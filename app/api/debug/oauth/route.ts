import { NextRequest, NextResponse } from 'next/server';
import { getBaseUrl, getOAuthRedirectUri } from '@/utils/env';

export async function GET(request: NextRequest) {
    try {
        const debugInfo = {
            timestamp: new Date().toISOString(),
            environment: {
                NODE_ENV: process.env.NODE_ENV,
                NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
                NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
                NEXT_PUBLIC_DEV_URL: process.env.NEXT_PUBLIC_DEV_URL,
            },
            urls: {
                baseUrl: getBaseUrl(),
                googleRedirectUri: getOAuthRedirectUri('google'),
                clientCallbackUri: `${getBaseUrl()}/auth/callback`,
            },
            googleOAuth: {
                clientId: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not Set',
                clientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Not Set',
            },
            request: {
                url: request.url,
                origin: request.headers.get('origin'),
                host: request.headers.get('host'),
            }
        };

        return NextResponse.json(debugInfo, { status: 200 });
    } catch (error) {
        console.error('Debug endpoint error:', error);
        return NextResponse.json(
            { error: 'Debug endpoint failed', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
