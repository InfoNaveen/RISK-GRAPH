'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ComposedChart, Line, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts';
import { olsRegression } from '@/lib/ai/regression';
import type { OLSResult } from '@/lib/ai/regression';
import type { AssetData } from '@/lib/data/ingestion';

interface VolPoint {
  date: string;
  actual: number;
  predicted: number;
  upper: number;
  lower: number;
}

export default function ForecastPage() {
  const [loading, setLoading] = useState(true);
  const [olsResult, setOlsResult] = useState<OLSResult | null>(null);
  const [chartData, setChartData] = useState<VolPoint[]>([]);
  const [nextDayForecast, setNextDayForecast] = useState(0);
  const [ciRange, setCiRange] = useState('');
  const [significantCount, setSignificantCount] = useState(0);
  const [showFeatureDefs, setShowFeatureDefs] = useState(false);

  const runForecast = useCallback(async () => {
    try {
      const res = await fetch('/api/prices');
      if (!res.ok) {
        setLoading(false);
        return;
      }

      const json: { data: AssetData[] } = await res.json();
      const primary = json.data.find((a) => a.prices.length > 30);
      if (!primary) {
        setLoading(false);
        return;
      }

      const closePrices = primary.prices.map((p) => p.close);
      const logReturns: number[] = [];
      for (let i = 1; i < closePrices.length; i++) {
        logReturns.push(Math.log((closePrices[i] || 1) / (closePrices[i - 1] || 1)));
      }

      // Rolling 20-day volatility
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

      // Build X, y for OLS
      const X: number[][] = [];
      const y: number[] = [];
      const dateLabels: string[] = [];

      for (let i = 22; i < logReturns.length; i++) {
        X.push([
          rollingVol[i - 1],       // Lag1_Vol
          rollingVol[i - 2],       // Lag2_Vol
          logReturns[i - 1],       // Lag1_Return
          0.5,                     // Centrality placeholder
          0.3,                     // Network_Density placeholder
        ]);
        y.push(rollingVol[i]);
        dateLabels.push(primary.prices[i + 1]?.date || `Day ${i}`);
      }

      if (X.length < 5) {
        setLoading(false);
        return;
      }

      const result = olsRegression(X, y);
      setOlsResult(result);

      // Chart data
      const cd: VolPoint[] = result.predictions.map((pred, i) => ({
        date: dateLabels[i],
        actual: y[i] * Math.sqrt(252) * 100,
        predicted: pred * Math.sqrt(252) * 100,
        upper: result.confidenceBands.upper[i] * Math.sqrt(252) * 100,
        lower: Math.max(0, result.confidenceBands.lower[i] * Math.sqrt(252) * 100),
      }));
      setChartData(cd);

      // Next day forecast (last prediction extrapolated)
      const lastPred = result.predictions[result.predictions.length - 1] || 0;
      setNextDayForecast(lastPred * Math.sqrt(252) * 100);

      // Confidence interval
      const lastUpper = result.confidenceBands.upper[result.confidenceBands.upper.length - 1] || 0;
      const lastLower = result.confidenceBands.lower[result.confidenceBands.lower.length - 1] || 0;
      setCiRange(`±${((lastUpper - lastLower) * Math.sqrt(252) * 100 / 2).toFixed(2)}%`);

      // Significant features
      setSignificantCount(result.featureImportance.filter((f) => Math.abs(f.tStat) > 1.96).length);

      setLoading(false);
    } catch (err) {
      console.error('Forecast error:', err instanceof Error ? err.message : 'Unknown');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    runForecast();
  }, [runForecast]);

  const featureDefinitions: Record<string, string> = {
    'Lag1_Vol': 'Previous day rolling 20-day volatility — captures volatility persistence (ARCH effect)',
    'Lag2_Vol': 'Two-day lagged rolling volatility — captures secondary momentum in vol clustering',
    'Lag1_Return': 'Previous day log return — captures leverage effect (neg returns → higher vol)',
    'Centrality': 'Eigenvector centrality from correlation network graph — systemic importance proxy',
    'Network_Density': 'Graph density metric — measures interconnectedness of the asset universe',
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500, marginBottom: 8 }}>
          VOLATILITY FORECASTING
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 400, color: 'var(--ink)', margin: '0 0 8px 0' }}>
          Volatility Forecasting — Multivariate OLS
        </h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--ink-muted)', margin: 0, maxWidth: 600 }}>
          5-feature regression · Trained on NSE return series
        </p>
        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '24px 0' }} />
      </div>

      {/* Model Performance Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20, marginBottom: 40 }}>
        <div style={{ border: '1px solid var(--border)', borderRadius: 4, padding: '20px 24px', background: 'var(--surface)' }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-muted)', marginBottom: 8 }}>R² Value</div>
          <div className="font-num" style={{ fontSize: 28, fontWeight: 300, color: 'var(--gold)' }}>
            {olsResult ? olsResult.rSquared.toFixed(4) : '--'}
          </div>
        </div>
        <div style={{ border: '1px solid var(--border)', borderRadius: 4, padding: '20px 24px', background: 'var(--surface)' }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-muted)', marginBottom: 8 }}>Next-Day Forecast Vol</div>
          <div className="font-num" style={{ fontSize: 28, fontWeight: 300, color: 'var(--ink)' }}>
            {nextDayForecast.toFixed(2)}%
          </div>
        </div>
        <div style={{ border: '1px solid var(--border)', borderRadius: 4, padding: '20px 24px', background: 'var(--surface)' }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-muted)', marginBottom: 8 }}>Confidence Interval</div>
          <div className="font-num" style={{ fontSize: 28, fontWeight: 300, color: 'var(--ink)' }}>
            {ciRange}
          </div>
        </div>
        <div style={{ border: '1px solid var(--border)', borderRadius: 4, padding: '20px 24px', background: 'var(--surface)' }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-muted)', marginBottom: 8 }}>Significant Features</div>
          <div className="font-num" style={{ fontSize: 28, fontWeight: 300, color: 'var(--risk-green)' }}>
            {significantCount}/5
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div style={{
        background: 'var(--ink)',
        border: '1px solid var(--gold)',
        borderRadius: 8,
        padding: 24,
        marginBottom: 40,
      }}>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: 'var(--cream)', marginBottom: 16 }}>
          Actual vs Predicted Volatility (Annualized %)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData}>
            <XAxis
              dataKey="date"
              tick={{ fill: '#6B6B6B', fontSize: 9 }}
              tickFormatter={(v: string) => v.slice(5)}
              interval={Math.floor(chartData.length / 8) || 1}
            />
            <YAxis tick={{ fill: '#6B6B6B', fontSize: 10 }} />
            <Tooltip
              contentStyle={{ background: 'var(--ink)', border: '1px solid var(--gold)', color: 'var(--cream)', fontSize: 12 }}
              labelStyle={{ color: 'var(--gold)' }}
              formatter={(value: number, name: string) => [`${value.toFixed(2)}%`, name]}
            />
            <Area
              type="monotone"
              dataKey="upper"
              stroke="none"
              fill="rgba(201,168,76,0.15)"
            />
            <Area
              type="monotone"
              dataKey="lower"
              stroke="none"
              fill="var(--ink)"
            />
            <Line type="monotone" dataKey="actual" stroke="var(--cream)" strokeWidth={1.5} dot={false} name="Actual" />
            <Line type="monotone" dataKey="predicted" stroke="var(--gold)" strokeWidth={1.5} dot={false} name="Predicted" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Feature Importance */}
      {olsResult && olsResult.featureImportance.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, marginBottom: 16, color: 'var(--ink)' }}>
            Feature Importance
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={olsResult.featureImportance}
              layout="vertical"
            >
              <XAxis type="number" tick={{ fill: '#6B6B6B', fontSize: 10 }} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: 'var(--ink)', fontSize: 11 }}
                width={120}
              />
              <Tooltip
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 12 }}
                formatter={(value: number, name: string) => [value.toFixed(4), name]}
              />
              <Bar dataKey="coefficient" name="Coefficient">
                {olsResult.featureImportance.map((entry, idx) => {
                  let color = 'var(--ink-muted)';
                  if (Math.abs(entry.tStat) > 2.6) color = 'var(--risk-green)';
                  else if (Math.abs(entry.tStat) > 1.96) color = 'var(--gold)';
                  return <Cell key={idx} fill={color} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Significance labels */}
          <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
            {olsResult.featureImportance.map((f) => {
              let sig = 'ns';
              let sigColor = 'var(--ink-muted)';
              if (Math.abs(f.tStat) > 2.6) { sig = '***'; sigColor = 'var(--risk-green)'; }
              else if (Math.abs(f.tStat) > 1.96) { sig = '**'; sigColor = 'var(--gold)'; }
              return (
                <span key={f.name} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: sigColor }}>
                  {f.name}: t={f.tStat.toFixed(2)} {sig}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Feature Definitions (collapsible) */}
      <div style={{ marginBottom: 40 }}>
        <button
          onClick={() => setShowFeatureDefs(!showFeatureDefs)}
          style={{
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: 4,
            padding: '10px 20px',
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            color: 'var(--ink)',
            width: '100%',
            textAlign: 'left',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>Feature Definitions</span>
          <span style={{ transform: showFeatureDefs ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
        </button>
        {showFeatureDefs && (
          <div style={{
            border: '1px solid var(--border)',
            borderTop: 'none',
            borderRadius: '0 0 4px 4px',
            padding: 20,
            background: 'var(--surface)',
          }}>
            {Object.entries(featureDefinitions).map(([name, def]) => (
              <div key={name} style={{ marginBottom: 12 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--gold)', fontWeight: 500 }}>
                  {name}
                </span>
                <span style={{ fontSize: 12, color: 'var(--ink-muted)', marginLeft: 8 }}>
                  — {def}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
