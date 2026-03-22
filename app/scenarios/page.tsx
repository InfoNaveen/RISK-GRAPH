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
  const weights = portfolioWeights || {};
  const [selectedScenario, setSelectedScenario] = useState<ScenarioDefinition | null>(null);

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
                onAnalyze={() => {
                  setSelectedScenario(scen);
                  window.scrollTo({ top: 300, behavior: 'smooth' });
                }} 
              />
            ))}
          </div>

          {selectedScenario && (
            <div style={{ marginBottom: 40 }}>
              <ScenarioImpactChart scenario={selectedScenario} totalValue={totalValue} />
            </div>
          )}

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
