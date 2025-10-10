import { Livepeer } from 'livepeer';

export function createLivepeerClient() {
    const apiKey = process.env.LIVEPEER_API_KEY || process.env.NEXT_PUBLIC_LIVEPEER_API_KEY;
    if (!apiKey) {
        throw new Error('Missing LIVEPEER_API_KEY');
    }
    return new Livepeer({ apiKey });
}

// Note: React client utilities removed for current dependency versions.


