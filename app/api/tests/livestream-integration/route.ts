import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const playbackId = body?.playbackId || `test_${Date.now()}`;
    const name = body?.name || 'Integration Test Stream';

    const rawBase = (process.env.NEXT_PUBLIC_BACKEND_URL || '').replace(/\/$/, '');
    const backendBase = rawBase
      ? (rawBase.includes('/api/') ? rawBase : `${rawBase}/api/v1`)
      : '';
    if (!backendBase) {
      return NextResponse.json({ error: 'NEXT_PUBLIC_BACKEND_URL is not configured' }, { status: 400 });
    }

    const auth = req.headers.get('authorization');
    if (!auth) {
      return NextResponse.json({ error: 'Missing Authorization header from client' }, { status: 401 });
    }

    // 1) Create livestream
    const createResp = await fetch(`${backendBase}/livestreams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: auth },
      body: JSON.stringify({
        name,
        platform: 'livepeer',
        streamKey: 'st_live_integration',
        livepeerStreamId: 'lp_stream_integration',
        playbackId,
        status: 'starting',
        isActive: false,
        isHealthy: true,
        suspended: false,
      }),
    });
    const createText = await createResp.text();
    let created: any = null;
    try { created = JSON.parse(createText); } catch {}

    if (!createResp.ok) {
      return NextResponse.json({ step: 'create', status: createResp.status, body: createText }, { status: 500 });
    }

    const id = created?.id || created?.data?.id;

    // 2) Mark LIVE
    const liveResp = await fetch(`${backendBase}/livestreams/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: auth },
      body: JSON.stringify({ status: 'live' }),
    });
    const liveText = await liveResp.text();
    if (!liveResp.ok) {
      return NextResponse.json({ step: 'patch', status: liveResp.status, body: liveText, id }, { status: 500 });
    }

    // 3) Query active by playbackId
    const activeResp = await fetch(`${backendBase}/livestreams/active?playbackId=${encodeURIComponent(playbackId)}`, {
      headers: { Authorization: auth },
      cache: 'no-store',
    });
    const activeText = await activeResp.text();
    if (!activeResp.ok) {
      return NextResponse.json({ step: 'active', status: activeResp.status, body: activeText, id }, { status: 500 });
    }

    let active: any = null;
    try { active = JSON.parse(activeText); } catch {}

    return NextResponse.json({ ok: true, id, playbackId, create: created, live: liveText, active });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Integration failed' }, { status: 500 });
  }
}


