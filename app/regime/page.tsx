'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Line, ComposedChart,
} from 'recharts';
import { trainHMM, viterbi, REGIME_LABELS, REGIME_COLORS } from '@/lib/ai/hmm';
import type { HMMParams } from '@/lib/ai/hmm';
import type { AssetData } from '@/lib/data/ingestion';

interface RegimePoint {
  date: string;
  logReturn: number;
  regime: number;
  fillColor: string;
}

export default function RegimePage() {
  const [loading, setLoading] = useState(true);
  const [regimeData, setRegimeData] = useState<RegimePoint[]>([]);
  const [currentRegime, setCurrentRegime] = useState<number>(1);
  const [streakConfidence, setStreakConfidence] = useState<number>(0);
  const [expectedDuration, setExpectedDuration] = useState<number>(0);
  const [params, setParams] = useState<HMMParams | null>(null);
  const [regimeCounts, setRegimeCounts] = useState<number[]>([0, 0, 0]);
  const [showDerivation, setShowDerivation] = useState(false);

  const runHMM = useCallback(async () => {
    try {
      const res = await fetch('/api/prices');
      if (!res.ok) {
        setLoading(false);
        return;
      }

      const json: { data: AssetData[] } = await res.json();
      const primary = json.data.find((a) => a.prices.length > 10);
      if (!primary) {
        setLoading(false);
        return;
      }

      const closePrices = primary.prices.map((p) => p.close);
      const logReturns: number[] = [];
      for (let i = 1; i < closePrices.length; i++) {
        logReturns.push(Math.log((closePrices[i] || 1) / (closePrices[i - 1] || 1)));
      }

      if (logReturns.length < 10) {
        setLoading(false);
        return;
      }

      const hmmParams = trainHMM(logReturns);
      setParams(hmmParams);
      const states = viterbi(logReturns, hmmParams);

      const current = states[states.length - 1] ?? 1;
      setCurrentRegime(current);

      // Streak confidence
      let streak = 0;
      for (let i = states.length - 1; i >= 0; i--) {
        if (states[i] === current) streak++;
        else break;
      }
      setStreakConfidence(Math.round((streak / (states.length || 1)) * 100));

      // Expected duration: 1 / P(leave state)
      const pStay = hmmParams.A[current][current];
      setExpectedDuration(Math.round(1 / (1 - pStay || 1)));

      // Regime data
      const dates = primary.prices.slice(1).map((p) => p.date);
      const rd: RegimePoint[] = states.map((regime, i) => ({
        date: dates[i] || `Day ${i}`,
        logReturn: logReturns[i],
        regime,
        fillColor: REGIME_COLORS[regime],
      }));
      setRegimeData(rd);

      const counts = [0, 0, 0];
      for (const s of states) counts[s]++;
      setRegimeCounts(counts);

      setLoading(false);
    } catch (err) {
      console.error('Regime page error:', err instanceof Error ? err.message : 'Unknown');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    runHMM();
  }, [runHMM]);

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
        <div style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 10,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'var(--gold)',
          fontWeight: 500,
          marginBottom: 8,
        }}>
          REGIME DETECTION
        </div>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 28,
          fontWeight: 400,
          color: 'var(--ink)',
          margin: '0 0 8px 0',
        }}>
          Hidden Markov Model — Regime Detection
        </h1>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14,
          color: 'var(--ink-muted)',
          margin: 0,
          maxWidth: 600,
        }}>
          3-state HMM trained via Baum-Welch EM · Decoded via Viterbi algorithm
        </p>
        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '24px 0' }} />
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 40 }}>
        <div style={{ border: '1px solid var(--border)', borderRadius: 4, padding: '20px 24px', background: 'var(--surface)' }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-muted)', marginBottom: 8 }}>Current Regime</div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 28,
            fontWeight: 300,
            color: REGIME_COLORS[currentRegime],
          }}>
            {REGIME_LABELS[currentRegime]}
          </div>
        </div>
        <div style={{ border: '1px solid var(--border)', borderRadius: 4, padding: '20px 24px', background: 'var(--surface)' }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-muted)', marginBottom: 8 }}>Confidence</div>
          <div className="font-num" style={{ fontSize: 28, fontWeight: 300, color: 'var(--ink)' }}>
            {streakConfidence}%
          </div>
        </div>
        <div style={{ border: '1px solid var(--border)', borderRadius: 4, padding: '20px 24px', background: 'var(--surface)' }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-muted)', marginBottom: 8 }}>Expected Duration</div>
          <div className="font-num" style={{ fontSize: 28, fontWeight: 300, color: 'var(--ink)' }}>
            {expectedDuration}d
          </div>
        </div>
      </div>

      {/* Full-width Chart */}
      <div style={{
        background: 'var(--ink)',
        border: '1px solid var(--gold)',
        borderRadius: 8,
        padding: 24,
        marginBottom: 40,
      }}>
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
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={regimeData}>
            <XAxis
              dataKey="date"
              tick={{ fill: '#6B6B6B', fontSize: 9 }}
              tickFormatter={(v: string) => v.slice(5)}
              interval={Math.floor(regimeData.length / 8) || 1}
            />
            <YAxis tick={{ fill: '#6B6B6B', fontSize: 10 }} />
            <Tooltip
              contentStyle={{ background: 'var(--ink)', border: '1px solid var(--gold)', color: 'var(--cream)', fontSize: 12 }}
              labelStyle={{ color: 'var(--gold)' }}
              formatter={(value: number, name: string) => {
                if (name === 'logReturn') return [value.toFixed(5), 'Log Return'];
                return [String(value), name];
              }}
            />
            <Area
              type="stepAfter"
              dataKey="regime"
              fill="none"
              stroke="none"
            />
            <Line
              type="monotone"
              dataKey="logReturn"
              stroke="var(--cream)"
              strokeWidth={1}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Transition Matrix */}
      {params && (
        <div style={{ marginBottom: 40 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, marginBottom: 16, color: 'var(--ink)' }}>
            Transition Matrix
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ maxWidth: 500 }}>
              <thead>
                <tr>
                  <th></th>
                  {REGIME_LABELS.map((label) => (
                    <th key={label} style={{ color: 'var(--ink-muted)' }}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {REGIME_LABELS.map((fromLabel, i) => (
                  <tr key={fromLabel}>
                    <td style={{ fontWeight: 500, color: REGIME_COLORS[i] }}>{fromLabel}</td>
                    {params.A[i].map((val, j) => (
                      <td key={j} style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        background: `rgba(201,168,76,${val * 0.4})`,
                        textAlign: 'center',
                      }}>
                        {val.toFixed(2)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Emission Parameters */}
      {params && (
        <div style={{ marginBottom: 40 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, marginBottom: 16, color: 'var(--ink)' }}>
            Emission Parameters
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            {REGIME_LABELS.map((label, i) => (
              <div key={label} style={{
                border: `1px solid ${REGIME_COLORS[i]}40`,
                borderRadius: 4,
                padding: 16,
                background: 'var(--surface)',
              }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: REGIME_COLORS[i], marginBottom: 8 }}>
                  {label}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--ink)', marginBottom: 4 }}>
                  μ = {params.mu[i].toFixed(6)}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--ink)' }}>
                  σ = {params.sigma[i].toFixed(6)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mathematical Derivation Toggle */}
      <div style={{ marginBottom: 40 }}>
        <button
          onClick={() => setShowDerivation(!showDerivation)}
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
          <span>View Baum-Welch EM Derivation</span>
          <span style={{ transform: showDerivation ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
        </button>
        {showDerivation && (
          <div style={{
            border: '1px solid var(--border)',
            borderTop: 'none',
            borderRadius: '0 0 4px 4px',
            padding: 20,
            background: 'var(--surface)',
          }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, lineHeight: 2, color: 'var(--ink)' }}>
              <p><strong>E-step (Gamma computation):</strong></p>
              <p>γ_t(i) = P(q_t = S_i | O, λ) = α_t(i)·β_t(i) / Σ_j α_t(j)·β_t(j)</p>
              <br />
              <p><strong>M-step (Parameter update):</strong></p>
              <p>π̂_i = γ_1(i)</p>
              <p>â_ij = Σ_t ξ_t(i,j) / Σ_t γ_t(i)</p>
              <p>μ̂_j = Σ_t γ_t(j)·O_t / Σ_t γ_t(j)</p>
              <p>σ̂²_j = Σ_t γ_t(j)·(O_t - μ̂_j)² / Σ_t γ_t(j)</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
