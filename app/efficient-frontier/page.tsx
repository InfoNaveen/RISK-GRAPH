'use client';

import React, { useState, useEffect, useMemo } from 'react';
import SectionHeader from '@/components/SectionHeader';
import FrontierChart from '@/components/efficient-frontier/FrontierChart';
import PortfolioScatter from '@/components/efficient-frontier/PortfolioScatter';
import { usePortfolio } from '@/lib/PortfolioContext';
import { getVolatilities, getDrifts, getCorrelationSubMatrix } from '@/lib/math';
import { 
  computeEfficientFrontier, 
  computeMinVariancePortfolio, 
  computeMaxSharpePortfolio, 
  simulateRandomPortfolios,
  FrontierPoint 
} from '@/lib/optimizer';

export default function EfficientFrontierPage() {
  const { tickers, portfolioWeights } = usePortfolio();
  const weights = portfolioWeights || {};

  const [unconstrainedPoints, setUnconstrainedPoints] = useState<FrontierPoint[]>([]);
  const [longOnlyPoints, setLongOnlyPoints] = useState<FrontierPoint[]>([]);
  const [randomPoints, setRandomPoints] = useState<FrontierPoint[]>([]);
  const [minVarPoint, setMinVarPoint] = useState<FrontierPoint | null>(null);
  const [maxSharpePoint, setMaxSharpePoint] = useState<FrontierPoint | null>(null);
  const [equalWeightPoint, setEqualWeightPoint] = useState<FrontierPoint | null>(null);
  const [currentPoint, setCurrentPoint] = useState<FrontierPoint | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<FrontierPoint | null>(null);

  const [isComputing, setIsComputing] = useState(false);

  useEffect(() => {
    if (tickers.length < 2) return;

    setIsComputing(true);
    
    // Defer computation so UI can render loading state
    setTimeout(() => {
      const mu = getDrifts(tickers);
      const vols = getVolatilities(tickers);
      const corr = getCorrelationSubMatrix(tickers);
      
      const n = tickers.length;
      const covMatrix = Array.from({length: n}, (_, i) => 
        Array.from({length: n}, (_, j) => vols[i] * corr[i][j] * vols[j])
      );

      // Unconstrained
      const unconstrained = computeEfficientFrontier(tickers, mu, covMatrix, 0.065, false);
      setUnconstrainedPoints(unconstrained);

      // Long Only
      const longOnly = computeEfficientFrontier(tickers, mu, covMatrix, 0.065, true);
      setLongOnlyPoints(longOnly);

      // Specifics
      const minV = computeMinVariancePortfolio(tickers, covMatrix);
      setMinVarPoint(minV);

      const maxS = computeMaxSharpePortfolio(tickers, mu, covMatrix, 0.065);
      setMaxSharpePoint(maxS);

      // Random points
      const randoms = simulateRandomPortfolios(2000, tickers, mu, covMatrix, 0.065);
      setRandomPoints(randoms);

      // Equal weight
      let eqPr = 0;
      let eqVar = 0;
      for(let i = 0; i < n; i++) {
        eqPr += (1/n) * mu[i];
        for(let j = 0; j < n; j++) {
          eqVar += (1/n) * (1/n) * covMatrix[i][j];
        }
      }
      const eqWeights: Record<string, number> = {};
      tickers.forEach(t => eqWeights[t] = 1/n);
      const eqS = Math.sqrt(eqVar) > 0 ? (eqPr - 0.065) / Math.sqrt(eqVar) : 0;
      setEqualWeightPoint({ return: eqPr, vol: Math.sqrt(eqVar), weights: eqWeights, sharpe: eqS });

      // Current
      let cPr = 0;
      let cVar = 0;
      const weightArray = tickers.map(t => weights[t] || 0);
      for(let i = 0; i < n; i++) {
        cPr += weightArray[i] * mu[i];
        for(let j = 0; j < n; j++) {
          cVar += weightArray[i] * weightArray[j] * covMatrix[i][j];
        }
      }
      const expectedCurrWeights: Record<string, number> = {};
      tickers.forEach((t, i) => expectedCurrWeights[t] = weightArray[i]);
      const curS = Math.sqrt(cVar) > 0 ? (cPr - 0.065) / Math.sqrt(cVar) : 0;
      setCurrentPoint({ return: cPr, vol: Math.sqrt(cVar), weights: expectedCurrWeights, sharpe: curS });

      setIsComputing(false);
    }, 100);

  }, [tickers, weights]);

  if (tickers.length < 2) {
    return (
      <div>
        <SectionHeader label="MODULE 09" title="Efficient Frontier" description="Select at least 2 assets." />
        <div style={{ padding: 20, color: 'var(--ink-muted)' }}>Need at least 2 assets to compute efficient frontier.</div>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        label="MODULE 09"
        title="Efficient Frontier"
        description="Markowitz optimization showing the risk-return tradeoff curve. Features long-only constraints and tangency portfolio (risk-free rate = 6.5%)."
      />

      {isComputing ? (
        <div style={{ height: '70vh', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulse 1.5s infinite opacity' }}>
          <div style={{ textAlign: 'center', color: 'var(--gold)', fontFamily: "'Playfair Display', serif", fontSize: 18 }}>
            Computing Optimal Portfolios...
            <div style={{ fontSize: 12, color: 'var(--ink-muted)', fontFamily: 'DM Sans', marginTop: 8 }}>Matrix Inversion & Lagrangian active</div>
          </div>
        </div>
      ) : (
        <>
          <FrontierChart 
            unconstrainedPoints={unconstrainedPoints}
            longOnlyPoints={longOnlyPoints}
            randomPoints={randomPoints}
            minVarPoint={minVarPoint}
            maxSharpePoint={maxSharpePoint}
            currentPoint={currentPoint}
            equalWeightPoint={equalWeightPoint}
            riskFreeRate={0.065}
            onPointClick={setSelectedPoint}
          />
          <PortfolioScatter
            minVarPoint={minVarPoint}
            maxSharpePoint={maxSharpePoint}
            equalWeightPoint={equalWeightPoint}
            selectedPoint={selectedPoint}
            onSelectRow={setSelectedPoint}
          />
        </>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}} />
    </div>
  );
}
