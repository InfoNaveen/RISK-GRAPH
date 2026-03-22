'use client';

import React, { useMemo } from 'react';
import { usePortfolio } from '@/lib/PortfolioContext';
import { SYNTHETIC_PRICES } from '@/lib/priceData';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function RollingVarChart() {
  const { tickers, portfolioWeights } = usePortfolio();
  const weights = portfolioWeights || {};

  const data = useMemo(() => {
    if (tickers.length === 0) return null;

    const returnsMap: Record<string, number[]> = {};
    const nSteps = (SYNTHETIC_PRICES[tickers[0] as keyof typeof SYNTHETIC_PRICES] || []).length;
    
    tickers.forEach(t => {
      const prices = SYNTHETIC_PRICES[t as keyof typeof SYNTHETIC_PRICES] || [];
      const ret = [];
      for (let i = 1; i < prices.length; i++) {
        ret.push(Math.log(prices[i] / prices[i - 1]));
      }
      returnsMap[t] = ret;
    });

    const weightArray = tickers.map(t => weights[t] || 0);
    const portfolioReturns = [];
    
    for (let t = 0; t < nSteps - 1; t++) {
      let pret = 0;
      tickers.forEach((ticker, i) => {
        pret += weightArray[i] * returnsMap[ticker][t];
      });
      portfolioReturns.push(pret);
    }

    const windowSize = 21;
    const chartData = [];
    let sumVar = 0;
    
    for (let t = windowSize; t < portfolioReturns.length; t++) {
      const windowRets = portfolioReturns.slice(t - windowSize, t).sort((a, b) => a - b); // Ascending (worst first)
      
      // 95% Historical VaR (5th percentile = idx 1 out of 21)
      const varIndex = Math.floor(windowSize * 0.05);
      const varLoss = -windowRets[varIndex]; // positive = loss percent
      
      // CVaR
      const tailRets = windowRets.slice(0, varIndex + 1);
      const cvarLoss = -(tailRets.reduce((s, v) => s + v, 0) / tailRets.length);

      sumVar += varLoss;
      
      chartData.push({
        day: t,
        var: varLoss * 100, // as %
        cvar: cvarLoss * 100
      });
    }

    return { chartData, avgVar: sumVar / (portfolioReturns.length - windowSize) * 100 };
  }, [tickers, weights]);

  if (tickers.length === 0 || !data || !data.chartData || data.chartData.length === 0) return null;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    return (
      <div style={{ background: 'var(--cream)', border: '1px solid var(--border)', padding: '12px', borderRadius: '4px', fontSize: 12 }}>
        <div style={{ fontFamily: 'JetBrains Mono', color: 'var(--ink)', marginBottom: 8, fontWeight: 600 }}>Day {label}</div>
        <div style={{ color: 'var(--risk-red)', fontFamily: 'JetBrains Mono', marginBottom: 4 }}>
          VaR(95%): {payload[0]?.value?.toFixed(2)}%
        </div>
        <div style={{ color: 'var(--risk-red)', fontFamily: 'JetBrains Mono' }}>
          CVaR(95%): {payload[1]?.value?.toFixed(2)}%
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 24 }}>
      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, marginBottom: 20 }}>Rolling Value at Risk (95%)</h3>
      
      <div style={{ height: 300, width: '100%' }}>
        <ResponsiveContainer>
          <ComposedChart data={data.chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: 'var(--ink-muted)' }} />
            <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: 'var(--ink-muted)' }} />
            <Tooltip content={<CustomTooltip />} />
            
            <ReferenceLine y={data.avgVar} stroke="var(--gold)" strokeDasharray="3 3" label={{ position: 'top', value: 'Avg VaR', fill: 'var(--gold)', fontSize: 10 }} />
            
            <Area type="monotone" dataKey="var" fill="var(--risk-red)" fillOpacity={0.1} stroke="none" isAnimationActive={false} />
            <Line type="monotone" dataKey="var" stroke="var(--risk-red)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="cvar" stroke="var(--risk-red)" strokeWidth={2.5} strokeDasharray="5 5" dot={false} isAnimationActive={false} />
            
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
