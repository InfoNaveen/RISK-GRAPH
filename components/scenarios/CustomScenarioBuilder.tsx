'use client';

import React, { useState } from 'react';
import { usePortfolio } from '@/lib/PortfolioContext';
import { ScenarioDefinition } from '@/lib/scenarios';
import { ASSET_COLORS } from '@/lib/types';

interface CustomScenarioBuilderProps {
  onAnalyzeCustom: (scenario: ScenarioDefinition) => void;
  totalValue: number;
}

export default function CustomScenarioBuilder({ onAnalyzeCustom, totalValue }: CustomScenarioBuilderProps) {
  const { tickers, portfolioWeights } = usePortfolio();
  const weights = portfolioWeights || {};
  
  // State for user shocks per asset (in decimals, so -0.1 is -10%)
  const [shocks, setShocks] = useState<Record<string, number>>({});

  const handleShockChange = (asset: string, value: number) => {
    setShocks(prev => ({ ...prev, [asset]: value }));
  };

  const currentImpact = tickers.reduce((sum, t) => {
    return sum + (weights[t] || 0) * (shocks[t] || 0);
  }, 0);

  const isNegative = currentImpact < 0;

  const handleReset = () => {
    setShocks({});
  };

  const handleAnalyze = () => {
    const customScenario: ScenarioDefinition = {
      name: "Custom User Scenario",
      date: "Live Setup",
      description: "User defined custom shock vectors per asset.",
      shocks: { ...shocks }
    };
    onAnalyzeCustom(customScenario);
  };

  if (tickers.length === 0) return null;

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 24, marginTop: 40 }}>
      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, marginBottom: 8 }}>Build Custom Scenario</h3>
      <p style={{ fontSize: 13, color: 'var(--ink-muted)', marginBottom: 24 }}>
        Input custom shock vectors to test hypothetical breaking points. Adjust the sliders from -80% to +80%.
      </p>

      <div style={{ display: 'flex', gap: 32 }}>
        
        {/* Sliders Grid */}
        <div style={{ flex: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {tickers.map(t => {
            const val = shocks[t] || 0;
            return (
              <div key={t} style={{ background: 'var(--cream)', padding: '12px 16px', borderRadius: 6, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: (ASSET_COLORS as any)[t] || 'var(--ink-muted)' }} />
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{t}</span>
                  </div>
                  <span style={{ 
                    fontFamily: 'JetBrains Mono', 
                    fontSize: 13, 
                    fontWeight: 600,
                    color: val < 0 ? 'var(--risk-red)' : (val > 0 ? 'var(--risk-green)' : 'var(--ink-muted)')
                  }}>
                    {val > 0 ? '+' : ''}{(val * 100).toFixed(0)}%
                  </span>
                </div>
                <input 
                  type="range"
                  min="-0.8" max="0.8" step="0.01"
                  value={val}
                  onChange={(e) => handleShockChange(t, parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--gold)' }}
                />
              </div>
            );
          })}
        </div>

        {/* Live Preview Panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--cream)', border: '1px solid var(--border)', padding: 24, borderRadius: 8, flex: 1 }}>
            <div style={{ fontSize: 12, color: 'var(--ink-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Live Portfolio Impact</div>
            <div style={{ 
              fontFamily: 'JetBrains Mono', 
              fontSize: 32, 
              fontWeight: 700,
              color: isNegative ? 'var(--risk-red)' : (currentImpact > 0 ? 'var(--risk-green)' : 'var(--ink)'),
              marginBottom: 16
            }}>
              {currentImpact > 0 ? '+' : ''}{(currentImpact * 100).toFixed(1)}%
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 'auto' }}>
              <button onClick={handleReset} className="btn-outline" style={{ flex: 1, padding: '10px 0', fontSize: 13 }}>Reset All</button>
              <button onClick={handleAnalyze} style={{ flex: 2, padding: '10px 0', fontSize: 13, background: 'var(--gold)', border: 'none', borderRadius: 4, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans', color: 'var(--ink)' }}>
                Analyze Full Impact
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
