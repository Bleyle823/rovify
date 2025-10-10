/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    return NextResponse.next();
}

export const config = {
    // Only match routes that aren't Next.js internals
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};