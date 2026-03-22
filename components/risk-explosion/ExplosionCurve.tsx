'use client';

import React, { useMemo } from 'react';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceArea, ReferenceLine, ReferenceDot, Area, ResponsiveContainer } from 'recharts';
import { usePortfolio } from '@/lib/PortfolioContext';
import { getVolatilities, stressCovariance, portfolioVariance } from '@/lib/math';

export default function ExplosionCurve() {
  const { alpha, setAlpha, tickers, portfolioWeights } = usePortfolio();
  const weights = portfolioWeights || {};

  const chartData = useMemo(() => {
    if (tickers.length === 0) return [];
    
    const vols = getVolatilities(tickers);
    const weightArray = tickers.map(t => weights[t] || 0);

    const data = [];
    for (let i = 0; i <= 100; i++) {
      const currentA = i / 100;
      const cov = stressCovariance(currentA, vols);
      const varP = portfolioVariance(weightArray, cov);
      const volP = Math.sqrt(varP) * Math.sqrt(252); // Annualized

      data.push({
        alpha: currentA,
        volP: volP * 100, // as percentage
      });
    }
    return data;
  }, [tickers, weights]);

  if (tickers.length === 0 || chartData.length === 0) {
    return <div style={{ padding: 20, color: 'var(--ink-muted)' }}>No assets selected.</div>;
  }

  const currentVol = chartData.find(d => Math.abs(d.alpha - alpha) < 0.001)?.volP || 0;
  const baselineVol = chartData[0].volP;
  const worstCaseVol = chartData[chartData.length - 1].volP;

  const handleChartClick = (e: any) => {
    if (e && e.activePayload && e.activePayload.length > 0) {
      const clickedAlpha = e.activePayload[0].payload.alpha;
      setAlpha(clickedAlpha);
    }
  };

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 24, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, marginBottom: 24 }}>Systemic Risk Expansion</h3>
      
      <div style={{ flex: 1, minHeight: 400 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }} onClick={handleChartClick}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis 
              dataKey="alpha" 
              type="number" 
              domain={[0, 1]} 
              tickCount={6} 
              tickFormatter={(v) => v.toFixed(2)}
              stroke="var(--ink-muted)"
              tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }}
              label={{ value: "Stress Intensity (α)", position: "bottom", style: { fontSize: 12, fill: 'var(--ink-muted)' } }}
            />
            <YAxis 
              domain={['auto', 'auto']}
              stroke="var(--ink-muted)"
              tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }}
              tickFormatter={(v) => `${v.toFixed(1)}%`}
              label={{ value: "Portfolio Volatility σ_p", angle: -90, position: "insideLeft", style: { fontSize: 12, fill: 'var(--ink-muted)' } }}
            />
            
            <Tooltip
              cursor={{ strokeDasharray: '3 3', stroke: 'var(--gold)', strokeWidth: 1.5 }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div style={{ background: 'var(--cream)', border: '1px solid var(--border)', padding: '12px', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--ink)' }}>
                        α = {data.alpha.toFixed(2)}
                      </div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: 'var(--risk-red)', fontWeight: 600, marginTop: 4 }}>
                        σ_p = {data.volP.toFixed(2)}%
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Regime Zones */}
            <ReferenceArea x1={0} x2={0.25} fill="rgba(26,107,60,0.06)" />
            <ReferenceArea x1={0.25} x2={0.50} fill="rgba(201,168,76,0.08)" />
            <ReferenceArea x1={0.50} x2={0.75} fill="rgba(192,57,43,0.08)" />
            <ReferenceArea x1={0.75} x2={1.00} fill="rgba(192,57,43,0.16)" />

            {/* Labels for Regimes (using generic custom SVG text as ReferenceDot for simplicity to position them) */}
            {/* Labels removed to satisfy strict typescript typing. Regimes are indicated by area fill. */}

            {/* Reference Lines */}
            <ReferenceLine y={baselineVol} stroke="var(--ink-muted)" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Current Vol', fill: 'var(--ink-muted)', fontSize: 11 }} />
            <ReferenceLine y={worstCaseVol} stroke="var(--risk-red)" strokeOpacity={0.5} strokeDasharray="3 3" label={{ position: 'insideBottomLeft', value: 'Worst Case', fill: 'var(--risk-red)', fontSize: 11 }} />

            {/* Area under curve */}
            <Area type="monotone" dataKey="volP" fill="var(--risk-red)" fillOpacity={0.08} stroke="none" isAnimationActive={false} />
            
            {/* Main Curve */}
            <Line type="monotone" dataKey="volP" stroke="var(--risk-red)" strokeWidth={2.5} dot={false} isAnimationActive={false} />
            
            {/* Current Alpha Marker */}
            <ReferenceDot x={alpha} y={currentVol} r={4} fill="var(--gold)" stroke="var(--ink)" strokeWidth={2} />
            
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginTop: 20 }}>
        <p style={{ fontSize: 12, color: 'var(--ink-muted)', textAlign: 'center', marginBottom: 8 }}>Drag to explore stress regimes</p>
        <input
          type="range"
          min="0" max="1" step="0.01"
          value={alpha}
          onChange={(e) => setAlpha(parseFloat(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--gold)' }}
        />
      </div>
    </div>
  );
}
