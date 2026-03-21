'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts';
import { formatINR } from '@/lib/math';
import type { SimulationResult } from '@/lib/types';

interface McChartProps {
  result: SimulationResult;
  nSims: number;
  horizonDays: number;
}

export default function McChart({ result, nSims, horizonDays }: McChartProps) {
  const chartData = useMemo(() => {
    const { paths, percentile5, percentile50, percentile95 } = result;
    const nSteps = percentile5.length;

    // Sample 200 random paths for background density
    const sampleCount = Math.min(200, paths.length);
    const sampleIndices: number[] = [];
    const step = Math.max(1, Math.floor(paths.length / sampleCount));
    for (let i = 0; i < paths.length && sampleIndices.length < sampleCount; i += step) {
      sampleIndices.push(i);
    }

    const data = [];
    for (let t = 0; t < nSteps; t++) {
      const point: Record<string, number> = {
        day: t,
        p5: percentile5[t],
        p50: percentile50[t],
        p95: percentile95[t],
      };
      // Add sampled paths
      sampleIndices.forEach((idx, si) => {
        point[`path_${si}`] = paths[idx][t];
      });
      data.push(point);
    }

    return { data, sampleCount: sampleIndices.length };
  }, [result]);

  const formatYAxis = (value: number) => {
    return formatINR(value);
  };

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
        Monte Carlo Portfolio Simulation — {nSims.toLocaleString()} Paths
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={chartData.data} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 10, fill: 'var(--ink-muted)' }}
            label={{ value: 'Trading Days', position: 'insideBottom', offset: -5, fontSize: 10, fill: 'var(--ink-muted)' }}
          />
          <YAxis
            tickFormatter={formatYAxis}
            tick={{ fontSize: 10, fill: 'var(--ink-muted)', fontFamily: 'JetBrains Mono' }}
            width={100}
          />
          <Tooltip
            formatter={(value: number) => [formatINR(value), '']}
            labelFormatter={(label) => `Day ${label}`}
            contentStyle={{
              background: 'var(--ink)',
              border: 'none',
              borderRadius: 4,
              color: 'var(--cream)',
              fontSize: 12,
            }}
          />

          {/* Shaded band between 5th-95th */}
          <Area
            dataKey="p95"
            stroke="none"
            fill="var(--risk-red)"
            fillOpacity={0.05}
          />

          {/* Background: sampled paths */}
          {Array.from({ length: chartData.sampleCount }, (_, i) => (
            <Line
              key={`path_${i}`}
              dataKey={`path_${i}`}
              stroke="var(--ink-muted)"
              strokeWidth={0.3}
              strokeOpacity={0.15}
              dot={false}
              isAnimationActive={false}
            />
          ))}

          {/* 5th percentile */}
          <Line
            dataKey="p5"
            stroke="var(--risk-red)"
            strokeWidth={1.5}
            dot={false}
            name="5th Percentile"
          />

          {/* 95th percentile */}
          <Line
            dataKey="p95"
            stroke="var(--risk-green)"
            strokeWidth={1.5}
            dot={false}
            name="95th Percentile"
          />

          {/* Median */}
          <Line
            dataKey="p50"
            stroke="var(--gold)"
            strokeWidth={2}
            dot={false}
            name="Median"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
