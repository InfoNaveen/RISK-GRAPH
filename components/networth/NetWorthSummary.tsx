import { formatINR } from '@/lib/math';

interface NetWorthSummaryProps {
  equityValue: number;
  physicalAssets: number;
  cashFD: number;
  totalLiabilities: number;
}

export default function NetWorthSummary({
  equityValue,
  physicalAssets,
  cashFD,
  totalLiabilities,
}: NetWorthSummaryProps) {
  const grossAssets = equityValue + physicalAssets + cashFD;
  const netWorth = grossAssets - totalLiabilities;

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    padding: '10px 0',
    borderBottom: '1px solid var(--border)',
    fontSize: 14,
  };

  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: '24px',
      background: 'var(--surface)',
      marginBottom: 24,
    }}>
      <h3 style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 18,
        fontWeight: 400,
        marginBottom: 20,
      }}>
        Net Worth Statement
      </h3>

      <div style={rowStyle}>
        <span>Total Equity Value</span>
        <span className="font-num" style={{ color: 'var(--risk-green)' }}>{formatINR(equityValue)}</span>
      </div>
      <div style={rowStyle}>
        <span>Physical Assets (Gold, Silver, Real Estate)</span>
        <span className="font-num">{formatINR(physicalAssets)}</span>
      </div>
      <div style={rowStyle}>
        <span>Cash & FDs</span>
        <span className="font-num">{formatINR(cashFD)}</span>
      </div>
      <div style={{
        ...rowStyle,
        borderBottom: '2px solid var(--ink)',
        fontWeight: 500,
      }}>
        <span>Gross Assets</span>
        <span className="font-num">{formatINR(grossAssets)}</span>
      </div>
      <div style={rowStyle}>
        <span>Total Liabilities</span>
        <span className="font-num" style={{ color: 'var(--risk-red)' }}>{formatINR(totalLiabilities)}</span>
      </div>

      {/* Net Worth */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        padding: '20px 0 8px',
        marginTop: 8,
      }}>
        <span style={{
          fontWeight: 700,
          fontSize: 16,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          Net Worth
        </span>
        <span className="font-num" style={{
          fontSize: 32,
          fontWeight: 300,
          color: 'var(--gold)',
        }}>
          {formatINR(netWorth)}
        </span>
      </div>
    </div>
  );
}
