import { NextResponse } from 'next/server';
import { Livepeer } from 'livepeer';
import { getSrc } from '@livepeer/react/external';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const playbackId = url.searchParams.get('playbackId');
    if (!playbackId) {
      return NextResponse.json({ error: 'Missing playbackId' }, { status: 400 });
    }

    const apiKey = process.env.LIVEPEER_API_KEY || process.env.NEXT_PUBLIC_LIVEPEER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing LIVEPEER_API_KEY' }, { status: 400 });
    }

    const livepeer = new Livepeer({ apiKey });
    const result = await livepeer.playback.get(playbackId);
    const src = getSrc(result.playbackInfo);

    return NextResponse.json({ src, result });
  } catch (e: any) {
    console.error('playbackInfo error:', e);
    const status = e?.statusCode || e?.status || 500;
    return NextResponse.json({ error: e?.message || 'Failed to fetch playback info' }, { status });
  }
}


