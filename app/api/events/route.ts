import { NextRequest, NextResponse } from 'next/server';

// Map the lightweight frontend form into the backend CreateEventDto shape
function mapToCreateEventDto(body: any) {
  const title = body?.title?.trim();
  const description = body?.description?.trim();
  const startDate = body?.startDate || buildIsoDate(body?.date, body?.time);
  const endDate = body?.endDate || buildIsoDate(body?.endDateOnly || body?.endDate, body?.endTime);

  const tags = (body?.tags || '')
    .toString()
    .split(',')
    .map((t: string) => t.trim())
    .filter(Boolean);

  const currency = body?.currency || 'USD';
  const minPrice = Number(body?.minPrice ?? 0) || 0;
  const maxPrice = Number(body?.maxPrice ?? minPrice) || minPrice;
  const totalTickets = Number(body?.totalTickets ?? 0) || 0;

  // Single tier derived from min/max; if different, keep min as base for now
  const tiers = [
    {
      name: 'General',
      price: minPrice,
      quantity: totalTickets > 0 ? totalTickets : 100,
      description: 'General admission',
    },
  ];

  const categories = body?.category ? [String(body.category)] : [];

  const location = {
    address: body?.locationAddress || '',
    city: body?.locationCity || '',
    state: body?.locationState || undefined,
    country: body?.locationCountry || 'US',
    postalCode: body?.locationPostalCode || undefined,
    latitude: Number(body?.latitude ?? 0) || 0,
    longitude: Number(body?.longitude ?? 0) || 0,
    venue: body?.locationName || undefined,
    isVirtual: Boolean(body?.isVirtual) || false,
    virtualUrl: body?.virtualUrl || undefined,
  };

  const pricing = {
    currency,
    tiers,
    isFreeSale: minPrice === 0,
    acceptsCrypto: true,
    acceptsFiat: true,
  };

  const metadata = {
    tags,
    categories,
  };

  return {
    title,
    description,
    banner: body?.image || undefined,
    images: body?.images || (body?.image ? [body.image] : undefined),
    status: body?.status || 'published',
    startDate,
    endDate,
    registrationStart: body?.registrationStart || undefined,
    registrationEnd: body?.registrationEnd || undefined,
    location,
    pricing,
    maxAttendees: totalTickets || undefined,
    isPublic: body?.isPublic !== undefined ? Boolean(body.isPublic) : true,
    requiresApproval: Boolean(body?.requiresApproval) || false,
    allowGroupRegistration: Boolean(body?.allowGroupRegistration) || true,
    isNftGated: Boolean(body?.hasNftTickets) || false,
    metadata,
  };
}

function buildIsoDate(datePart?: string, timePart?: string) {
  if (!datePart) return undefined;
  const iso = timePart ? `${datePart}T${timePart}:00.000Z` : `${datePart}T00:00:00.000Z`;
  return iso;
}

export async function POST(req: NextRequest) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backendUrl) {
      return NextResponse.json({ error: 'Backend URL not configured' }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const dto = mapToCreateEventDto(body);

    // Read access token from header cookie if present (client should set localStorage cookie beforehand)
    const authHeader = req.headers.get('authorization');
    const bearer = authHeader || undefined;

    const res = await fetch(`${backendUrl}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(bearer ? { Authorization: bearer } : {}),
      },
      body: JSON.stringify(dto),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json({ error: data?.message || data?.error || 'Failed to create event' }, { status: res.status });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 });
  }
}


