import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { Livepeer } from 'livepeer';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = body?.name || 'Rovify Stream';
    const contractAddress: string | undefined = body?.contractAddress?.trim() || undefined;
    const creatorUserId: string | undefined = body?.creatorUserId || undefined;
    const image: string | undefined = body?.image || undefined;

    const apiKey = process.env.LIVEPEER_API_KEY || process.env.NEXT_PUBLIC_LIVEPEER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing LIVEPEER_API_KEY. Set it in your environment and restart the server.' }, { status: 400 });
    }

    const livepeer = new Livepeer({ apiKey });

    const result = await livepeer.stream.create({ name });
    const stream = (result as any)?.stream ?? result;

    // Return stream key if present (Studio API returns streamKey)
    const streamKey = stream?.streamKey || stream?.ingest?.streamKey || null;
    const playbackId = stream?.playbackId || null;

    // Append to data/streams.json for user dashboard listings
    try {
      const dataFile = path.join(process.cwd(), 'data', 'streams.json');
      let current: any[] = [];
      try {
        const raw = await fs.readFile(dataFile, 'utf-8');
        current = JSON.parse(raw || '[]');
        if (!Array.isArray(current)) current = [];
      } catch {}
      const entry = {
        id: stream?.id || null,
        name,
        playbackId,
        createdAt: new Date().toISOString(),
        thumbnail: image || `https://picsum.photos/seed/${encodeURIComponent(playbackId || stream?.id || Date.now())}/640/360`,
        status: 'live',
        contractAddress: contractAddress || null,
        streamKey: streamKey || null,
      };
      current.unshift(entry);
      await fs.mkdir(path.dirname(dataFile), { recursive: true });
      await fs.writeFile(dataFile, JSON.stringify(current, null, 2), 'utf-8');
    } catch (e) {
      // non-fatal
      console.error('Failed to append stream to store:', e);
    }

    // Fire-and-forget: notify backend to persist livestream entry
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (backendUrl) {
        const organiserUserId = (body?.organiserUserId as string | undefined) || undefined;
        await fetch(`${backendUrl}/livestreams`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            creatorUserId: organiserUserId || creatorUserId,
            platform: 'livepeer',
            streamKey: streamKey || undefined,
            livepeerStreamId: stream?.id || undefined,
            playbackId: playbackId || undefined,
            status: 'starting',
            isActive: false,
            isHealthy: true,
            suspended: false
          })
        }).catch(() => undefined);
      }
    } catch {}

    return NextResponse.json({ id: stream?.id, streamKey, playbackId });
  } catch (e: any) {
    console.error('Livepeer createStream error:', e);
    const status = e?.statusCode || e?.status || 500;
    const message = e?.message || 'Failed to create stream';
    const data = e?.data || e?.response || undefined;
    return NextResponse.json({ error: message, details: data }, { status });
  }
}


