'use client';

import React, { useMemo } from 'react';
import { usePortfolio } from '@/lib/PortfolioContext';
import { getVolatilities, getCorrelationSubMatrix, stressCovariance, portfolioVariance } from '@/lib/math';

export default function RiskRegimePanel() {
  const { alpha, beta, tickers, portfolioWeights, lambdaMax } = usePortfolio();

  const metrics = useMemo(() => {
    if (tickers.length === 0) return null;
    const weights = portfolioWeights || {};
    
    const vols = getVolatilities(tickers);
    const weightArray = tickers.map(t => weights[t] || 0);
    const corrSub = getCorrelationSubMatrix(tickers);
    
    // Baseline
    const covBase = stressCovariance(0, vols, corrSub);
    const volBase = Math.sqrt(Math.max(0, portfolioVariance(weightArray, covBase))) * Math.sqrt(252);
    
    // Current Alpha
    const covAlpha = stressCovariance(alpha, vols, corrSub);
    const volAlpha = Math.sqrt(Math.max(0, portfolioVariance(weightArray, covAlpha))) * Math.sqrt(252);
    
    // Avg Correl
    let sumCorr = 0;
    let count = 0;
    for (let i = 0; i < tickers.length; i++) {
      for (let j = i + 1; j < tickers.length; j++) {
        // Recover correlation from covariance
        const corr = covAlpha[i][j] / (Math.sqrt(covAlpha[i][i]) * Math.sqrt(covAlpha[j][j]));
        sumCorr += corr;
        count++;
      }
    }
    const avgCorr = count > 0 ? sumCorr / count : 1;
    
    // Diversification ratio
    const weightedSumVols = weightArray.reduce((sum, w, i) => sum + w * vols[i] * Math.sqrt(252), 0);
    const divRatio = volAlpha > 0 ? weightedSumVols / volAlpha : 1;
    
    const volIncrease = volBase > 0 ? ((volAlpha - volBase) / volBase) * 100 : 0;
    
    return {
      volAlpha: volAlpha * 100,
      avgCorr,
      divRatio,
      volIncrease
    };
  }, [tickers, portfolioWeights, alpha]);

  if (!metrics) return null;

  let regimeLabel = '';
  let regimeBg = '';
  let regimeColor = '';
  let isCrisis = false;

  if (alpha < 0.25) {
    regimeLabel = "● NORMAL";
    regimeBg = "rgba(26,107,60,0.1)";
    regimeColor = "var(--risk-green)";
  } else if (alpha < 0.5) {
    regimeLabel = "● ELEVATED";
    regimeBg = "rgba(201,168,76,0.1)";
    regimeColor = "var(--gold)";
  } else if (alpha < 0.75) {
    regimeLabel = "● STRESSED";
    regimeBg = "rgba(192,57,43,0.1)";
    regimeColor = "var(--risk-red)";
  } else {
    regimeLabel = "⚠ CRISIS";
    regimeBg = "rgba(192,57,43,0.2)";
    regimeColor = "var(--risk-red)";
    isCrisis = true;
  }

  const threshold = lambdaMax ? 1 / lambdaMax : 1;
  const isUnstable = beta >= threshold;
  const betaRatio = Math.min(beta / threshold, 1);
  const barColor = isUnstable ? 'var(--risk-red)' : (betaRatio > 0.5 ? 'var(--gold)' : 'var(--risk-green)');

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, marginBottom: 20 }}>Current Risk Regime</h3>
      
      {/* Regime Indicator Badge */}
      <div style={{ 
        width: '100%', 
        padding: '16px', 
        background: regimeBg, 
        color: regimeColor,
        borderRadius: 8,
        textAlign: 'center',
        fontFamily: 'JetBrains Mono',
        fontSize: 20,
        fontWeight: 700,
        letterSpacing: '0.1em',
        marginBottom: 24,
        border: isCrisis ? `1px solid ${regimeColor}` : 'none',
        animation: isCrisis ? 'pulse 2s infinite' : 'none'
      }}>
        {regimeLabel}
      </div>

      {/* Metrics Layout grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>Effective Avg Correlation</div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 16, color: 'var(--ink)' }}>{metrics.avgCorr.toFixed(2)}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>Portfolio Vol (σ_p)</div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 16, color: 'var(--ink)' }}>{metrics.volAlpha.toFixed(2)}%</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>Diversification Ratio</div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 16, color: 'var(--ink)' }}>{metrics.divRatio.toFixed(2)}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>Vol Increase vs Base</div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 16, color: metrics.volIncrease > 0 ? 'var(--risk-red)' : 'var(--ink)' }}>
            +{metrics.volIncrease.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Stability Assessment */}
      <div style={{ marginTop: 'auto', background: 'var(--cream)', border: '1px solid var(--border)', padding: 16, borderRadius: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}>Stability Assessment</div>
        
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--ink-muted)', marginBottom: 8 }}>
          β = {beta.toFixed(3)} / threshold = {threshold.toFixed(3)}
        </div>
        
        {/* Progress Bar */}
        <div style={{ height: 6, width: '100%', background: 'var(--surface)', borderRadius: 3, overflow: 'hidden', marginBottom: isUnstable ? 12 : 0 }}>
          <div style={{ height: '100%', width: `${betaRatio * 100}%`, background: barColor, transition: 'width 0.3s, background 0.3s' }} />
        </div>

        {isUnstable && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', color: 'var(--risk-red)', fontSize: 12, lineHeight: 1.4 }}>
            <span>⚠</span>
            <span>Contagion rate exceeds stability threshold. Risk of herding collapse.</span>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(192,57,43, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(192,57,43, 0); }
          100% { box-shadow: 0 0 0 0 rgba(192,57,43, 0); }
        }
      `}} />
    </div>
  );
}
