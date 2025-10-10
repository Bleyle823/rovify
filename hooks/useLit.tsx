'use client';

// Temporarily removed Lit from the app to avoid optional dependency errors.
// Reintroduce when auth-helpers dependency chain is resolved or installed.

export const LitProvider = ({ children }: { children: React.ReactNode }) => children as any;
export const useLit = () => ({ litNodeClient: null as any });
