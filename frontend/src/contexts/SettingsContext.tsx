import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// --- Types ---
export type Theme = 'light' | 'dark' | 'system';

export interface Settings {
    id?: string;
    theme: Theme;
    provider?: string;
    model: string;
    enable_glow: boolean;
    clear_all_chats?: boolean;
}

interface SettingsContextType {
    settings: Settings;
    isLoading: boolean;
    error: string | null;
    saveSettings: (newSettings: Settings) => Promise<void>;
    isModalOpen: boolean;
    setModalOpen: (open: boolean) => void;
    lastClearedAt: number;
}

// --- Defaults ---
const DEFAULT_SETTINGS: Settings = {
    theme: 'dark',
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    enable_glow: true,
};

const THEME_CACHE_KEY = 'qwipi_theme_cache';

const getInitialTheme = (): Theme => {
    const cached = localStorage.getItem(THEME_CACHE_KEY);
    if (cached === 'light' || cached === 'dark' || cached === 'system') {
        return cached as Theme;
    }
    return DEFAULT_SETTINGS.theme;
};

const API_URL = API_BASE_URL;

// --- Context ---
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

// --- Provider ---
export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<Settings>({
        ...DEFAULT_SETTINGS,
        theme: getInitialTheme()
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setModalOpen] = useState(false);
    const [lastClearedAt, setLastClearedAt] = useState(0);

    // Race Condition & Debounce Refs
    // Race Condition & Debounce Refs - Removed unused refs

    // --- Actions ---

    const fetchSettings = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // SPOF Fallback: If this fails, we catch and keep DEFAULT_SETTINGS
            const response = await axios.get(`${API_URL}/settings`);
            if (response.data) {
                setSettings(response.data);
            }
        } catch (err) {
            console.error('Failed to fetch settings, using defaults:', err);
            setError('Failed to load settings. Using offline defaults.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initial Load
    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    // Apply Theme Side Effect
    useEffect(() => {
        const root = window.document.documentElement;
        console.log('Applying theme:', settings.theme); // Debug log

        // Remove existing theme classes
        root.classList.remove('light', 'dark');

        if (settings.theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            console.log('System theme detected:', systemTheme);
            root.classList.add(systemTheme);
        } else {
            console.log('Force theme applied:', settings.theme);
            root.classList.add(settings.theme);
        }

        // Cache theme for fast subsequent loads
        localStorage.setItem(THEME_CACHE_KEY, settings.theme);

        console.log('Current root classes:', root.classList.toString());
    }, [settings.theme]);

    // Explicit Save Action (No more debounce)
    const saveSettings = useCallback(async (newSettings: Settings) => {
        setIsLoading(true);
        setError(null);
        try {
            // Optimistic update? No, "Apply" implies we wait for confirmation usually, 
            // but for better UX we might update local immediately. 
            // However, the requested flow is "Apply" button.
            // So we send API request first.

            // Validate? The Type ensures basic shape.

            const response = await axios.patch(`${API_URL}/settings`, newSettings);

            if (response.data) {
                setSettings(response.data);
                if (newSettings.clear_all_chats) {
                    setLastClearedAt(Date.now());
                }
                // setModalOpen(false); // Let the modal handle closing
            }
        } catch (err) {
            console.error('Failed to save settings:', err);
            setError('Failed to save settings. Please try again.');
            throw err; // Re-throw so Modal knows it failed
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Helper for SettingsModal to get current state without direct mutation
    // Not needed, we export 'settings'.

    /* Previous Debounce Logic Removed */

    return (
        <SettingsContext.Provider value={{
            settings,
            isLoading,
            error,
            saveSettings,
            isModalOpen,
            setModalOpen,
            lastClearedAt
        }}>
            {children}
        </SettingsContext.Provider>
    );
};
