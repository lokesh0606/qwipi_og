import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './Sidebar'
import GlowAnimation from './GlowAnimation'
import { ChatHeader } from './chat/ChatHeader'
import { MessageList } from './chat/MessageList'
import { ChatInput } from './chat/ChatInput'
import { useSettings } from '../contexts/SettingsContext'
import { useChatStream } from '../hooks/useChatStream'
import brandLogo from '../assets/brand-logo.png'
import { BrandedText } from './BrandedText'
import { useBranding } from '../contexts/BrandingContext'

export default function ChatInterface() {
    const { settings } = useSettings();
    const { appName } = useBranding();
    const {
        messages,
        conversations,
        currentConversationId,
        streamingTitleConvId,
        isLoading,
        sendMessage,
        loadConversation,
        handleNewChat,
        handleDeleteChat
    } = useChatStream();

    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const isEmptyState = messages.length === 0

    return (
        <div className="flex h-screen w-full relative z-10">
            <Sidebar
                onNewChat={handleNewChat}
                conversations={conversations}
                activeConversationId={currentConversationId}
                streamingTitleConvId={streamingTitleConvId}
                onSelectConversation={loadConversation}
                onDeleteConversation={handleDeleteChat}
                isOpen={isSidebarOpen}
            />

            <div className="flex-1 flex flex-col h-full relative overflow-hidden">
                <ChatHeader
                    isSidebarOpen={isSidebarOpen}
                    setIsSidebarOpen={setIsSidebarOpen}
                    hasMessages={!isEmptyState}
                />

                <AnimatePresence>
                    {settings.enable_glow && isLoading && <GlowAnimation />}
                </AnimatePresence>

                <div className="flex-1 relative overflow-hidden">
                    <AnimatePresence mode="wait">
                        {isEmptyState ? (
                            <motion.div
                                key="empty-state"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                                transition={{ duration: 0.4, ease: "easeInOut" }}
                                className="absolute inset-0 flex flex-col items-center justify-center p-4"
                            >
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{
                                        duration: 0.8,
                                        ease: [0.16, 1, 0.3, 1], // Custom spring-like easing
                                        delay: 0.1
                                    }}
                                    className="flex flex-col items-center mb-8"
                                >
                                    <div className="relative mb-6">
                                        <motion.div
                                            className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full"
                                            animate={{
                                                scale: [1, 1.2, 1],
                                                opacity: [0.3, 0.6, 0.3],
                                            }}
                                            transition={{ duration: 4, repeat: Infinity }}
                                        />
                                        <img
                                            src={brandLogo}
                                            alt={appName}
                                            className="relative h-28 w-auto object-contain"
                                        />
                                    </div>
                                    <h1 className="text-4xl font-black tracking-tight animate-gradient">
                                        <BrandedText className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 dark:from-blue-400 dark:via-purple-400 dark:to-blue-400 bg-[length:200%_auto]" />
                                    </h1>
                                    <p className="mt-4 text-gray-500 dark:text-gray-400 font-medium text-lg">
                                        How can I help you today?
                                    </p>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.3 }}
                                    className="w-full max-w-2xl px-4"
                                >
                                    <ChatInput onSend={sendMessage} isLoading={isLoading} />
                                </motion.div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="chat-messages"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                className="flex flex-col h-full"
                            >
                                <MessageList
                                    messages={messages}
                                    isLoading={isLoading}
                                    messagesEndRef={messagesEndRef}
                                />

                                <div className="relative p-4 md:p-6 bg-gradient-to-t from-white via-white/90 to-transparent dark:from-black dark:via-black/90 dark:to-transparent z-40">
                                    <div className="max-w-4xl mx-auto relative z-50">
                                        <ChatInput
                                            onSend={sendMessage}
                                            isLoading={isLoading}
                                            showDisclaimer
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}
