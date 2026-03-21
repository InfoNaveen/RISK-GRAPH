import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { SYNTHETIC_PRICES, DATE_LABELS } from '@/lib/priceData';
import { formatINR } from '@/lib/math';

interface PriceChartProps {
  selectedAssets: string[];
  normalized: boolean;
}

// Colors for 10 assets
const LINE_COLORS = [
  '#C9A84C', '#1A6B3C', '#C0392B', '#2980B9', '#8E44AD',
  '#E67E22', '#16A085', '#2C3E50', '#7F8C8D', '#D35400'
];

export default function PriceChart({ selectedAssets, normalized }: PriceChartProps) {
  const chartData = useMemo(() => {
    return DATE_LABELS.map((date, i) => {
      const point: any = { date };
      selectedAssets.forEach(asset => {
        const raw = SYNTHETIC_PRICES[asset]?.[i] ?? 0;
        if (normalized) {
          const base = SYNTHETIC_PRICES[asset]?.[0] ?? 1;
          point[asset] = (raw / base) * 100;
        } else {
          point[asset] = raw;
        }
      });
      return point;
    });
  }, [selectedAssets, normalized]);

  if (selectedAssets.length === 0) {
    return (
      <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-muted)' }}>
        No assets selected.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 10, fill: 'var(--ink-muted)', fontFamily: 'JetBrains Mono' }} 
          minTickGap={30}
        />
        <YAxis 
          tickFormatter={val => normalized ? val.toFixed(0) : formatINR(val).replace('.00', '')}
          tick={{ fontSize: 10, fill: 'var(--ink-muted)', fontFamily: 'JetBrains Mono' }}
          domain={['auto', 'auto']}
        />
        <Tooltip
          formatter={(value: number, name: string) => [
            normalized ? `${value.toFixed(2)}` : formatINR(value),
            name
          ]}
          labelStyle={{ color: 'var(--ink-muted)', marginBottom: 4 }}
          contentStyle={{
            background: 'white',
            border: '1px solid var(--border)',
            borderRadius: 4,
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            fontSize: 12,
            fontFamily: "'JetBrains Mono', monospace"
          }}
        />
        <Legend 
          wrapperStyle={{ fontSize: 12, paddingTop: 16 }}
          iconType="circle"
        />
        {selectedAssets.map((asset, i) => (
          <Line
            key={asset}
            type="monotone"
            dataKey={asset}
            stroke={LINE_COLORS[i % LINE_COLORS.length]}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
