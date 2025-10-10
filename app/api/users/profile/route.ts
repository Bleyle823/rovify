import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

export async function GET(request: NextRequest) {
    try {
        const auth = request.headers.get('authorization') || '';
        const resp = await fetch(`${BACKEND_URL}/api/v1/users/profile`, {
            method: 'GET',
            headers: { 'Authorization': auth },
            cache: 'no-store'
        });
        const raw = await resp.json().catch(() => ({}));
        if (!resp.ok) {
            return NextResponse.json({ message: raw?.message || 'Failed to load profile' }, { status: resp.status });
        }
        return NextResponse.json(raw, { status: 200 });
    } catch (e) {
        return NextResponse.json({ message: 'Unexpected error' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const auth = request.headers.get('authorization') || '';
        const body = await request.json();
        const resp = await fetch(`${BACKEND_URL}/api/v1/users/profile`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': auth },
            body: JSON.stringify(body)
        });
        const raw = await resp.json().catch(() => ({}));
        if (!resp.ok) {
            return NextResponse.json({ message: raw?.message || 'Failed to update profile' }, { status: resp.status });
        }
        return NextResponse.json(raw, { status: 200 });
    } catch (e) {
        return NextResponse.json({ message: 'Unexpected error' }, { status: 500 });
    }
}


