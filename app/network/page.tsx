'use client';

import { useMemo } from 'react';
import SectionHeader from '@/components/SectionHeader';
import MetricCard from '@/components/MetricCard';
import ForceGraph from '@/components/network/ForceGraph';
import CentralityTable from '@/components/network/CentralityTable';
import GsviGauge from '@/components/network/GsviGauge';
import {
  eigenvectorCentrality,
  betweennessCentrality,
  computeDegree,
  computeWeightedDegree,
  computeGSVI,
  networkDensity,
  spectralRiskRatio,
} from '@/lib/math';
import { type GraphNode, type GraphEdge, type CentralityResult } from '@/lib/types';
import { usePortfolio } from '@/lib/PortfolioContext';

function spectralColor(v: number): string {
  if (v < 0.25) return 'var(--risk-green)';
  if (v <= 0.4) return 'var(--gold)';
  return 'var(--risk-red)';
}

function getAlphaHint(alpha: number): string {
  if (alpha < 0.2) return 'Assets behaving independently — low systemic risk';
  if (alpha < 0.5) return 'Moderate stress — correlations increasing';
  if (alpha < 0.8) return 'High stress — diversification breaking down';
  return '⚠ Crisis regime — herding collapse, all assets co-moving';
}

function getHerdingRisk(alpha: number): { label: string; color: string } {
  if (alpha < 0.25) return { label: 'LOW', color: 'var(--risk-green)' };
  if (alpha < 0.5) return { label: 'MODERATE', color: 'var(--gold)' };
  if (alpha < 0.75) return { label: 'HIGH', color: 'var(--gold)' };
  return { label: '⚠ CRITICAL', color: 'var(--risk-red)' };
}

export default function NetworkPage() {
  const { tickers, correlationMatrix, isAnalyzing, alpha, setAlpha, assetVols, portfolioWeights } = usePortfolio();

  const { nodes, edges, centralityData, gsvi, spectralRR, density, maxEigAsset, maxEigScore } = useMemo(() => {
    if (!correlationMatrix || correlationMatrix.length === 0 || tickers.length === 0) {
      return { nodes: [], edges: [], centralityData: [], gsvi: 0, spectralRR: 0, density: 0, maxEigAsset: '', maxEigScore: 0 };
    }

    const n = tickers.length;
    if (correlationMatrix.length !== n) {
      return { nodes: [], edges: [], centralityData: [], gsvi: 0, spectralRR: 0, density: 0, maxEigAsset: '', maxEigScore: 0 };
    }

    const eigCent = eigenvectorCentrality(correlationMatrix);
    const betCent = betweennessCentrality(correlationMatrix);
    const degrees = computeDegree(correlationMatrix, 0.4);
    const weightedDeg = computeWeightedDegree(correlationMatrix);

    const sortedIndices = eigCent
      .map((v, i) => ({ v, i }))
      .sort((a, b) => b.v - a.v)
      .map(x => x.i);

    const riskTiers: Record<number, 'Systemic' | 'Elevated' | 'Peripheral'> = {};
    sortedIndices.forEach((idx, rank) => {
      if (rank < Math.max(1, Math.floor(n * 0.3))) riskTiers[idx] = 'Systemic';
      else if (rank < Math.max(2, Math.floor(n * 0.6))) riskTiers[idx] = 'Elevated';
      else riskTiers[idx] = 'Peripheral';
    });

    const nodes: GraphNode[] = tickers.map((name, i) => ({
      id: name,
      eigenvectorCentrality: eigCent[i] || 0,
      degree: degrees[i] || 0,
      betweennessCentrality: betCent[i] || 0,
    }));

    const edges: GraphEdge[] = [];
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (Math.abs(correlationMatrix[i][j]) > 0.01) {
          edges.push({
            source: tickers[i],
            target: tickers[j],
            weight: correlationMatrix[i][j],
          });
        }
      }
    }

    const centralityData: CentralityResult[] = tickers.map((name, i) => ({
      asset: name,
      degree: degrees[i] || 0,
      eigenvectorCentrality: eigCent[i] || 0,
      betweennessCentrality: betCent[i] || 0,
      weightedDegree: weightedDeg[i] || 0,
      riskTier: riskTiers[i] || 'Peripheral',
    }));

    const gsvi = computeGSVI(eigCent, betCent);
    const spectralRR = spectralRiskRatio(correlationMatrix);
    const density = networkDensity(correlationMatrix, 0.4);

    const maxIdx = eigCent.indexOf(Math.max(...eigCent));
    const maxEigAsset = tickers[maxIdx] || '';
    const maxEigScore = eigCent[maxIdx] || 0;

    return { nodes, edges, centralityData, gsvi, spectralRR, density, maxEigAsset, maxEigScore };
  }, [tickers, correlationMatrix]);

  /* ── Alpha-dependent stats ───────────────────────────────────────── */
  const alphaStats = useMemo(() => {
    if (!correlationMatrix || correlationMatrix.length === 0) {
      return { effectiveAvgCorr: 0, diversificationRatio: 0 };
    }

    const n = correlationMatrix.length;

    // Effective average correlation
    let corrSum = 0;
    let corrCount = 0;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const baseCorr = Math.abs(correlationMatrix[i][j]);
        const effectiveCorr = (1 - alpha) * baseCorr + alpha * 1.0;
        corrSum += effectiveCorr;
        corrCount++;
      }
    }
    const effectiveAvgCorr = corrCount > 0 ? corrSum / corrCount : 0;

    // Diversification Ratio: DR = Σwᵢσᵢ / σ_p
    let dr = 1;
    if (assetVols && portfolioWeights && tickers.length > 0) {
      const w: number[] = tickers.map(t => portfolioWeights[t] || (1 / tickers.length));
      const sigma: number[] = tickers.map(t => assetVols[t] || 0.2);

      // Σwᵢσᵢ
      const weightedSigmaSum = w.reduce((s, wi, i) => s + wi * sigma[i], 0);

      // Build stressed correlation matrix
      const stressCov: number[][] = [];
      for (let i = 0; i < n; i++) {
        stressCov[i] = [];
        for (let j = 0; j < n; j++) {
          const baseCorr = correlationMatrix[i][j];
          const effCorr = (1 - alpha) * baseCorr + alpha * 1.0;
          stressCov[i][j] = effCorr * sigma[i] * sigma[j];
        }
      }

      // σ_p = sqrt(w' Σ w)
      let portfolioVar = 0;
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          portfolioVar += w[i] * w[j] * stressCov[i][j];
        }
      }
      const portfolioSigma = Math.sqrt(Math.max(0, portfolioVar));
      dr = portfolioSigma > 0 ? weightedSigmaSum / portfolioSigma : 1;
    }

    return { effectiveAvgCorr, diversificationRatio: dr };
  }, [correlationMatrix, alpha, assetVols, portfolioWeights, tickers]);

  const herding = getHerdingRisk(alpha);

  return (
    <div style={{ opacity: isAnalyzing ? 0.5 : 1, transition: 'opacity 0.2s', pointerEvents: isAnalyzing ? 'none' : 'auto' }}>
      <SectionHeader
        label="MODULE 01"
        title="Network Graph"
        description="Graph-theoretic systemic risk analysis via correlation network topology, centrality metrics, and spectral decomposition."
      />

      {tickers.length < 2 && (
        <div style={{ padding: 20, color: 'var(--risk-red)', background: 'rgba(192,57,43,0.1)', borderRadius: 8, marginBottom: 24 }}>
          Please select at least 2 assets to render the network graph.
        </div>
      )}

      {tickers.length >= 2 && (
        <>
          {/* ── Stress Intensity Control Bar ─────────────────────────── */}
          <div style={{
            width: '100%',
            padding: '16px 20px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 4,
            marginBottom: 24,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--ink-muted)',
                whiteSpace: 'nowrap',
              }}>
                Stress Intensity
              </span>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 14,
                color: 'var(--gold)',
                minWidth: 40,
              }}>
                α = {alpha.toFixed(2)}
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={alpha}
                onChange={e => setAlpha(parseFloat(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--gold)' }}
              />
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                color: 'var(--ink-muted)',
              }}>
                1.0
              </span>
            </div>
            <div style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              color: 'var(--ink-muted)',
              fontStyle: 'italic',
              marginTop: 6,
            }}>
              {getAlphaHint(alpha)}
            </div>
          </div>

          {/* ── Graph + Metrics Layout ───────────────────────────────── */}
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            {/* Left: Force Graph */}
            <div style={{
              flex: '1 1 60%',
              minWidth: 400,
              border: '1px solid var(--border)',
              borderRadius: 8,
              overflow: 'hidden',
              background: 'white',
            }}>
              <ForceGraph nodes={nodes} edges={edges} alpha={alpha} />
            </div>

            {/* Right: Metrics Panel */}
            <div style={{
              flex: '1 1 30%',
              minWidth: 260,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}>
              <GsviGauge gsvi={gsvi} />
              <MetricCard
                label="Spectral Risk Ratio"
                value={spectralRR.toFixed(4)}
                color={spectralColor(spectralRR)}
                subtext="λ_max / n — concentration of systemic risk"
              />
              <MetricCard
                label="Network Density"
                value={density.toFixed(4)}
                subtext="Fraction of edges with |ρ| > 0.4"
              />
              <MetricCard
                label="Max Eigenvector Centrality"
                value={maxEigScore.toFixed(4)}
                color="var(--risk-red)"
                subtext={`${maxEigAsset} — most systemically important`}
              />
            </div>
          </div>

          {/* ── Alpha Stats Panel ────────────────────────────────────── */}
          <div style={{
            display: 'flex',
            alignItems: 'stretch',
            gap: 0,
            marginTop: 20,
            border: '1px solid var(--border)',
            borderRadius: 4,
            background: 'var(--surface)',
            overflow: 'hidden',
          }}>
            {/* Effective Avg Correlation */}
            <div style={{ flex: 1, padding: '12px 16px', textAlign: 'center' }}>
              <div style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--ink-muted)',
                marginBottom: 4,
              }}>
                Effective Avg. Correlation
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 13,
                color: alphaStats.effectiveAvgCorr > 0.7 ? 'var(--risk-red)' : 'var(--gold)',
              }}>
                {alphaStats.effectiveAvgCorr.toFixed(3)}
              </div>
            </div>

            {/* Divider */}
            <div style={{ width: 1, background: 'var(--border)' }} />

            {/* Diversification Ratio */}
            <div style={{ flex: 1, padding: '12px 16px', textAlign: 'center' }}>
              <div style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--ink-muted)',
                marginBottom: 4,
              }}>
                Diversification Ratio
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 13,
                color: alphaStats.diversificationRatio < 1.1 ? 'var(--risk-red)' : 'var(--gold)',
              }}>
                {alphaStats.diversificationRatio.toFixed(3)}
              </div>
            </div>

            {/* Divider */}
            <div style={{ width: 1, background: 'var(--border)' }} />

            {/* Herding Risk */}
            <div style={{ flex: 1, padding: '12px 16px', textAlign: 'center' }}>
              <div style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--ink-muted)',
                marginBottom: 4,
              }}>
                Herding Risk
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 13,
                color: herding.color,
                fontWeight: alpha >= 0.75 ? 700 : 400,
              }}>
                {herding.label}
              </div>
            </div>
          </div>

          {/* Centrality Table */}
          <div style={{ marginTop: 40 }}>
            <h3 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 20,
              fontWeight: 400,
              marginBottom: 16,
            }}>
              Centrality Analysis
            </h3>
            <div style={{
              border: '1px solid var(--border)',
              borderRadius: 4,
              overflow: 'hidden',
            }}>
              <CentralityTable data={centralityData} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
