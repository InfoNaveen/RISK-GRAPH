// ─── AI Kill Switch — SEBI Algo Framework Compliance ──────────────────────
// SEBI Circular SEBI/HO/MIRSD/MIRSD-PoD/P/CIR/2025/0000013, Feb 4 2025
// Kill switch: last line of defence against algorithm malfunction

export interface KillSwitchEvent {
  action: 'activated' | 'deactivated';
  timestamp: string;
  reason: string;
  eventId: string;
}

export interface KillSwitchState {
  active: boolean;
  activatedAt: string | null;
  reason: string | null;
  log: KillSwitchEvent[];
}

// Module-level state — persists for server process lifetime
// In production: replace with Redis. For demo: sufficient.
let killSwitchActive = false;
let activatedAt: string | null = null;
let activatedReason: string | null = null;

const killSwitchLog: KillSwitchEvent[] = [];

function generateKillSwitchId(): string {
  const ts = Date.now();
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let rand = '';
  for (let i = 0; i < 3; i++) {
    rand += chars[Math.floor(Math.random() * chars.length)];
  }
  return `KS-${ts}-${rand}`;
}

export function activateKillSwitch(reason: string): KillSwitchEvent {
  killSwitchActive = true;
  activatedAt = new Date().toISOString();
  activatedReason = reason;

  const event: KillSwitchEvent = {
    action: 'activated',
    timestamp: activatedAt,
    reason,
    eventId: generateKillSwitchId(),
  };

  killSwitchLog.push(event);
  return event;
}

export function deactivateKillSwitch(): KillSwitchEvent {
  const event: KillSwitchEvent = {
    action: 'deactivated',
    timestamp: new Date().toISOString(),
    reason: activatedReason ?? 'No prior activation reason',
    eventId: generateKillSwitchId(),
  };

  killSwitchActive = false;
  activatedAt = null;
  activatedReason = null;

  killSwitchLog.push(event);
  return event;
}

export function isKillSwitchActive(): boolean {
  return killSwitchActive;
}

export function getKillSwitchState(): KillSwitchState {
  return {
    active: killSwitchActive,
    activatedAt,
    reason: activatedReason,
    log: [...killSwitchLog],
  };
}
