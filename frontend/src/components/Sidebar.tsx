import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageSquare, Settings, Plus, LogOut, MoreHorizontal, Trash2, ShieldCheck } from 'lucide-react'
import type { Conversation } from '../types'
import { useSettings } from '../contexts/SettingsContext'
import { useAuth } from '../contexts/AuthContext'

interface SidebarProps {
    onNewChat: () => void
    conversations: Conversation[]
    activeConversationId: string | null
    streamingTitleConvId?: string | null
    onSelectConversation: (id: string) => void
    onDeleteConversation: (id: string) => void
    isOpen: boolean
}

export default function Sidebar({ onNewChat, conversations, activeConversationId, streamingTitleConvId, onSelectConversation, onDeleteConversation, isOpen }: SidebarProps) {
    const [width, setWidth] = useState(260)
    const [isResizing, setIsResizing] = useState(false)
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
    const sidebarRef = useRef<HTMLDivElement>(null)
    const menuRef = useRef<HTMLDivElement>(null)
    const { setModalOpen } = useSettings()
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const startResizing = React.useCallback(() => {
        setIsResizing(true)
    }, [])

    const stopResizing = React.useCallback(() => {
        setIsResizing(false)
    }, [])

    const resize = React.useCallback(
        (mouseMoveEvent: MouseEvent) => {
            if (isResizing) {
                const newWidth = mouseMoveEvent.clientX
                if (newWidth >= 200 && newWidth <= 480) {
                    setWidth(newWidth)
                }
            }
        },
        [isResizing]
    )

    useEffect(() => {
        window.addEventListener('mousemove', resize)
        window.addEventListener('mouseup', stopResizing)
        return () => {
            window.removeEventListener('mousemove', resize)
            window.removeEventListener('mouseup', stopResizing)
        }
    }, [resize, stopResizing])

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpenId(null)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    return (
        <div
            ref={sidebarRef}
            className={`hidden md:flex flex-col h-full bg-gray-50 dark:bg-black/20 backdrop-blur-xl border-r border-black/10 dark:border-white/10 z-20 relative shrink-0 overflow-hidden ${!isOpen ? 'border-none' : ''}`}
            style={{
                width: isOpen ? `${width}px` : '0px',
                transition: isResizing ? 'none' : 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: isOpen ? 1 : 0,
                padding: isOpen ? '16px' : '0px'
            }}
        >
            <button
                onClick={onNewChat}
                className="flex items-center gap-2 w-full p-3 mb-4 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 border border-black/5 dark:border-white/10 transition-all group"
            >
                <Plus className="w-5 h-5 text-gray-700 dark:text-white group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-gray-700 dark:text-white">New Chat</span>
            </button>

            <div className="flex-1 overflow-y-auto space-y-2 scrollbar-hide">
                <div className="text-xs font-semibold text-gray-500 dark:text-white/40 mb-2 px-2 uppercase tracking-wider">Recent</div>
                {conversations.map((conv) => (
                    <div key={conv.id} className="relative group">
                        <button
                            onClick={() => onSelectConversation(conv.id)}
                            className={`flex items-center gap-3 w-full p-3 pr-10 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-left transition-colors ${activeConversationId === conv.id ? 'bg-black/10 dark:bg-white/10 border border-black/5 dark:border-white/5' : ''}`}
                        >
                            <MessageSquare className={`w-4 h-4 shrink-0 ${activeConversationId === conv.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-white/60 group-hover:text-gray-900 dark:group-hover:text-white'}`} />
                            <span className={`text-sm truncate flex items-center gap-1.5 min-w-0 ${activeConversationId === conv.id ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-700 dark:text-white/80 group-hover:text-gray-900 dark:group-hover:text-white'}`}>
                                <span className="truncate">{conv.title || "New Chat"}</span>
                                {streamingTitleConvId === conv.id && (
                                    <span className="relative flex h-2 w-2 shrink-0 ml-0.5" title="Generating title...">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.9)]"></span>
                                    </span>
                                )}
                            </span>
                        </button>

                        {/* Kebab Menu Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                setMenuOpenId(menuOpenId === conv.id ? null : conv.id)
                            }}
                            className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all ${menuOpenId === conv.id ? 'opacity-100 bg-black/5 dark:bg-white/10' : 'opacity-0 group-hover:opacity-100'}`}
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {menuOpenId === conv.id && (
                            <div
                                ref={menuRef}
                                className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 rounded-lg shadow-xl z-50 overflow-hidden"
                            >
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onDeleteConversation(conv.id)
                                        setMenuOpenId(null)
                                    }}
                                    className="flex items-center gap-2 w-full p-2 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-300 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete Chat
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Footer / User Profile */}
            <div className="p-4 border-t border-black/10 dark:border-white/10">
                {user?.is_admin && (
                    <button
                        onClick={() => navigate('/admin')}
                        className="flex items-center gap-3 w-full p-2 mb-1.5 hover:bg-blue-500/10 rounded-lg transition-colors text-sm text-blue-600 dark:text-blue-400 font-medium"
                    >
                        <ShieldCheck size={18} />
                        <span>Admin Dashboard</span>
                    </button>
                )}
                <button
                    onClick={() => setModalOpen(true)}
                    className="flex items-center gap-3 w-full p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                    <Settings size={18} />
                    <span>Settings</span>
                </button>
                <div className="flex items-center gap-3 mt-2 px-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xs font-medium text-white uppercase">
                        {user?.email?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.email || 'User'}</div>
                        <div className="text-xs text-gray-500 truncate">Free Plan</div>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-red-500/10 transition-colors text-gray-700 dark:text-white/80 hover:text-red-500 dark:hover:text-red-400 mt-2"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Log out</span>
                </button>
            </div>

            {/* Resize Handle */}
            <div
                className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500/50 transition-colors z-50 flex justify-center"
                onMouseDown={startResizing}
            >
            </div>
        </div>
    )
}
