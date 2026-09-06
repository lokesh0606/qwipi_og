import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { User, Copy, Check, AlertTriangle } from 'lucide-react'
import { useState, memo } from 'react'
import type { Message } from '../types'
import aiLogo from '../assets/ai-logo.png'

interface MessageBubbleProps {
    message: Message
    isStreaming?: boolean
}

function MessageBubbleComponent({ message, isStreaming = false }: MessageBubbleProps) {
    const isUser = message.role === 'user'
    const isError = message.isError
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        navigator.clipboard.writeText(message.content)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-6 group`}>
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center overflow-hidden ${
                isUser 
                    ? 'bg-blue-600' 
                    : isError 
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                        : 'bg-transparent p-0.5'
            }`}>
                {isUser ? (
                    <User className="w-5 h-5 text-white" />
                ) : isError ? (
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                ) : (
                    <img
                        src={aiLogo}
                        alt="AI"
                        className="w-full h-full object-cover"
                    />
                )}
            </div>

            <div className={`relative max-w-[85%] rounded-2xl p-4 backdrop-blur-md border shadow-lg ${
                isUser
                    ? 'bg-blue-600/20 border-blue-500/30 text-white rounded-tr-none'
                    : isError
                        ? 'bg-red-500/10 border-red-500/20 text-red-300 rounded-tl-none'
                        : 'bg-white/10 dark:bg-white/5 border-black/10 dark:border-white/10 text-gray-800 dark:text-gray-100 rounded-tl-none'
            }`}>
                {!isUser && !isError && message.content && (
                    <button
                        onClick={handleCopy}
                        className="absolute top-2 right-2 p-1.5 rounded-md bg-black/20 hover:bg-black/40 text-white/60 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                        title="Copy message"
                    >
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                )}

                <div className={`prose dark:prose-invert prose-sm max-w-none break-words leading-relaxed prose-pre:p-0 prose-pre:bg-transparent ${!isUser && 'text-gray-800 dark:text-gray-100'}`}>
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            table: ({ node, ...props }) => (
                                <div className="overflow-x-auto my-4 rounded-lg border border-white/10">
                                    <table className="w-full text-left border-collapse" {...props} />
                                </div>
                            ),
                            thead: ({ node, ...props }) => (
                                <thead className="bg-white/10 text-white" {...props} />
                            ),
                            th: ({ node, ...props }) => (
                                <th className="p-3 border-b border-white/10 font-semibold" {...props} />
                            ),
                            td: ({ node, ...props }) => (
                                <td className="p-3 border-b border-white/5" {...props} />
                            ),
                            code({ node, inline, className, children, ...props }: any) {
                                const match = /language-(\w+)/.exec(className || '')
                                return !inline && match ? (
                                    <div className="relative group/code my-4">
                                        <div className="absolute -top-3 right-2 text-xs text-white/40 bg-black/50 px-2 py-1 rounded">{match[1]}</div>
                                        <pre className="!bg-black/30 !p-4 !rounded-lg overflow-x-auto border border-white/10">
                                            <code className={className} {...props}>
                                                {children}
                                            </code>
                                        </pre>
                                    </div>
                                ) : (
                                    <code className="bg-white/10 px-1.5 py-0.5 rounded text-sm font-mono text-blue-200" {...props}>
                                        {children}
                                    </code>
                                )
                            }
                        }}
                    >
                        {message.content}
                    </ReactMarkdown>
                    {isStreaming && (
                        <span
                            className="inline-block w-2 h-4 ml-1 -mb-0.5 bg-blue-500 dark:bg-blue-400 rounded-sm animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)] align-middle"
                            aria-hidden="true"
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

const MessageBubble = memo(MessageBubbleComponent, (prev, next) => {
    return (
        prev.message.content === next.message.content &&
        prev.message.role === next.message.role &&
        prev.message.isError === next.message.isError &&
        prev.isStreaming === next.isStreaming
    )
})

export default MessageBubble
