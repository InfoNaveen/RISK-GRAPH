import { NextResponse } from 'next/server';
import { getAuditLog, verifyLogIntegrity } from '@/lib/security/audit-logger';

export async function GET() {
  try {
    const log = getAuditLog();
    const integrity = verifyLogIntegrity();

    return NextResponse.json({ log, integrity });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error in audit log';
    console.error('Audit log error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
