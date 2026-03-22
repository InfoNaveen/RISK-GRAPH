'use client';

import { useState, useEffect } from 'react';
import SectionHeader from '@/components/SectionHeader';
import McChart from '@/components/monte-carlo/McChart';
import MetricCard from '@/components/MetricCard';
import { runSimulation, computeVarMetrics } from '@/components/monte-carlo/PathSimulator';
import { usePortfolio } from '@/lib/PortfolioContext';
import { getVolatilities, stressCovariance } from '@/lib/math';
import type { SimulationResult, VarMetrics } from '@/lib/types';

export default function MonteCarloPage() {
  const { tickers, alpha, correlationMatrix, isAnalyzing } = usePortfolio();
  
  const [baselineSim, setBaselineSim] = useState<SimulationResult | null>(null);
  const [stressedSim, setStressedSim] = useState<SimulationResult | null>(null);
  const [baselineMetrics, setBaselineMetrics] = useState<VarMetrics | null>(null);
  const [stressedMetrics, setStressedMetrics] = useState<VarMetrics | null>(null);
  const [isRecalculating, setIsRecalculating] = useState(false);

  const initialValue = 1000000;
  const nSims = 5000;
  const horizon = 63; // 3 months roughly

  useEffect(() => {
    if (!tickers.length || !correlationMatrix?.length || isAnalyzing) return;
    
    setIsRecalculating(true);
    
    // Defer actual simulation to allow React to paint the 'Recalculating...' overlay
    const timer = setTimeout(() => {
      const vols = getVolatilities(tickers);
      
      const baselineCov = correlationMatrix.map((row, i) => 
        row.map((val, j) => vols[i] * val * vols[j])
      );
      
      const stressedCov = stressCovariance(alpha, vols, correlationMatrix);

      const weights = new Array(tickers.length).fill(1 / tickers.length);
      
      const base = runSimulation(tickers, weights, nSims, horizon, initialValue, baselineCov);
      const stress = runSimulation(tickers, weights, nSims, horizon, initialValue, stressedCov);
      
      setBaselineSim(base);
      setStressedSim(stress);
      
      setBaselineMetrics(computeVarMetrics(base, initialValue, horizon));
      setStressedMetrics(computeVarMetrics(stress, initialValue, horizon));
      setIsRecalculating(false);
    }, 50);

    return () => clearTimeout(timer);
  }, [tickers, alpha, correlationMatrix, isAnalyzing]);

  return (
    <div style={{ position: 'relative', minHeight: '100%' }}>
      <SectionHeader
        label="MODULE 03"
        title="Monte Carlo Simulation"
        description="Stochastic differential equations (GBM) for multivariate returns with Cholesky-decomposed covariance inputs."
      />

      {(isAnalyzing || isRecalculating) && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(250,248,244,0.8)',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 13,
          color: 'var(--ink-muted)'
        }}>
          <div className="spinner" style={{ marginBottom: 16 }} />
          Recalculating...
        </div>
      )}

      {!tickers.length && !isAnalyzing && (
        <div style={{ padding: 20, color: 'var(--ink-muted)' }}>
          Please select at least 1 asset to run Monte Carlo simulations.
        </div>
      )}

      {baselineMetrics && stressedMetrics && baselineSim && stressedSim && tickers.length > 0 && (
        <>
          {/* Main Chart */}
          <div style={{
            background: 'white',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '32px',
            marginBottom: 32,
          }}>
            <h3 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 22,
              fontWeight: 400,
              marginBottom: 32,
            }}>
              Core Simulation Results: Baseline vs Stressed Regime
            </h3>
            <McChart 
              baselineFinalValues={baselineSim.finalValues} 
              stressedFinalValues={stressedSim.finalValues}
              initialValue={initialValue} 
            />
          </div>

          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', marginBottom: 48 }}>
            <div style={{ flex: '1 1 45%' }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-muted)', marginBottom: 20 }}>
                Baseline Metrics (α=0)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <MetricCard label="95% Value at Risk" value={`₹${baselineMetrics.var95.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} color="var(--ink)" />
                <MetricCard label="95% Expected Shortfall" value={`₹${baselineMetrics.cvar95.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} color="var(--risk-red)" subtext="Avg loss beyond VaR" />
                <MetricCard label="Prob. of Loss" value={`${baselineMetrics.probLoss.toFixed(1)}%`} />
                <MetricCard label="Expected Return" value={`₹${baselineMetrics.expectedReturn.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} color="var(--risk-green)" />
              </div>
            </div>

            <div style={{ flex: '1 1 45%' }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-muted)', marginBottom: 20 }}>
                Stressed Metrics (α={alpha.toFixed(2)})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <MetricCard label="95% Value at Risk" value={`₹${stressedMetrics.var95.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} color="var(--ink)" />
                <MetricCard label="95% Expected Shortfall" value={`₹${stressedMetrics.cvar95.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} color="var(--risk-red)" subtext="Avg loss beyond VaR" />
                <MetricCard label="Prob. of Loss" value={`${stressedMetrics.probLoss.toFixed(1)}%`} />
                <MetricCard label="Expected Return" value={`₹${stressedMetrics.expectedReturn.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} color="var(--risk-green)" />
              </div>
            </div>
          </div>

          {/* Risk Metrics Table */}
          <div style={{ marginBottom: 48 }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, marginBottom: 24 }}>Risk Concentration Metrics</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
              <thead>
                <tr style={{ background: 'var(--surface)', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '16px', fontSize: 13, color: 'var(--ink-muted)' }}>Metric</th>
                  <th style={{ padding: '16px', fontSize: 13, color: 'var(--ink-muted)' }}>Baseline</th>
                  <th style={{ padding: '16px', fontSize: 13, color: 'var(--ink-muted)' }}>Stressed</th>
                  <th style={{ padding: '16px', fontSize: 13, color: 'var(--ink-muted)' }}>Delta</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: 14 }}>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '16px', fontWeight: 500 }}>VaR (95%)</td>
                  <td style={{ padding: '16px', fontFamily: 'JetBrains Mono' }}>₹{baselineMetrics.var95.toLocaleString()}</td>
                  <td style={{ padding: '16px', fontFamily: 'JetBrains Mono' }}>₹{stressedMetrics.var95.toLocaleString()}</td>
                  <td style={{ padding: '16px', color: 'var(--risk-red)', fontFamily: 'JetBrains Mono' }}>+{((stressedMetrics.var95 / (baselineMetrics.var95 || 1) - 1) * 100).toFixed(1)}%</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '16px', fontWeight: 500 }}>Expected Shortfall</td>
                  <td style={{ padding: '16px', fontFamily: 'JetBrains Mono' }}>₹{baselineMetrics.cvar95.toLocaleString()}</td>
                  <td style={{ padding: '16px', fontFamily: 'JetBrains Mono' }}>₹{stressedMetrics.cvar95.toLocaleString()}</td>
                  <td style={{ padding: '16px', color: 'var(--risk-red)', fontFamily: 'JetBrains Mono' }}>+{((stressedMetrics.cvar95 / (baselineMetrics.cvar95 || 1) - 1) * 100).toFixed(1)}%</td>
                </tr>
                <tr>
                  <td style={{ padding: '16px', fontWeight: 500 }}>Sharpe Ratio</td>
                  <td style={{ padding: '16px', fontFamily: 'JetBrains Mono' }}>{baselineMetrics.sharpeRatio.toFixed(2)}</td>
                  <td style={{ padding: '16px', fontFamily: 'JetBrains Mono' }}>{stressedMetrics.sharpeRatio.toFixed(2)}</td>
                  <td style={{ padding: '16px', color: 'var(--risk-red)', fontFamily: 'JetBrains Mono' }}>{-( (1 - stressedMetrics.sharpeRatio / (baselineMetrics.sharpeRatio || 1)) * 100).toFixed(1)}%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Diversification Analysis */}
          <div style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid var(--gold)', borderRadius: 12, padding: '32px' }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, marginBottom: 16 }}>Diversification Entropy Analysis</h3>
            <p style={{ fontSize: 15, color: 'var(--ink)', lineHeight: 1.7, maxWidth: 800 }}>
              Under baseline conditions, the portfolio exhibits a robust diversification structure with the effective number of bets approaching the asset count. 
              However, as the stress parameter α increases to <strong>{alpha.toFixed(2)}</strong>, the correlation structure collapses toward the first principal component. 
              The simulation shows a <strong>{((stressedMetrics.var95 / (baselineMetrics.var95 || 1) - 1) * 100).toFixed(0)}%</strong> expansion in tail risk, 
              as previously non-correlated assets begin to move in lock-step, effectively nullifying the protection of the traditional efficient frontier.
            </p>
          </div>
        </>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .spinner {
          width: 24px;
          height: 24px;
          border: 3px solid var(--border);
          border-top-color: var(--gold);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
