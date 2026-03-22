'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import SectionHeader from '@/components/SectionHeader';
import MetricCard from '@/components/MetricCard';
import StressSlider from '@/components/stress/StressSlider';
import ContagionHeatmap from '@/components/stress/ContagionHeatmap';
import VarianceCurve from '@/components/stress/VarianceCurve';
import {
  stressCovariance,
  portfolioVariance,
  getVolatilities,
  contagionStep,
  jacobiEigenvalue,
} from '@/lib/math';
import { usePortfolio } from '@/lib/PortfolioContext';
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
  const { 
    tickers, 
    alpha, setAlpha, 
    beta, setBeta, 
    contagionSteps, setContagionSteps, 
    correlationMatrix, isAnalyzing, lambdaMax 
  } = usePortfolio();

  const [activeTab, setActiveTab] = useState<'contagion' | 'explosion'>('contagion');

  const [contagionData, setContagionData] = useState<number[][]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const n = tickers.length;
  const vols = useMemo(() => getVolatilities(tickers), [tickers]);
  const equalWeights = useMemo(() => new Array(n).fill(1 / (n || 1)), [n]);

  const stressedMatrix = useMemo(() => {
    if (!correlationMatrix || !n) return [];
    const cov = stressCovariance(alpha, vols, correlationMatrix);
    const corr: number[][] = [];
    for (let i = 0; i < n; i++) {
      corr[i] = [];
      for (let j = 0; j < n; j++) {
        const denom = Math.sqrt(cov[i][i] * cov[j][j]);
        corr[i][j] = denom > 0 ? cov[i][j] / denom : 0;
      }
    }
    return corr;
  }, [alpha, vols, n, correlationMatrix]);

  const varianceCurveData = useMemo(() => {
    if (!correlationMatrix || !n) return [];
    const data: { alpha: number; vol: number }[] = [];
    for (let a = 0; a <= 1.001; a += 0.04) {
      const cov = stressCovariance(a, vols, correlationMatrix);
      const pvar = portfolioVariance(equalWeights, cov);
      const pvol = Math.sqrt(pvar) * Math.sqrt(252);
      data.push({ alpha: parseFloat(a.toFixed(2)), vol: pvol });
    }
    return data;
  }, [vols, equalWeights, correlationMatrix, n]);

  const currentVol = useMemo(() => {
    if (!correlationMatrix || !n) return 0;
    const cov = stressCovariance(alpha, vols, correlationMatrix);
    return Math.sqrt(portfolioVariance(equalWeights, cov)) * Math.sqrt(252);
  }, [alpha, vols, equalWeights, correlationMatrix, n]);

  const stabilityThreshold = lambdaMax && lambdaMax > 0 ? 1 / lambdaMax : Infinity;
  const isUnstable = beta >= stabilityThreshold && stabilityThreshold !== Infinity;

  const runContagion = useCallback(() => {
    if (!correlationMatrix || !n) return;
    const steps: number[][] = [];
    let w = equalWeights.slice();
    steps.push([...w]);

    for (let t = 0; t < contagionSteps; t++) {
      w = contagionStep(w, correlationMatrix, beta);
      steps.push([...w]);
    }

    setContagionData(steps);
    setCurrentStep(0);
    setPlaying(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [beta, contagionSteps, equalWeights, correlationMatrix, n]);

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
    return tickers.map((name, i) => ({
      asset: name,
      weight: parseFloat((w[i] * 100).toFixed(2)),
    }));
  }, [contagionData, currentStep, equalWeights, tickers]);

  const drChartData = useMemo(() => {
    if (!correlationMatrix || !n) return [];
    const currentCov = stressCovariance(alpha, vols, correlationMatrix);
    
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
  }, [contagionData, currentStep, equalWeights, alpha, vols, correlationMatrix, n]);

  const spectrumData = useMemo(() => {
    if (stressedMatrix.length === 0 || !n) return [];
    const { eigenvalues } = jacobiEigenvalue(stressedMatrix);
    // Sort descending
    eigenvalues.sort((a, b) => b - a);
    return eigenvalues.map((ev, i) => ({ component: `PC${i + 1}`, eigenvalue: parseFloat(ev.toFixed(3)) }));
  }, [stressedMatrix, n]);

  return (
    <div style={{ opacity: isAnalyzing ? 0.5 : 1, transition: 'opacity 0.2s', pointerEvents: isAnalyzing ? 'none' : 'auto' }}>
      <SectionHeader
        label="MODULE 04"
        title="Stress Testing"
        description="PSD-safe stress operators, contagion dynamics, and herding collapse analysis via correlation regime modulation."
      />

      {tickers.length < 2 ? (
        <div style={{ padding: 20, color: 'var(--risk-red)', background: 'rgba(192,57,43,0.1)', borderRadius: 8, marginBottom: 24 }}>
          Please select at least 2 assets to run stress testing.
        </div>
      ) : (
        <>
          {/* Tab Navigation */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
            <button
              onClick={() => setActiveTab('contagion')}
              style={{
                background: 'none',
                border: 'none',
                padding: '12px 24px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                fontWeight: activeTab === 'contagion' ? 600 : 400,
                color: activeTab === 'contagion' ? 'var(--ink)' : 'var(--ink-muted)',
                borderBottom: activeTab === 'contagion' ? '2px solid var(--gold)' : '2px solid transparent',
                cursor: 'pointer',
              }}
            >
              Contagion Dynamics
            </button>
            <button
              onClick={() => setActiveTab('explosion')}
              style={{
                background: 'none',
                border: 'none',
                padding: '12px 24px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                fontWeight: activeTab === 'explosion' ? 600 : 400,
                color: activeTab === 'explosion' ? 'var(--ink)' : 'var(--ink-muted)',
                borderBottom: activeTab === 'explosion' ? '2px solid var(--gold)' : '2px solid transparent',
                cursor: 'pointer',
              }}
            >
              Risk Explosion
            </button>
          </div>

          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            {/* Left Panel: Controls */}
            <div style={{ flex: '1 1 35%', minWidth: 320 }}>
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
                  Regime Parameters
                </h3>
                
                <MetricCard
                  label="Portfolio Annualized Vol"
                  value={`${(currentVol * 100).toFixed(2)}%`}
                  color={alpha > 0.5 ? 'var(--risk-red)' : 'var(--gold)'}
                  subtext={`At α = ${alpha.toFixed(2)} — Σ_stress = (1-α)Σ + αΣ_max`}
                />

                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 13, marginBottom: 8, color: 'var(--ink)' }}>Contagion Coeff. (β) Threshold Limit</div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: isUnstable ? 'var(--risk-red)' : 'var(--ink)' }}>
                    β_max = {stabilityThreshold === Infinity ? '∞' : stabilityThreshold.toFixed(4)}
                  </div>
                  {isUnstable && (
                    <div style={{
                      marginTop: 8,
                      background: 'rgba(192, 57, 43, 0.1)',
                      border: '1px solid var(--risk-red)',
                      borderRadius: 4,
                      padding: '8px 12px',
                      fontSize: 12,
                      color: 'var(--risk-red)',
                      fontWeight: 500,
                    }}>
                      ⚠ Contagion rate β ({beta.toFixed(2)}) exceeds stability threshold. Unstable herding triggered.
                    </div>
                  )}
                </div>
              </div>

              <div style={{
                padding: '24px',
                background: 'white',
                border: '1px solid var(--border)',
                borderRadius: 8,
                overflowX: 'auto',
              }}>
                <h3 style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 16,
                  fontWeight: 400,
                  marginBottom: 16,
                }}>
                  Stressed Correlation Matrix
                </h3>
                <ContagionHeatmap matrix={stressedMatrix} />
              </div>
            </div>

            {/* Right Panel: Tab Content */}
            <div style={{ flex: '1 1 55%', minWidth: 400 }}>
              {activeTab === 'contagion' ? (
                <div style={{
                  padding: '24px',
                  background: 'white',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: 18,
                      fontWeight: 400,
                      margin: 0,
                    }}>
                      Capital Flow Contagion
                    </h3>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn-primary" onClick={runContagion} style={{ fontSize: 12, padding: '6px 16px' }}>
                        Run Simulation
                      </button>
                      {contagionData.length > 0 && (
                        <button className="btn-outline" onClick={togglePlay} style={{ fontSize: 12, padding: '6px 12px' }}>
                          {playing ? '⏸ Pause' : '▶ Play'}
                        </button>
                      )}
                    </div>
                  </div>

                  {contagionData.length > 0 ? (
                    <>
                      <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginBottom: 8, textAlign: 'right' }}>
                        Step {currentStep} / {contagionData.length - 1}
                      </div>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={barChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                          <XAxis
                            dataKey="asset"
                            tick={{ fontSize: 10, fill: 'var(--ink-muted)' }}
                            interval={0}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis
                            tick={{ fontSize: 10, fill: 'var(--ink-muted)', fontFamily: 'JetBrains Mono' }}
                            tickFormatter={v => `${v}%`}
                          />
                          <Tooltip
                            formatter={(value: number) => [`${value.toFixed(2)}%`, 'Weight']}
                            contentStyle={{ background: 'var(--ink)', border: 'none', borderRadius: 4, color: 'var(--cream)', fontSize: 12 }}
                          />
                          <Bar dataKey="weight" fill="var(--gold)" radius={[2, 2, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>

                      <div style={{ marginTop: 24 }}>
                        <div style={{ fontSize: 13, marginBottom: 12, color: 'var(--ink)' }}>
                          Diversification Ratio (DR) vs Timestep
                        </div>
                        <ResponsiveContainer width="100%" height={160}>
                          <LineChart data={drChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                            <XAxis 
                              dataKey="step" 
                              type="number"
                              domain={[0, contagionSteps]}
                              tick={{ fontSize: 10, fill: 'var(--ink-muted)', fontFamily: 'JetBrains Mono' }} 
                            />
                            <YAxis 
                              domain={['dataMin - 0.1', 'dataMax + 0.1']}
                              tick={{ fontSize: 10, fill: 'var(--ink-muted)', fontFamily: 'JetBrains Mono' }} 
                            />
                            <Tooltip 
                              formatter={(value: number) => [value.toFixed(3), 'DR']}
                              labelFormatter={(l) => `Step ${l}`}
                              contentStyle={{ background: 'var(--ink)', border: 'none', borderRadius: 4, color: 'var(--cream)', fontSize: 12 }}
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
                  ) : (
                    <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-muted)', fontStyle: 'italic', fontSize: 13 }}>
                      Run simulation to view contagion dynamics.
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <VarianceCurve data={varianceCurveData} currentAlpha={alpha} />
                  
                  <div style={{
                    padding: '24px',
                    background: 'white',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                  }}>
                    <h3 style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: 18,
                      fontWeight: 400,
                      marginBottom: 16,
                    }}>
                      Eigenvalue Spectrum (Stressed Regime)
                    </h3>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={spectrumData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis
                          dataKey="component"
                          tick={{ fontSize: 10, fill: 'var(--ink-muted)' }}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: 'var(--ink-muted)', fontFamily: 'JetBrains Mono' }}
                        />
                        <Tooltip
                          formatter={(value: number) => [value, 'Eigenvalue']}
                          contentStyle={{ background: 'white', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--ink)', fontSize: 12 }}
                        />
                        <Bar dataKey="eigenvalue" fill="var(--risk-red)" radius={[2, 2, 0, 0]} opacity={0.8} />
                      </BarChart>
                    </ResponsiveContainer>
                    <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 12 }}>
                      Distribution of variance explained by principal components. A dominant PC1 reflects high systemic correlation.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
