/**
 * AdminRoute - Guards routes that require administrator privileges
 * 
 * Verifies that the user is authenticated and has is_admin == true.
 * Shows an unauthorized banner if the user lacks sufficient privileges.
 */

import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AdminRouteProps {
    children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
    const { user, isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-black flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-white/20 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-white/60 text-sm">Verifying privileges...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!user?.is_admin) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center shadow-2xl">
                    <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <ShieldAlert size={32} />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Access Restricted</h1>
                    <p className="text-gray-400 text-sm mb-6">
                        Administrator privileges are required to access the system administration dashboard. Your account (<span className="text-white font-medium">{user?.email}</span>) does not have admin permissions.
                    </p>
                    <Link
                        to="/"
                        className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
                    >
                        <ArrowLeft size={18} />
                        Return to Chat
                    </Link>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
