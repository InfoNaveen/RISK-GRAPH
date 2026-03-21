'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface VarianceCurveProps {
  data: { alpha: number; vol: number }[];
  currentAlpha: number;
}

export default function VarianceCurve({ data, currentAlpha }: VarianceCurveProps) {
  const minVol = data.length > 0 ? data[0].vol : 0;
  const maxVol = data.length > 0 ? data[data.length - 1].vol : 1;

  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: '20px',
      background: 'white',
    }}>
      <div style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 12,
        color: 'var(--ink-muted)',
        marginBottom: 16,
      }}>
        Portfolio Annualized Volatility vs. Stress Level α
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="alpha"
            tick={{ fontSize: 10, fill: 'var(--ink-muted)' }}
            label={{ value: 'Stress Level α', position: 'insideBottom', offset: -10, fontSize: 10, fill: 'var(--ink-muted)' }}
            tickFormatter={v => v.toFixed(1)}
          />
          <YAxis
            domain={[Math.floor(minVol * 100) / 100, Math.ceil(maxVol * 100) / 100]}
            tick={{ fontSize: 10, fill: 'var(--ink-muted)', fontFamily: 'JetBrains Mono' }}
            label={{ value: 'σ_p (annualized)', angle: -90, position: 'insideLeft', offset: -5, fontSize: 10, fill: 'var(--ink-muted)' }}
            tickFormatter={v => `${(v * 100).toFixed(1)}%`}
          />
          <Tooltip
            formatter={(value: number) => [`${(value * 100).toFixed(2)}%`, 'Portfolio Vol']}
            labelFormatter={(label) => `α = ${Number(label).toFixed(2)}`}
            contentStyle={{
              background: 'var(--ink)',
              border: 'none',
              borderRadius: 4,
              color: 'var(--cream)',
              fontSize: 12,
            }}
          />
          <Line
            dataKey="vol"
            stroke="var(--risk-red)"
            strokeWidth={2}
            dot={false}
          />
          <ReferenceLine
            x={currentAlpha}
            stroke="var(--gold)"
            strokeWidth={2}
            strokeDasharray="4 4"
          />
        </LineChart>
      </ResponsiveContainer>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 10,
        color: 'var(--ink-muted)',
        marginTop: 8,
        padding: '0 20px',
      }}>
        <span>Current Vol</span>
        <span>Worst Case</span>
      </div>
    </div>
  );
}
