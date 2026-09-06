import { useState, useRef, useEffect, useCallback } from 'react'
import { useSettings } from '../contexts/SettingsContext'
import { API_BASE_URL } from '../config/api'
import type { Conversation, Message } from '../types'

const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem('qwipi_auth_token')
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
}

export function useChatStream() {
    const { lastClearedAt } = useSettings();
    const [messages, setMessages] = useState<Message[]>([])
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
    const currentConversationIdRef = useRef<string | null>(null)
    const [streamingTitleConvId, setStreamingTitleConvId] = useState<string | null>(null)
    const streamingTitleConvIdRef = useRef<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const lastPromptRef = useRef<string>('')

    // Sync refs
    useEffect(() => {
        currentConversationIdRef.current = currentConversationId
    }, [currentConversationId])

    useEffect(() => {
        streamingTitleConvIdRef.current = streamingTitleConvId
    }, [streamingTitleConvId])

    const fetchConversations = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/conversations`, {
                headers: getAuthHeaders()
            })
            if (res.ok) {
                const data: Conversation[] = await res.json()
                setConversations(prev => {
                    const activeStreamingId = streamingTitleConvIdRef.current
                    return data.map(serverConv => {
                        // If this conversation is currently streaming a title, preserve local in-flight title
                        if (activeStreamingId && serverConv.id === activeStreamingId) {
                            const local = prev.find(p => p.id === activeStreamingId)
                            if (local && local.title) {
                                return { ...serverConv, title: local.title }
                            }
                        }
                        return serverConv
                    })
                })
            }
        } catch (error) {
            console.error('Failed to fetch conversations', error)
        }
    }, [])

    const handleNewChat = useCallback(() => {
        setCurrentConversationId(null)
        setMessages([])
        setIsLoading(false)
    }, [])

    // Sync clearance
    useEffect(() => {
        if (lastClearedAt > 0) {
            setConversations([])
            handleNewChat()
        }
    }, [lastClearedAt, handleNewChat])

    useEffect(() => {
        fetchConversations()
    }, [fetchConversations])

    const loadConversation = async (id: string) => {
        setCurrentConversationId(id)
        setIsLoading(true)
        try {
            const res = await fetch(`${API_BASE_URL}/conversations/${id}`, {
                headers: getAuthHeaders()
            })
            if (res.ok) {
                const data = await res.json()
                setMessages(data.messages || [])
            }
        } catch (error) {
            console.error('Failed to load conversation', error)
        } finally {
            setIsLoading(false)
        }
    }

    const streamTitle = async (conversationId: string) => {
        setStreamingTitleConvId(conversationId)
        try {
            const response = await fetch(`${API_BASE_URL}/chat/title-stream`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ conversation_id: conversationId })
            })

            if (!response.body) {
                setStreamingTitleConvId(null)
                return
            }

            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let accumulatedTitle = ''
            let isFirstChunk = true

            while (true) {
                const { done, value } = await reader.read()
                if (done) break
                const chunk = decoder.decode(value, { stream: true })
                if (!chunk) continue

                if (isFirstChunk) {
                    accumulatedTitle = ''
                    isFirstChunk = false
                }

                for (const char of chunk) {
                    accumulatedTitle += char
                    setConversations(prev => prev.map(c =>
                        c.id === conversationId ? { ...c, title: accumulatedTitle } : c
                    ))
                    await new Promise(r => setTimeout(r, 20))
                }
            }
        } catch (error) {
            console.error("Error streaming title:", error)
        } finally {
            setStreamingTitleConvId(null)
            // Allow a small delay for backend database commit before fetching synced conversations
            setTimeout(() => {
                fetchConversations()
            }, 600)
        }
    }

    const sendMessage = async (prompt: string) => {
        if (!prompt.trim()) return

        const trimmedPrompt = prompt.trim()
        const optimisticTitle = trimmedPrompt.length > 28 ? trimmedPrompt.slice(0, 28) + '...' : trimmedPrompt
        const previousMessageCount = messages.length

        lastPromptRef.current = prompt
        const userMessage: Message = { role: 'user', content: prompt }
        setMessages(prev => [...prev, userMessage])
        setIsLoading(true)

        try {
            const response = await fetch(`${API_BASE_URL}/chat`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    prompt,
                    conversation_id: currentConversationId
                }),
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.detail || `Server error (${response.status})`)
            }

            if (!response.body) throw new Error('No response body from server')

            const conversationId = response.headers.get('X-Conversation-Id')

            if (conversationId) {
                const isNewConversation = !currentConversationIdRef.current || (conversationId !== currentConversationIdRef.current)

                if (isNewConversation) {
                    setCurrentConversationId(conversationId)
                    setConversations(prev => {
                        if (prev.find(c => c.id === conversationId)) {
                            return prev.map(c => c.id === conversationId ? { ...c, title: optimisticTitle } : c)
                        }
                        const newConv: Conversation = {
                            id: conversationId,
                            title: optimisticTitle,
                            updated_at: new Date().toISOString()
                        }
                        return [newConv, ...prev]
                    })
                }

                // In parallel with the chat streaming:
                // Stream title for new chats (turn 1) or during the first 2-3 turns (messages count <= 5)
                if (isNewConversation || previousMessageCount <= 5) {
                    streamTitle(conversationId)
                }
            }

            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let accumulatedContent = ''
            let rafId: number | null = null
            let hasPendingUpdate = false

            const flushUpdate = () => {
                if (!hasPendingUpdate) return
                hasPendingUpdate = false
                if (currentConversationIdRef.current === conversationId) {
                    setMessages(prev => {
                        const newMessages = [...prev]
                        if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'assistant') {
                            newMessages[newMessages.length - 1] = {
                                ...newMessages[newMessages.length - 1],
                                content: accumulatedContent
                            }
                        } else {
                            newMessages.push({ role: 'assistant', content: accumulatedContent })
                        }
                        return newMessages
                    })
                }
            }

            const scheduleUpdate = () => {
                hasPendingUpdate = true
                if (rafId === null) {
                    rafId = requestAnimationFrame(() => {
                        rafId = null
                        flushUpdate()
                    })
                }
            }

            // Immediately append initial assistant message
            setMessages(prev => [...prev, { role: 'assistant', content: '' }])

            while (true) {
                const { done, value } = await reader.read()
                if (done) {
                    if (rafId !== null) {
                        cancelAnimationFrame(rafId)
                        rafId = null
                    }
                    flushUpdate()
                    break
                }

                const chunk = decoder.decode(value, { stream: true })
                if (chunk) {
                    accumulatedContent += chunk
                    scheduleUpdate()
                }
            }
        } catch (error: any) {
            console.error('Error sending message:', error)
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: `Error: ${error.message || error}. Click to retry.`, 
                isError: true 
            }])
        } finally {
            setIsLoading(false)
        }
    }

    const retryLastMessage = () => {
        if (lastPromptRef.current) {
            sendMessage(lastPromptRef.current)
        }
    }

    const handleDeleteChat = async (id: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/conversations/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            })
            if (res.ok) {
                setConversations(prev => prev.filter(c => c.id !== id))
                if (currentConversationId === id) {
                    handleNewChat()
                }
            }
        } catch (error) {
            console.error('Failed to delete conversation', error)
        }
    }

    return {
        messages,
        conversations,
        currentConversationId,
        streamingTitleConvId,
        isLoading,
        sendMessage,
        retryLastMessage,
        loadConversation,
        handleNewChat,
        handleDeleteChat,
        fetchConversations
    }
}
