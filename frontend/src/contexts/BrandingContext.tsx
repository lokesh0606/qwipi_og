import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

interface BrandingContextType {
    appName: string;
    refreshConfig: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const useBranding = () => {
    const context = useContext(BrandingContext);
    if (!context) {
        throw new Error('useBranding must be used within a BrandingProvider');
    }
    return context;
};

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [appName, setAppName] = useState<string>("Qwipi AI");

    const fetchConfig = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/v1/config/public`);
            const name = response.data.app_name;
            if (name) {
                setAppName(name);
                document.title = name;
            }
        } catch (error) {
            console.error("Failed to load branding config", error);
        }
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    return (
        <BrandingContext.Provider value={{ appName, refreshConfig: fetchConfig }}>
            {children}
        </BrandingContext.Provider>
    );
};
