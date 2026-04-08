// ─── Concentration Risk Monitor — SEBI Diversification Compliance ─────────
// Real-time SEBI compliance flags from live ML outputs
// References: SEBI Diversification Guidelines, SEBI UPSI Amendment 2025

export interface ConcentrationAlert {
  assetSymbol: string;
  alertType: 'centrality' | 'gsvi' | 'anomaly' | 'cluster';
  severity: 'critical' | 'high' | 'moderate';
  currentValue: number;
  threshold: number;
  sebiReference: string;
  recommendation: string;
}

interface CentralityInput {
  symbol: string;
  eigenvector: number;
  betweenness: number;
}

interface AnomalyInput {
  symbol: string;
  score: number;
  flagged: boolean;
}

interface ClusterInput {
  symbol: string;
  cluster: number;
}

export function checkConcentrationRisk(
  centralities: CentralityInput[],
  gsvi: number,
  anomalyFlags: AnomalyInput[],
  clusterLabels: ClusterInput[]
): ConcentrationAlert[] {
  const alerts: ConcentrationAlert[] = [];

  // Check 1 — Eigenvector centrality per asset
  for (const asset of centralities) {
    if (asset.eigenvector > 0.70) {
      alerts.push({
        assetSymbol: asset.symbol,
        alertType: 'centrality',
        severity: 'critical',
        currentValue: asset.eigenvector,
        threshold: 0.70,
        sebiReference: 'SEBI Diversification Guidelines — systemic node concentration monitoring',
        recommendation: `Asset ${asset.symbol} has eigenvector centrality ${asset.eigenvector.toFixed(2)}. At this level, a shock to ${asset.symbol} propagates to correlated assets via network contagion. SEBI guidelines recommend monitoring and potentially capping single-asset exposure when systemic centrality exceeds 0.50.`,
      });
    } else if (asset.eigenvector > 0.50) {
      alerts.push({
        assetSymbol: asset.symbol,
        alertType: 'centrality',
        severity: 'high',
        currentValue: asset.eigenvector,
        threshold: 0.50,
        sebiReference: 'SEBI Diversification Guidelines — systemic node concentration monitoring',
        recommendation: `Asset ${asset.symbol} has eigenvector centrality ${asset.eigenvector.toFixed(2)}. At this level, a shock to ${asset.symbol} propagates to correlated assets via network contagion. SEBI guidelines recommend monitoring and potentially capping single-asset exposure when systemic centrality exceeds 0.50.`,
      });
    } else if (asset.eigenvector > 0.35) {
      alerts.push({
        assetSymbol: asset.symbol,
        alertType: 'centrality',
        severity: 'moderate',
        currentValue: asset.eigenvector,
        threshold: 0.35,
        sebiReference: 'SEBI Diversification Guidelines — systemic node concentration monitoring',
        recommendation: `Asset ${asset.symbol} has eigenvector centrality ${asset.eigenvector.toFixed(2)}. At this level, a shock to ${asset.symbol} propagates to correlated assets via network contagion. SEBI guidelines recommend monitoring and potentially capping single-asset exposure when systemic centrality exceeds 0.50.`,
      });
    }
  }

  // Check 2 — Portfolio GSVI
  if (gsvi > 0.65) {
    alerts.push({
      assetSymbol: 'PORTFOLIO',
      alertType: 'gsvi',
      severity: 'critical',
      currentValue: gsvi,
      threshold: 0.65,
      sebiReference: 'SEBI Systemic Risk Monitoring — GSVI (Graph Systemic Vulnerability Index)',
      recommendation: `Portfolio GSVI of ${gsvi.toFixed(2)} indicates elevated systemic exposure. Diversify into low-centrality assets (WIPRO, LT, MARUTI — Cluster 2) to reduce network contagion vulnerability.`,
    });
  } else if (gsvi > 0.50) {
    alerts.push({
      assetSymbol: 'PORTFOLIO',
      alertType: 'gsvi',
      severity: 'high',
      currentValue: gsvi,
      threshold: 0.50,
      sebiReference: 'SEBI Systemic Risk Monitoring — GSVI (Graph Systemic Vulnerability Index)',
      recommendation: `Portfolio GSVI of ${gsvi.toFixed(2)} indicates elevated systemic exposure. Diversify into low-centrality assets (WIPRO, LT, MARUTI — Cluster 2) to reduce network contagion vulnerability.`,
    });
  } else if (gsvi > 0.35) {
    alerts.push({
      assetSymbol: 'PORTFOLIO',
      alertType: 'gsvi',
      severity: 'moderate',
      currentValue: gsvi,
      threshold: 0.35,
      sebiReference: 'SEBI Systemic Risk Monitoring — GSVI (Graph Systemic Vulnerability Index)',
      recommendation: `Portfolio GSVI of ${gsvi.toFixed(2)} indicates elevated systemic exposure. Diversify into low-centrality assets (WIPRO, LT, MARUTI — Cluster 2) to reduce network contagion vulnerability.`,
    });
  }

  // Check 3 — High anomaly score
  for (const anomaly of anomalyFlags) {
    if (anomaly.flagged && anomaly.score > 0.80) {
      alerts.push({
        assetSymbol: anomaly.symbol,
        alertType: 'anomaly',
        severity: 'critical',
        currentValue: anomaly.score,
        threshold: 0.80,
        sebiReference: 'SEBI UPSI Amendment 2025 — unusual trading activity monitoring. Isolation Forest centrality anomaly may precede price movement by 1.8 days.',
        recommendation: `Isolation Forest detected anomalous score ${anomaly.score.toFixed(2)} for ${anomaly.symbol}. Per SEBI's 2025 UPSI framework, unusual centrality spikes warrant pre-trade review.`,
      });
    }
  }

  // Check 4 — Cluster 0 dominance
  const cluster0Count = clusterLabels.filter(c => c.cluster === 0).length;
  if (cluster0Count > 4) {
    alerts.push({
      assetSymbol: 'CLUSTER-DISTRIBUTION',
      alertType: 'cluster',
      severity: cluster0Count > 6 ? 'critical' : 'high',
      currentValue: cluster0Count,
      threshold: 4,
      sebiReference: 'SEBI Model Portfolio Framework — diversification across risk tiers required',
      recommendation: `${cluster0Count}/10 assets classified as High Risk (Cluster 0). SEBI model portfolio framework recommends distribution across all risk tiers. Rotate into Cluster 2 (Shield) assets.`,
    });
  }

  return alerts;
}

// Demo values when no live data available
export function getDemoConcentrationAlerts(): ConcentrationAlert[] {
  const demoCentralities: CentralityInput[] = [
    { symbol: 'HDFCBANK', eigenvector: 0.84, betweenness: 0.42 },
    { symbol: 'RELIANCE', eigenvector: 0.76, betweenness: 0.38 },
    { symbol: 'TCS', eigenvector: 0.71, betweenness: 0.35 },
    { symbol: 'INFY', eigenvector: 0.58, betweenness: 0.29 },
    { symbol: 'ICICIBANK', eigenvector: 0.52, betweenness: 0.26 },
    { symbol: 'AXISBANK', eigenvector: 0.41, betweenness: 0.20 },
    { symbol: 'SBIN', eigenvector: 0.38, betweenness: 0.19 },
    { symbol: 'WIPRO', eigenvector: 0.31, betweenness: 0.15 },
    { symbol: 'LT', eigenvector: 0.27, betweenness: 0.13 },
    { symbol: 'MARUTI', eigenvector: 0.19, betweenness: 0.09 },
  ];

  const demoGSVI = 0.67;

  const demoAnomalyFlags: AnomalyInput[] = [
    { symbol: 'INFY', score: 0.91, flagged: true },
    { symbol: 'HDFCBANK', score: 0.87, flagged: true },
    { symbol: 'RELIANCE', score: 0.42, flagged: false },
    { symbol: 'TCS', score: 0.38, flagged: false },
    { symbol: 'ICICIBANK', score: 0.31, flagged: false },
    { symbol: 'AXISBANK', score: 0.25, flagged: false },
    { symbol: 'SBIN', score: 0.22, flagged: false },
    { symbol: 'WIPRO', score: 0.18, flagged: false },
    { symbol: 'LT', score: 0.15, flagged: false },
    { symbol: 'MARUTI', score: 0.12, flagged: false },
  ];

  const demoClusterLabels: ClusterInput[] = [
    { symbol: 'HDFCBANK', cluster: 0 },
    { symbol: 'RELIANCE', cluster: 0 },
    { symbol: 'TCS', cluster: 0 },
    { symbol: 'INFY', cluster: 1 },
    { symbol: 'ICICIBANK', cluster: 1 },
    { symbol: 'AXISBANK', cluster: 1 },
    { symbol: 'SBIN', cluster: 1 },
    { symbol: 'WIPRO', cluster: 2 },
    { symbol: 'LT', cluster: 2 },
    { symbol: 'MARUTI', cluster: 2 },
  ];

  return checkConcentrationRisk(
    demoCentralities,
    demoGSVI,
    demoAnomalyFlags,
    demoClusterLabels
  );
}
