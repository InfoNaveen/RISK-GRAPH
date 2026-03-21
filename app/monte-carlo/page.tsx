'use client';

import { useState, useCallback, useMemo } from 'react';
import SectionHeader from '@/components/SectionHeader';
import McChart from '@/components/monte-carlo/McChart';
import VarReadout from '@/components/monte-carlo/VarReadout';
import { runSimulation, computeVarMetrics } from '@/components/monte-carlo/PathSimulator';
import { ASSET_NAMES, type AssetName } from '@/lib/types';
import type { SimulationResult, VarMetrics } from '@/lib/types';
import { formatINR } from '@/lib/math';

const HORIZONS = [
  { label: '21 days (1M)', value: 21 },
  { label: '63 days (3M)', value: 63 },
  { label: '126 days (6M)', value: 126 },
  { label: '252 days (1Y)', value: 252 },
];

const SIM_COUNTS = [1000, 5000, 10000];

export default function MonteCarloPage() {
  const [selectedAssets, setSelectedAssets] = useState<AssetName[]>([...ASSET_NAMES]);
  const [weights, setWeights] = useState<number[]>(new Array(ASSET_NAMES.length).fill(10));
  const [nSims, setNSims] = useState(5000);
  const [horizon, setHorizon] = useState(63);
  const [initialValue, setInitialValue] = useState(1000000);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [varMetrics, setVarMetrics] = useState<VarMetrics | null>(null);
  const [running, setRunning] = useState(false);

  const normalizedWeights = useMemo(() => {
    const activeWeights = ASSET_NAMES.map((name, i) =>
      selectedAssets.includes(name) ? weights[i] : 0
    );
    const sum = activeWeights.reduce((s, w) => s + w, 0);
    return sum > 0 ? activeWeights.map(w => w / sum) : activeWeights;
  }, [selectedAssets, weights]);

  const handleToggleAsset = (asset: AssetName) => {
    setSelectedAssets(prev =>
      prev.includes(asset) ? prev.filter(a => a !== asset) : [...prev, asset]
    );
  };

  const handleWeightChange = (index: number, value: number) => {
    const newWeights = [...weights];
    newWeights[index] = value;
    setWeights(newWeights);
  };

  const handleRun = useCallback(() => {
    setRunning(true);
    // Use setTimeout to allow spinner to render
    setTimeout(() => {
      const active = selectedAssets;
      const activeWeights = active.map(a => {
        const i = ASSET_NAMES.indexOf(a);
        return normalizedWeights[i];
      });

      const sim = runSimulation(active, activeWeights, nSims, horizon, initialValue);
      const metrics = computeVarMetrics(sim, initialValue, horizon);

      setResult(sim);
      setVarMetrics(metrics);
      setRunning(false);
    }, 50);
  }, [selectedAssets, normalizedWeights, nSims, horizon, initialValue]);

  const handleExportCSV = () => {
    if (!result) return;
    const headers = ['Day', 'P5', 'Median', 'P95'].join(',');
    const rows = result.percentile5.map((_, t) =>
      [t, result.percentile5[t].toFixed(2), result.percentile50[t].toFixed(2), result.percentile95[t].toFixed(2)].join(',')
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'monte_carlo_results.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <SectionHeader
        label="MODULE 02"
        title="Monte Carlo Simulation"
        description="Geometric Brownian Motion portfolio simulation with Cholesky-correlated asset paths, VaR, CVaR, and Sharpe analysis."
      />

      {/* Controls Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 24,
        padding: '20px 24px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        marginBottom: 24,
        alignItems: 'flex-start',
      }}>
        {/* Asset selector */}
        <div style={{ flex: '1 1 auto', minWidth: 300 }}>
          <label style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-muted)', display: 'block', marginBottom: 8 }}>
            Assets
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {ASSET_NAMES.map(name => (
              <label key={name} style={{
                display: 'flex', alignItems: 'center', gap: 4, fontSize: 12,
                cursor: 'pointer', color: selectedAssets.includes(name) ? 'var(--ink)' : 'var(--ink-muted)',
              }}>
                <input
                  type="checkbox"
                  checked={selectedAssets.includes(name)}
                  onChange={() => handleToggleAsset(name)}
                  style={{ accentColor: 'var(--gold)' }}
                />
                {name}
              </label>
            ))}
          </div>
        </div>

        {/* Simulation params */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-muted)', display: 'block', marginBottom: 4 }}>
              Simulations
            </label>
            <select value={nSims} onChange={e => setNSims(Number(e.target.value))}>
              {SIM_COUNTS.map(n => (<option key={n} value={n}>{n.toLocaleString()}</option>))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-muted)', display: 'block', marginBottom: 4 }}>
              Horizon
            </label>
            <select value={horizon} onChange={e => setHorizon(Number(e.target.value))}>
              {HORIZONS.map(h => (<option key={h.value} value={h.value}>{h.label}</option>))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-muted)', display: 'block', marginBottom: 4 }}>
              Initial Value
            </label>
            <input
              type="number"
              value={initialValue}
              onChange={e => setInitialValue(Number(e.target.value))}
              style={{ width: 130 }}
            />
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <button className="btn-primary" onClick={handleRun} disabled={running || selectedAssets.length === 0}>
            {running ? 'Running...' : 'Run Simulation'}
          </button>
          <button className="btn-outline" onClick={handleExportCSV} disabled={!result}>
            Export CSV
          </button>
        </div>
      </div>

      {/* Weight Sliders */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: 12,
        marginBottom: 24,
      }}>
        {ASSET_NAMES.map((name, i) => {
          if (!selectedAssets.includes(name)) return null;
          return (
            <div key={name} style={{
              padding: '10px 14px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 4,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 500 }}>{name}</span>
                <span className="font-num" style={{ fontSize: 11, color: 'var(--gold)' }}>
                  {(normalizedWeights[i] * 100).toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={weights[i]}
                onChange={e => handleWeightChange(i, Number(e.target.value))}
              />
            </div>
          );
        })}
      </div>

      {/* Loading Spinner */}
      {running && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 400,
        }}>
          <div className="spinner" />
        </div>
      )}

      {/* Chart */}
      {result && !running && (
        <McChart result={result} nSims={nSims} horizonDays={horizon} />
      )}

      {/* VaR Metrics */}
      {varMetrics && !running && (
        <div style={{ marginTop: 24 }}>
          <VarReadout metrics={varMetrics} initialValue={initialValue} />
        </div>
      )}
    </div>
  );
}
