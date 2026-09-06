import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ShieldCheck, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { useBranding } from '../contexts/BrandingContext';
import { useAuth } from '../contexts/AuthContext';
import { BrandedText } from './BrandedText';
import { API_BASE_URL } from '../config/api';

export default function AdminDashboard() {
    const { appName, refreshConfig } = useBranding();
    const { user } = useAuth();
    const [newName, setNewName] = useState(appName);
    const [isSaving, setIsSaving] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleSave = async () => {
        setIsSaving(true);
        setStatusMessage(null);
        try {
            await axios.patch(`${API_BASE_URL}/api/v1/admin/config`, { value: newName });
            await refreshConfig();
            setStatusMessage({ type: 'success', text: 'Branding updated successfully!' });
        } catch (error: any) {
            console.error("Failed to update config", error);
            setStatusMessage({ 
                type: 'error', 
                text: error.response?.data?.detail || 'Failed to update configuration.' 
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                <ShieldCheck size={14} />
                                Administrator
                            </span>
                            <span className="text-xs text-gray-500">{user?.email}</span>
                        </div>
                        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                    </div>
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Back to Chat
                    </Link>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-8 shadow-xl">
                    <h2 className="text-xl font-semibold mb-2">Application Branding</h2>
                    <p className="text-gray-400 text-sm mb-6">
                        Configure the global application title displayed across the header, login screens, and document title.
                    </p>

                    {statusMessage && (
                        <div className={`flex items-center gap-2 p-3 mb-6 rounded-lg text-sm border ${
                            statusMessage.type === 'success'
                                ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                : 'bg-red-500/10 border-red-500/20 text-red-400'
                        }`}>
                            {statusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                            {statusMessage.text}
                        </div>
                    )}

                    <div className="mb-6">
                        <label className="block text-gray-300 mb-2 text-sm font-medium">Application Name</label>
                        <input
                            className="w-full bg-black border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Enter application name..."
                        />
                    </div>

                    <div className="mb-8">
                        <label className="block text-gray-300 mb-2 text-sm font-medium">Live Preview</label>
                        <div className="p-6 bg-black rounded-xl border border-gray-800 flex items-center justify-center">
                            <span className="text-3xl font-black">
                                <BrandedText className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400" />
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={isSaving || !newName.trim()}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-4 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                    >
                        {isSaving ? 'Saving Changes...' : 'Save Branding'}
                    </button>
                </div>
            </div>
        </div>
    );
}
