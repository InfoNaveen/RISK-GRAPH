import { NextRequest, NextResponse } from 'next/server';
import { scanPrompt } from '@/lib/security/prompt-guard';
import { logEvent } from '@/lib/security/audit-logger';

interface ScanRequestBody {
  input: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ScanRequestBody = await request.json();
    const { input } = body;

    if (!input || typeof input !== 'string') {
      return NextResponse.json(
        { error: 'Missing input field' },
        { status: 400 }
      );
    }

    const result = scanPrompt(input);

    logEvent({
      eventType: result.safe ? 'security_scan' : 'injection_blocked',
      input: input.slice(0, 200),
      threatLevel: result.threatLevel,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error in security scan';
    console.error('Security scan error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
