'use client';

import { ASSET_NAMES, DEFAULT_PRICES, type EquityHolding, type PhysicalAssets, type Liabilities, type AssetName } from '@/lib/types';

interface AssetFormProps {
  equity: EquityHolding[];
  physical: PhysicalAssets;
  liabilities: Liabilities;
  otherIncome: number;
  onEquityChange: (equity: EquityHolding[]) => void;
  onPhysicalChange: (physical: PhysicalAssets) => void;
  onLiabilitiesChange: (liabilities: Liabilities) => void;
  onOtherIncomeChange: (income: number) => void;
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

const fieldGroup: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
  gap: 10,
  marginBottom: 12,
  padding: '12px 16px',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 4,
};

export default function AssetForm({
  equity,
  physical,
  liabilities,
  otherIncome,
  onEquityChange,
  onPhysicalChange,
  onLiabilitiesChange,
  onOtherIncomeChange,
}: AssetFormProps) {

  const updateEquity = (index: number, field: keyof EquityHolding, value: string | number) => {
    const updated = [...equity];
    updated[index] = { ...updated[index], [field]: value };
    onEquityChange(updated);
  };

  return (
    <div>
      {/* Equity Holdings */}
      <div style={sectionStyle}>
        <h3 style={sectionTitle}>Equity Holdings</h3>
        {equity.map((holding, i) => (
          <div key={holding.asset} style={fieldGroup}>
            <div style={{ gridColumn: '1 / -1', fontWeight: 500, fontSize: 12, marginBottom: 4 }}>
              {holding.asset}
            </div>
            <div>
              <label style={fieldLabel}>Units</label>
              <input
                type="number"
                value={holding.units}
                onChange={e => updateEquity(i, 'units', Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={fieldLabel}>Purchase Price (₹)</label>
              <input
                type="number"
                value={holding.purchasePrice}
                onChange={e => updateEquity(i, 'purchasePrice', Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={fieldLabel}>Current Price (₹)</label>
              <input
                type="number"
                value={holding.currentPrice}
                onChange={e => updateEquity(i, 'currentPrice', Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={fieldLabel}>Purchase Date</label>
              <input
                type="date"
                value={holding.purchaseDate}
                onChange={e => updateEquity(i, 'purchaseDate', e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Physical Assets */}
      <div style={sectionStyle}>
        <h3 style={sectionTitle}>Physical Assets</h3>
        <div style={fieldGroup}>
          <div>
            <label style={fieldLabel}>Gold (grams)</label>
            <input
              type="number"
              value={physical.goldGrams}
              onChange={e => onPhysicalChange({ ...physical, goldGrams: Number(e.target.value) })}
              style={{ width: '100%' }}
            />
            <span style={{ fontSize: 9, color: 'var(--ink-muted)' }}>@ ₹6,200/gram (FY25-26)</span>
          </div>
          <div>
            <label style={fieldLabel}>Silver (grams)</label>
            <input
              type="number"
              value={physical.silverGrams}
              onChange={e => onPhysicalChange({ ...physical, silverGrams: Number(e.target.value) })}
              style={{ width: '100%' }}
            />
            <span style={{ fontSize: 9, color: 'var(--ink-muted)' }}>@ ₹75/gram</span>
          </div>
          <div>
            <label style={fieldLabel}>Real Estate (₹)</label>
            <input
              type="number"
              value={physical.realEstate}
              onChange={e => onPhysicalChange({ ...physical, realEstate: Number(e.target.value) })}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={fieldLabel}>Cash & FDs (₹)</label>
            <input
              type="number"
              value={physical.cashFD}
              onChange={e => onPhysicalChange({ ...physical, cashFD: Number(e.target.value) })}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </div>

      {/* Liabilities */}
      <div style={sectionStyle}>
        <h3 style={sectionTitle}>Liabilities</h3>
        <div style={fieldGroup}>
          <div>
            <label style={fieldLabel}>Home Loan (₹)</label>
            <input
              type="number"
              value={liabilities.homeLoan}
              onChange={e => onLiabilitiesChange({ ...liabilities, homeLoan: Number(e.target.value) })}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={fieldLabel}>Personal/Car Loan (₹)</label>
            <input
              type="number"
              value={liabilities.personalLoan}
              onChange={e => onLiabilitiesChange({ ...liabilities, personalLoan: Number(e.target.value) })}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={fieldLabel}>Credit Card Debt (₹)</label>
            <input
              type="number"
              value={liabilities.creditCard}
              onChange={e => onLiabilitiesChange({ ...liabilities, creditCard: Number(e.target.value) })}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </div>

      {/* Other Income */}
      <div style={sectionStyle}>
        <h3 style={sectionTitle}>Other Income</h3>
        <div style={fieldGroup}>
          <div>
            <label style={fieldLabel}>Annual Income (₹) — Salary / Business</label>
            <input
              type="number"
              value={otherIncome}
              onChange={e => onOtherIncomeChange(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
