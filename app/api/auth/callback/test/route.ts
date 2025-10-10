import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const testInfo = {
            message: 'OAuth callback test endpoint is working',
            timestamp: new Date().toISOString(),
            url: request.url,
            searchParams: Object.fromEntries(request.nextUrl.searchParams),
            headers: {
                host: request.headers.get('host'),
                origin: request.headers.get('origin'),
                referer: request.headers.get('referer'),
            }
        };

        return NextResponse.json(testInfo, { status: 200 });
    } catch (error) {
        console.error('OAuth callback test error:', error);
        return NextResponse.json(
            { error: 'OAuth callback test failed', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
