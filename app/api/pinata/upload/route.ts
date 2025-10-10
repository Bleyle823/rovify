import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const jwt = process.env.PINATA_JWT;
    if (!jwt) {
      return NextResponse.json({ error: 'PINATA_JWT not configured' }, { status: 500 });
    }

    const form = await request.formData();
    const file = form.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const pinataForm = new FormData();
    pinataForm.append('file', file);

    const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
      body: pinataForm,
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: 'Pinata upload failed', detail: text }, { status: 502 });
    }

    const data = await res.json();
    // data.IpfsHash is the CID
    const cid = data.IpfsHash as string;
    // Prefer ipfs.io to avoid Pinata gateway rate limits (429)
    const gatewayUrl = `https://ipfs.io/ipfs/${cid}`;
    return NextResponse.json({ cid, url: gatewayUrl }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: 'Upload error' }, { status: 500 });
  }
}


