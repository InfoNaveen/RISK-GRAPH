// ─── Shared TypeScript Interfaces ────────────────────────────────────

export interface Asset {
  name: string;
  ticker: string;
}

export interface AssetParams {
  mu: number;   // annual drift
  sigma: number; // annual volatility
}

export interface CentralityResult {
  asset: string;
  degree: number;
  eigenvectorCentrality: number;
  betweennessCentrality: number;
  weightedDegree: number;
  riskTier: 'Systemic' | 'Elevated' | 'Peripheral';
}

export interface GraphNode {
  id: string;
  index?: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  eigenvectorCentrality: number;
  degree: number;
  betweennessCentrality: number;
}

export interface GraphEdge {
  source: string | GraphNode;
  target: string | GraphNode;
  weight: number; // correlation
}

export interface SimulationResult {
  paths: number[][]; // [simulation][timestep] = portfolio value
  percentile5: number[];
  percentile50: number[];
  percentile95: number[];
  finalValues: number[];
}

export interface VarMetrics {
  var95: number;
  cvar95: number;
  expectedReturn: number;
  sharpeRatio: number;
  probLoss: number;
}

export interface TaxResult {
  stcgEquity: number;
  stcgTax: number;
  ltcgEquity: number;
  ltcgExemption: number;
  ltcgTaxable: number;
  ltcgTax: number;
  ltcgGold: number;
  ltcgGoldTax: number;
  otherIncome: number;
  incomeTax: number;
  totalTaxBeforeSurcharge: number;
  surcharge: number;
  cess: number;
  totalTax: number;
  effectiveRate: number;
}

export interface EquityHolding {
  asset: string;
  units: number;
  purchasePrice: number;
  currentPrice: number;
  purchaseDate: string;
}

export interface PhysicalAssets {
  goldGrams: number;
  silverGrams: number;
  realEstate: number;
  cashFD: number;
}

export interface Liabilities {
  homeLoan: number;
  personalLoan: number;
  creditCard: number;
}

export const ASSET_NAMES = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK',
  'AXISBANK', 'SBIN', 'WIPRO', 'LT', 'MARUTI',
  'Gold', 'Silver', 'RealEstate'
] as const;

export type AssetName = typeof ASSET_NAMES[number];

export const DEFAULT_PRICES: Record<AssetName, number> = {
  RELIANCE: 2950,
  TCS: 4020,
  HDFCBANK: 1680,
  INFY: 1820,
  ICICIBANK: 1250,
  AXISBANK: 1180,
  SBIN: 780,
  WIPRO: 485,
  LT: 3540,
  MARUTI: 12600,
  Gold: 6200,
  Silver: 75,
  RealEstate: 8500,
};

export const ASSET_PARAMS: Record<AssetName, AssetParams> = {
  RELIANCE:  { mu: 0.14, sigma: 0.22 },
  TCS:       { mu: 0.18, sigma: 0.24 },
  HDFCBANK:  { mu: 0.16, sigma: 0.20 },
  INFY:      { mu: 0.20, sigma: 0.26 },
  ICICIBANK: { mu: 0.17, sigma: 0.23 },
  AXISBANK:  { mu: 0.15, sigma: 0.28 },
  SBIN:      { mu: 0.12, sigma: 0.30 },
  WIPRO:     { mu: 0.16, sigma: 0.25 },
  LT:        { mu: 0.13, sigma: 0.24 },
  MARUTI:    { mu: 0.15, sigma: 0.27 },
  Gold:       { mu: 0.11, sigma: 0.16 },
  Silver:     { mu: 0.08, sigma: 0.22 },
  RealEstate: { mu: 0.09, sigma: 0.12 },
};

export const ASSET_COLORS: Record<string, string> = {
  RELIANCE: '#3B82F6', TCS: '#8B5CF6', HDFCBANK: '#10B981', INFY: '#F59E0B',
  ICICIBANK: '#EF4444', AXISBANK: '#EC4899', SBIN: '#14B8A6', WIPRO: '#F97316',
  LT: '#6366F1', MARUTI: '#84CC16',
  Gold: '#D4AF37', Silver: '#A8A9AD', RealEstate: '#8B7355',
};

export const GOLD_PRICE_PER_GRAM = 6200;
export const SILVER_PRICE_PER_GRAM = 75;
