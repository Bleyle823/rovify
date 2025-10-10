import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

type ViewersStore = Record<string, Record<string, number>>; // playbackId -> viewerId -> lastHeartbeatMs

const VIEWERS_FILE = path.join(process.cwd(), 'data', 'viewers.json');
const STALE_MS = 30_000; // viewer considered active if heartbeat in last 30s

async function readStore(): Promise<ViewersStore> {
  try {
    const raw = await fs.readFile(VIEWERS_FILE, 'utf-8');
    const json = JSON.parse(raw || '{}');
    if (json && typeof json === 'object') return json as ViewersStore;
    return {};
  } catch {
    return {};
  }
}

async function writeStore(store: ViewersStore) {
  await fs.mkdir(path.dirname(VIEWERS_FILE), { recursive: true });
  await fs.writeFile(VIEWERS_FILE, JSON.stringify(store, null, 2), 'utf-8');
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const playbackId = url.searchParams.get('playbackId');
    if (!playbackId) return NextResponse.json({ error: 'Missing playbackId' }, { status: 400 });

    const store = await readStore();
    const now = Date.now();
    const viewers = store[playbackId] || {};
    // purge stale
    const activeEntries = Object.entries(viewers).filter(([, ts]) => now - ts <= STALE_MS);
    const count = activeEntries.length;

    return NextResponse.json({ playbackId, viewerCount: count });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const playbackId: string | undefined = body?.playbackId;
    const viewerId: string | undefined = body?.viewerId;
    if (!playbackId || !viewerId) {
      return NextResponse.json({ error: 'Missing playbackId or viewerId' }, { status: 400 });
    }

    const store = await readStore();
    const now = Date.now();
    const viewers = store[playbackId] || {};
    // purge stale then upsert
    const pruned: Record<string, number> = {};
    for (const [id, ts] of Object.entries(viewers)) {
      if (now - ts <= STALE_MS) pruned[id] = ts;
    }
    pruned[viewerId] = now;
    store[playbackId] = pruned;
    await writeStore(store);

    return NextResponse.json({ playbackId, viewerCount: Object.keys(pruned).length });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}


