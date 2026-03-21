import React from 'react';
import { formatINR } from '@/lib/math';
import type { TaxResult } from '@/lib/types';
import TaxDonutChart from './TaxDonutChart';

interface TaxResultPanelProps {
  result: TaxResult;
  isNewRegime: boolean;
  totalIncomeBeforeDeductions: number;
  totalDeductionsIfOld: number;
  savingsMessage?: { betterRegime: string; savings: number } | null;
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

export default function TaxResultPanel({
  result,
  isNewRegime,
  totalIncomeBeforeDeductions,
  totalDeductionsIfOld,
  savingsMessage,
}: TaxResultPanelProps) {
  
  const standardDeduction = isNewRegime ? 75000 : 50000;
  // If old regime, we add their custom deductions plus the standard deduction
  // totalDeductionsIfOld is just their custom deductions sum. 
  // Wait, let's keep it simple: just show total standard + custom.
  const applicableDeductions = isNewRegime ? standardDeduction : (standardDeduction + totalDeductionsIfOld);
  const netTaxableIncomeSlab = Math.max(0, result.otherIncome - applicableDeductions);
  const totalGrossIncome = totalIncomeBeforeDeductions;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {savingsMessage && (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderLeft: '4px solid var(--gold)',
          padding: '16px 20px',
          borderRadius: 4,
        }}>
          <div style={{ fontSize: 13, color: 'var(--ink-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Recommendation
          </div>
          <div style={{ fontSize: 18, color: 'var(--ink)', fontWeight: 500 }}>
            Under {savingsMessage.betterRegime}, you save <span style={{ color: 'var(--risk-green)' }}>{formatINR(savingsMessage.savings)}</span> annually
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 4 }}>
            Equivalent to {formatINR(Math.round(savingsMessage.savings / 12))} per month
          </div>
        </div>
      )}

      <div style={{
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '24px',
        background: 'white',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h3 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 18,
            fontWeight: 400,
            color: 'var(--ink)',
          }}>
            Tax Breakdown — {isNewRegime ? 'New Regime' : 'Old Regime'}
          </h3>
        </div>

        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
          <div style={{ flex: '1 1 auto' }}>
            <div style={{ ...rowStyle, borderBottom: 'none', paddingBottom: 0 }}>
              <span style={{ ...labelStyle, fontWeight: 500 }}>Gross Total Income</span>
              <span style={valueStyle}>{formatINR(totalGrossIncome)}</span>
            </div>
            
            <div style={{ ...rowStyle, color: 'var(--ink-muted)' }}>
              <span>Less: Deductions ({isNewRegime ? 'Std Only' : 'Std + 80C etc.'})</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>- {formatINR(applicableDeductions)}</span>
            </div>
            
            <div style={{ ...rowStyle, fontWeight: 500, borderBottom: '2px solid var(--border)', marginBottom: 8 }}>
              <span>Net Taxable (Slab Income)</span>
              <span style={valueStyle}>{formatINR(netTaxableIncomeSlab)}</span>
            </div>

            <div style={rowStyle}>
              <span style={labelStyle}>Tax on Salary/Other (Slab)</span>
              <span style={valueStyle}>{formatINR(result.incomeTax)}</span>
            </div>

            <div style={rowStyle}>
              <span style={labelStyle}>Tax on STCG Equity (20%)</span>
              <span style={valueStyle}>{formatINR(result.stcgTax)}</span>
            </div>

            <div style={rowStyle}>
              <span style={labelStyle}>Tax on LTCG Equity (12.5% after ex)</span>
              <span style={valueStyle}>{formatINR(result.ltcgTax)}</span>
            </div>

            <div style={rowStyle}>
              <span style={labelStyle}>Tax on LTCG Other (12.5%)</span>
              <span style={valueStyle}>{formatINR(result.ltcgGoldTax)}</span>
            </div>

            <div style={{ ...rowStyle, fontWeight: 500, marginTop: 8 }}>
              <span>Sub-total Tax</span>
              <span style={valueStyle}>{formatINR(result.totalTaxBeforeSurcharge)}</span>
            </div>

            <div style={rowStyle}>
              <span style={labelStyle}>Surcharge</span>
              <span style={valueStyle}>{formatINR(result.surcharge)}</span>
            </div>

            <div style={rowStyle}>
              <span style={labelStyle}>Health & Education Cess (4%)</span>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--ink-muted)', marginTop: 8 }}>
              <span>Effective Tax Rate: <strong style={{color: 'var(--ink)'}}>{result.effectiveRate}%</strong></span>
              <span>Monthly Provision: <strong style={{color: 'var(--ink)'}}>{formatINR(Math.round(result.totalTax / 12))}</strong></span>
            </div>
          </div>
          
          <div style={{ width: 220, flexShrink: 0, paddingTop: 16 }}>
             <TaxDonutChart 
                slabTax={result.incomeTax}
                stcgTax={result.stcgTax}
                ltcgTax={result.ltcgTax + result.ltcgGoldTax}
                surcharge={result.surcharge}
                cess={result.cess}
                totalTax={result.totalTax}
             />
          </div>
        </div>
      </div>
    </div>
  );
}
