import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { Livepeer } from 'livepeer';

export async function GET() {
  try {
    const apiKey = process.env.LIVEPEER_API_KEY || process.env.NEXT_PUBLIC_LIVEPEER_API_KEY;

    if (apiKey) {
      const livepeer = new Livepeer({ apiKey });
      const list = await livepeer.stream.getAll();
      const items = Array.isArray(list)
        ? list
            .filter((s: any) => s?.isActive || s?.isHealthy || String(s?.status || '').toLowerCase() === 'active')
            .map((s: any) => ({
              id: s?.id ?? null,
              name: s?.name ?? 'Untitled Stream',
              playbackId: s?.playbackId ?? null,
              createdAt: s?.createdAt ? new Date(s.createdAt).toISOString() : new Date().toISOString(),
              thumbnail: s?.playbackId ? `https://image.livepeer.studio/thumbnail/${s.playbackId}` : 'https://picsum.photos/seed/rovify/640/360',
              status: s?.isActive ? 'live' : (s?.status || 'idle'),
            }))
        : [];
      return NextResponse.json({ items });
    }

    // Dev fallback: use local file store
    const dataFile = path.join(process.cwd(), 'data', 'streams.json');
    const raw = await fs.readFile(dataFile, 'utf-8').catch(() => '[]');
    const items = JSON.parse(raw || '[]');
    return NextResponse.json({ items: Array.isArray(items) ? items : [] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to fetch streams' }, { status: 500 });
  }
}



