'use client';

import React, { useMemo } from 'react';
import { usePortfolio } from '@/lib/PortfolioContext';
import { SYNTHETIC_PRICES } from '@/lib/priceData';
import { computeAllEigenvalues } from '@/lib/math';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function RegimeAnalysis() {
  const { tickers } = usePortfolio();

  const data = useMemo(() => {
    if (tickers.length < 2) return [];

    const nSteps = (SYNTHETIC_PRICES[tickers[0] as keyof typeof SYNTHETIC_PRICES] || []).length;
    if (nSteps < 2) return [];

    const returnsMap: Record<string, number[]> = {};
    tickers.forEach(t => {
      const prices = SYNTHETIC_PRICES[t as keyof typeof SYNTHETIC_PRICES] || [];
      const ret = [];
      for (let i = 1; i < prices.length; i++) {
        ret.push(Math.log(prices[i] / prices[i - 1]));
      }
      returnsMap[t] = ret;
    });

    const windowSize = 42; // Same as rolling correlation
    const n = tickers.length;
    const chartData = [];

    // Calculate rolling absorption ratio (AR) = variance explained by 1st PC
    for (let t = windowSize; t < nSteps - 1; t++) {
      // 1. Build correlation matrix for this window
      const matrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));
      const stds = Array(n).fill(0);
      const means = Array(n).fill(0);

      // calc means
      for(let i=0; i<n; i++) {
        const w = returnsMap[tickers[i]].slice(t - windowSize, t);
        means[i] = w.reduce((a,b)=>a+b,0)/windowSize;
      }

      // calc stds
      for(let i=0; i<n; i++) {
        const w = returnsMap[tickers[i]].slice(t - windowSize, t);
        stds[i] = Math.sqrt(w.reduce((a,b)=>a+Math.pow(b-means[i],2),0)/(windowSize-1));
      }

      // calc correlation
      for(let i=0; i<n; i++) {
        for(let j=0; j<n; j++) {
          if (i===j) {
            matrix[i][j] = 1;
          } else {
            const w1 = returnsMap[tickers[i]].slice(t - windowSize, t);
            const w2 = returnsMap[tickers[j]].slice(t - windowSize, t);
            let cov = 0;
            for(let k=0; k<windowSize; k++) {
              cov += (w1[k]-means[i])*(w2[k]-means[j]);
            }
            cov /= (windowSize-1);
            matrix[i][j] = (stds[i]>0 && stds[j]>0) ? cov / (stds[i]*stds[j]) : 0;
          }
        }
      }

      const eigenVals = computeAllEigenvalues(matrix);
      const maxEigen = Math.max(...eigenVals);
      
      // Absorption Ratio = max Eigenvalue / trace(correl) which is N
      const ar = maxEigen / n;
      
      // Define regimes based on AR:
      // AR < 0.3 = Normal
      // 0.3 < AR < 0.5 = Elevated
      // AR > 0.5 = Crisis/Herding
      let regimeVal = 0; // for coloring the background
      if (ar > 0.5) regimeVal = 1;
      else if (ar > 0.3) regimeVal = 0.5;

      chartData.push({
        day: t,
        absorptionRatio: ar * 100, // as percentage of total variance
        regimeWarning: regimeVal
      });
    }

    return chartData;
  }, [tickers]);

  if (tickers.length < 2) {
    return <div style={{ color: 'var(--ink-muted)' }}>Need at least 2 assets for regime analysis.</div>;
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const ar = payload[0].payload.absorptionRatio;
    let regimeStr = 'Normal (Uncorrelated)';
    let color = 'var(--risk-green)';
    if (ar > 50) { regimeStr = 'Crisis (High Herding)'; color = 'var(--risk-red)'; }
    else if (ar > 30) { regimeStr = 'Elevated Risk'; color = 'var(--gold)'; }

    return (
      <div style={{ background: 'var(--cream)', border: '1px solid var(--border)', padding: '12px', borderRadius: '4px', fontSize: 12 }}>
        <div style={{ fontFamily: 'JetBrains Mono', color: 'var(--ink)', marginBottom: 8, fontWeight: 600 }}>Day {label}</div>
        <div style={{ color: 'var(--ink)', fontFamily: 'JetBrains Mono', marginBottom: 4 }}>
          PCA1 Dominance: {ar.toFixed(1)}%
        </div>
        <div style={{ color: color, fontWeight: 600 }}>
          Regime: {regimeStr}
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: 'white', padding: 24, borderRadius: 8, border: '1px solid var(--border)' }}>
      <h3 style={{ fontSize: 14, marginBottom: 8, color: 'var(--ink)' }}>Principal Component Regime Detection (42d Window)</h3>
      <p style={{ fontSize: 13, color: 'var(--ink-muted)', marginBottom: 24 }}>
        Plots the trailing Absorption Ratio (percentage of total variance explained by the first principal component). High values indicate "herding" behavior where assets move together, typical of market crises.
      </p>

      <div style={{ height: 350, width: '100%' }}>
        <ResponsiveContainer>
          <ComposedChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: 'var(--ink-muted)' }} />
            <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: 'var(--ink-muted)' }} domain={[0, 100]} />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Background coloring for regimes */}
            <Area type="step" dataKey="regimeWarning" fill="var(--risk-red)" fillOpacity={0.05} stroke="none" isAnimationActive={false} 
                  yAxisId="reg" />
            
            <YAxis yAxisId="reg" domain={[0, 1]} hide /> {/* Hidden axis strictly for background coloring */}

            <Line type="monotone" dataKey="absorptionRatio" stroke="var(--ink)" strokeWidth={2} dot={false} isAnimationActive={false} />
            
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      <div style={{ display: 'flex', gap: 16, marginTop: 16, fontSize: 11, color: 'var(--ink-muted)', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
           <div style={{ width: 10, height: 10, background: 'var(--risk-green)', borderRadius: '50%' }} />
           <span>Normal (&lt;30%)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
           <div style={{ width: 10, height: 10, background: 'var(--gold)', borderRadius: '50%' }} />
           <span>Elevated (30-50%)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
           <div style={{ width: 10, height: 10, background: 'var(--risk-red)', borderRadius: '50%' }} />
           <span>Crisis/Herding (&gt;50%)</span>
        </div>
      </div>
    </div>
  );
}
