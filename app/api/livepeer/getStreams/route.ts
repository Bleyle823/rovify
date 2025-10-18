import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { Livepeer } from 'livepeer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    // Always prefer backend as the source of truth, then fall back to local JSON, then Livepeer
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || (process.env.NODE_ENV !== 'production' ? 'http://localhost:4000' : undefined);
    const livepeerKey = process.env.LIVEPEER_API_KEY || process.env.NEXT_PUBLIC_LIVEPEER_API_KEY;
    const url = new URL(request.url);
    const source = url.searchParams.get('source');
    const forceBackend = source === 'backend';

    let items: any[] = [];

    // 1) Backend first (preferred)
    if (backendUrl) {
      try {
        const r = await fetch(`${backendUrl}/livestreams`, { cache: 'no-store' });
        if (r.ok) {
          const j = await r.json();
          if (Array.isArray(j) && j.length > 0) {
            items = j.map((x: any) => ({
              id: x?.id || null,
              name: x?.name || 'Stream',
              playbackId: x?.playbackId || x?.livepeerPlaybackId || null,
              createdAt: x?.createdAt || new Date().toISOString(),
              thumbnail: x?.thumbnail || `https://picsum.photos/seed/${encodeURIComponent(x?.playbackId || x?.id || Date.now())}/640/360`,
              status: x?.status || (x?.isActive ? 'live' : 'ended') || 'live',
              contractAddress: x?.contractAddress || null,
              isActive: x?.isActive || false,
              viewerCount: x?.viewerCount || x?.viewerPeak || 0,
              startedAt: x?.startedAt || x?.createdAt,
              endedAt: x?.endedAt || null,
              platform: x?.platform || 'livepeer',
              eventId: x?.eventId || null,
            }));
          }
        }
      } catch {}
    }

    // If caller requested backend explicitly and we have results, return immediately.
    // Otherwise, continue to fallbacks so the UI still shows streams.
    if (forceBackend && Array.isArray(items) && items.length > 0) {
      return NextResponse.json({ items });
    }

    // 2) Local JSON fallback (for dev/serverless)
    if (!Array.isArray(items) || items.length === 0) {
      try {
        const dataFile = path.join(process.cwd(), 'data', 'streams.json');
        const localRaw = await fs.readFile(dataFile, 'utf-8').catch(() => '[]');
        const localArr = JSON.parse(localRaw || '[]');
        if (Array.isArray(localArr) && localArr.length > 0) {
          items = localArr;
        }
      } catch {}
    }

    // 3) Livepeer Studio fallback (best-effort)
    if ((!items || items.length === 0) && livepeerKey) {
      try {
        const resp = await fetch('https://livepeer.studio/api/stream?limit=20', {
          headers: { Authorization: `Bearer ${livepeerKey}` },
          cache: 'no-store',
        });
        if (resp.ok) {
          const json = await resp.json();
          const arr = Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : []);
          if (Array.isArray(arr) && arr.length > 0) {
            items = arr.map((s: any) => ({
              id: s?.id || null,
              name: s?.name || 'Stream',
              playbackId: s?.playbackId || null,
              createdAt: s?.createdAt ? new Date(s.createdAt).toISOString() : new Date().toISOString(),
              thumbnail: s?.playbackId
                ? `https://recordings-cdn-s.lp-playback.studio/hls/${encodeURIComponent(s.playbackId)}/source/latest.png`
                : `https://picsum.photos/seed/${encodeURIComponent(s?.id || Date.now())}/640/360`,
              status: s?.isActive ? 'live' : 'ended',
              contractAddress: null,
            }));
          }
        }
      } catch {}
    }

    return NextResponse.json({ items: Array.isArray(items) ? items : [] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to read streams' }, { status: 500 });
  }
}


