'use client';

import { useState, useMemo } from 'react';
import SectionHeader from '@/components/SectionHeader';
import TaxCalculatorForm, { type TaxFormState } from '@/components/tax/TaxCalculatorForm';
import TaxResultPanel from '@/components/tax/TaxResultPanel';
import { computeTax, computeTaxOldRegime } from '@/lib/tax';
import { formatINR } from '@/lib/math';

export default function TaxPage() {
  const [form, setForm] = useState<TaxFormState>({
    salary: 2500000,
    stcgEquity: 0,
    ltcgEquity: 0,
    ltcgOther: 0,
    otherIncome: 0,
    sec80C: 150000,
    sec80D: 25000,
    hra: 120000,
    otherDeductions: 50000,
    isNewRegime: true,
  });

  const [showComparison, setShowComparison] = useState(false);

  const newRegimeResult = useMemo(() => {
    return computeTax(form.stcgEquity, form.ltcgEquity, form.ltcgOther, form.salary + form.otherIncome);
  }, [form]);

  const oldRegimeResult = useMemo(() => {
    const deductions = form.sec80C + form.sec80D + form.hra + form.otherDeductions;
    return computeTaxOldRegime(form.stcgEquity, form.ltcgEquity, form.ltcgOther, form.salary + form.otherIncome, deductions);
  }, [form]);

  const activeResult = form.isNewRegime ? newRegimeResult : oldRegimeResult;
  const totalDeductionsIfOld = form.sec80C + form.sec80D + form.hra + form.otherDeductions;
  
  const savingsMessage = useMemo(() => {
    const diff = Math.abs(newRegimeResult.totalTax - oldRegimeResult.totalTax);
    if (diff === 0) return null;
    
    const better = newRegimeResult.totalTax < oldRegimeResult.totalTax ? 'New Regime' : 'Old Regime';
    return { betterRegime: better, savings: diff };
  }, [newRegimeResult.totalTax, oldRegimeResult.totalTax]);

  return (
    <div>
      <SectionHeader
        label="MODULE 05"
        title="Standalone Tax Calculator"
        description="Independent FY2025-26 Indian Income Tax evaluator comparing Old vs. New Regimes with integrated Section 112A/111A capital gains logic."
      />

      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Left: Input Form */}
        <div style={{ flex: '1 1 45%', minWidth: 360 }}>
          <TaxCalculatorForm 
            form={form} 
            onChange={setForm} 
            onCompare={() => setShowComparison(!showComparison)} 
          />
        </div>

        {/* Right: Summary + Tax */}
        <div style={{ flex: '1 1 50%', minWidth: 400 }}>
          {showComparison ? (
            <div style={{
              background: 'white',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 24
            }}>
              <h3 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 18,
                fontWeight: 400,
                color: 'var(--ink)',
                marginBottom: 24,
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span>Regime Comparison</span>
                <button onClick={() => setShowComparison(false)} style={{ fontSize: 12, color: 'var(--ink-muted)', cursor: 'pointer', background: 'none', border: 'none' }}>
                  Close ✕
                </button>
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{
                  border: '1px solid var(--border)',
                  borderLeft: oldRegimeResult.totalTax < newRegimeResult.totalTax ? '4px solid var(--gold)' : '1px solid var(--border)',
                  padding: 16,
                  borderRadius: 4,
                  background: 'var(--surface)',
                }}>
                  <div style={{ fontWeight: 500, marginBottom: 16 }}>Old Regime</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                    <span style={{ color: 'var(--ink-muted)' }}>Net Taxable (Slab)</span>
                    <span className="font-num">{formatINR(Math.max(0, form.salary + form.otherIncome - totalDeductionsIfOld - 50000))}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 500, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                    <span>Total Tax Liability</span>
                    <span className="font-num" style={{ color: 'var(--risk-red)' }}>{formatINR(oldRegimeResult.totalTax)}</span>
                  </div>
                </div>

                <div style={{
                  border: '1px solid var(--border)',
                  borderLeft: newRegimeResult.totalTax <= oldRegimeResult.totalTax ? '4px solid var(--gold)' : '1px solid var(--border)',
                  padding: 16,
                  borderRadius: 4,
                  background: 'var(--surface)',
                }}>
                  <div style={{ fontWeight: 500, marginBottom: 16 }}>New Regime</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                    <span style={{ color: 'var(--ink-muted)' }}>Net Taxable (Slab)</span>
                    <span className="font-num">{formatINR(Math.max(0, form.salary + form.otherIncome - 75000))}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 500, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                    <span>Total Tax Liability</span>
                    <span className="font-num" style={{ color: 'var(--risk-red)' }}>{formatINR(newRegimeResult.totalTax)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <TaxResultPanel 
              result={activeResult}
              isNewRegime={form.isNewRegime}
              totalIncomeBeforeDeductions={form.salary + form.otherIncome}
              totalDeductionsIfOld={totalDeductionsIfOld}
              savingsMessage={savingsMessage}
            />
          )}
        </div>
      </div>
    </div>
  );
}
