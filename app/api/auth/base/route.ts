import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { address, signature, message, baseName } = await req.json();

    if (!address || !signature || !message) {
      return NextResponse.json(
        { message: 'Missing required fields: address, signature, and message are required' },
        { status: 400 },
      );
    }

    // NOTE: In production, verify the signature server-side against the message and address
    // and create/fetch the user from your DB. This is a minimal stub to unblock the client.

    const user = {
      id: `base-${String(address).toLowerCase()}`,
      walletAddress: address,
      baseName: baseName ?? null,
    };

    return NextResponse.json(user, { status: 200 });
  } catch (err) {
    // If body wasn't JSON or other unexpected error
    return NextResponse.json(
      { message: 'Invalid request body' },
      { status: 400 },
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Method Not Allowed' },
    { status: 405 },
  );
}


