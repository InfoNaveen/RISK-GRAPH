import React from 'react';

export interface TaxFormState {
  salary: number;
  stcgEquity: number;
  ltcgEquity: number;
  ltcgOther: number;
  otherIncome: number;
  sec80C: number;
  sec80D: number;
  hra: number;
  otherDeductions: number;
  isNewRegime: boolean;
}

interface TaxCalculatorFormProps {
  form: TaxFormState;
  onChange: (form: TaxFormState) => void;
  onCompare: () => void;
}

const sectionStyle: React.CSSProperties = {
  marginBottom: 32,
};

const sectionTitle: React.CSSProperties = {
  fontFamily: "'Playfair Display', serif",
  fontSize: 16,
  fontWeight: 400,
  marginBottom: 16,
  color: 'var(--ink)',
};

const fieldLabel: React.CSSProperties = {
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--ink-muted)',
  display: 'block',
  marginBottom: 4,
};

const fieldStyle = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid var(--border)',
  borderRadius: 4,
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 13,
  background: 'white',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
  gap: 16,
};

export default function TaxCalculatorForm({ form, onChange, onCompare }: TaxCalculatorFormProps) {
  const update = (field: keyof TaxFormState, value: number | boolean) => {
    onChange({ ...form, [field]: value });
  };

  return (
    <div style={{ background: 'var(--surface)', padding: 24, borderRadius: 8, border: '1px solid var(--border)' }}>
      {/* Regime Toggle */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
        <button
          onClick={() => update('isNewRegime', true)}
          style={{
            flex: 1,
            padding: '12px',
            background: form.isNewRegime ? 'var(--ink)' : 'transparent',
            color: form.isNewRegime ? 'white' : 'var(--ink-muted)',
            border: `1px solid ${form.isNewRegime ? 'var(--ink)' : 'var(--border)'}`,
            borderRadius: 4,
            fontWeight: form.isNewRegime ? 500 : 400,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          New Regime (FY25-26)
        </button>
        <button
          onClick={() => update('isNewRegime', false)}
          style={{
            flex: 1,
            padding: '12px',
            background: !form.isNewRegime ? 'var(--ink)' : 'transparent',
            color: !form.isNewRegime ? 'white' : 'var(--ink-muted)',
            border: `1px solid ${!form.isNewRegime ? 'var(--ink)' : 'var(--border)'}`,
            borderRadius: 4,
            fontWeight: !form.isNewRegime ? 500 : 400,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          Old Regime
        </button>
      </div>

      {/* Income Sources */}
      <div style={sectionStyle}>
        <h3 style={sectionTitle}>Income Sources</h3>
        <div style={gridStyle}>
          <div>
            <label style={fieldLabel}>Salary / Business Income (₹)</label>
            <input
              type="number"
              style={fieldStyle}
              value={form.salary || ''}
              onChange={e => update('salary', Number(e.target.value))}
            />
          </div>
          <div>
            <label style={fieldLabel}>Other Income (Div/Int) (₹)</label>
            <input
              type="number"
              style={fieldStyle}
              value={form.otherIncome || ''}
              onChange={e => update('otherIncome', Number(e.target.value))}
            />
          </div>
          <div>
            <label style={fieldLabel}>STCG Equity (Sec 111A, 20%)</label>
            <input
              type="number"
              style={fieldStyle}
              value={form.stcgEquity || ''}
              onChange={e => update('stcgEquity', Number(e.target.value))}
            />
          </div>
          <div>
            <label style={fieldLabel}>LTCG Equity (12.5%, ₹1.25L ex)</label>
            <input
              type="number"
              style={fieldStyle}
              value={form.ltcgEquity || ''}
              onChange={e => update('ltcgEquity', Number(e.target.value))}
            />
          </div>
          <div>
            <label style={fieldLabel}>LTCG Debt/Gold (12.5% flat)</label>
            <input
              type="number"
              style={fieldStyle}
              value={form.ltcgOther || ''}
              onChange={e => update('ltcgOther', Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* Deductions */}
      <div style={{
        ...sectionStyle,
        opacity: form.isNewRegime ? 0.5 : 1,
        pointerEvents: form.isNewRegime ? 'none' : 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <h3 style={{ ...sectionTitle, marginBottom: 0 }}>Deductions</h3>
          {form.isNewRegime && (
            <span style={{ fontSize: 10, color: 'var(--risk-red)', background: 'rgba(192,57,43,0.1)', padding: '2px 6px', borderRadius: 4 }}>
              Not applicable under New Regime
            </span>
          )}
        </div>
        <div style={gridStyle}>
          <div>
            <label style={fieldLabel}>Section 80C (Max ₹1.5L)</label>
            <input
              type="number"
              style={{ ...fieldStyle, background: form.isNewRegime ? 'var(--surface-2)' : 'white' }}
              value={form.sec80C || ''}
              onChange={e => update('sec80C', Number(e.target.value))}
            />
          </div>
          <div>
            <label style={fieldLabel}>Section 80D (Health Ins)</label>
            <input
              type="number"
              style={{ ...fieldStyle, background: form.isNewRegime ? 'var(--surface-2)' : 'white' }}
              value={form.sec80D || ''}
              onChange={e => update('sec80D', Number(e.target.value))}
            />
          </div>
          <div>
            <label style={fieldLabel}>HRA Exemption</label>
            <input
              type="number"
              style={{ ...fieldStyle, background: form.isNewRegime ? 'var(--surface-2)' : 'white' }}
              value={form.hra || ''}
              onChange={e => update('hra', Number(e.target.value))}
            />
          </div>
          <div>
            <label style={fieldLabel}>Other Deductions</label>
            <input
              type="number"
              style={{ ...fieldStyle, background: form.isNewRegime ? 'var(--surface-2)' : 'white' }}
              value={form.otherDeductions || ''}
              onChange={e => update('otherDeductions', Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 40 }}>
        <button
          className="btn-primary"
          style={{ flex: 1, padding: 14, fontSize: 14 }}
          onClick={() => {}} // form state is already live
        >
          Calculate Tax
        </button>
        <button
          className="btn-outline"
          style={{ flex: 1, padding: 14, fontSize: 14 }}
          onClick={onCompare}
        >
          Compare Both Regimes
        </button>
      </div>
    </div>
  );
}
