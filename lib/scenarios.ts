export type ScenarioDefinition = {
  name: string;
  date: string;
  description: string;
  shocks: Record<string, number>;
};

export const SCENARIO_LIBRARY: ScenarioDefinition[] = [
  {
    name: "2008 Global Financial Crisis",
    date: "Sep–Nov 2008",
    description: "Lehman collapse. Global equity selloff, credit freeze.",
    shocks: { RELIANCE:-0.52, TCS:-0.48, HDFCBANK:-0.58, INFY:-0.44, ICICIBANK:-0.62, AXISBANK:-0.55, SBIN:-0.50, WIPRO:-0.46, LT:-0.54, MARUTI:-0.60, Gold:+0.12, Silver:-0.15, RealEstate:-0.35 }
  },
  {
    name: "2020 COVID Crash",
    date: "Feb–Mar 2020",
    description: "Pandemic shock. Sharp V-shaped selloff.",
    shocks: { RELIANCE:-0.38, TCS:-0.28, HDFCBANK:-0.42, INFY:-0.22, ICICIBANK:-0.45, AXISBANK:-0.48, SBIN:-0.44, WIPRO:-0.25, LT:-0.40, MARUTI:-0.50, Gold:+0.08, Silver:-0.10, RealEstate:-0.20 }
  },
  {
    name: "2013 Taper Tantrum",
    date: "May–Aug 2013",
    description: "Fed signals QE tapering. EM selloff, INR weakness.",
    shocks: { RELIANCE:-0.18, TCS:-0.08, HDFCBANK:-0.22, INFY:-0.05, ICICIBANK:-0.25, AXISBANK:-0.28, SBIN:-0.30, WIPRO:-0.10, LT:-0.20, MARUTI:-0.22, Gold:-0.20, Silver:-0.28, RealEstate:-0.08 }
  },
  {
    name: "2016 Demonetization",
    date: "Nov 2016",
    description: "India-specific shock. Liquidity crisis, banking stress.",
    shocks: { RELIANCE:-0.12, TCS:-0.08, HDFCBANK:-0.10, INFY:-0.06, ICICIBANK:-0.14, AXISBANK:-0.16, SBIN:-0.18, WIPRO:-0.07, LT:-0.13, MARUTI:-0.20, Gold:+0.05, Silver:+0.03, RealEstate:-0.15 }
  },
  {
    name: "2022 Rate Hike Cycle",
    date: "Jan–Oct 2022",
    description: "Global rate hike shock. Growth stocks hit hardest.",
    shocks: { RELIANCE:+0.08, TCS:-0.22, HDFCBANK:-0.05, INFY:-0.28, ICICIBANK:+0.02, AXISBANK:-0.08, SBIN:+0.05, WIPRO:-0.30, LT:+0.10, MARUTI:+0.15, Gold:-0.02, Silver:-0.12, RealEstate:-0.10 }
  },
  {
    name: "Bull Market Rally",
    date: "2023 India Bull Run",
    description: "Strong domestic flows. Mid/small caps outperform.",
    shocks: { RELIANCE:+0.25, TCS:+0.18, HDFCBANK:+0.15, INFY:+0.20, ICICIBANK:+0.30, AXISBANK:+0.28, SBIN:+0.35, WIPRO:+0.22, LT:+0.40, MARUTI:+0.32, Gold:+0.10, Silver:+0.08, RealEstate:+0.18 }
  },
  {
    name: "Sector Rotation: IT Crash",
    date: "Hypothetical",
    description: "Tech/IT earnings miss. Sector-specific selloff.",
    shocks: { RELIANCE:+0.02, TCS:-0.35, HDFCBANK:+0.03, INFY:-0.38, ICICIBANK:+0.01, AXISBANK:0, SBIN:+0.02, WIPRO:-0.40, LT:-0.05, MARUTI:+0.04, Gold:+0.05, Silver:+0.02, RealEstate:0 }
  },
  {
    name: "INR Currency Crisis",
    date: "Hypothetical",
    description: "Sharp INR depreciation. Import-heavy sectors hit.",
    shocks: { RELIANCE:-0.08, TCS:+0.12, HDFCBANK:-0.15, INFY:+0.15, ICICIBANK:-0.18, AXISBANK:-0.20, SBIN:-0.22, WIPRO:+0.12, LT:-0.10, MARUTI:-0.25, Gold:+0.15, Silver:+0.10, RealEstate:-0.05 }
  }
];

export function applyScenario(
  scenario: ScenarioDefinition,
  weightsRecord: Record<string, number>,
  currentValues: number // Total portfolio value
): { portfolioImpact: number; assetImpacts: Record<string, number>; survivingValue: number } {
  let portfolioImpactPercent = 0;
  const assetImpacts: Record<string, number> = {};

  for (const asset in weightsRecord) {
    const w = weightsRecord[asset];
    const shock = scenario.shocks[asset] || 0; // fallback to 0 if not defined
    const impact = w * shock;
    portfolioImpactPercent += impact;
    assetImpacts[asset] = impact;
  }

  const portfolioImpactAmount = portfolioImpactPercent * currentValues;
  const survivingValue = currentValues + portfolioImpactAmount;

  return {
    portfolioImpact: portfolioImpactPercent,
    assetImpacts,
    survivingValue
  };
}
