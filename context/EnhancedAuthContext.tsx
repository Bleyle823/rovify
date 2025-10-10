'use client';

import { createContext, useContext, useState, useEffect, ReactNode, JSX } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useError } from './ErrorContext';
import { apiClient } from '@/lib/enhanced-api-client';

// API Response interfaces
interface AuthResponse {
    user: {
        id: string | number;
        email?: string;
        name?: string;
        image?: string;
        walletAddress?: string;
        role?: 'admin' | 'organiser' | 'attendee';
        isActive?: boolean;
        authMethod?: 'email' | 'google' | 'metamask' | 'base';
    };
    accessToken: string;
    refreshToken: string;
}

interface ProfileResponse {
    id: string | number;
    email?: string;
    name?: string;
    image?: string;
    walletAddress?: string;
    authMethod?: 'email' | 'google' | 'metamask' | 'base';
    role?: 'admin' | 'organiser' | 'attendee';
    isActive?: boolean;
}

interface RefreshResponse {
    accessToken: string;
    refreshToken?: string;
}

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
    signature?: string;
    message?: string;
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
    refreshToken: () => Promise<boolean>;
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

export function EnhancedAuthProvider({ children }: { children: ReactNode }): JSX.Element {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [authInitialized, setAuthInitialized] = useState<boolean>(false);
    const router = useRouter();
    const pathname = usePathname();
    const { showError, showSuccess, showWarning } = useError();

    // Initialize auth state
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const token = localStorage.getItem('rovify_access_token');
                if (token) {
                    // Verify token is still valid
                    const isValid = await verifyToken(token);
                    if (isValid) {
                        await loadUserProfile();
                    } else {
                        // Try to refresh token
                        const refreshed = await refreshToken();
                        if (!refreshed) {
                            clearAuthData();
                        }
                    }
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
                clearAuthData();
            } finally {
                setIsLoading(false);
                setAuthInitialized(true);
            }
        };

        initializeAuth();
    }, []);

    // Handle routing based on auth status
    useEffect(() => {
        if (!authInitialized || isLoading) return;

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
    }, [isAuthenticated, isLoading, authInitialized, pathname, router]);

    const verifyToken = async (token: string): Promise<boolean> => {
        try {
            const response = await apiClient.get('/api/auth/verify', {
                headers: { Authorization: `Bearer ${token}` },
                showErrorToast: false,
            });
            return !response.error;
        } catch {
            return false;
        }
    };

    const loadUserProfile = async (): Promise<void> => {
        try {
            const response = await apiClient.get('/api/auth/profile', {
                showErrorToast: false,
            });

            if (response.data) {
                const userData = response.data as ProfileResponse;
                const mappedUser: User = {
                    id: userData.id?.toString() || 'user',
                    email: userData.email,
                    name: userData.name,
                    image: userData.image,
                    walletAddress: userData.walletAddress,
                    authMethod: userData.authMethod || 'email',
                    role: userData.role || 'attendee',
                    verified: userData.isActive ?? true,
                };
                setUser(mappedUser);
                setIsAuthenticated(true);
            }
        } catch (error) {
            console.error('Failed to load user profile:', error);
            clearAuthData();
        }
    };

    const clearAuthData = (): void => {
        setUser(null);
        setIsAuthenticated(false);
        if (typeof window !== 'undefined') {
            localStorage.removeItem('rovify_access_token');
            localStorage.removeItem('rovify_refresh_token');
        }
    };

    const refreshToken = async (): Promise<boolean> => {
        try {
            const refreshTokenValue = localStorage.getItem('rovify_refresh_token');
            if (!refreshTokenValue) {
                return false;
            }

            const response = await apiClient.post('/api/auth/refresh', {
                refreshToken: refreshTokenValue,
            }, {
                showErrorToast: false,
            });

            if (response.data) {
                const refreshData = response.data as RefreshResponse;
                if (refreshData.accessToken) {
                    localStorage.setItem('rovify_access_token', refreshData.accessToken);
                    if (refreshData.refreshToken) {
                        localStorage.setItem('rovify_refresh_token', refreshData.refreshToken);
                    }
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('Token refresh failed:', error);
            return false;
        }
    };

    // Email/password login
    const login = async (email: string, password: string): Promise<void> => {
        console.log('Login attempt for', email);
        setIsLoading(true);

        try {
            const response = await apiClient.post('/api/auth/login', {
                email,
                password,
            }, {
                showErrorToast: false, // We'll handle errors manually
            });

            if (response.error) {
                throw new Error(response.error);
            }

            const authData = response.data as AuthResponse;
            const { user: backendUser, accessToken, refreshToken: refreshTokenValue } = authData;

            // Persist tokens for subsequent API calls
            if (typeof window !== 'undefined') {
                localStorage.setItem('rovify_access_token', accessToken);
                localStorage.setItem('rovify_refresh_token', refreshTokenValue);
            }

            const mappedUser: User = {
                id: backendUser?.id?.toString() || 'user',
                email: backendUser?.email || email,
                name: backendUser?.name,
                walletAddress: backendUser?.walletAddress,
                authMethod: 'email',
                role: backendUser?.role || 'attendee',
                verified: backendUser?.isActive ?? true,
            };

            setUser(mappedUser);
            setIsAuthenticated(true);
            showSuccess('Welcome back!', `Hello ${mappedUser.name || email}`);
            router.push('/home');
        } catch (error) {
            console.error('Login failed', error);
            const errorMessage = error instanceof Error ? error.message : 'Login failed';
            
            // Provide more specific error messages
            if (errorMessage.includes('Invalid') || errorMessage.includes('credentials')) {
                showError('Login Failed', 'Please check your email and password and try again.');
            } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
                showError('Connection Error', 'Please check your internet connection and try again.', {
                    label: 'Retry',
                    onClick: () => login(email, password),
                });
            } else {
                showError('Login Failed', errorMessage);
            }
            
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // OAuth provider login
    const loginWithProvider = async (provider: 'google' | 'github'): Promise<void> => {
        console.log(`${provider} login attempt`);
        setIsLoading(true);

        try {
            // Redirect to OAuth provider
            const redirectUri = encodeURIComponent(`${window.location.origin}/auth/callback`);
            const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
            
            if (provider === 'google' && clientId) {
                const googleAuthUrl = `https://accounts.google.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=email profile&response_type=code`;
                window.location.href = googleAuthUrl;
                return;
            }

            throw new Error(`${provider} authentication not configured`);
        } catch (error) {
            console.error(`${provider} login failed`, error);
            const errorMessage = error instanceof Error ? error.message : `${provider} login failed`;
            showError(`${provider} Login Failed`, errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // Wallet login
    const loginWithWallet = async (userData: User): Promise<void> => {
        console.log('Wallet login attempt');
        setIsLoading(true);

        try {
            const response = await apiClient.post('/api/auth/wallet-login', {
                walletAddress: userData.walletAddress,
                signature: userData.signature,
                message: userData.message,
            }, {
                showErrorToast: false,
            });

            if (response.error) {
                throw new Error(response.error);
            }

            const authData = response.data as AuthResponse;
            const { user: backendUser, accessToken, refreshToken: refreshTokenValue } = authData;

            // Persist tokens
            if (typeof window !== 'undefined') {
                localStorage.setItem('rovify_access_token', accessToken);
                localStorage.setItem('rovify_refresh_token', refreshTokenValue);
            }

            const mappedUser: User = {
                id: backendUser?.id?.toString() || 'user',
                email: backendUser?.email,
                name: backendUser?.name || userData.name,
                image: backendUser?.image || userData.image,
                walletAddress: backendUser?.walletAddress || userData.walletAddress,
                authMethod: 'metamask',
                role: backendUser?.role || 'attendee',
                verified: backendUser?.isActive ?? true,
            };

            setUser(mappedUser);
            setIsAuthenticated(true);
            showSuccess('Wallet Connected!', `Welcome ${mappedUser.name || 'to Rovify'}`);
            router.push('/home');
        } catch (error) {
            console.error('Wallet login failed', error);
            const errorMessage = error instanceof Error ? error.message : 'Wallet login failed';
            showError('Wallet Connection Failed', errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // Registration
    const register = async (name: string, email: string, password: string): Promise<void> => {
        console.log('Registration attempt for', email);
        setIsLoading(true);

        try {
            const response = await apiClient.post('/api/auth/register', {
                name,
                email,
                password,
            }, {
                showErrorToast: false,
            });

            if (response.error) {
                throw new Error(response.error);
            }

            const authData = response.data as AuthResponse;
            const { user: backendUser, accessToken, refreshToken: refreshTokenValue } = authData;

            // Persist tokens
            if (typeof window !== 'undefined') {
                localStorage.setItem('rovify_access_token', accessToken);
                localStorage.setItem('rovify_refresh_token', refreshTokenValue);
            }

            const mappedUser: User = {
                id: backendUser?.id?.toString() || 'user',
                email: backendUser?.email || email,
                name: backendUser?.name || name,
                authMethod: 'email',
                role: backendUser?.role || 'attendee',
                verified: backendUser?.isActive ?? true,
            };

            setUser(mappedUser);
            setIsAuthenticated(true);
            showSuccess('Welcome to Rovify!', `Your account has been created successfully.`);
            router.push('/home');
        } catch (error) {
            console.error('Registration failed', error);
            const errorMessage = error instanceof Error ? error.message : 'Registration failed';
            
            // Provide more specific error messages
            if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
                showError('Email Already Exists', 'An account with this email already exists. Please try logging in instead.', {
                    label: 'Go to Login',
                    onClick: () => router.push('/auth/login'),
                });
            } else if (errorMessage.includes('password')) {
                showError('Password Requirements', 'Please ensure your password meets all requirements.');
            } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
                showError('Connection Error', 'Please check your internet connection and try again.', {
                    label: 'Retry',
                    onClick: () => register(name, email, password),
                });
            } else {
                showError('Registration Failed', errorMessage);
            }
            
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // Logout
    const logout = async (): Promise<void> => {
        console.log('Logout');
        setIsLoading(true);

        try {
            // Call logout endpoint to invalidate tokens on server
            await apiClient.post('/api/auth/logout', {}, {
                showErrorToast: false,
            });
        } catch (error) {
            console.error('Logout API call failed:', error);
            // Continue with local logout even if API call fails
        } finally {
            clearAuthData();
            showSuccess('Logged Out', 'You have been successfully logged out.');
            router.push('/');
            setIsLoading(false);
        }
    };

    const value: AuthContextType = {
        user,
        isLoading,
        isAuthenticated,
        login,
        loginWithProvider,
        loginWithWallet,
        logout,
        register,
        refreshToken,
    };

    return (
        <AuthContext.Provider value={value}>
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