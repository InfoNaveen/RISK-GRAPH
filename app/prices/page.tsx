'use client';

import { useState, useMemo } from 'react';
import SectionHeader from '@/components/SectionHeader';
import AssetSelector from '@/components/prices/AssetSelector';
import PriceChart from '@/components/prices/PriceChart';
import PriceTable from '@/components/prices/PriceTable';
import ContagionHeatmap from '@/components/stress/ContagionHeatmap';
import { ASSET_NAMES } from '@/lib/types';
import { SYNTHETIC_PRICES } from '@/lib/priceData';

export default function PriceHistoryPage() {
  const [selectedAssets, setSelectedAssets] = useState<string[]>([...ASSET_NAMES]);
  const [normalized, setNormalized] = useState(false);
  const [activeTab, setActiveTab] = useState<'chart' | 'correlation'>('chart');

  // Compute empirical correlation matrix from log returns
  const correlationMatrix = useMemo(() => {
    if (selectedAssets.length === 0) return [];
    
    // Calculate returns for selected assets
    const returns: number[][] = selectedAssets.map(asset => {
      const prices = SYNTHETIC_PRICES[asset];
      const ret = [];
      for (let i = 1; i < prices.length; i++) {
        ret.push(Math.log(prices[i] / prices[i - 1]));
      }
      return ret;
    });

    const numAssets = returns.length;
    const numSteps = returns[0].length;
    
    // Means
    const means = returns.map(retArr => retArr.reduce((a, b) => a + b, 0) / numSteps);
    
    // Standard deviations
    const stds = returns.map((retArr, idx) => {
      const v = retArr.reduce((a, b) => a + Math.pow(b - means[idx], 2), 0) / (numSteps - 1);
      return Math.sqrt(v);
    });

    // Correlation
    const matrix: number[][] = [];
    for (let i = 0; i < numAssets; i++) {
      matrix[i] = [];
      for (let j = 0; j < numAssets; j++) {
        if (i === j) {
          matrix[i][j] = 1.0;
        } else {
          let cov = 0;
          for (let t = 0; t < numSteps; t++) {
            cov += (returns[i][t] - means[i]) * (returns[j][t] - means[j]);
          }
          cov /= (numSteps - 1);
          matrix[i][j] = (stds[i] > 0 && stds[j] > 0) ? cov / (stds[i] * stds[j]) : 0;
        }
      }
    }

    return matrix;
  }, [selectedAssets]);

  return (
    <div>
      <SectionHeader
        label="MODULE 07"
        title="Price History"
        description="Simulated 252-day historical price sequences generated via Geometric Brownian Motion with induced Cholesky correlation constraints."
      />

      <div style={{ marginBottom: 24 }}>
        <AssetSelector selected={selectedAssets} onChange={setSelectedAssets} />
      </div>

      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '24px',
        marginBottom: 32,
      }}>
        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 24 }}>
          <button
            onClick={() => setActiveTab('chart')}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              fontSize: 16,
              fontFamily: "'Playfair Display', serif",
              color: activeTab === 'chart' ? 'var(--ink)' : 'var(--ink-muted)',
              cursor: 'pointer',
              fontWeight: activeTab === 'chart' ? 700 : 400,
              borderBottom: activeTab === 'chart' ? '2px solid var(--gold)' : '2px solid transparent',
              paddingBottom: 8,
              marginBottom: -17,
            }}
          >
            Price Chart
          </button>
          <button
            onClick={() => setActiveTab('correlation')}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              fontSize: 16,
              fontFamily: "'Playfair Display', serif",
              color: activeTab === 'correlation' ? 'var(--ink)' : 'var(--ink-muted)',
              cursor: 'pointer',
              fontWeight: activeTab === 'correlation' ? 700 : 400,
              borderBottom: activeTab === 'correlation' ? '2px solid var(--gold)' : '2px solid transparent',
              paddingBottom: 8,
              marginBottom: -17,
            }}
          >
            Correlation Matrix
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'chart' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button
                onClick={() => setNormalized(!normalized)}
                className="btn-outline"
                style={{ padding: '6px 12px', fontSize: 11 }}
              >
                {normalized ? 'Show Absolute (₹)' : 'Show Normalized (Base 100)'}
              </button>
            </div>
            <PriceChart selectedAssets={selectedAssets} normalized={normalized} />
          </div>
        )}

        {activeTab === 'correlation' && (
          <div style={{ background: 'white', padding: 24, borderRadius: 8, border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 14, marginBottom: 8, color: 'var(--ink)' }}>Empirical Correlation (Log Returns)</h3>
            <p style={{ fontSize: 13, color: 'var(--ink-muted)', marginBottom: 24 }}>
              Computed directly from the 252-day synthetic sequences. Note how this roughly matches the static assumption matrix used to seed the Cholesky decomposition.
            </p>
            {selectedAssets.length > 0 ? (
              <ContagionHeatmap matrix={correlationMatrix} assets={selectedAssets} />
            ) : (
              <div style={{ color: 'var(--ink-muted)' }}>No assets selected.</div>
            )}
          </div>
        )}
      </div>

      <SectionHeader
        label="DATA TABLE"
        title="Performance Metrics"
        description="Comprehensive daily return statistics based on trailing historical sequence."
      />
      
      <PriceTable selectedAssets={selectedAssets} />
    </div>
  );
}
