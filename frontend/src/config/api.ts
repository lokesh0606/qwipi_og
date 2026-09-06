/**
 * Centralized API configuration for Qwipi AI frontend.
 * Reads base URL from Vite environment variable VITE_API_BASE_URL with fallback to localhost:8000.
 */
export const API_BASE_URL: string = (
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
).replace(/\/$/, ''); // Strip trailing slash if provided
