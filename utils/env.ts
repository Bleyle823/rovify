/**
 * Environment configuration utility for Rovify
 * Handles environment-specific values and ensures consistent URLs
 */

// Define application environments
type Environment = 'development' | 'staging' | 'production';

// Get current environment
export const getEnvironment = (): Environment => {
    // First check for explicit environment variable
    if (process.env.NEXT_PUBLIC_APP_ENV) {
        return process.env.NEXT_PUBLIC_APP_ENV as Environment;
    }

    // Check for specific environment variables that Next.js sets
    if (process.env.NODE_ENV === 'production') {
        return 'production';
    } else if (process.env.NODE_ENV === 'test') {
        return 'staging';
    }
    return 'development';
};

export const getBaseUrl = (): string => {
    const env = getEnvironment();

    if (typeof window !== 'undefined') {
        // When running in browser, use the current origin
        // But only if we're in dev env
        if (env === 'development') {
            return window.location.origin;
        }
    }

    // Server-side or during build time - use env-specific URLs
    switch (env) {
        case 'production':
            // Replace with your actual production domain
            return process.env.NEXT_PUBLIC_PRODUCTION_URL || 'https://app.rovify.io';
        case 'staging':
            return process.env.NEXT_PUBLIC_STAGING_URL || 'https://beta.rovify.io';
        default:
            return process.env.NEXT_PUBLIC_DEV_URL || 'http://localhost:3000';
    }
};

// Get platform-specific OAuth redirect URIs
export const getOAuthRedirectUri = (provider: 'google' | 'base' | 'metamask'): string => {
    // Use the active origin for redirect to keep state/PKCE on the same origin
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : getBaseUrl();

    switch (provider) {
        case 'google':
            // Allow explicit override to avoid Google redirect_uri_mismatch
            // Must exactly match the value configured in Google Cloud Console
            if (process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI) {
                return process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI.trim();
            }
            return `${baseUrl}/api/auth/callback/google`;
        case 'base':
            return `${baseUrl}/api/auth/callback/base`;
        case 'metamask':
            return `${baseUrl}/api/auth/callback/metamask`;
        default:
            return `${baseUrl}/api/auth/callback/${provider}`;
    }
};

// Get client-side callback page URI
export const getClientCallbackUri = (): string => {
    return `${getBaseUrl()}/auth/callback`;
};

// Debug function to help troubleshoot environment issues
export const debugEnvironment = () => {
    if (typeof window === 'undefined') {
        console.log('Environment Debug Info:');
        console.log('NODE_ENV:', process.env.NODE_ENV);
        console.log('NEXT_PUBLIC_APP_ENV:', process.env.NEXT_PUBLIC_APP_ENV);
        console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);
        console.log('Detected Environment:', getEnvironment());
        console.log('Base URL:', getBaseUrl());
    }
};