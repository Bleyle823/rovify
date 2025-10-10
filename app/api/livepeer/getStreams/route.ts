import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const dataFile = path.join(process.cwd(), 'data', 'streams.json');
    const raw = await fs.readFile(dataFile, 'utf-8').catch(() => '[]');
    const items = JSON.parse(raw || '[]');
    return NextResponse.json({ items: Array.isArray(items) ? items : [] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to read streams' }, { status: 500 });
  }
}


