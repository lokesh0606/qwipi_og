import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import MessageBubble from '../MessageBubble'
import StreamingIndicator from '../StreamingIndicator'
import type { Message } from '../../types'

interface MessageListProps {
    messages: Message[];
    isLoading: boolean;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, isLoading, messagesEndRef }) => {
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, isLoading])
    return (
        <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-4 md:pb-8 pt-24 scrollbar-hide">
            <div className="max-w-4xl mx-auto space-y-6">
                <AnimatePresence>
                    {messages.map((msg, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <MessageBubble message={msg} />
                        </motion.div>
                    ))}
                </AnimatePresence>
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                    >
                        <StreamingIndicator />
                    </motion.div>
                )}
                <div ref={messagesEndRef} />
            </div>
        </div>
    )
}
