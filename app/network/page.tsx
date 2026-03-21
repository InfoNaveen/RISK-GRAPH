'use client';

import { useMemo } from 'react';
import SectionHeader from '@/components/SectionHeader';
import MetricCard from '@/components/MetricCard';
import ForceGraph from '@/components/network/ForceGraph';
import CentralityTable from '@/components/network/CentralityTable';
import GsviGauge from '@/components/network/GsviGauge';
import {
  CORRELATION_MATRIX,
  eigenvectorCentrality,
  betweennessCentrality,
  computeDegree,
  computeWeightedDegree,
  computeGSVI,
  networkDensity,
  spectralRiskRatio,
} from '@/lib/math';
import { ASSET_NAMES, type GraphNode, type GraphEdge, type CentralityResult } from '@/lib/types';

function spectralColor(v: number): string {
  if (v < 0.25) return 'var(--risk-green)';
  if (v <= 0.4) return 'var(--gold)';
  return 'var(--risk-red)';
}

export default function NetworkPage() {
  const { nodes, edges, centralityData, gsvi, spectralRR, density, maxEigAsset, maxEigScore } = useMemo(() => {
    const eigCent = eigenvectorCentrality(CORRELATION_MATRIX);
    const betCent = betweennessCentrality(CORRELATION_MATRIX);
    const degrees = computeDegree(CORRELATION_MATRIX, 0.4);
    const weightedDeg = computeWeightedDegree(CORRELATION_MATRIX);

    // Sort by eigenvector centrality for risk tiers
    const sortedIndices = eigCent
      .map((v, i) => ({ v, i }))
      .sort((a, b) => b.v - a.v)
      .map(x => x.i);

    const riskTiers: Record<number, 'Systemic' | 'Elevated' | 'Peripheral'> = {};
    sortedIndices.forEach((idx, rank) => {
      if (rank < 3) riskTiers[idx] = 'Systemic';
      else if (rank < 6) riskTiers[idx] = 'Elevated';
      else riskTiers[idx] = 'Peripheral';
    });

    const nodes: GraphNode[] = ASSET_NAMES.map((name, i) => ({
      id: name,
      eigenvectorCentrality: eigCent[i],
      degree: degrees[i],
      betweennessCentrality: betCent[i],
    }));

    const edges: GraphEdge[] = [];
    for (let i = 0; i < ASSET_NAMES.length; i++) {
      for (let j = i + 1; j < ASSET_NAMES.length; j++) {
        if (Math.abs(CORRELATION_MATRIX[i][j]) > 0.01) {
          edges.push({
            source: ASSET_NAMES[i],
            target: ASSET_NAMES[j],
            weight: CORRELATION_MATRIX[i][j],
          });
        }
      }
    }

    const centralityData: CentralityResult[] = ASSET_NAMES.map((name, i) => ({
      asset: name,
      degree: degrees[i],
      eigenvectorCentrality: eigCent[i],
      betweennessCentrality: betCent[i],
      weightedDegree: weightedDeg[i],
      riskTier: riskTiers[i],
    }));

    const gsvi = computeGSVI(eigCent, betCent);
    const spectralRR = spectralRiskRatio(CORRELATION_MATRIX);
    const density = networkDensity(CORRELATION_MATRIX, 0.4);

    const maxIdx = eigCent.indexOf(Math.max(...eigCent));
    const maxEigAsset = ASSET_NAMES[maxIdx];
    const maxEigScore = eigCent[maxIdx];

    return { nodes, edges, centralityData, gsvi, spectralRR, density, maxEigAsset, maxEigScore };
  }, []);

  return (
    <div>
      <SectionHeader
        label="MODULE 01"
        title="Network Graph"
        description="Graph-theoretic systemic risk analysis via correlation network topology, centrality metrics, and spectral decomposition."
      />

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
          <ForceGraph nodes={nodes} edges={edges} />
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
    </div>
  );
}
