'use client';

import { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface McChartProps {
  baselineFinalValues: number[];
  stressedFinalValues: number[];
  initialValue: number;
}

export default function McChart({ baselineFinalValues, stressedFinalValues, initialValue }: McChartProps) {
  const data = useMemo(() => {
    if (!baselineFinalValues.length || !stressedFinalValues.length) return [];

    const baselineReturns = baselineFinalValues.map(v => (v / initialValue) - 1);
    const stressedReturns = stressedFinalValues.map(v => (v / initialValue) - 1);

    const minReturn = Math.min(...baselineReturns, ...stressedReturns);
    const maxReturn = Math.max(...baselineReturns, ...stressedReturns);

    const numBins = 40;
    const step = (maxReturn - minReturn) / numBins;

    const dataArr = [];
    for (let i = 0; i < numBins; i++) {
       const binMin = minReturn + i * step;
       const binMax = binMin + step;
       const binCenter = binMin + step / 2;
       
       const baseCount = baselineReturns.filter(r => r >= binMin && (i === numBins - 1 ? r <= binMax : r < binMax)).length;
       const stressCount = stressedReturns.filter(r => r >= binMin && (i === numBins - 1 ? r <= binMax : r < binMax)).length;
       
       dataArr.push({
         returnPct: (binCenter * 100).toFixed(1) + '%',
         baseline: baseCount,
         stressed: stressCount,
       });
    }

    return dataArr;
  }, [baselineFinalValues, stressedFinalValues, initialValue]);

  if (data.length === 0) return <div>No data</div>;

  return (
    <div style={{ width: '100%', height: 400 }}>
      <ResponsiveContainer>
        <ComposedChart data={data} barCategoryGap="0%" barGap={0}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
          <XAxis 
            dataKey="returnPct" 
            tick={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
            interval="preserveStartEnd"
          />
          <YAxis 
            tick={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
            tickFormatter={(v) => v.toLocaleString()}
          />
          <Tooltip
            contentStyle={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          />
          <Legend wrapperStyle={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12 }} />
          <Bar dataKey="baseline" name="Baseline (α=0)" fill="rgba(59,130,246,0.5)" stroke="none" />
          <Bar dataKey="stressed" name="Stressed (α)" fill="rgba(192,57,43,0.5)" stroke="none" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
