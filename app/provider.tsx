// app/providers.tsx
'use client';

import { ReactNode, useEffect } from 'react';
import { ThemeProvider } from '@/app/(protected)/provider/ThemeProvider';
import { AuthProvider } from '@/context/AuthContext';
import { Web3Provider } from '@/components/web3/Web3Provider';
import { Web3EventProvider } from '@/contexts/Web3EventContext';
import { XMTPProvider } from '@/contexts/XMTPContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ErrorProvider } from '@/context/ErrorContext';

export function Providers({ children }: { children: ReactNode }) {
    // Inject Authorization: Bearer <streamKey> for Livepeer WHIP POSTs
    useEffect(() => {
        if (typeof window === 'undefined' || typeof window.fetch !== 'function') return;
        const originalFetch = window.fetch;
        window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
            try {
                const urlString = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;
                const method = (init?.method || (typeof input !== 'string' && !(input instanceof URL) ? (input as Request).method : 'GET'))?.toUpperCase?.();
                const headersObj: Record<string, string> = {};
                // Normalize existing headers from init or Request
                const existingHeaders = init?.headers || (typeof input !== 'string' && !(input instanceof URL) ? (input as Request).headers : undefined);
                if (existingHeaders instanceof Headers) {
                    existingHeaders.forEach((v, k) => { headersObj[k.toLowerCase()] = v; });
                } else if (Array.isArray(existingHeaders)) {
                    for (const [k, v] of existingHeaders as any) headersObj[String(k).toLowerCase()] = String(v);
                } else if (existingHeaders && typeof existingHeaders === 'object') {
                    for (const k of Object.keys(existingHeaders as any)) headersObj[k.toLowerCase()] = String((existingHeaders as any)[k]);
                }
                const contentType = headersObj['content-type'] || headersObj['Content-Type' as any];
                const isWebrtcPost = /\/webrtc\//i.test(urlString || '') && method === 'POST' && /application\/sdp/i.test(contentType || '');
                const hasAuth = 'authorization' in headersObj || 'Authorization' in headersObj;
                if (isWebrtcPost && !hasAuth) {
                    try {
                        const u = new URL(urlString);
                        const isWhipIngest = /\/webrtc\/video\+/i.test(u.pathname);
                        const tokenParam = u.searchParams.get('tkn');
                        // Only send Authorization for WHIP ingest when a tkn param is present
                        if (isWhipIngest && tokenParam) {
                            const nextHeaders = new Headers(existingHeaders || {});
                            nextHeaders.set('Authorization', `Bearer ${tokenParam}`);
                            const nextInit: RequestInit = { ...init, headers: nextHeaders };
                            return await originalFetch(typeof input === 'string' || input instanceof URL ? input : (input as Request), nextInit);
                        }
                    } catch {}
                }
            } catch {}
            return originalFetch(input as any, init);
        }) as any;
        return () => { window.fetch = originalFetch; };
    }, []);
    return (
        <ErrorBoundary>
            <ErrorProvider>
                <Web3Provider>
                    <Web3EventProvider>
                        <AuthProvider>
                            <ThemeProvider>
                                <XMTPProvider>
                                    {children}
                                </XMTPProvider>
                            </ThemeProvider>
                        </AuthProvider>
                    </Web3EventProvider>
                </Web3Provider>
            </ErrorProvider>
        </ErrorBoundary>
    );
}