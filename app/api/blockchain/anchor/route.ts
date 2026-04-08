import { NextResponse } from 'next/server';
import { getAuditLog } from '@/lib/security/audit-logger';
import { anchorAuditLog } from '@/lib/blockchain/anchor';

export async function GET() {
  return NextResponse.json({
    supported: true,
    network: 'polygon-amoy',
    explorerBase: 'https://amoy.polygonscan.com/tx/',
    instructions: 'POST to anchor current audit log to Polygon Amoy',
  });
}

export async function POST() {
  try {
    const entries = getAuditLog();
    if (entries.length === 0) {
      return NextResponse.json(
        { error: 'No audit entries to anchor' },
        { status: 400 }
      );
    }

    const result = await anchorAuditLog(
      entries,
      process.env.POLYGON_PRIVATE_KEY ?? '',
      process.env.POLYGON_AMOY_RPC ?? 'https://rpc-amoy.polygon.technology'
    );

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown blockchain error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
