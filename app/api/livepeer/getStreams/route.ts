import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { Livepeer } from 'livepeer';

export async function GET() {
  try {
    // Prefer local store in dev; on Vercel, data/streams.json is ephemeral.
    const dataFile = path.join(process.cwd(), 'data', 'streams.json');
    const localRaw = await fs.readFile(dataFile, 'utf-8').catch(() => '[]');
    let items = [] as any[];
    try { items = JSON.parse(localRaw || '[]'); } catch { items = []; }

    // If no local items (e.g., serverless), optionally fall back to backend or Livepeer
    if (!Array.isArray(items) || items.length === 0) {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      const livepeerKey = process.env.LIVEPEER_API_KEY || process.env.NEXT_PUBLIC_LIVEPEER_API_KEY;
      // Try backend first if configured
      if (backendUrl) {
        try {
          const r = await fetch(`${backendUrl}/livestreams`, { cache: 'no-store' });
          if (r.ok) {
            const j = await r.json();
            if (Array.isArray(j)) {
              items = j.map((x: any) => ({
                id: x?.id || null,
                name: x?.name || 'Stream',
                playbackId: x?.playbackId || null,
                createdAt: x?.createdAt || new Date().toISOString(),
                thumbnail: x?.thumbnail || `https://picsum.photos/seed/${encodeURIComponent(x?.playbackId || x?.id || Date.now())}/640/360`,
                status: x?.status || 'live',
                contractAddress: x?.contractAddress || null,
              }));
            }
          }
        } catch {}
      }

      // If still empty and we have Livepeer key, list streams from Studio (best-effort)
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
                // Latest thumbnail via playback pipeline; fallback to placeholder
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
    }

    return NextResponse.json({ items: Array.isArray(items) ? items : [] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to read streams' }, { status: 500 });
  }
}


