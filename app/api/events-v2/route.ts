import { NextRequest, NextResponse } from 'next/server';

function toIso(datePart?: string, timePart?: string) {
  if (!datePart) return undefined;
  const t = timePart ? `${timePart}:00.000Z` : '00:00:00.000Z';
  return `${datePart}T${t}`;
}

function mapToCreateEventV2Dto(body: any) {
  const title = body?.title?.trim();
  const description = body?.description?.trim();

  const startDate = body?.startDate || toIso(body?.date, body?.time);
  const endDate = body?.endDate || toIso(body?.endDateOnly || body?.endDate, body?.endTime);

  const tags: string[] | undefined = (body?.tags ?? '')
    .toString()
    .split(',')
    .map((t: string) => t.trim())
    .filter(Boolean);

  return {
    title,
    description,
    category: body?.category || undefined,
    subcategory: body?.subcategory || undefined,
    startDate,
    endDate,
    locationName: body?.locationName || undefined,
    locationAddress: body?.locationAddress || undefined,
    locationCity: body?.locationCity || undefined,
    currency: body?.currency || 'USD',
    minPrice: Number(body?.minPrice ?? 0) || 0,
    maxPrice: Number(body?.maxPrice ?? 0) || 0,
    totalTickets: Number(body?.totalTickets ?? 0) || 0,
    hasNftTickets: Boolean(body?.hasNftTickets) || false,
    tags: tags && tags.length ? tags : undefined,
    image: body?.image || undefined,
    isPublic: body?.isPublic !== undefined ? Boolean(body.isPublic) : true,
    txHash: body?.txHash || undefined,
  };
}

export async function POST(req: NextRequest) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

    // Build API base, ensure it includes the API prefix if missing
    const buildApiBase = (base: string): string => {
      try {
        const url = new URL(base);
        const pathname = url.pathname.replace(/\/?$/, '');
        if (!/\/api(\/|$)/.test(pathname)) {
          url.pathname = `${pathname}/api/v1`;
        }
        return url.toString().replace(/\/?$/, '');
      } catch {
        const trimmed = base.replace(/\/?$/, '');
        return `${trimmed}/api/v1`;
      }
    };

    const apiBase = buildApiBase(backendUrl);

    const body = await req.json().catch(() => ({}));
    const dto = mapToCreateEventV2Dto(body);

    // Quick client-side validation to avoid sending obviously invalid payloads
    if (!dto?.title || !dto?.description || !dto?.startDate || !dto?.endDate) {
      return NextResponse.json({ error: 'Missing required fields: title, description, startDate, endDate' }, { status: 400 });
    }

    const authHeader = req.headers.get('authorization') || undefined;

    // Basic auth check: require bearer token
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized: missing bearer token' }, { status: 401 });
    }

    const res = await fetch(`${apiBase}/events-v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(dto),
      // Don't set a client timeout; backend is fast and returns 201
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const status = res.status || 502;
      return NextResponse.json({ error: data?.message || data?.error || 'Failed to create event (v2)' }, { status });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 });
  }
}
