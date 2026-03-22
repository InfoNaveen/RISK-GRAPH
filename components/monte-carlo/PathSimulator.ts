// ─── Path Simulator — GBM Monte Carlo with Cholesky ────────────────
// Pure TypeScript math, no React.

import { choleskyDecomposition, generateNormals, getDrifts } from '@/lib/math';
import type { SimulationResult, VarMetrics } from '@/lib/types';

export function runSimulation(
  selectedAssets: string[],
  weights: number[],        // must sum to 1
  nSimulations: number,
  horizonDays: number,
  initialValue: number,
  covMatrix: number[][]
): SimulationResult {
  const n = selectedAssets.length;
  const dt = 1 / 252; // daily

  const mus = getDrifts(selectedAssets);
  const sigmas = covMatrix.map((row, i) => Math.sqrt(Math.max(0, row[i])));

  // Cholesky of covariance matrix
  const L = choleskyDecomposition(covMatrix);

  const paths: number[][] = [];
  const finalValues: number[] = [];

  for (let sim = 0; sim < nSimulations; sim++) {
    const assetPrices = new Array(n).fill(1.0); // normalized to 1
    const path: number[] = [initialValue];

    for (let t = 0; t < horizonDays; t++) {
      // Generate correlated normals (scaled by cov)
      const z = generateNormals(n);
      const correlatedZ = L.map(row =>
        row.reduce((s, val, j) => s + val * z[j], 0)
      );

      // GBM step for each asset
      for (let i = 0; i < n; i++) {
        const drift = (mus[i] - 0.5 * sigmas[i] * sigmas[i]) * dt;
        const diffusion = Math.sqrt(dt) * correlatedZ[i];
        assetPrices[i] *= Math.exp(drift + diffusion);
      }

      // Portfolio value
      let portfolioValue = 0;
      for (let i = 0; i < n; i++) {
        portfolioValue += weights[i] * assetPrices[i];
      }
      path.push(portfolioValue * initialValue);
    }

    paths.push(path);
    finalValues.push(path[path.length - 1]);
  }

  // Compute percentile paths
  const nSteps = horizonDays + 1;
  const percentile5: number[] = [];
  const percentile50: number[] = [];
  const percentile95: number[] = [];

  for (let t = 0; t < nSteps; t++) {
    const vals = paths.map(p => p[t]).sort((a, b) => a - b);
    percentile5.push(vals[Math.floor(nSimulations * 0.05)]);
    percentile50.push(vals[Math.floor(nSimulations * 0.50)]);
    percentile95.push(vals[Math.floor(nSimulations * 0.95)]);
  }

  return { paths, percentile5, percentile50, percentile95, finalValues };
}

export function computeVarMetrics(
  result: SimulationResult,
  initialValue: number,
  horizonDays: number,
): VarMetrics {
  const { finalValues } = result;
  const n = finalValues.length;
  const sorted = [...finalValues].sort((a, b) => a - b);

  // VaR (95%) = -(5th percentile - initial)
  const p5 = sorted[Math.floor(n * 0.05)];
  const var95 = -(p5 - initialValue);

  // CVaR = average of losses worse than VaR
  const cutoff = Math.floor(n * 0.05);
  const worstLosses = sorted.slice(0, cutoff).map(v => -(v - initialValue));
  const cvar95 = worstLosses.length > 0 ? worstLosses.reduce((s, v) => s + v, 0) / worstLosses.length : 0;

  // Expected return
  const meanFinal = finalValues.reduce((s, v) => s + v, 0) / n;
  const expectedReturn = meanFinal - initialValue;

  // Std dev of returns
  const returns = finalValues.map(v => (v - initialValue) / initialValue);
  const meanReturn = returns.reduce((s, r) => s + r, 0) / n;
  const variance = returns.reduce((s, r) => s + (r - meanReturn) ** 2, 0) / (n - 1);
  const stdDev = Math.sqrt(variance);

  // Sharpe Ratio (annualized)
  const T = horizonDays;
  const sharpeRatio = stdDev > 0 ? (meanReturn / stdDev) * Math.sqrt(252 / T) : 0;

  // Probability of loss
  const lossCount = finalValues.filter(v => v < initialValue).length;
  const probLoss = (lossCount / n) * 100;

  return { var95, cvar95, expectedReturn, sharpeRatio, probLoss };
}
