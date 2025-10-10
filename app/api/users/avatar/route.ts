import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
    try {
        const auth = request.headers.get('authorization') || '';
        const formData = await request.formData();
        
        const resp = await fetch(`${BACKEND_URL}/api/v1/upload/avatar`, {
            method: 'POST',
            headers: { 'Authorization': auth },
            body: formData
        });
        
        const raw = await resp.json().catch(() => ({}));
        if (!resp.ok) {
            return NextResponse.json({ message: raw?.message || 'Failed to upload avatar' }, { status: resp.status });
        }
        
        return NextResponse.json(raw, { status: 200 });
    } catch (e) {
        return NextResponse.json({ message: 'Unexpected error' }, { status: 500 });
    }
}
