import { NextRequest, NextResponse } from 'next/server';

type PairBody = {
  pairingCode?: string;
  deviceName?: string;
  backend?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PairBody;
    const pairingCode = body.pairingCode;
    const deviceName = body.deviceName || 'Phone';
    const backend = body.backend || 'http://localhost:4000';

    if (!pairingCode) {
      return NextResponse.json({ success: false, error: 'Missing pairing code' }, { status: 400 });
    }

    const res = await fetch(`${backend.replace(/\/$/, '')}/api/pair/complete`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ pairingCode, deviceName }),
      cache: 'no-store',
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Proxy pairing failed' }, { status: 500 });
  }
}
