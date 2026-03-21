'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import SectionHeader from '@/components/SectionHeader';
import MetricCard from '@/components/MetricCard';
import StressSlider from '@/components/stress/StressSlider';
import ContagionHeatmap from '@/components/stress/ContagionHeatmap';
import VarianceCurve from '@/components/stress/VarianceCurve';
import {
  CORRELATION_MATRIX,
  stressCovariance,
  portfolioVariance,
  getVolatilities,
  contagionStep,
  powerIteration,
} from '@/lib/math';
import { ASSET_NAMES } from '@/lib/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  ReferenceLine,
} from 'recharts';

export default function StressPage() {
  const [alpha, setAlpha] = useState(0.0);
  const [beta, setBeta] = useState(0.1);
  const [contagionSteps, setContagionSteps] = useState(20);
  const [contagionData, setContagionData] = useState<number[][]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const vols = useMemo(() => getVolatilities(), []);
  const n = ASSET_NAMES.length;
  const equalWeights = useMemo(() => new Array(n).fill(1 / n), [n]);

  // Compute stressed correlation matrix for heatmap
  const stressedMatrix = useMemo(() => {
    const cov = stressCovariance(alpha, vols);
    // Convert covariance back to correlation for display
    const corr: number[][] = [];
    for (let i = 0; i < n; i++) {
      corr[i] = [];
      for (let j = 0; j < n; j++) {
        const denom = Math.sqrt(cov[i][i] * cov[j][j]);
        corr[i][j] = denom > 0 ? cov[i][j] / denom : 0;
      }
    }
    return corr;
  }, [alpha, vols, n]);

  // Compute variance curve data
  const varianceCurveData = useMemo(() => {
    const data: { alpha: number; vol: number }[] = [];
    for (let a = 0; a <= 1.001; a += 0.01) {
      const cov = stressCovariance(a, vols);
      const pvar = portfolioVariance(equalWeights, cov);
      const pvol = Math.sqrt(pvar) * Math.sqrt(252);
      data.push({ alpha: parseFloat(a.toFixed(2)), vol: pvol });
    }
    return data;
  }, [vols, equalWeights]);

  // Current portfolio vol
  const currentVol = useMemo(() => {
    const cov = stressCovariance(alpha, vols);
    return Math.sqrt(portfolioVariance(equalWeights, cov)) * Math.sqrt(252);
  }, [alpha, vols, equalWeights]);

  // Stability threshold
  const stabilityThreshold = useMemo(() => {
    const { eigenvalue } = powerIteration(CORRELATION_MATRIX);
    return 1 / eigenvalue;
  }, []);

  const isUnstable = beta > stabilityThreshold;

  // Run contagion simulation
  const runContagion = useCallback(() => {
    const steps: number[][] = [];
    let w = equalWeights.slice();
    steps.push([...w]);

    for (let t = 0; t < contagionSteps; t++) {
      w = contagionStep(w, CORRELATION_MATRIX, beta);
      steps.push([...w]);
    }

    setContagionData(steps);
    setCurrentStep(0);
    setPlaying(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [beta, contagionSteps, equalWeights]);

  // Play animation
  const togglePlay = () => {
    if (playing) {
      setPlaying(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    setPlaying(true);
    let step = currentStep;
    intervalRef.current = setInterval(() => {
      step++;
      if (step >= contagionData.length) {
        setPlaying(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }
      setCurrentStep(step);
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const barChartData = useMemo(() => {
    if (contagionData.length === 0) return [];
    const w = contagionData[currentStep] || equalWeights;
    return ASSET_NAMES.map((name, i) => ({
      asset: name,
      weight: parseFloat((w[i] * 100).toFixed(2)),
    }));
  }, [contagionData, currentStep, equalWeights]);

  const drChartData = useMemo(() => {
    const currentCov = stressCovariance(alpha, vols);
    
    if (contagionData.length === 0) {
      const pvar = portfolioVariance(equalWeights, currentCov);
      const pvol = Math.sqrt(pvar);
      const wSumSig = equalWeights.reduce((sum, weight, i) => sum + weight * vols[i], 0);
      const dr = pvol > 0 ? wSumSig / pvol : 1;
      return [{ step: 0, dr: parseFloat(dr.toFixed(3)) }];
    }

    return contagionData.slice(0, currentStep + 1).map((w, t) => {
      const pvar = portfolioVariance(w, currentCov);
      const pvol = Math.sqrt(pvar);
      const wSumSig = w.reduce((sum, weight, i) => sum + weight * vols[i], 0);
      const dr = pvol > 0 ? wSumSig / pvol : 1;
      return { step: t, dr: parseFloat(dr.toFixed(3)) };
    });
  }, [contagionData, currentStep, equalWeights, alpha, vols]);

  return (
    <div>
      <SectionHeader
        label="MODULE 03"
        title="Stress Testing"
        description="PSD-safe stress operators, contagion dynamics, and herding collapse analysis via correlation regime modulation."
      />

      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        {/* Left Panel: Controls + Contagion */}
        <div style={{ flex: '1 1 45%', minWidth: 360 }}>
          {/* Section A: Stress Operator */}
          <div style={{
            padding: '24px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            marginBottom: 24,
          }}>
            <h3 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 18,
              fontWeight: 400,
              marginBottom: 16,
            }}>
              PSD-Safe Stress Operator
            </h3>
            <StressSlider
              label="Stress Level α"
              value={alpha}
              min={0}
              max={1}
              step={0.01}
              onChange={setAlpha}
            />
            <MetricCard
              label="Portfolio Annualized Vol"
              value={`${(currentVol * 100).toFixed(2)}%`}
              color={alpha > 0.5 ? 'var(--risk-red)' : 'var(--gold)'}
              subtext={`At α = ${alpha.toFixed(2)} — Σ_stress = (1-α)Σ + αΣ_max`}
            />
          </div>

          {/* Section B: Contagion */}
          <div style={{
            padding: '24px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 8,
          }}>
            <h3 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 18,
              fontWeight: 400,
              marginBottom: 16,
            }}>
              Capital Flow Contagion
            </h3>

            {isUnstable && (
              <div style={{
                background: 'rgba(192, 57, 43, 0.1)',
                border: '1px solid var(--risk-red)',
                borderRadius: 4,
                padding: '10px 14px',
                marginBottom: 16,
                fontSize: 12,
                color: 'var(--risk-red)',
                fontWeight: 500,
              }}>
                ⚠ Contagion rate exceeds stability threshold — herding collapse imminent
              </div>
            )}

            <StressSlider
              label="Contagion Rate β"
              value={beta}
              min={0}
              max={0.5}
              step={0.01}
              onChange={setBeta}
              displayValue={`${beta.toFixed(2)} (threshold: ${stabilityThreshold.toFixed(3)})`}
            />
            <StressSlider
              label="Timesteps T"
              value={contagionSteps}
              min={1}
              max={50}
              step={1}
              onChange={v => setContagionSteps(Math.round(v))}
              displayValue={String(contagionSteps)}
            />

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button className="btn-primary" onClick={runContagion}>
                Run Contagion
              </button>
              {contagionData.length > 0 && (
                <button className="btn-outline" onClick={togglePlay}>
                  {playing ? '⏸ Pause' : '▶ Play'}
                </button>
              )}
            </div>

            {contagionData.length > 0 && (
              <>
                <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginBottom: 8 }}>
                  Step {currentStep} / {contagionData.length - 1}
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="asset"
                      tick={{ fontSize: 9, fill: 'var(--ink-muted)' }}
                      angle={-45}
                      textAnchor="end"
                      height={50}
                    />
                    <YAxis
                      tick={{ fontSize: 9, fill: 'var(--ink-muted)', fontFamily: 'JetBrains Mono' }}
                      tickFormatter={v => `${v}%`}
                    />
                    <Tooltip
                      formatter={(value: number) => [`${value.toFixed(2)}%`, 'Weight']}
                      contentStyle={{
                        background: 'var(--ink)',
                        border: 'none',
                        borderRadius: 4,
                        color: 'var(--cream)',
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="weight" fill="var(--gold)" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>

                <div style={{ marginTop: 24 }}>
                  <div style={{ fontSize: 13, marginBottom: 8, color: 'var(--ink)' }}>
                    Diversification Ratio (DR) vs Timestep
                  </div>
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={drChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis 
                        dataKey="step" 
                        type="number"
                        domain={[0, contagionSteps]}
                        tick={{ fontSize: 9, fill: 'var(--ink-muted)', fontFamily: 'JetBrains Mono' }} 
                      />
                      <YAxis 
                        domain={['dataMin - 0.1', 'dataMax + 0.1']}
                        tick={{ fontSize: 9, fill: 'var(--ink-muted)', fontFamily: 'JetBrains Mono' }} 
                      />
                      <Tooltip 
                        formatter={(value: number) => [value.toFixed(3), 'DR']}
                        labelFormatter={(l) => `Step ${l}`}
                        contentStyle={{
                          background: 'var(--ink)',
                          border: 'none',
                          borderRadius: 4,
                          color: 'var(--cream)',
                          fontSize: 12,
                        }}
                      />
                      <ReferenceLine 
                        y={1} 
                        stroke="var(--risk-red)" 
                        strokeDasharray="3 3" 
                        label={{ position: 'insideBottomRight', value: 'Zero Diversification', fill: 'var(--risk-red)', fontSize: 10, dy: -5 }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="dr" 
                        stroke="url(#colorDr)" 
                        strokeWidth={2} 
                        dot={false}
                        isAnimationActive={false}
                      />
                      <defs>
                        <linearGradient id="colorDr" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--risk-green)" />
                          <stop offset="100%" stopColor="var(--risk-red)" />
                        </linearGradient>
                      </defs>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Panel: Charts */}
        <div style={{ flex: '1 1 45%', minWidth: 360 }}>
          <VarianceCurve data={varianceCurveData} currentAlpha={alpha} />

          <div style={{ marginTop: 24 }}>
            <h3 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 18,
              fontWeight: 400,
              marginBottom: 16,
            }}>
              Stressed Correlation Matrix
            </h3>
            <div style={{
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '16px',
              background: 'white',
              overflowX: 'auto',
            }}>
              <ContagionHeatmap matrix={stressedMatrix} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
