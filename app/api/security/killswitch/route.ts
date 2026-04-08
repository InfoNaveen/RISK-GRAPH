import { NextRequest, NextResponse } from 'next/server';
import {
  activateKillSwitch,
  deactivateKillSwitch,
  getKillSwitchState,
} from '@/lib/security/kill-switch';
import { logEvent } from '@/lib/security/audit-logger';

export async function GET() {
  try {
    const state = getKillSwitchState();
    return NextResponse.json(state);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

interface KillSwitchRequestBody {
  action: 'activate' | 'deactivate';
  reason?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: KillSwitchRequestBody = await request.json();
    const { action, reason } = body;

    if (action === 'activate') {
      const event = activateKillSwitch(reason ?? 'Manual operator suspension');
      logEvent({
        eventType: 'integrity_alert',
        output: 'KILL_SWITCH_ACTIVATED — SEBI Algo Framework compliant',
      });
      return NextResponse.json({
        success: true,
        event,
        state: getKillSwitchState(),
      });
    }

    if (action === 'deactivate') {
      const event = deactivateKillSwitch();
      logEvent({
        eventType: 'integrity_alert',
        output: 'KILL_SWITCH_DEACTIVATED — AI predictions restored',
      });
      return NextResponse.json({
        success: true,
        event,
        state: getKillSwitchState(),
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "activate" or "deactivate".' },
      { status: 400 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
