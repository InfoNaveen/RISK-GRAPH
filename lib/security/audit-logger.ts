export interface AuditEntry {
  id: string;
  timestamp: string;
  eventType: 'prediction' | 'security_scan' | 'injection_blocked' | 'integrity_alert' | 'llm_call';
  asset?: string;
  input?: string;
  output?: string;
  threatLevel?: string;
  integrityScore?: number;
  modelUsed?: string;
  hash: string;
}

function simpleHash(data: string): string {
  let hash = 5381;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) + hash) + data.charCodeAt(i);
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

function generateId(): string {
  const timestamp = Date.now();
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let random = '';
  for (let i = 0; i < 5; i++) {
    random += chars[Math.floor(Math.random() * chars.length)];
  }
  return `EVT-${timestamp}-${random}`;
}

const auditLog: AuditEntry[] = [];
const MAX_ENTRIES = 500;

export function logEvent(
  entry: Omit<AuditEntry, 'id' | 'timestamp' | 'hash'>
): AuditEntry {
  const id = generateId();
  const timestamp = new Date().toISOString();

  const fullEntry: AuditEntry = {
    ...entry,
    id,
    timestamp,
    hash: '',
  };

  // Compute hash from full entry JSON (without hash field)
  const dataToHash = JSON.stringify({ ...fullEntry, hash: undefined });
  fullEntry.hash = simpleHash(dataToHash);

  // Add to log (max 500, shift oldest)
  if (auditLog.length >= MAX_ENTRIES) {
    auditLog.shift();
  }
  auditLog.push(fullEntry);

  return fullEntry;
}

export function getAuditLog(): AuditEntry[] {
  return [...auditLog];
}

export function verifyLogIntegrity(): {
  intact: boolean;
  tamperedEntries: string[];
} {
  const tamperedEntries: string[] = [];

  for (const entry of auditLog) {
    const dataToHash = JSON.stringify({ ...entry, hash: undefined });
    const expectedHash = simpleHash(dataToHash);
    if (expectedHash !== entry.hash) {
      tamperedEntries.push(entry.id);
    }
  }

  return {
    intact: tamperedEntries.length === 0,
    tamperedEntries,
  };
}
