/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { createContext, useContext, useState, useEffect, ReactNode, JSX } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getOAuthRedirectUri } from '@/utils/env';
// Updated User interface with our custom fields
interface User {
    id: string;
    email?: string;
    name?: string;
    image?: string;
    walletAddress?: string;
    baseName?: string;
    ethName?: string;
    authMethod?: 'email' | 'google' | 'metamask' | 'base';
    role?: 'admin' | 'organiser' | 'attendee';
    verified?: boolean;
    [key: string]: unknown;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    loginWithProvider: (provider: 'google' | 'github') => Promise<void>;
    loginWithWallet: (userData: User) => Promise<void>;
    logout: () => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper for public paths - keep this in sync with router configuration
function isPublicPath(pathname: string): boolean {
    return pathname === '/' ||
        pathname.startsWith('/auth/') ||
        pathname.startsWith('/forbidden/') ||
        pathname.startsWith('/maintenance/') ||
        pathname.startsWith('/terms') ||
        pathname.startsWith('/privacy') ||
        pathname.startsWith('/help') ||
        pathname.startsWith('/api/');
}

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [authInitialized, setAuthInitialized] = useState<boolean>(false);
    const router = useRouter();
    const pathname = usePathname();

    // Initialize auth state
    useEffect(() => {
        setIsLoading(false);
        setAuthInitialized(true);
    }, []);


    // Handle routing based on auth status (disabled by default)
    useEffect(() => {
        if (isLoading) return;

        // If you want to require auth again, set NEXT_PUBLIC_REQUIRE_AUTH=true
        const requireAuth = process.env.NEXT_PUBLIC_REQUIRE_AUTH === 'true';
        if (!requireAuth) {
            return; // allow access without logging in
        }

        const authPaths = ['/auth/login', '/auth/register', '/auth/forgot-password'];
        const isAuthPath = authPaths.includes(pathname);

        if (!isAuthenticated && !isAuthPath && !isPublicPath(pathname)) {
            router.push('/auth/login');
        } else if (isAuthenticated && isAuthPath) {
            router.push('/home');
        }
    }, [isAuthenticated, isLoading, pathname, router]);

    // Email/password login
    const login = async (email: string, password: string): Promise<void> => {
        console.log('🔐 AUTH: Login attempt for', email);
        setIsLoading(true);

        try {
            const resp = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const raw = await resp.json();
            if (!resp.ok) {
                throw new Error(raw?.message || raw?.error || 'Invalid email or password');
            }

            const data = raw?.data ?? raw;
            const { user: backendUser, accessToken, refreshToken } = data;

            // Persist tokens for subsequent API calls
            if (typeof window !== 'undefined') {
                localStorage.setItem('rovify_access_token', accessToken);
                localStorage.setItem('rovify_refresh_token', refreshToken);
            }

            const mappedUser: User = {
                id: backendUser?.id?.toString?.() || 'user',
                email: backendUser?.email || email,
                name: backendUser?.name,
                walletAddress: backendUser?.walletAddress,
                authMethod: 'email',
                role: backendUser?.role || 'attendee',
                verified: backendUser?.isActive ?? true,
            };

            setUser(mappedUser);
            setIsAuthenticated(true);
            router.push('/home');
        } catch (error) {
            console.error('🔐 AUTH ERROR: Login failed', error);
            throw new Error(error instanceof Error ? error.message : 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    // Generate PKCE code verifier and S256 challenge
    const generatePKCE = async () => {
        const base64UrlEncode = (buffer: Uint8Array) =>
            btoa(String.fromCharCode.apply(null, Array.from(buffer)))
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=/g, '');

        // Generate a random code verifier (43-128 chars when base64url encoded)
        const random = new Uint8Array(32);
        crypto.getRandomValues(random);
        const codeVerifier = base64UrlEncode(random);

        try {
            // Compute SHA-256 over the ASCII codeVerifier
            const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier));
            const codeChallenge = base64UrlEncode(new Uint8Array(digest));
            return { codeVerifier, codeChallenge };
        } catch (error) {
            // Fallback for environments without crypto.subtle (like HTTP in some browsers)
            console.warn('crypto.subtle not available, using plain PKCE');
            return { codeVerifier, codeChallenge: codeVerifier };
        }
    };

    // OAuth provider login
    const loginWithProvider = async (provider: 'google' | 'github'): Promise<void> => {
        console.log('🔐 AUTH: OAuth login attempt with', provider);
        setIsLoading(true);

        try {
            if (provider === 'google') {
                // Redirect to Google OAuth
                const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
                if (!clientId) {
                    throw new Error('Google OAuth not configured. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID');
                }

                const redirectUri = encodeURIComponent(getOAuthRedirectUri('google'));
                // Generate cryptographically-strong state to prevent CSRF and reduce mismatch risk
                const stateBytes = new Uint8Array(16);
                crypto.getRandomValues(stateBytes);
                const state = Array.from(stateBytes).map(b => b.toString(16).padStart(2, '0')).join('');
                
                // Generate PKCE parameters (S256)
                const { codeVerifier, codeChallenge } = await generatePKCE();
                
                // Store state and PKCE verifier for verification
                if (typeof window !== 'undefined') {
                    try {
                        // Use sessionStorage to scope to the current tab and avoid cross-tab mismatches
                        sessionStorage.removeItem('oauth_state');
                        sessionStorage.removeItem('oauth_state_issued_at');
                        sessionStorage.removeItem('pkce_verifier');

                        sessionStorage.setItem('oauth_state', state);
                        sessionStorage.setItem('oauth_state_issued_at', String(Date.now()));
                        sessionStorage.setItem('pkce_verifier', codeVerifier);
                        
                        console.log('🔐 AUTH: Stored OAuth data in sessionStorage', {
                            state: state.substring(0, 8) + '...',
                            verifier: codeVerifier.substring(0, 8) + '...'
                        });
                    } catch (error) {
                        console.warn('🔐 AUTH: sessionStorage failed, using localStorage', error);
                        // Fallback to localStorage if sessionStorage is unavailable
                        localStorage.setItem('oauth_state', state);
                        localStorage.setItem('oauth_state_issued_at', String(Date.now()));
                        localStorage.setItem('pkce_verifier', codeVerifier);
                        
                        console.log('🔐 AUTH: Stored OAuth data in localStorage', {
                            state: state.substring(0, 8) + '...',
                            verifier: codeVerifier.substring(0, 8) + '...'
                        });
                    }
                }

                const scope = encodeURIComponent('openid email profile');
                const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256&access_type=offline&include_granted_scopes=true`;
                window.location.href = googleAuthUrl;
                return;
            }

            throw new Error(`${provider} authentication not implemented`);
        } catch (error) {
            console.error('🔐 AUTH ERROR: OAuth login failed', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // Wallet-based login (for Web3 authentication)
    const loginWithWallet = async (userData: User): Promise<void> => {
        console.log(`🔐 AUTH: Wallet login attempt for ${userData.walletAddress || 'unknown wallet'}`);
        setIsLoading(true);

        try {
            // For wallet auth, we'll create a user record directly
            // In a production app, you'd want to verify wallet signature here
            
            if (!userData.walletAddress) {
                throw new Error('Wallet address is required');
            }

            // Create a local user from wallet
            const userObj: User = {
                id: 'wallet-' + (userData.walletAddress || Date.now().toString()),
                email: undefined,
                name: userData.name || userData.baseName || userData.ethName || 'Wallet User',
                image: undefined,
                walletAddress: userData.walletAddress,
                authMethod: 'metamask',
                role: 'attendee',
                verified: true,
            };
            setUser(userObj);
            setIsAuthenticated(true);

            console.log('🔐 AUTH: Wallet login successful');
            router.push('/home');
        } catch (error) {
            console.error('🔐 AUTH ERROR: Wallet login failed', error);
            throw new Error('Wallet authentication failed');
        } finally {
            setIsLoading(false);
        }
    };

    // User registration
    const register = async (name: string, email: string, password: string): Promise<void> => {
        console.log('🔐 AUTH: Register attempt for', email);
        setIsLoading(true);

        try {
            // Split name into firstName and lastName for backend compatibility
            const nameParts = name.trim().split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            const resp = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    firstName, 
                    lastName, 
                    email, 
                    password 
                })
            });

            console.log('🔐 AUTH: Registration response status:', resp.status);
            console.log('🔐 AUTH: Registration response headers:', Object.fromEntries(resp.headers.entries()));

            let raw;
            try {
                const responseText = await resp.text();
                console.log('🔐 AUTH: Raw response text:', responseText);
                
                if (!responseText) {
                    throw new Error('Empty response from server');
                }
                
                raw = JSON.parse(responseText);
                console.log('🔐 AUTH: Parsed response:', raw);
            } catch (parseError) {
                console.error('🔐 AUTH: Failed to parse response:', parseError);
                throw new Error('Invalid response from server. Please try again.');
            }

            if (!resp.ok) {
                throw new Error(raw?.message || raw?.error || 'Registration failed');
            }

            const data = raw?.data ?? raw;
            console.log('🔐 AUTH: Extracted data:', data);
            
            const { user: backendUser, accessToken, refreshToken } = data;

            if (!backendUser) {
                throw new Error('User data not found in response');
            }

            if (!accessToken) {
                throw new Error('Access token not found in response');
            }

            if (typeof window !== 'undefined') {
                localStorage.setItem('rovify_access_token', accessToken);
                localStorage.setItem('rovify_refresh_token', refreshToken);
            }

            console.log('🔐 AUTH: Backend user data:', backendUser);

            const mappedUser: User = {
                id: backendUser?.id?.toString?.() || 'user',
                email: backendUser?.email || email,
                name: backendUser?.name || (backendUser?.firstName && backendUser?.lastName 
                    ? `${backendUser.firstName} ${backendUser.lastName}`.trim()
                    : name),
                walletAddress: backendUser?.walletAddress,
                authMethod: 'email',
                role: backendUser?.role || 'attendee',
                verified: backendUser?.isActive ?? true,
            };

            console.log('🔐 AUTH: Mapped user:', mappedUser);

            setUser(mappedUser);
            setIsAuthenticated(true);
            router.push('/home');
        } catch (error) {
            console.error('🔐 AUTH ERROR: Registration failed', error);
            throw new Error(error instanceof Error ? error.message : 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    // Logout
    const logout = async (): Promise<void> => {
        console.log('🔐 AUTH: Logging out user', user?.email || user?.walletAddress || user?.id);
        // Clear local tokens and state
        if (typeof window !== 'undefined') {
            localStorage.removeItem('rovify_access_token');
            localStorage.removeItem('rovify_refresh_token');
        }
        setUser(null);
        setIsAuthenticated(false);
        router.push('/auth/login');
    };

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            isAuthenticated,
            login,
            loginWithProvider,
            loginWithWallet,
            logout,
            register
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}