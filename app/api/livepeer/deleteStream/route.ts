import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const streamKey = body?.streamKey;

    if (!streamKey) {
      return NextResponse.json({ error: 'Stream key is required' }, { status: 400 });
    }

    // Remove from data/streams.json
    try {
      const dataFile = path.join(process.cwd(), 'data', 'streams.json');
      let current: any[] = [];
      try {
        const raw = await fs.readFile(dataFile, 'utf-8');
        current = JSON.parse(raw || '[]');
        if (!Array.isArray(current)) current = [];
      } catch {}

      // Filter out the stream with matching streamKey
      const filtered = current.filter((s) => s?.streamKey !== streamKey);
      
      await fs.writeFile(dataFile, JSON.stringify(filtered, null, 2), 'utf-8');
      
      return NextResponse.json({ success: true, removed: current.length - filtered.length });
    } catch (e) {
      console.error('Failed to delete stream from store:', e);
      return NextResponse.json({ error: 'Failed to delete stream' }, { status: 500 });
    }
  } catch (e: any) {
    console.error('Delete stream error:', e);
    return NextResponse.json({ error: e?.message || 'Failed to delete stream' }, { status: 500 });
  }
}

