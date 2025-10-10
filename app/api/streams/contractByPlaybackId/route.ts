import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const playbackId = url.searchParams.get('playbackId');
    if (!playbackId) return NextResponse.json({ error: 'Missing playbackId' }, { status: 400 });

    const dataFile = path.join(process.cwd(), 'data', 'streams.json');
    let current: any[] = [];
    try {
      const raw = await fs.readFile(dataFile, 'utf-8');
      current = JSON.parse(raw || '[]');
    } catch {}

    const found = Array.isArray(current) ? current.find((s) => s?.playbackId === playbackId) : null;
    if (!found) return NextResponse.json({ contractAddress: null });
    return NextResponse.json({ contractAddress: found?.contractAddress || null });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}


