import React from 'react'
import { PanelLeft } from 'lucide-react'
import brandLogo from '../../assets/brand-logo.png'
import { useBranding } from '../../contexts/BrandingContext'
import { BrandedText } from '../BrandedText'

interface ChatHeaderProps {
    isSidebarOpen: boolean;
    setIsSidebarOpen: (open: boolean) => void;
    hasMessages: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ isSidebarOpen, setIsSidebarOpen, hasMessages }) => {
    const { appName } = useBranding();
    return (
        <div className={`absolute top-0 left-0 w-full z-20 h-16 flex items-center px-6 transition-all duration-300 ${hasMessages ? 'bg-white/80 dark:bg-black/10 backdrop-blur-md border-b border-black/5 dark:border-white/10' : ''}`}>
            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 -ml-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-white/70 hover:text-gray-900 dark:hover:text-white transition-colors"
                title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
                <PanelLeft className="w-5 h-5" />
            </button>
            {hasMessages && (
                <div className="flex items-center gap-2 ml-4">
                    <img src={brandLogo} alt={appName} className="h-8 w-auto object-contain" />
                    <span className="text-xl font-bold">
                        <BrandedText className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400" />
                    </span>
                    <span className="text-[10px] bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 px-1.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-500/30">Beta</span>
                </div>
            )}
        </div>
    )
}
