import { formatINR } from '@/lib/math';
import type { TaxResult } from '@/lib/types';

interface TaxBreakdownProps {
  result: TaxResult;
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  padding: '8px 0',
  borderBottom: '1px solid var(--border)',
  fontSize: 13,
};

const labelStyle: React.CSSProperties = {
  color: 'var(--ink)',
};

const valueStyle: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 13,
};

export default function TaxBreakdown({ result }: TaxBreakdownProps) {
  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: '24px',
      background: 'var(--surface)',
    }}>
      <h3 style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 18,
        fontWeight: 400,
        marginBottom: 20,
      }}>
        Tax Breakdown — FY 2025-26
      </h3>

      <div style={rowStyle}>
        <span style={labelStyle}>STCG on Equity</span>
        <span style={valueStyle}>
          {formatINR(result.stcgEquity)} × 20% = <strong>{formatINR(result.stcgTax)}</strong>
        </span>
      </div>

      <div style={rowStyle}>
        <span style={labelStyle}>LTCG on Equity</span>
        <span style={valueStyle}>
          {formatINR(result.ltcgTaxable)} × 12.5% = <strong>{formatINR(result.ltcgTax)}</strong>
        </span>
      </div>
      <div style={{ fontSize: 10, color: 'var(--ink-muted)', padding: '4px 0 4px 16px' }}>
        (After ₹1,25,000 exemption under Section 112A)
      </div>

      <div style={rowStyle}>
        <span style={labelStyle}>LTCG on Gold</span>
        <span style={valueStyle}>
          {formatINR(result.ltcgGold)} × 12.5% = <strong>{formatINR(result.ltcgGoldTax)}</strong>
        </span>
      </div>

      <div style={rowStyle}>
        <span style={labelStyle}>Income Tax on Other Income</span>
        <span style={valueStyle}>
          <strong>{formatINR(result.incomeTax)}</strong>
        </span>
      </div>
      <div style={{ fontSize: 10, color: 'var(--ink-muted)', padding: '4px 0 4px 16px' }}>
        (New Regime slabs after ₹75,000 standard deduction)
      </div>

      <div style={rowStyle}>
        <span style={labelStyle}>Surcharge</span>
        <span style={valueStyle}>{formatINR(result.surcharge)}</span>
      </div>

      <div style={rowStyle}>
        <span style={labelStyle}>Health & Ed. Cess (4%)</span>
        <span style={valueStyle}>{formatINR(result.cess)}</span>
      </div>

      {/* Total */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        padding: '16px 0 8px',
        borderTop: '2px solid var(--ink)',
        marginTop: 8,
      }}>
        <span style={{
          fontWeight: 700,
          fontSize: 15,
          color: 'var(--ink)',
        }}>
          TOTAL TAX LIABILITY
        </span>
        <span className="font-num" style={{
          fontSize: 24,
          fontWeight: 300,
          color: 'var(--risk-red)',
        }}>
          {formatINR(result.totalTax)}
        </span>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '8px 0',
        fontSize: 13,
      }}>
        <span style={{ color: 'var(--ink-muted)' }}>Effective Tax Rate</span>
        <span className="font-num" style={{ color: 'var(--risk-red)' }}>
          {result.effectiveRate.toFixed(2)}%
        </span>
      </div>
    </div>
  );
}
