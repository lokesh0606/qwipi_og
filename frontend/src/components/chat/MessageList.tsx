import React, { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowDown } from 'lucide-react'
import MessageBubble from '../MessageBubble'
import StreamingIndicator from '../StreamingIndicator'
import type { Message } from '../../types'

interface MessageListProps {
    messages: Message[];
    isLoading: boolean;
    messagesEndRef?: React.RefObject<HTMLDivElement | null>;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, isLoading, messagesEndRef }) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const isPinnedToBottomRef = useRef(true)
    const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false)

    // Check user scroll position
    const handleScroll = useCallback(() => {
        const container = containerRef.current
        if (!container) return
        const threshold = 120
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight <= threshold
        isPinnedToBottomRef.current = isNearBottom
        setShowScrollBottomBtn(!isNearBottom && messages.length > 2)
    }, [messages.length])

    // Butter-smooth scroll pinning during streaming without animation fighting
    useEffect(() => {
        if (!isPinnedToBottomRef.current) return
        const container = containerRef.current
        if (!container) return

        // Pin directly to bottom on update with zero animation jitter or fighting
        container.scrollTop = container.scrollHeight
    }, [messages, isLoading])

    const scrollToBottomSmooth = () => {
        isPinnedToBottomRef.current = true
        setShowScrollBottomBtn(false)
        const container = containerRef.current
        if (container) {
            container.scrollTo({
                top: container.scrollHeight,
                behavior: 'smooth'
            })
        }
    }

    const lastMessage = messages[messages.length - 1]
    const isThinking = isLoading && (!lastMessage || lastMessage.role !== 'assistant' || !lastMessage.content)

    return (
        <div
            ref={containerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-4 md:px-8 pb-4 md:pb-8 pt-24 scrollbar-hide relative"
            style={{ overscrollBehaviorY: 'contain' }}
        >
            <div className="max-w-4xl mx-auto space-y-6">
                {messages.map((msg, index) => {
                    const isLast = index === messages.length - 1
                    const isStreaming = isLast && isLoading && msg.role === 'assistant' && !!msg.content
                    return (
                        <div key={index} className="transition-opacity duration-150">
                            <MessageBubble
                                message={msg}
                                isStreaming={isStreaming}
                            />
                        </div>
                    )
                })}

                <AnimatePresence>
                    {isThinking && (
                        <motion.div
                            key="thinking-indicator"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                        >
                            <StreamingIndicator />
                        </motion.div>
                    )}
                </AnimatePresence>

                <div ref={messagesEndRef} className="h-2" />
            </div>

            {/* Floating Scroll to Bottom Button */}
            <AnimatePresence>
                {showScrollBottomBtn && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 10 }}
                        onClick={scrollToBottomSmooth}
                        className="fixed bottom-24 right-8 z-50 flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-blue-600/90 hover:bg-blue-600 text-white text-xs font-medium shadow-lg shadow-blue-500/25 backdrop-blur-md transition-colors border border-blue-400/30 cursor-pointer"
                        title="Scroll to bottom"
                    >
                        <ArrowDown className="w-3.5 h-3.5" />
                        <span>Recent</span>
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    )
}
