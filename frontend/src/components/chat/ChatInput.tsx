import React, { useState } from 'react'
import { Send } from 'lucide-react'
import { useBranding } from '../../contexts/BrandingContext'

interface ChatInputProps {
    onSend: (message: string) => void;
    isLoading: boolean;
    placeholder?: string;
    showDisclaimer?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
    onSend,
    isLoading,
    placeholder = "Message Qwipi AI... (Shift+Enter for new line)",
    showDisclaimer = false
}) => {
    const { appName } = useBranding();
    const effectivePlaceholder = placeholder.includes("Qwipi AI")
        ? placeholder.replace("Qwipi AI", appName)
        : placeholder;

    const [input, setInput] = useState('')

    const handleSubmit = (e: React.FormEvent | React.KeyboardEvent) => {
        e.preventDefault()
        if (input.trim() && !isLoading) {
            onSend(input)
            setInput('')
        }
    }

    return (
        <div className="w-full relative group z-10">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <form onSubmit={handleSubmit} className="relative z-10">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSubmit(e)
                        }
                    }}
                    placeholder={effectivePlaceholder}
                    className="w-full p-4 pr-14 rounded-2xl bg-white dark:bg-white/5 backdrop-blur-xl border border-black/10 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-black/5 dark:focus:ring-white/20 focus:bg-white dark:focus:bg-white/10 transition-all shadow-xl dark:shadow-2xl resize-none h-[60px] max-h-[200px] scrollbar-hide"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="absolute right-2 top-[30px] -translate-y-1/2 p-2.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-blue-600 dark:hover:bg-blue-600 text-gray-500 dark:text-white/70 hover:text-white transition-all disabled:opacity-50 disabled:hover:bg-black/5 dark:disabled:hover:bg-white/10 z-20"
                >
                    <Send className="w-5 h-5" />
                </button>
            </form>
            {showDisclaimer && (
                <div className="text-center mt-3 text-xs text-gray-400 dark:text-white/30 relative z-10">
                    AI can make mistakes. Please verify important information.
                </div>
            )}
        </div>
    )
}
