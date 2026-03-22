'use client';

import React, { useMemo } from 'react';
import { usePortfolio } from '@/lib/PortfolioContext';
import { SYNTHETIC_PRICES } from '@/lib/priceData';
import { computeDrawdown, computeMaxDrawdown } from '@/lib/math';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot, ReferenceLine } from 'recharts';

export default function DrawdownChart() {
  const { tickers, portfolioWeights } = usePortfolio();

  const data = useMemo(() => {
    if (tickers.length === 0) return null;
    const weights = portfolioWeights || {};

    const nSteps = (SYNTHETIC_PRICES[tickers[0] as keyof typeof SYNTHETIC_PRICES] || []).length;
    
    // Equal Weight starting at 100 for simplicity (drawdowns are scale invariant)
    const portPrices = new Array(nSteps).fill(0);
    portPrices[0] = 100;

    // Use current portfolio weights instead of 1/N for accuracy to user view
    const weightArray = tickers.map(t => weights[t] || 0);

    for (let t = 1; t < nSteps; t++) {
      let pRet = 0;
      tickers.forEach((ticker, i) => {
        const p0 = SYNTHETIC_PRICES[ticker as keyof typeof SYNTHETIC_PRICES][t-1];
        const p1 = SYNTHETIC_PRICES[ticker as keyof typeof SYNTHETIC_PRICES][t];
        pRet += weightArray[i] * ((p1 - p0) / p0);
      });
      portPrices[t] = portPrices[t-1] * (1 + pRet);
    }

    const { mdd, peakIdx, troughIdx } = computeMaxDrawdown(portPrices);
    const dd = computeDrawdown(portPrices);
    
    // Average DD
    const avgDd = dd.reduce((sum, d) => sum + d, 0) / dd.length;
    
    // Recovery tracking (from trough to exactly 0 again)
    let recoveryDays = 0;
    for (let t = troughIdx; t < nSteps; t++) {
      if (dd[t] === 0) {
        recoveryDays = t - troughIdx;
        break;
      }
    }

    const chartData = dd.map((d, i) => ({
      day: i,
      dd: d * 100, // as percentage
    }));

    // Annualized Return for Calmar
    const annualRet = Math.pow(portPrices[nSteps-1] / portPrices[0], 252 / nSteps) - 1;
    const calmar = mdd !== 0 ? annualRet / Math.abs(mdd) : 0;

    return { 
      chartData, 
      mdd: mdd * 100, 
      troughIdx, 
      avgDd: avgDd * 100,
      recoveryDays: recoveryDays > 0 ? recoveryDays : 'Not recovered',
      calmar
    };
  }, [tickers, portfolioWeights]);

  if (!data) return null;

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    return (
      <div style={{ background: 'var(--cream)', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: '4px', fontSize: 12 }}>
        <div style={{ color: 'var(--risk-red)', fontFamily: 'JetBrains Mono', fontWeight: 600 }}>
          DD: {payload[0]?.value?.toFixed(2)}%
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 24, display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, marginBottom: 20 }}>Maximum Drawdown (Peak-to-Trough)</h3>
      
      <div style={{ height: 260, width: '100%' }}>
        <ResponsiveContainer>
          <AreaChart data={data.chartData} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: 'var(--ink-muted)' }} />
            <YAxis reversed domain={['auto', 0]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: 'var(--ink-muted)' }} />
            <Tooltip content={<CustomTooltip />} />
            
            <Area type="monotone" dataKey="dd" fill="var(--risk-red)" fillOpacity={0.15} stroke="var(--risk-red)" strokeWidth={1.5} isAnimationActive={false} />
            
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
        <div>
          <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--ink-muted)' }}>Max Drawdown</div>
          <div style={{ fontFamily: 'JetBrains Mono', color: 'var(--risk-red)', fontWeight: 600 }}>{data.mdd.toFixed(2)}%</div>
        </div>
        <div>
          <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--ink-muted)' }}>Avg Drawdown</div>
          <div style={{ fontFamily: 'JetBrains Mono', color: 'var(--ink-muted)' }}>{data.avgDd.toFixed(2)}%</div>
        </div>
        <div>
          <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--ink-muted)' }}>Recovery Days</div>
          <div style={{ fontFamily: 'JetBrains Mono', color: 'var(--ink)' }}>{data.recoveryDays} {typeof data.recoveryDays === 'number' ? 'days' : ''}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--ink-muted)' }}>Calmar Ratio</div>
          <div style={{ fontFamily: 'JetBrains Mono', color: 'var(--gold)', fontWeight: 600 }}>{data.calmar.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}
