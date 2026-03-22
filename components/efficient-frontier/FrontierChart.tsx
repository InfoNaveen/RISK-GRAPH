'use client';

import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Line } from 'recharts';
import { FrontierPoint } from '@/lib/optimizer';
import { ASSET_COLORS } from '@/lib/types';

interface FrontierChartProps {
  unconstrainedPoints: FrontierPoint[];
  longOnlyPoints: FrontierPoint[];
  randomPoints: FrontierPoint[];
  minVarPoint: FrontierPoint | null;
  maxSharpePoint: FrontierPoint | null;
  currentPoint: FrontierPoint | null;
  equalWeightPoint: FrontierPoint | null;
  riskFreeRate: number;
  onPointClick: (pt: FrontierPoint) => void;
}

export default function FrontierChart({
  unconstrainedPoints,
  longOnlyPoints,
  randomPoints,
  minVarPoint,
  maxSharpePoint,
  currentPoint,
  equalWeightPoint,
  riskFreeRate,
  onPointClick
}: FrontierChartProps) {
  
  if (!unconstrainedPoints.length && !randomPoints.length) return null;

  // Determine bounds
  let maxVol = 0.3; // 30% default max
  let minRet = 0;
  let maxRet = 0.2;
  
  const allPoints = [...unconstrainedPoints, ...randomPoints, currentPoint].filter(Boolean) as FrontierPoint[];
  allPoints.forEach(pt => {
    if (pt.vol > maxVol) maxVol = pt.vol;
    if (pt.return < minRet) minRet = pt.return;
    if (pt.return > maxRet) maxRet = pt.return;
  });

  const getSharpeColor = (sharpe: number) => {
    if (sharpe < 0.5) return 'var(--ink-muted)';
    if (sharpe < 1.0) return 'var(--gold)';
    return 'var(--risk-green)';
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: FrontierPoint = payload[0].payload;
      if (!data.weights) return null;
      
      const topWeights = Object.entries(data.weights)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([a, w]) => `${a} (${(w*100).toFixed(1)}%)`)
        .join(', ');

      return (
        <div style={{ background: 'var(--cream)', border: '1px solid var(--border)', padding: '12px', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }}>
          <div style={{ fontFamily: 'JetBrains Mono', color: 'var(--ink)', fontWeight: 600, marginBottom: 8 }}>
            Return: {(data.return * 100).toFixed(2)}% | Vol: {(data.vol * 100).toFixed(2)}% | Sharpe: {data.sharpe?.toFixed(2) || 'N/A'}
          </div>
          <div style={{ color: 'var(--ink-muted)' }}>Top 3: {topWeights}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: '70vh', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 24 }}>
      <ResponsiveContainer>
        <ScatterChart margin={{ top: 20, right: 30, left: 10, bottom: 20 }} onClick={(e) => {
          if (e && e.activePayload && e.activePayload.length) {
            onPointClick(e.activePayload[0].payload);
          }
        }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis 
            type="number" 
            dataKey="vol" 
            name="Volatility" 
            domain={[0, maxVol + 0.05]} 
            tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} 
            tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: 'var(--ink-muted)' }}
            label={{ value: "Annual Volatility σ_p", position: 'bottom', fill: 'var(--ink-muted)', fontSize: 12 }}
          />
          <YAxis 
            type="number" 
            dataKey="return" 
            name="Return" 
            domain={[minRet - 0.02, maxRet + 0.02]} 
            tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} 
            tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: 'var(--ink-muted)' }}
            label={{ value: "Annual Return μ_p", angle: -90, position: 'insideLeft', fill: 'var(--ink-muted)', fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />

          {/* Random Portfolios Cloud */}
          <Scatter name="Random Portfolios" data={randomPoints} shape="circle">
            {randomPoints.map((entry, index) => (
              <circle key={`cell-${index}`} cx={0} cy={0} r={3} fill={getSharpeColor(entry.sharpe)} fillOpacity={0.4} />
            ))}
          </Scatter>

          {/* Unconstrained Efficient Frontier */}
          {unconstrainedPoints.length > 0 && (
            <Line
              data={unconstrainedPoints}
              type="monotone"
              dataKey="return"
              stroke="var(--risk-red)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          )}

          {/* Long-Only Frontier */}
          {longOnlyPoints.length > 0 && (
            <Line
              data={longOnlyPoints}
              type="monotone"
              dataKey="return"
              stroke="var(--gold)"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              dot={false}
              isAnimationActive={false}
            />
          )}

          {/* CML (if max sharpe exists) */}
          {maxSharpePoint && (
            <ReferenceLine 
              segment={[{ x: 0, y: riskFreeRate }, { x: maxVol, y: riskFreeRate + (maxSharpePoint.return - riskFreeRate) / maxSharpePoint.vol * maxVol }]} 
              stroke="var(--ink-muted)" 
              strokeOpacity={0.5} 
              strokeDasharray="3 3"
              label={{ position: 'insideBottomRight', value: 'CML (rf=6.5%)', fill: 'var(--ink-muted)', fontSize: 10 }}
            />
          )}

          {/* Special Markers */}
          {minVarPoint && (
            <Scatter name="Min Var" data={[minVarPoint]} shape="diamond" fill="var(--risk-green)" />
          )}
          {maxSharpePoint && (
            <Scatter name="Max Sharpe" data={[maxSharpePoint]} shape="star" fill="var(--gold)" />
          )}
          {currentPoint && (
            <Scatter name="Current" data={[currentPoint]} shape="circle" fill="var(--ink)">
              {/* Force a little larger point */}
              <circle cx={0} cy={0} r={6} fill="var(--ink)" />
            </Scatter>
          )}
          {equalWeightPoint && (
            <Scatter name="1/N" data={[equalWeightPoint]} shape="circle" fill="none">
              <circle cx={0} cy={0} r={5} fill="none" stroke="var(--ink-muted)" strokeWidth={2} />
            </Scatter>
          )}

        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
