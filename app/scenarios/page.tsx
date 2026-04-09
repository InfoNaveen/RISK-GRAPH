'use client';

import React, { useState } from 'react';
import SectionHeader from '@/components/SectionHeader';
import { SCENARIO_LIBRARY, ScenarioDefinition } from '@/lib/scenarios';
import ScenarioCard from '@/components/scenarios/ScenarioCard';
import ScenarioImpactChart from '@/components/scenarios/ScenarioImpactChart';
import CustomScenarioBuilder from '@/components/scenarios/CustomScenarioBuilder';
import { usePortfolio } from '@/lib/PortfolioContext';
import { applyScenario } from '@/lib/scenarios';

export default function ScenariosPage() {
  const { tickers, portfolioWeights } = usePortfolio();
  const weights = portfolioWeights ?? {};
  const weightsReady = portfolioWeights !== null && Object.keys(portfolioWeights).length > 0;
  const [selectedScenario, setSelectedScenario] = useState<ScenarioDefinition | null>(null);
  const chartRef = React.useRef<HTMLDivElement>(null);

  const totalValue = 1000000; // 10 Lakhs nominal base for visual understanding

  // Evaluate impacts for sorting cards
  const sortedScenarios = React.useMemo(() => {
    if (tickers.length === 0) return SCENARIO_LIBRARY.map(scen => ({ scen, impact: 0 }));
    
    const weightsRecord: Record<string, number> = {};
    tickers.forEach(t => weightsRecord[t] = weights[t] || 0);

    const withImpact = SCENARIO_LIBRARY.map(scen => {
      const res = applyScenario(scen, weightsRecord, totalValue);
      return { scen, impact: res.portfolioImpact };
    });

    // Worst (most negative) impact first
    return withImpact.sort((a, b) => a.impact - b.impact);
  }, [tickers, weights]);

  return (
    <div style={{ paddingBottom: 60 }}>
      <SectionHeader
        label="MODULE 12"
        title="Scenario Analysis"
        description="Stress tests the current portfolio against 8 historical crisis environments and hypothetical shocks."
      />

      {tickers.length === 0 ? (
        <div style={{ padding: 20, color: 'var(--ink-muted)' }}>No assets selected.</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
            {sortedScenarios.map(({ scen, impact }, idx) => (
              <ScenarioCard 
                key={idx} 
                scenario={scen} 
                impactPercent={impact}
                disabled={!weightsReady}
                onAnalyze={() => {
                  if (!weightsReady) return;
                  setSelectedScenario(scen);
                  // Scroll to the chart section — use ref not magic number
                  setTimeout(() => {
                    chartRef.current?.scrollIntoView({ 
                      behavior: 'smooth', 
                      block: 'start' 
                    });
                  }, 50);
                }} 
              />
            ))}
          </div>

          <div ref={chartRef}>
            {selectedScenario && weightsReady && (
              <div style={{ marginBottom: 40 }}>
                <ScenarioImpactChart 
                  scenario={selectedScenario} 
                  totalValue={totalValue}
                  weights={weights}
                />
              </div>
            )}
            {selectedScenario && !weightsReady && (
              <div style={{ 
                padding: 20, 
                color: 'var(--ink-muted)',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13
              }}>
                ⏳ Portfolio analysis running — please wait...
              </div>
            )}
          </div>

          <CustomScenarioBuilder 
            totalValue={totalValue} 
            onAnalyzeCustom={(scen) => {
              setSelectedScenario(scen);
              window.scrollTo({ top: 500, behavior: 'smooth' });
            }} 
          />
        </>
      )}
    </div>
  );
}
