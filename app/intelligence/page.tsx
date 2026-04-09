'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, Legend,
} from 'recharts';
import { engineerFeatures } from '@/lib/data/features';
import { trainHMM, viterbi, REGIME_LABELS, REGIME_COLORS } from '@/lib/ai/hmm';
import { kMeansPlusPlus } from '@/lib/ai/kmeans';
import { isolationForest } from '@/lib/ai/isolation-forest';
import { olsRegression } from '@/lib/ai/regression';
import type { AssetData } from '@/lib/data/ingestion';
import type { ScanResult } from '@/lib/security/prompt-guard';

interface PipelineState {
  loading: boolean;
  pricesLoaded: boolean;
  hmmDone: boolean;
  clustersDone: boolean;
  anomalyDone: boolean;
  olsDone: boolean;
  dataSource: 'live' | 'synthetic' | 'unknown';
  timestamp: string;
}

interface RegimeDataPoint {
  date: string;
  regime: number;
  logReturn: number;
}

interface ClusterAsset {
  symbol: string;
  cluster: number;
  vol: number;
  silhouette: number;
}

export default function IntelligencePage() {
  const [pipeline, setPipeline] = useState<PipelineState>({
    loading: true,
    pricesLoaded: false,
    hmmDone: false,
    clustersDone: false,
    anomalyDone: false,
    olsDone: false,
    dataSource: 'unknown',
    timestamp: '',
  });

  const [currentRegime, setCurrentRegime] = useState<number>(1);
  const [anomalyCount, setAnomalyCount] = useState<number>(0);
  const [rSquared, setRSquared] = useState<number>(0);
  const [regimeData, setRegimeData] = useState<RegimeDataPoint[]>([]);
  const [regimeCounts, setRegimeCounts] = useState<number[]>([0, 0, 0]);
  const [clusterAssets, setClusterAssets] = useState<ClusterAsset[]>([]);
  const [narrative, setNarrative] = useState<string>('');
  const [analystLoading, setAnalystLoading] = useState(false);
  const [analystQuery, setAnalystQuery] = useState('');
  const [securityBadge, setSecurityBadge] = useState<{ scanned: boolean; safe: boolean; pattern?: string }>({
    scanned: false,
    safe: true,
  });

  const contextRef = useRef<Record<string, unknown>>({});

  const runPipeline = useCallback(async () => {
    let latestRegime = 1;
    let latestAnomalyCount = 0;
    let latestR2 = 0;

    try {
      // Try live data with 8 second timeout — fallback to 
      // synthetic if rate limited or unavailable
      let assets: AssetData[] = [];
      let hasLive = false;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const res = await fetch('/api/prices', { 
          signal: controller.signal 
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const json: { data: AssetData[]; timestamp: string } = 
            await res.json();
          // Only use assets that actually have price data
          const liveAssets = json.data.filter(
            (a) => a.prices && a.prices.length > 10
          );
          if (liveAssets.length >= 3) {
            assets = json.data;
            hasLive = json.data.some(
              (a) => a.source === 'live' && a.prices.length > 0
            );
          }
        }
      } catch {
        // Timeout or network error — fall through to synthetic
      }

      // If live data failed or insufficient — generate synthetic
      // GBM prices so ML models always have real data to run on
      if (assets.length === 0 || 
          assets.every((a) => a.prices.length < 10)) {
        const syntheticSymbols = [
          'RELIANCE','TCS','HDFCBANK','INFY','ICICIBANK',
          'AXISBANK','SBIN','WIPRO','LT','MARUTI'
        ];
        // Starting prices approximate NSE FY2025-26 values
        const startPrices: Record<string, number> = {
          RELIANCE:2850, TCS:3920, HDFCBANK:1680, INFY:1540,
          ICICIBANK:1220, AXISBANK:1080, SBIN:780, WIPRO:480,
          LT:3450, MARUTI:12200
        };
        // Deterministic GBM using seeded LCG (same seed as 
        // priceData.ts to maintain consistency)
        let seed = 42;
        const lcg = () => {
          seed = (1664525 * seed + 1013904223) & 0xffffffff;
          return (seed >>> 0) / 0xffffffff;
        };
        const gauss = () => {
          const u = lcg() || 1e-10;
          const v = lcg();
          return Math.sqrt(-2 * Math.log(u)) * Math.cos(2*Math.PI*v);
        };

        assets = syntheticSymbols.map((symbol) => {
          const mu = 0.0008;
          const sigma = 0.018;
          const S0 = startPrices[symbol] ?? 1000;
          const prices = [];
          let S = S0;
          // Generate 252 trading days
          const startDate = new Date('2024-04-01');
          for (let i = 0; i < 252; i++) {
            S = S * Math.exp(
              (mu - 0.5 * sigma * sigma) + sigma * gauss()
            );
            const d = new Date(startDate);
            d.setDate(d.getDate() + i);
            prices.push({
              date: d.toISOString().slice(0, 10),
              close: Math.round(S * 100) / 100,
              volume: Math.floor(1000000 + lcg() * 5000000),
              high: Math.round(S * 1.02 * 100) / 100,
              low: Math.round(S * 0.98 * 100) / 100,
            });
          }
          return { symbol, source: 'synthetic' as const, prices };
        });
        hasLive = false;
      }

      setPipeline((p) => ({
        ...p,
        pricesLoaded: true,
        dataSource: hasLive ? 'live' : 'synthetic',
        timestamp: new Date().toISOString(),
      }));

      // Get first asset with prices for HMM
      const primaryAsset = assets.find((a) => a.prices.length > 10);
      const closePrices = primaryAsset ? primaryAsset.prices.map((p) => p.close) : [];

      // Compute log returns
      const logReturns: number[] = [];
      for (let i = 1; i < closePrices.length; i++) {
        const prev = closePrices[i - 1] || 1;
        logReturns.push(Math.log((closePrices[i] || 1) / prev));
      }

      // HMM
      if (logReturns.length > 10) {
        const params = trainHMM(logReturns);
        const states = viterbi(logReturns, params);
        setCurrentRegime(states[states.length - 1] ?? 1);
        latestRegime = states[states.length - 1] ?? 1;

        const dates = primaryAsset?.prices.slice(1).map((p) => p.date) || [];
        const rd: RegimeDataPoint[] = states.map((regime, i) => ({
          date: dates[i] || `Day ${i}`,
          regime,
          logReturn: logReturns[i],
        }));
        setRegimeData(rd);

        const counts = [0, 0, 0];
        for (const s of states) counts[s]++;
        setRegimeCounts(counts);
      }
      setPipeline((p) => ({ ...p, hmmDone: true }));

      // Feature Engineering for all assets
      const featureVectors: number[][] = [];
      const assetLabels: string[] = [];
      const assetVols: number[] = [];

      for (const asset of assets) {
        if (asset.prices.length < 10) continue;
        const prices = asset.prices.map((p) => p.close);
        const features = engineerFeatures(prices);
        featureVectors.push([
          features.annualizedReturn || 0,
          features.annualizedVolatility || 0,
          features.sharpeProxy || 0,
          features.maxDrawdown || 0,
          features.skewness || 0,
          features.kurtosis || 0,
        ]);
        assetLabels.push(asset.symbol.replace('.BSE', ''));
        assetVols.push(features.annualizedVolatility || 0);
      }

      // K-Means Clustering
      if (featureVectors.length >= 3) {
        const kResult = kMeansPlusPlus(featureVectors, 3);
        const ca: ClusterAsset[] = assetLabels.map((sym, i) => ({
          symbol: sym,
          cluster: kResult.labels[i],
          vol: assetVols[i],
          silhouette: kResult.silhouette,
        }));
        setClusterAssets(ca);
      }
      setPipeline((p) => ({ ...p, clustersDone: true }));

      // Isolation Forest
      if (featureVectors.length > 0) {
        const ifoResult = isolationForest(featureVectors);
        const count = ifoResult.anomalyFlags.filter(Boolean).length;
        setAnomalyCount(count);
        latestAnomalyCount = count;
      }
      setPipeline((p) => ({ ...p, anomalyDone: true }));

      // OLS Regression
      if (logReturns.length > 30) {
        const rollingVol: number[] = [];
        for (let i = 0; i < logReturns.length; i++) {
          if (i < 20) {
            rollingVol.push(0);
          } else {
            const window = logReturns.slice(i - 20, i);
            const m = window.reduce((a, b) => a + b, 0) / (window.length || 1);
            const v = window.reduce((a, b) => a + (b - m) ** 2, 0) / (window.length - 1 || 1);
            rollingVol.push(Math.sqrt(v));
          }
        }

        const X: number[][] = [];
        const y: number[] = [];
        for (let i = 22; i < logReturns.length; i++) {
          X.push([
            rollingVol[i - 1],
            rollingVol[i - 2],
            logReturns[i - 1],
            0.5,
            0.3,
          ]);
          y.push(rollingVol[i]);
        }

        if (X.length > 5) {
          const olsResult = olsRegression(X, y);
          setRSquared(olsResult.rSquared);
          latestR2 = olsResult.rSquared;
        }
      }
      setPipeline((p) => ({ ...p, olsDone: true, loading: false }));

      // Store context using LOCAL variables not stale state
      // These are the actual computed values from this pipeline run
      contextRef.current = {
        regime: REGIME_LABELS[latestRegime],
        anomalyCount: latestAnomalyCount,
        rSquaredValue: latestR2,
        assetCount: assets.length,
        dataSource: hasLive ? 'live' : 'synthetic',
        assetsAnalyzed: assetLabels.join(', '),
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      console.error('Pipeline error:', err instanceof Error ? err.message : 'Unknown');
      setPipeline((p) => ({ ...p, loading: false }));
    }
  }, []);

  useEffect(() => {
    runPipeline();
  }, [runPipeline]);

  const handleAnalyst = async () => {
    if (!analystQuery.trim()) return;
    setAnalystLoading(true);
    setSecurityBadge({ scanned: false, safe: true });
    setNarrative('');

    try {
      const res = await fetch('/api/analyst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userQuery: analystQuery,
          portfolioContext: {
            ...contextRef.current,
            clusterCount: clusterAssets.length,
            clusterBreakdown: clusterAssets.map(a => 
              `${a.symbol}:Cluster${a.cluster}`
            ).join(', '),
            regimeDistribution: `Bear:${regimeCounts[0]}d Sideways:${regimeCounts[1]}d Bull:${regimeCounts[2]}d`,
          },
        }),
      });
      const data = await res.json();

      if (data.blocked) {
        setSecurityBadge({ scanned: true, safe: false, pattern: data.reason });
        setNarrative('');
      } else {
        setSecurityBadge({ scanned: true, safe: true });
        setNarrative(data.narrative || 'No analysis returned.');
      }
    } catch {
      setNarrative('Failed to reach analyst endpoint. Please check your OpenAI API key.');
      setSecurityBadge({ scanned: true, safe: true });
    } finally {
      setAnalystLoading(false);
    }
  };

  const clusterColors = ['var(--risk-red)', 'var(--gold)', 'var(--risk-green)'];
  const clusterLabels = ['High Risk', 'Moderate', 'Low Risk'];

  const SkeletonBar = () => (
    <div style={{
      height: 20,
      borderRadius: 4,
      background: 'var(--surface-2)',
      animation: 'pulse 1.5s ease-in-out infinite',
      marginBottom: 8,
    }} />
  );

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: 40 }}>
        <div style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 10,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'var(--gold)',
          fontWeight: 500,
          marginBottom: 8,
        }}>
          AI · ML · SECURITY
        </div>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 36,
          fontWeight: 400,
          color: 'var(--ink)',
          margin: '0 0 8px 0',
          lineHeight: 1.2,
        }}>
          AI Risk Intelligence
        </h1>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14,
          color: 'var(--ink-muted)',
          margin: 0,
        }}>
          4 ML models · Live NSE data · Adversarial defense
        </p>
        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '24px 0' }} />
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 40 }}>
        {/* Market Regime */}
        <div style={{
          background: 'var(--ink)',
          border: `1px solid var(--gold)`,
          borderRadius: 8,
          padding: 20,
          transition: 'transform 0.2s',
        }}>
          <div style={{ fontSize: 10, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
            Market Regime
          </div>
          {pipeline.hmmDone ? (
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 24,
              color: REGIME_COLORS[currentRegime],
              fontWeight: 400,
            }}>
              {REGIME_LABELS[currentRegime]}
            </div>
          ) : <SkeletonBar />}
        </div>

        {/* Portfolio GSVI */}
        <div style={{
          background: 'var(--ink)',
          border: `1px solid var(--gold)`,
          borderRadius: 8,
          padding: 20,
        }}>
          <div style={{ fontSize: 10, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
            Portfolio GSVI
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 24,
            color: 'var(--cream)',
          }}>
            --
          </div>
        </div>

        {/* Anomalies */}
        <div style={{
          background: 'var(--ink)',
          border: `1px solid var(--gold)`,
          borderRadius: 8,
          padding: 20,
        }}>
          <div style={{ fontSize: 10, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
            Anomalies Detected
          </div>
          {pipeline.anomalyDone ? (
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 24,
              color: anomalyCount > 0 ? 'var(--risk-red)' : 'var(--risk-green)',
            }}>
              {anomalyCount}
            </div>
          ) : <SkeletonBar />}
        </div>

        {/* Model R² */}
        <div style={{
          background: 'var(--ink)',
          border: `1px solid var(--gold)`,
          borderRadius: 8,
          padding: 20,
        }}>
          <div style={{ fontSize: 10, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
            Model R²
          </div>
          {pipeline.olsDone ? (
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 24,
              color: 'var(--gold)',
            }}>
              {rSquared.toFixed(4)}
            </div>
          ) : <SkeletonBar />}
        </div>
      </div>

      {/* Regime Timeline Chart */}
      <div style={{
        background: 'var(--ink)',
        border: '1px solid var(--gold)',
        borderRadius: 8,
        padding: 24,
        marginBottom: 40,
      }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 20,
          color: 'var(--cream)',
          marginBottom: 4,
        }}>
          HMM Market Regime Detection — Baum-Welch EM
        </h2>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
          {REGIME_LABELS.map((label, i) => (
            <span key={label} style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              color: REGIME_COLORS[i],
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: REGIME_COLORS[i], display: 'inline-block' }} />
              {label} ({regimeCounts[i]}d)
            </span>
          ))}
        </div>

        {pipeline.hmmDone && regimeData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={regimeData}>
              <XAxis
                dataKey="date"
                tick={{ fill: '#6B6B6B', fontSize: 9 }}
                tickFormatter={(v: string) => v.slice(5)}
                interval={Math.floor(regimeData.length / 8)}
              />
              <YAxis tick={{ fill: '#6B6B6B', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: 'var(--ink)', border: '1px solid var(--gold)', color: 'var(--cream)', fontSize: 12 }}
                labelStyle={{ color: 'var(--gold)' }}
                formatter={(value: number, name: string) => {
                  if (name === 'logReturn') return [value.toFixed(4), 'Log Return'];
                  return [REGIME_LABELS[value as number], 'Regime'];
                }}
              />
              <Bar dataKey="logReturn">
                {regimeData.map((entry, idx) => (
                  <Cell key={idx} fill={REGIME_COLORS[entry.regime]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner" />
          </div>
        )}
      </div>

      {/* Cluster Panel */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 20,
          color: 'var(--ink)',
          marginBottom: 16,
        }}>
          K-Means Asset Clusters
        </h2>
        {pipeline.clustersDone ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {clusterAssets.map((asset) => (
              <div key={asset.symbol} style={{
                border: `1px solid ${clusterColors[asset.cluster] || 'var(--border)'}`,
                borderRadius: 8,
                padding: 16,
                background: 'var(--surface)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 14,
                    color: 'var(--ink)',
                    fontWeight: 500,
                  }}>
                    {asset.symbol}
                  </span>
                  <span style={{
                    fontSize: 10,
                    padding: '2px 8px',
                    borderRadius: 3,
                    background: `${clusterColors[asset.cluster]}20`,
                    color: clusterColors[asset.cluster],
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}>
                    {clusterLabels[asset.cluster]}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-muted)' }}>
                  <span>Vol: <span style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--ink)' }}>{(asset.vol * 100).toFixed(1)}%</span></span>
                  <span>Silhouette: <span style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--gold)' }}>{asset.silhouette.toFixed(3)}</span></span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ height: 80, borderRadius: 8, background: 'var(--surface-2)', animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        )}
      </div>

      {/* AI Analyst Section */}
      <div style={{
        background: 'var(--ink)',
        border: '1px solid var(--gold)',
        borderRadius: 8,
        padding: 24,
        marginBottom: 40,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 20 }}>🛡️</span>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 20,
            color: 'var(--cream)',
            margin: 0,
          }}>
            GPT-4o Risk Analyst
          </h2>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <input
            type="text"
            value={analystQuery}
            onChange={(e) => setAnalystQuery(e.target.value)}
            placeholder="Ask about your portfolio risk..."
            onKeyDown={(e) => { if (e.key === 'Enter') handleAnalyst(); }}
            style={{
              flex: 1,
              minWidth: 200,
              padding: '10px 14px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(201,168,76,0.3)',
              borderRadius: 4,
              color: 'var(--cream)',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              outline: 'none',
            }}
          />
          <button
            onClick={handleAnalyst}
            disabled={analystLoading || !analystQuery.trim()}
            style={{
              padding: '10px 20px',
              background: 'var(--gold)',
              color: 'var(--ink)',
              border: 'none',
              borderRadius: 4,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              fontWeight: 500,
              cursor: analystLoading ? 'wait' : 'pointer',
              opacity: analystLoading ? 0.7 : 1,
            }}
          >
            {analystLoading ? '⏳ Analyzing...' : '🔍 Analyze'}
          </button>
        </div>

        {/* Security Badge */}
        {securityBadge.scanned && (
          <div style={{
            padding: '8px 12px',
            borderRadius: 4,
            marginBottom: 16,
            fontSize: 12,
            fontFamily: "'DM Sans', sans-serif",
            background: securityBadge.safe ? 'rgba(26,107,60,0.15)' : 'rgba(192,57,43,0.15)',
            color: securityBadge.safe ? 'var(--risk-green)' : 'var(--risk-red)',
          }}>
            {securityBadge.safe
              ? '✅ Input scanned — no threats detected'
              : `🚨 Threat blocked — ${securityBadge.pattern || 'suspicious input'}`
            }
          </div>
        )}

        {/* Narrative */}
        {narrative && (
          <div style={{
            borderLeft: '3px solid var(--gold)',
            padding: '16px 20px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '0 4px 4px 0',
          }}>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              color: 'var(--cream)',
              lineHeight: 1.7,
              margin: 0,
              whiteSpace: 'pre-wrap',
            }}>
              {narrative}
            </p>
            <div style={{
              fontSize: 10,
              color: 'var(--ink-muted)',
              marginTop: 12,
              fontStyle: 'italic',
            }}>
              Every claim grounded in model outputs. No investment advice.
            </div>
          </div>
        )}
      </div>

      {/* Data Source Indicator */}
      <div style={{
        padding: '12px 20px',
        borderRadius: 8,
        background: pipeline.dataSource === 'live' ? 'rgba(26,107,60,0.1)' : 'rgba(201,168,76,0.1)',
        border: `1px solid ${pipeline.dataSource === 'live' ? 'var(--risk-green)' : 'var(--gold)'}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
      }}>
        <span style={{
          fontSize: 13,
          color: pipeline.dataSource === 'live' ? 'var(--risk-green)' : 'var(--gold)',
          fontWeight: 500,
        }}>
          {pipeline.dataSource === 'live' ? '📡 Live NSE Data' : '⚙️ Synthetic Fallback'}
        </span>
        {pipeline.timestamp && (
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            color: 'var(--ink-muted)',
          }}>
            Last fetch: {new Date(pipeline.timestamp).toLocaleString()}
          </span>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}} />
    </div>
  );
}
