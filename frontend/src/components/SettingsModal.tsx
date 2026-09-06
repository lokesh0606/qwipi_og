import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings2, Shield, Palette, HardDrive } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const TABS = [
    { id: 'general', label: 'General', icon: Settings2 },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'data', label: 'Data Controls', icon: HardDrive },
];

export default function SettingsModal() {
    const { isModalOpen, setModalOpen, settings, saveSettings } = useSettings();
    const [activeTab, setActiveTab] = useState('general');
    const [localSettings, setLocalSettings] = useState(settings);
    const [isSaving, setIsSaving] = useState(false);
    const [clearAllChats, setClearAllChats] = useState(false);

    interface ModelOption {
        id: string;
        name: string;
    }
    interface ProviderOption {
        id: string;
        name: string;
        models: ModelOption[];
    }
    const [providers, setProviders] = useState<ProviderOption[]>([]);
    const [loadingModels, setLoadingModels] = useState(false);

    // Sync local state when modal opens or settings change (external update)
    useEffect(() => {
        if (isModalOpen) {
            setLocalSettings(settings);
        }
    }, [isModalOpen, settings]);

    // Fetch available providers and models dynamically from backend
    useEffect(() => {
        if (isModalOpen) {
            const fetchModels = async () => {
                setLoadingModels(true);
                try {
                    const response = await axios.get(`${API_BASE_URL}/api/v1/models`);
                    if (response.data) {
                        setProviders(response.data);
                        
                        // If current configured provider is not in the list, default to first available
                        const currentProvider = localSettings.provider || settings.provider;
                        const providerExists = response.data.some((p: any) => p.id === currentProvider);
                        if (!providerExists && response.data.length > 0) {
                            const firstProv = response.data[0];
                            setLocalSettings(prev => ({
                                ...prev,
                                provider: firstProv.id,
                                model: firstProv.models[0]?.id || ''
                            }));
                        }
                    }
                } catch (error) {
                    console.error("Failed to fetch available models", error);
                } finally {
                    setLoadingModels(false);
                }
            };
            fetchModels();
        }
    }, [isModalOpen]);

    // Accessibility: Focus Trap & Escape Key
    // ... (keep existing effect)

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await saveSettings({ ...localSettings, clear_all_chats: clearAllChats });
            setClearAllChats(false);
            setModalOpen(false);
        } catch (error) {
            // Error handling handled by context (toast usually)
            console.error("Save failed", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setModalOpen(false);
        // Reset local settings handled by useEffect on next open
    };

    if (!isModalOpen) return null;

    return (
        <AnimatePresence>
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full max-w-4xl h-[600px] bg-white dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 rounded-xl shadow-2xl flex overflow-hidden flex-col md:flex-row"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="settings-title"
                    >
                        {/* Sidebar */}
                        <div className="w-full md:w-1/4 min-w-[200px] border-b md:border-b-0 md:border-r border-black/10 dark:border-white/10 p-4 bg-gray-50 dark:bg-[#151515]">
                            <h2 id="settings-title" className="text-lg font-semibold text-gray-900 dark:text-white mb-6 px-3">Settings</h2>
                            <div className="flex md:block overflow-x-auto md:overflow-visible space-x-2 md:space-x-0 md:space-y-1 pb-2 md:pb-0 scrollbar-hide">
                                {TABS.map((tab) => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex-shrink-0 w-auto md:w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === tab.id
                                                ? 'bg-black/10 dark:bg-white/10 text-gray-900 dark:text-white'
                                                : 'text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                                                }`}
                                        >
                                            <Icon size={18} />
                                            <span className="whitespace-nowrap">{tab.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#1a1a1a] min-h-0">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-black/10 dark:border-white/10 shrink-0">
                                <h3 className="text-xl font-medium text-gray-900 dark:text-white">
                                    {TABS.find((t) => t.id === activeTab)?.label}
                                </h3>
                                <button
                                    onClick={handleCancel}
                                    className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                    aria-label="Close settings"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Scrollable Body */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                                {activeTab === 'general' && (
                                    <section className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <label className="text-gray-900 dark:text-white block font-medium">Theme</label>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Match your system preference or choose manually.</p>
                                            </div>
                                            <select
                                                value={localSettings.theme}
                                                onChange={(e) => setLocalSettings({ ...localSettings, theme: e.target.value as any })}
                                                className="bg-gray-50 dark:bg-[#2a2a2a] text-gray-900 dark:text-white border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            >
                                                <option value="system">System</option>
                                                <option value="dark">Dark</option>
                                                <option value="light">Light</option>
                                            </select>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <label className="text-gray-900 dark:text-white block font-medium">AI Provider</label>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Choose the AI service to query.</p>
                                            </div>
                                            <select
                                                value={localSettings.provider || ''}
                                                onChange={(e) => {
                                                    const newProvider = e.target.value;
                                                    const providerData = providers.find(p => p.id === newProvider);
                                                    const firstModel = providerData?.models[0]?.id || '';
                                                    setLocalSettings({ ...localSettings, provider: newProvider, model: firstModel });
                                                }}
                                                className="bg-gray-50 dark:bg-[#2a2a2a] text-gray-900 dark:text-white border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
                                                disabled={loadingModels || providers.length === 0}
                                            >
                                                {providers.map((p) => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <label className="text-gray-900 dark:text-white block font-medium">AI Model</label>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Select the specific model architecture.</p>
                                            </div>
                                            <select
                                                value={localSettings.model}
                                                onChange={(e) => setLocalSettings({ ...localSettings, model: e.target.value })}
                                                className="bg-gray-50 dark:bg-[#2a2a2a] text-gray-900 dark:text-white border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
                                                disabled={loadingModels || !localSettings.provider}
                                            >
                                                {(providers.find(p => p.id === localSettings.provider)?.models || []).map((m) => (
                                                    <option key={m.id} value={m.id}>{m.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </section>
                                )}

                                {/* Other tabs content remains same... */}
                                {activeTab === 'appearance' && (
                                    <section className="space-y-8">
                                        {/* Chat Section */}
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Chat</h4>

                                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#2a2a2a]/50 border border-black/5 dark:border-white/5 rounded-lg">
                                                <div>
                                                    <label className="text-gray-900 dark:text-white font-medium block">Glow Animation</label>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Show the dynamic lighting effect when AI is responding.</p>
                                                </div>
                                                <button
                                                    onClick={() => setLocalSettings({ ...localSettings, enable_glow: !localSettings.enable_glow })}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${localSettings.enable_glow ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                                                        }`}
                                                >
                                                    <span className="sr-only">Enable glow animation</span>
                                                    <span
                                                        className={`${localSettings.enable_glow ? 'translate-x-6' : 'translate-x-1'
                                                            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                                    />
                                                </button>
                                            </div>
                                        </div>
                                    </section>
                                )}

                                {activeTab === 'data' && (
                                    <section className="space-y-6">
                                        <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-start gap-4">
                                                    <Shield className="text-red-500 dark:text-red-400 mt-1" size={20} />
                                                    <div>
                                                        <h4 className="text-red-600 dark:text-red-400 font-medium">Clear All History</h4>
                                                        <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1">Permanently delete all conversations. Settings will be preserved.</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setClearAllChats(!clearAllChats)}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${clearAllChats ? 'bg-red-600' : 'bg-gray-200 dark:bg-gray-700'
                                                        }`}
                                                >
                                                    <span className="sr-only">Enable clear all chats</span>
                                                    <span
                                                        className={`${clearAllChats ? 'translate-x-6' : 'translate-x-1'
                                                            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                                    />
                                                </button>
                                            </div>
                                        </div>
                                    </section>
                                )}
                            </div>

                            {/* Footer Actions */}
                            <div className="p-6 border-t border-black/10 dark:border-white/10 bg-gray-50/50 dark:bg-black/20 flex justify-end gap-3 shrink-0">
                                <button
                                    onClick={handleCancel}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isSaving ? 'Saving...' : 'Apply & Save'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
