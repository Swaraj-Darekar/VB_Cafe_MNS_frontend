/**
 * Centralized configuration for the application.
 * All backend API calls should use the base API_URL defined here.
 */

// Use environment variable VITE_API_URL if available, otherwise fallback to local dev URL
const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export const API_URL = `${BASE_URL}/api`;

export default {
    API_URL,
    BASE_URL
};
