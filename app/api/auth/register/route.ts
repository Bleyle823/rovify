import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        console.log('🔐 API: Register request body:', body);
        
        const resp = await fetch(`${BACKEND_URL}/api/v1/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        console.log('🔐 API: Backend response status:', resp.status);
        
        const data = await resp.json().catch(() => ({}));
        console.log('🔐 API: Backend response data:', data);
        
        if (!resp.ok) {
            return NextResponse.json(
                { message: data.message || 'Registration failed' },
                { status: resp.status }
            );
        }

        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        console.error('🔐 API ERROR: Registration failed:', error);
        return NextResponse.json({ message: 'Unexpected error' }, { status: 500 });
    }
}


