'use client';

import React, { useMemo } from 'react';
import { usePortfolio } from '@/lib/PortfolioContext';
import { getVolatilities, stressCovariance, computeMarginalRiskContribution, computeComponentRiskContribution, portfolioVariance } from '@/lib/math';

export default function MarginalContribution() {
  const { tickers, portfolioWeights, alpha } = usePortfolio();
  const weights = portfolioWeights || {};

  const tableData = useMemo(() => {
    if (tickers.length === 0) return [];

    const vols = getVolatilities(tickers);
    const weightArray = tickers.map(t => weights[t] || 0);
    const cov = stressCovariance(alpha, vols);
    
    const mrc = computeMarginalRiskContribution(weightArray, cov);
    const crc = computeComponentRiskContribution(weightArray, cov);
    const sigmaP = Math.sqrt(portfolioVariance(weightArray, cov));

    const data = [];
    for (let i = 0; i < tickers.length; i++) {
      const w = weightArray[i];
      const prc = sigmaP > 0 ? crc[i] / sigmaP : 0;
      const ratio = w > 0 ? prc / w : 0;
      
      let tier = "Neutral";
      let tierColor = "var(--ink-muted)";
      if (ratio > 1.3) {
        tier = "Concentrator";
        tierColor = "var(--risk-red)";
      } else if (ratio < 0.7) {
        tier = "Diversifier";
        tierColor = "var(--risk-green)";
      }

      data.push({
        asset: tickers[i],
        weight: w * 100,
        vol: vols[i] * Math.sqrt(252) * 100,
        mrc: mrc[i] * Math.sqrt(252) * 100, // Annualized marginal risk
        crc: crc[i] * Math.sqrt(252) * 100, // Annualized CRC
        prc: prc * 100,
        diff: (prc - w) * 100,
        tier,
        tierColor
      });
    }

    return data.sort((a, b) => b.prc - a.prc);
  }, [tickers, weights, alpha]);

  if (tableData.length === 0) return null;

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 24, flex: 1 }}>
      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, marginBottom: 16 }}>Marginal & Component Risk Analysis</h3>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: 'DM Sans', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--ink-muted)', fontSize: 11, textTransform: 'uppercase' }}>
            <th style={{ padding: '8px 0', fontWeight: 500 }}>Asset</th>
            <th style={{ padding: '8px 0', fontWeight: 500 }}>Weight</th>
            <th style={{ padding: '8px 0', fontWeight: 500 }}>σᵢ</th>
            <th style={{ padding: '8px 0', fontWeight: 500 }}>MRC</th>
            <th style={{ padding: '8px 0', fontWeight: 500 }}>CRC</th>
            <th style={{ padding: '8px 0', fontWeight: 500 }}>PRC%</th>
            <th style={{ padding: '8px 0', fontWeight: 500 }}>Risk vs Weight</th>
            <th style={{ padding: '8px 0', fontWeight: 500 }}>Tier</th>
          </tr>
        </thead>
        <tbody>
          {tableData.map((row, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '12px 0', fontWeight: 500 }}>{row.asset}</td>
              <td style={{ padding: '12px 0', fontFamily: 'JetBrains Mono' }}>{row.weight.toFixed(1)}%</td>
              <td style={{ padding: '12px 0', fontFamily: 'JetBrains Mono', color: 'var(--ink-muted)' }}>{row.vol.toFixed(1)}%</td>
              <td style={{ padding: '12px 0', fontFamily: 'JetBrains Mono' }}>{row.mrc.toFixed(2)}%</td>
              <td style={{ padding: '12px 0', fontFamily: 'JetBrains Mono' }}>{row.crc.toFixed(2)}%</td>
              <td style={{ padding: '12px 0', fontFamily: 'JetBrains Mono', fontWeight: 600 }}>{row.prc.toFixed(1)}%</td>
              <td style={{ padding: '12px 0', fontFamily: 'JetBrains Mono', color: row.diff > 0 ? 'var(--risk-red)' : 'var(--risk-green)' }}>
                {row.diff > 0 ? '+' : ''}{row.diff.toFixed(1)}%
              </td>
              <td style={{ padding: '12px 0' }}>
                <span style={{ 
                  background: `${row.tierColor}15`, 
                  color: row.tierColor, 
                  padding: '4px 8px', 
                  borderRadius: 4, 
                  fontSize: 10, 
                  textTransform: 'uppercase', 
                  fontWeight: 600 
                }}>
                  {row.tier}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
