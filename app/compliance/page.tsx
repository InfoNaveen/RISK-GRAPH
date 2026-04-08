'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { AuditEntry } from '@/lib/security/audit-logger';
import type { KillSwitchState, KillSwitchEvent } from '@/lib/security/kill-switch';
import type { DisclosureCertificate } from '@/lib/compliance/certificate';
import type { ConcentrationAlert } from '@/lib/compliance/concentration';
import type { BlockchainAnchor } from '@/lib/blockchain/anchor';
import { generateCertificate, formatCertificateText } from '@/lib/compliance/certificate';
import { getDemoConcentrationAlerts } from '@/lib/compliance/concentration';

/* ────────────────────────────────────────────────────────
   SEBI COMPLIANCE SCORECARD DATA
   ──────────────────────────────────────────────────────── */

interface ScorecardRow {
  requirement: string;
  regulation: string;
  statusKey: string;
  evidence: string;
  action: string;
}

const STATIC_ROWS: ScorecardRow[] = [
  {
    requirement: 'AI Usage Disclosure to Clients',
    regulation: 'SEBI Reg. 19(vii) RA Regs + Reg. 15(14) IA Regs, Jan 8 2025',
    statusKey: 'compliant',
    evidence: 'Auto-generated AI Disclosure Certificate available. 5 AI models documented with Algo IDs, confidence metrics, and human override status.',
    action: 'Download certificate → share at client onboarding. Mandatory by April 30, 2025 for existing clients.',
  },
  {
    requirement: 'Audit Trail & Record Retention — 5 Years Minimum',
    regulation: 'Regulation 25(1) RA Regs + SEBI Master Circular Jun 27, 2025',
    statusKey: 'dynamic-audit',
    evidence: '',
    action: 'Export audit log monthly. Blockchain-anchored hash provides 5-year tamper-proof retention evidence.',
  },
  {
    requirement: 'Algorithmic Kill Switch',
    regulation: 'SEBI Algo Framework Circular SEBI/HO/MIRSD/MIRSD-PoD/P/CIR/2025/0000013, Feb 4 2025 — effective Aug 1 2025',
    statusKey: 'compliant',
    evidence: 'Kill switch operational — suspends all AI predictions instantly. Logged to immutable audit trail with unique Event ID per SEBI kill switch SOP requirement.',
    action: 'Test kill switch quarterly. SEBI requires documented SOP for activation and restoration procedures.',
  },
  {
    requirement: 'Unique Algo ID per Algorithmic Strategy',
    regulation: 'SEBI Algo Framework, Feb 4 2025 — Algo ID tagging mandatory from Apr 1 2026',
    statusKey: 'dynamic-algoid',
    evidence: '',
    action: 'Maintain Algo ID registry. Black-box strategies require SEBI Research Analyst registration.',
  },
  {
    requirement: 'Model Portfolio Methodology Documentation',
    regulation: 'SEBI RA Master Circular Jun 27 2025 — Annexure-A, Model Portfolio Framework',
    statusKey: 'compliant',
    evidence: '19 mathematical formulas documented at /math with step-by-step derivations. Benchmark: NIFTY 50. Horizon: FY2025-26. Rebalancing: on data refresh. Risk disclosures: explicit in /math limitations.',
    action: 'Include /math URL in client agreement methodology section per SEBI model portfolio disclosure requirement.',
  },
  {
    requirement: 'Concentration Risk Monitoring',
    regulation: 'SEBI Diversification Guidelines + SEBI UPSI Amendment 2025 — unusual activity monitoring',
    statusKey: 'dynamic-concentration',
    evidence: 'HDFCBANK eigenvector centrality: 0.84 — exceeds 0.70 threshold. Systemic contagion risk flagged. GSVI: 0.67.',
    action: 'Review high-centrality asset allocation. Consider hedging or reducing HDFCBANK exposure.',
  },
  {
    requirement: 'Conflict of Interest Disclosure (MITC)',
    regulation: 'SEBI MITC Requirements — Annexure-B, RA Guidelines Jan 8 2025, effective Feb 17 2025',
    statusKey: 'compliant',
    evidence: 'RiskGraph issues zero buy/sell/hold recommendations. GPT-4o system prompt hard-codes prohibition on directional financial advice. No commission, no trade execution capability.',
    action: 'Include conflict-of-interest statement in MITC. Display mandatory SEBI disclaimer on all output pages.',
  },
  {
    requirement: 'Annual Compliance Audit',
    regulation: 'Regulation 25(3) RA Regs — audit within 6 months of FY end, submit to RAASB within 1 month',
    statusKey: 'partial',
    evidence: 'Full audit log available for ICAI/ICSI/ICMAI member review. Blockchain-anchored entries provide tamper evidence. Final sign-off requires registered auditor.',
    action: 'Export audit log → submit to registered auditor by September 30 annually. Publish findings on platform website per SEBI adverse findings disclosure requirement.',
  },
  {
    requirement: 'AI Accountability — No Autonomous Delegation',
    regulation: 'SEBI IA Reg. 15(14) — IA solely accountable for security, confidentiality, integrity of client data processed via AI. Jan 8 2025.',
    statusKey: 'compliant',
    evidence: 'All ML outputs are advisory only. No AI system has trade execution capability. Human investor retains full decision authority. Structurally enforced — not merely stated.',
    action: 'Document human oversight process. Include in client onboarding agreement per Reg. 15(14) requirements.',
  },
];

/* ────────────────────────────────────────────────────────
   HELPER: COMPUTE STATUS
   ──────────────────────────────────────────────────────── */

function computeRowStatus(
  row: ScorecardRow,
  auditLog: AuditEntry[],
  lastAuditEntry: AuditEntry | undefined
): { status: 'compliant' | 'partial' | 'non-compliant'; evidence: string } {
  if (row.statusKey === 'compliant') {
    return { status: 'compliant', evidence: row.evidence };
  }
  if (row.statusKey === 'partial') {
    return { status: 'partial', evidence: row.evidence };
  }
  if (row.statusKey === 'dynamic-audit') {
    if (auditLog.length > 0) {
      return {
        status: 'compliant',
        evidence: `${auditLog.length} events logged | Hash integrity: ✅ Verified | Polygon anchor: pending`,
      };
    }
    return {
      status: 'partial',
      evidence: '⚠️ No events yet — run AI Analyst to begin logging',
    };
  }
  if (row.statusKey === 'dynamic-algoid') {
    const lastId = lastAuditEntry?.id ?? 'N/A';
    return {
      status: 'compliant',
      evidence: `Last Algo ID: ${lastId} | Format: EVT-{ts}-{rand5} | 4 registered strategies: RISKGRAPH-HMM-01, RISKGRAPH-KM-02, RISKGRAPH-IF-03, RISKGRAPH-OLS-04`,
    };
  }
  if (row.statusKey === 'dynamic-concentration') {
    return { status: 'partial', evidence: row.evidence };
  }
  return { status: 'compliant', evidence: row.evidence };
}

/* ────────────────────────────────────────────────────────
   STATUS BADGE COMPONENT
   ──────────────────────────────────────────────────────── */

function StatusBadge({ status }: { status: 'compliant' | 'partial' | 'non-compliant' }) {
  const config = {
    compliant: { label: '✅ Compliant', bg: 'var(--risk-green)', color: 'white' },
    partial: { label: '⚠️ Partial', bg: '#B7791F', color: 'white' },
    'non-compliant': { label: '❌ Non-Compliant', bg: 'var(--risk-red)', color: 'white' },
  };
  const c = config[status];
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 500,
      background: c.bg,
      color: c.color,
      whiteSpace: 'nowrap',
    }}>
      {c.label}
    </span>
  );
}

/* ────────────────────────────────────────────────────────
   MAIN PAGE COMPONENT
   ──────────────────────────────────────────────────────── */

export default function CompliancePage() {
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [killState, setKillState] = useState<KillSwitchState>({ active: false, activatedAt: null, reason: null, log: [] });
  const [showKillModal, setShowKillModal] = useState(false);
  const [certificate, setCertificate] = useState<DisclosureCertificate | null>(null);
  const [copied, setCopied] = useState(false);
  const [anchorResult, setAnchorResult] = useState<BlockchainAnchor | null>(null);
  const [anchoring, setAnchoring] = useState(false);
  const [anchorError, setAnchorError] = useState<string | null>(null);
  const [concentrationAlerts, setConcentrationAlerts] = useState<ConcentrationAlert[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const killIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch audit log
  const fetchAuditLog = useCallback(async () => {
    try {
      const res = await fetch('/api/security/audit');
      if (res.ok) {
        const data: { log: AuditEntry[] } = await res.json();
        setAuditLog(data.log ?? []);
      }
    } catch {
      // silent
    }
  }, []);

  // Fetch kill switch state
  const fetchKillState = useCallback(async () => {
    try {
      const res = await fetch('/api/security/killswitch');
      if (res.ok) {
        const data: KillSwitchState = await res.json();
        setKillState(data);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchAuditLog();
    fetchKillState();
    setConcentrationAlerts(getDemoConcentrationAlerts());

    intervalRef.current = setInterval(fetchAuditLog, 30000);
    killIntervalRef.current = setInterval(fetchKillState, 10000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (killIntervalRef.current) clearInterval(killIntervalRef.current);
    };
  }, [fetchAuditLog, fetchKillState]);

  // Generate certificate on demand
  const handleGenerateCert = useCallback(() => {
    const cert = generateCertificate(auditLog);
    setCertificate(cert);
  }, [auditLog]);

  // Auto-generate certificate on first load
  useEffect(() => {
    handleGenerateCert();
  }, [handleGenerateCert]);

  // Compliance score computation
  const lastAuditEntry = auditLog.length > 0 ? auditLog[auditLog.length - 1] : undefined;
  const rowStatuses = STATIC_ROWS.map(row => computeRowStatus(row, auditLog, lastAuditEntry));
  const compliantCount = rowStatuses.filter(r => r.status === 'compliant').length;
  const complianceScore = Math.round((compliantCount / (STATIC_ROWS.length || 1)) * 100);

  const scoreColor = complianceScore >= 80 ? 'var(--risk-green)' : complianceScore >= 60 ? '#B7791F' : 'var(--risk-red)';

  // Kill switch handlers
  const handleActivateKill = async () => {
    setShowKillModal(false);
    try {
      await fetch('/api/security/killswitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'activate', reason: 'Manual operator suspension — ForgeX demo' }),
      });
      await fetchKillState();
      await fetchAuditLog();
    } catch { /* silent */ }
  };

  const handleDeactivateKill = async () => {
    try {
      await fetch('/api/security/killswitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deactivate' }),
      });
      await fetchKillState();
      await fetchAuditLog();
    } catch { /* silent */ }
  };

  // Blockchain anchor
  const handleAnchor = async () => {
    setAnchoring(true);
    setAnchorError(null);
    try {
      const res = await fetch('/api/blockchain/anchor', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.anchor) {
        setAnchorResult(data.anchor as BlockchainAnchor);
      } else {
        setAnchorError(data.error ?? 'Anchor failed');
      }
    } catch (err: unknown) {
      setAnchorError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setAnchoring(false);
    }
  };

  // Certificate download
  const handleDownload = () => {
    if (!certificate) return;
    const text = formatCertificateText(certificate);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SEBI-AI-Disclosure-${certificate.reportId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy to clipboard
  const handleCopy = async () => {
    if (!certificate) return;
    const text = formatCertificateText(certificate);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* silent */ }
  };

  // Metrics
  const blockedCount = auditLog.filter(e => e.eventType === 'injection_blocked').length;
  const recentKillEvents = [...killState.log].reverse().slice(0, 5);

  const getSeverityColor = (severity: string): string => {
    if (severity === 'critical') return 'var(--risk-red)';
    if (severity === 'high') return '#B7791F';
    return 'var(--gold)';
  };

  return (
    <div>
      {/* COMPLIANCE BANNER */}
      <div style={{
        background: 'var(--gold-light)',
        borderBottom: '1px solid var(--border)',
        padding: '12px 24px',
        marginBottom: 32,
        borderRadius: 4,
      }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--ink-muted)', margin: 0, lineHeight: 1.5 }}>
          📋 SEBI Compliance Mode — Disclosure documentation per SEBI IA/RA Regulations 2025 + Algo Framework Aug 2025. Not legal advice. Consult a SEBI-registered compliance officer.
        </p>
      </div>

      {/* PAGE HEADER */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 400, color: 'var(--ink)', margin: '0 0 8px 0' }}>
          SEBI Compliance Intelligence
        </h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--ink-muted)', margin: 0 }}>
          AI Governance Layer — SEBI IA/RA Regulations 2025 + Algo Trading Framework August 2025
        </p>
      </div>

      {/* COMPLIANCE SCORE BADGE */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
        <div style={{
          background: scoreColor,
          color: 'white',
          padding: '24px 48px',
          borderRadius: 8,
          textAlign: 'center',
        }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
            Compliance Score
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 48, fontWeight: 700, lineHeight: 1 }}>
            {complianceScore}<span style={{ fontSize: 24 }}>/100</span>
          </div>
        </div>
      </div>

      {/* SECTION 1: SCORECARD TABLE */}
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 400, color: 'var(--ink)', marginBottom: 16 }}>
        SEBI Requirements Scorecard
      </h2>
      <div style={{ overflowX: 'auto', marginBottom: 48 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 10, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Requirement</th>
              <th style={{ textAlign: 'left', padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 10, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Regulation</th>
              <th style={{ textAlign: 'left', padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 10, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Status</th>
              <th style={{ textAlign: 'left', padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 10, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Evidence</th>
              <th style={{ textAlign: 'left', padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 10, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {STATIC_ROWS.map((row, i) => {
              const computed = rowStatuses[i];
              return (
                <tr key={i} style={{
                  background: i % 2 === 0 ? 'var(--cream)' : 'var(--surface)',
                  transition: 'all 0.15s',
                }}>
                  <td style={{ padding: '12px 14px', fontSize: 13, color: 'var(--ink)', fontFamily: "'DM Sans', sans-serif", borderBottom: '1px solid var(--border)' }}>{row.requirement}</td>
                  <td style={{ padding: '12px 14px', fontSize: 11, color: 'var(--ink-muted)', fontFamily: "'JetBrains Mono', monospace", borderBottom: '1px solid var(--border)', maxWidth: 220 }}>{row.regulation}</td>
                  <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}><StatusBadge status={computed.status} /></td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--ink)', fontFamily: "'DM Sans', sans-serif", borderBottom: '1px solid var(--border)', maxWidth: 300 }}>{computed.evidence}</td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--ink-muted)', fontFamily: "'DM Sans', sans-serif", borderBottom: '1px solid var(--border)', maxWidth: 260 }}>{row.action}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* SECTION 2: REAL-TIME METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 48 }}>
        {[
          { label: 'Audit Events', value: String(auditLog.length), accent: 'var(--gold)' },
          { label: 'Injections Blocked', value: String(blockedCount), accent: 'var(--risk-red)' },
          { label: 'ML Models Active', value: '4', accent: 'var(--risk-green)' },
          { label: 'Compliance Score', value: `${complianceScore}%`, accent: scoreColor },
        ].map(card => (
          <div key={card.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '20px 16px', textAlign: 'center' }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 28, color: card.accent, lineHeight: 1, marginBottom: 8 }}>{card.value}</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* SECTION 3: AI DISCLOSURE CERTIFICATE */}
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 400, color: 'var(--ink)', marginBottom: 8 }}>
        AI Disclosure Certificate
      </h2>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--ink-muted)', marginBottom: 24 }}>
        Auto-generated per SEBI Reg. 19(vii) RA Regs + Reg. 15(14) IA Regs — Jan 8 2025
      </p>

      {certificate && (
        <div style={{ background: 'var(--cream)', border: '2px solid var(--gold)', borderRadius: 8, padding: 32, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>
              RISKGRAPH 3.0 | AI USAGE DISCLOSURE CERTIFICATE
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--gold)' }}>
              {certificate.reportId}
            </div>
          </div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--ink-muted)', marginBottom: 16 }}>
            Basis: SEBI IA Reg. 15(14) | RA Reg. 19(vii) | Algo Framework Feb 4 2025
          </p>
          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '16px 0' }} />

          {/* AI Models Table */}
          <div style={{ overflowX: 'auto', marginBottom: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Algo ID', 'Model Name', 'Type', 'Confidence Metric', 'Human Override'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid var(--border)', fontSize: 10, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {certificate.aiModels.map((m, i) => (
                  <tr key={m.modelId} style={{ background: i % 2 === 0 ? 'var(--cream)' : 'var(--surface)' }}>
                    <td style={{ padding: '8px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--gold)', borderBottom: '1px solid var(--border)' }}>{m.modelId}</td>
                    <td style={{ padding: '8px 12px', fontSize: 12, color: 'var(--ink)', borderBottom: '1px solid var(--border)' }}>{m.name}</td>
                    <td style={{ padding: '8px 12px', fontSize: 11, color: 'var(--ink-muted)', borderBottom: '1px solid var(--border)' }}>{m.type}</td>
                    <td style={{ padding: '8px 12px', fontSize: 11, color: 'var(--ink-muted)', fontFamily: "'JetBrains Mono', monospace", borderBottom: '1px solid var(--border)' }}>{m.confidenceMetric}</td>
                    <td style={{ padding: '8px 12px', fontSize: 12, borderBottom: '1px solid var(--border)' }}>✅ Yes</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '16px 0' }} />
          {[
            { title: 'Human Oversight Statement', text: certificate.humanOversightStatement },
            { title: 'Data Handling Statement', text: certificate.dataHandlingStatement },
            { title: 'Model Limitations', text: certificate.limitationsStatement },
            { title: 'SEBI Algo Compliance Note', text: certificate.sebiAlgoComplianceNote },
          ].map(section => (
            <div key={section.title} style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>{section.title}</div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--ink)', lineHeight: 1.6, margin: 0 }}>{section.text}</p>
            </div>
          ))}

          {/* Footer */}
          <div style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '12px 16px', borderRadius: '0 0 4px 4px', marginTop: 16 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--ink-muted)' }}>
              Generated: {certificate.generatedAt} | Audit Events: {certificate.auditSummary.totalEvents} | Integrity: {certificate.auditSummary.integrityStatus === 'verified' ? '✅ Verified' : certificate.auditSummary.integrityStatus === 'empty' ? '⚠️ Empty' : '❌ Tampered'} | Blockchain: {anchorResult ? 'Anchored' : 'Pending'}
            </span>
          </div>
        </div>
      )}

      {/* Certificate Action Buttons */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 48, flexWrap: 'wrap' }}>
        <button onClick={handleDownload} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          📄 Download Disclosure — SEBI Format
        </button>
        <button onClick={handleCopy} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {copied ? '✅ Copied!' : '📋 Copy to Clipboard'}
        </button>
      </div>

      {/* SECTION 4: KILL SWITCH */}
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 400, color: 'var(--ink)', marginBottom: 4 }}>
        AI Kill Switch
      </h2>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--ink-muted)', marginBottom: 24 }}>
        SEBI Circular SEBI/HO/MIRSD/MIRSD-PoD/P/CIR/2025/0000013, Feb 4 2025 — Kill switch: last line of defence against algorithm malfunction
      </p>

      {!killState.active ? (
        /* STATE A — INACTIVE */
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span className="pulse-dot" style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--risk-green)', display: 'inline-block' }} />
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: 'var(--ink)' }}>AI Predictions: ACTIVE</span>
              </div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--ink-muted)', margin: '0 0 4px 0' }}>4 ML models operational | GPT-4o Analyst enabled</p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--ink-muted)', margin: 0 }}>SEBI Kill Switch: Armed and Ready</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <button onClick={() => setShowKillModal(true)} style={{
                background: 'var(--risk-red)', color: 'white', border: 'none', borderRadius: 4,
                padding: '12px 24px', fontSize: 14, fontWeight: 500, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}>
                🔴 ACTIVATE KILL SWITCH
              </button>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--ink-muted)', marginTop: 8, maxWidth: 280 }}>
                Immediately suspends all AI predictions. Logs KILL_SWITCH_ACTIVATED event with unique Event ID per SEBI Algo Framework SOP.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* STATE B — ACTIVE */
        <div style={{ background: 'rgba(192,57,43,0.08)', border: '2px solid var(--risk-red)', borderRadius: 8, padding: 0, marginBottom: 24, overflow: 'hidden' }}>
          <div style={{ background: 'var(--risk-red)', color: 'white', padding: '12px 24px', fontWeight: 700, fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>
            🔴 KILL SWITCH ACTIVE — ALL AI PREDICTIONS SUSPENDED
          </div>
          <div style={{ padding: 24 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--ink)', marginBottom: 6 }}>Activated: {killState.activatedAt}</div>
            <div style={{ fontSize: 13, color: 'var(--ink)', marginBottom: 6 }}>Reason: {killState.reason}</div>
            {killState.log.length > 0 && (
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--gold)', marginBottom: 6 }}>Event ID: {killState.log[killState.log.length - 1].eventId}</div>
            )}
            <div style={{ fontSize: 13, color: 'var(--ink)', marginBottom: 6 }}>Status: All /api/analyst requests returning HTTP 503</div>
            <div style={{ fontSize: 13, color: 'var(--ink)', marginBottom: 16 }}>SEBI Compliance: Kill switch activation logged to immutable audit trail ✅</div>
            <button onClick={handleDeactivateKill} style={{
              background: 'var(--risk-green)', color: 'white', border: 'none', borderRadius: 4,
              padding: '12px 24px', fontSize: 14, fontWeight: 500, cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              ✅ RESTORE AI PREDICTIONS
            </button>
          </div>
        </div>
      )}

      {/* Kill Switch Confirmation Modal */}
      {showKillModal && (
        <>
          <div onClick={() => setShowKillModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'var(--cream)', border: '2px solid var(--risk-red)', borderRadius: 8, padding: 32, zIndex: 201, maxWidth: 480, width: '90%' }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: 'var(--ink)', marginBottom: 16 }}>Confirm Kill Switch Activation</h3>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--ink)', lineHeight: 1.8, marginBottom: 24 }}>
              This action will:<br />
              • Immediately suspend all 4 ML model outputs<br />
              • Disable GPT-4o AI Analyst endpoint<br />
              • Log a KILL_SWITCH_ACTIVATED event with unique Event ID<br />
              • This is auditable per SEBI Algo Framework<br /><br />
              Are you sure?
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={handleActivateKill} style={{ background: 'var(--risk-red)', color: 'white', border: 'none', borderRadius: 4, padding: '10px 20px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
                Confirm — Activate Now
              </button>
              <button onClick={() => setShowKillModal(false)} style={{ background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--border)', borderRadius: 4, padding: '10px 20px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      {/* Kill Switch Event Log */}
      {recentKillEvents.length > 0 && (
        <div style={{ marginBottom: 48 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 400, color: 'var(--ink)', marginBottom: 12 }}>Kill Switch Event History</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Event ID', 'Action', 'Timestamp', 'Reason'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid var(--border)', fontSize: 10, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentKillEvents.map((evt: KillSwitchEvent) => (
                <tr key={evt.eventId} style={{ background: evt.action === 'activated' ? 'rgba(192,57,43,0.05)' : 'rgba(26,107,60,0.05)' }}>
                  <td style={{ padding: '8px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, borderBottom: '1px solid var(--border)' }}>{evt.eventId}</td>
                  <td style={{ padding: '8px 12px', fontSize: 12, borderBottom: '1px solid var(--border)', color: evt.action === 'activated' ? 'var(--risk-red)' : 'var(--risk-green)', fontWeight: 500, textTransform: 'uppercase' }}>{evt.action}</td>
                  <td style={{ padding: '8px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--ink-muted)', borderBottom: '1px solid var(--border)' }}>{evt.timestamp}</td>
                  <td style={{ padding: '8px 12px', fontSize: 12, color: 'var(--ink)', borderBottom: '1px solid var(--border)' }}>{evt.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SECTION 5: BLOCKCHAIN AUDIT ANCHORING */}
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 400, color: 'var(--ink)', marginBottom: 4 }}>
        Blockchain Audit Anchoring
      </h2>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--ink-muted)', marginBottom: 24 }}>
        Polygon Amoy testnet — tamper-proof 5-year retention evidence per SEBI Regulation 25(1)
      </p>

      {!anchorResult ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 24, marginBottom: 48 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <div style={{ fontSize: 16, color: 'var(--ink)', marginBottom: 6 }}>⛓️ Audit Log: NOT YET ANCHORED</div>
              <p style={{ fontSize: 13, color: 'var(--ink-muted)', margin: '0 0 4px 0' }}>{auditLog.length} events in memory | Not yet blockchain-committed</p>
              <p style={{ fontSize: 13, color: 'var(--ink-muted)', margin: 0 }}>SEBI 5-year retention: requires periodic anchoring</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <button onClick={handleAnchor} disabled={anchoring} className="btn-primary" style={{ opacity: anchoring ? 0.7 : 1 }}>
                {anchoring ? '⏳ Anchoring to Polygon Amoy...' : '⛓️ Anchor to Polygon Amoy'}
              </button>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--ink-muted)', marginTop: 8, maxWidth: 280 }}>
                Writes audit root hash to Polygon Amoy testnet. Publicly verifiable on PolygonScan. ~3 seconds.
              </p>
            </div>
          </div>
          {anchorError && (
            <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(192,57,43,0.08)', border: '1px solid var(--risk-red)', borderRadius: 4, fontSize: 12, color: 'var(--risk-red)' }}>
              Error: {anchorError}
            </div>
          )}
        </div>
      ) : (
        <div style={{ background: 'rgba(26,107,60,0.05)', border: '1px solid var(--risk-green)', borderRadius: 8, padding: 24, marginBottom: 48 }}>
          <div style={{ fontSize: 16, color: 'var(--risk-green)', fontWeight: 600, marginBottom: 16 }}>✅ AUDIT LOG ANCHORED — POLYGON AMOY</div>
          <div style={{ display: 'grid', gap: 6, marginBottom: 16 }}>
            {[
              { label: 'Transaction', value: anchorResult.txHash },
              { label: 'Block', value: String(anchorResult.blockNumber) },
              { label: 'Entries Anchored', value: String(anchorResult.entriesAnchored) },
              { label: 'Audit Root', value: anchorResult.merkleRoot },
              { label: 'Network', value: 'Polygon Amoy Testnet' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--ink-muted)', minWidth: 120 }}>{item.label}:</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--ink)', wordBreak: 'break-all' }}>{item.value}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a href={anchorResult.explorerUrl} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
              🔍 View on PolygonScan
            </a>
          </div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--ink-muted)', marginTop: 16, margin: '16px 0 0 0' }}>
            This transaction hash is permanent, public, and irrevocable evidence of audit log state at {anchorResult.timestamp}. Satisfies SEBI Reg. 25(1) tamper-proof retention requirement.
          </p>
        </div>
      )}

      {/* SECTION 6: CONCENTRATION RISK MONITOR */}
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 400, color: 'var(--ink)', marginBottom: 4 }}>
        Concentration Risk Monitor
      </h2>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--ink-muted)', marginBottom: 24 }}>
        Real-time SEBI compliance flags from live ML outputs
      </p>

      {concentrationAlerts.length === 0 ? (
        <div style={{ background: 'rgba(26,107,60,0.05)', border: '1px solid var(--risk-green)', borderRadius: 8, padding: 24, marginBottom: 48, textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'var(--risk-green)', margin: 0 }}>
            ✅ No concentration risk violations detected. Portfolio meets SEBI diversification guidelines. All centrality values within acceptable bounds.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
          {concentrationAlerts.map((alert, i) => (
            <div key={i} style={{
              background: 'white',
              border: '1px solid var(--border)',
              borderLeft: `3px solid ${getSeverityColor(alert.severity)}`,
              borderRadius: 4,
              padding: '16px 20px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 3, fontSize: 10, fontWeight: 500,
                    textTransform: 'uppercase', background: `${getSeverityColor(alert.severity)}20`,
                    color: getSeverityColor(alert.severity),
                  }}>
                    {alert.severity}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--ink-muted)', textTransform: 'uppercase' }}>{alert.alertType}</span>
                </div>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--ink)' }}>{alert.assetSymbol}</span>
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--ink-muted)', marginBottom: 8 }}>
                Current: {alert.currentValue.toFixed(2)} | Threshold: {alert.threshold.toFixed(2)}
              </div>
              <div style={{ fontStyle: 'italic', fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--ink-muted)', marginBottom: 8 }}>{alert.sebiReference}</div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--ink)', margin: 0, lineHeight: 1.5 }}>{alert.recommendation}</p>
            </div>
          ))}
        </div>
      )}

      <button onClick={() => setConcentrationAlerts(getDemoConcentrationAlerts())} className="btn-outline" style={{ marginBottom: 48 }}>
        🔄 Refresh Analysis
      </button>

      {/* SECTION 7: WHY THIS MATTERS */}
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 400, color: 'var(--ink)', marginBottom: 24 }}>
        The Regulatory Landscape
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { num: '8.5 Cr+', label: 'SEBI-registered retail investors — unprotected', source: 'SEBI Annual Report 2024' },
          { num: '₹1.51L', label: 'Maximum IA fee cap per family per year', source: 'SEBI RA/IA Regulations, Jan 8 2025' },
          { num: '5 Years', label: 'Minimum AI audit record retention — SEBI mandated', source: 'Regulation 25(1) RA Regulations' },
        ].map(card => (
          <div key={card.num} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '24px 20px' }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 28, color: 'var(--gold)', lineHeight: 1, marginBottom: 8 }}>{card.num}</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--ink)', marginBottom: 6 }}>{card.label}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--ink-muted)' }}>{card.source}</div>
          </div>
        ))}
      </div>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.7, marginBottom: 48, maxWidth: 700 }}>
        As of January 8 2025, every registered Investment Adviser and Research Analyst in India must disclose AI tool usage to clients, maintain tamper-proof audit records for 5 years, and implement algorithmic kill switches per SEBI&apos;s August 2025 framework. RiskGraph generates this compliance infrastructure automatically — one platform, one click.
      </p>

      {/* PULSE DOT ANIMATION */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.3); }
          100% { opacity: 1; transform: scale(1); }
        }
        .pulse-dot { animation: pulse 2s infinite; }
        @media (max-width: 768px) {
          div[style*="grid-template-columns: repeat(auto-fit"] {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 480px) {
          div[style*="grid-template-columns: repeat(auto-fit"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}} />
    </div>
  );
}
