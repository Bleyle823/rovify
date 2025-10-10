import Livepeer from 'livepeer';
import { createReactClient, studioProvider } from '@livepeer/react';

export function createLivepeerClient() {
    const apiKey = process.env.LIVEPEER_API_KEY || process.env.NEXT_PUBLIC_LIVEPEER_API_KEY;
    if (!apiKey) {
        throw new Error('Missing LIVEPEER_API_KEY');
    }
    return new Livepeer({ apiKey });
}

export const livepeerReactClient = (() => {
    const apiKey = process.env.LIVEPEER_API_KEY || process.env.NEXT_PUBLIC_LIVEPEER_API_KEY;
    if (!apiKey) return null;
    return createReactClient({ provider: studioProvider({ apiKey }) });
})();


