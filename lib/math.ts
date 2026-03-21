// ─── Quantitative Math Library ──────────────────────────────────────
// All quantitative computations run client-side. No external API calls.

import { ASSET_NAMES, ASSET_PARAMS, type AssetName } from './types';

// ─── 10×10 Correlation Matrix (Indian Equities) ────────────────────
// Order: RELIANCE, TCS, HDFCBANK, INFY, ICICIBANK, AXISBANK, SBIN, WIPRO, LT, MARUTI
export const CORRELATION_MATRIX: number[][] = [
  [1.00, 0.35, 0.52, 0.30, 0.50, 0.45, 0.42, 0.28, 0.48, 0.38],
  [0.35, 1.00, 0.40, 0.68, 0.38, 0.32, 0.25, 0.62, 0.34, 0.30],
  [0.52, 0.40, 1.00, 0.36, 0.72, 0.65, 0.58, 0.33, 0.42, 0.35],
  [0.30, 0.68, 0.36, 1.00, 0.34, 0.28, 0.22, 0.58, 0.30, 0.26],
  [0.50, 0.38, 0.72, 0.34, 1.00, 0.62, 0.55, 0.30, 0.40, 0.33],
  [0.45, 0.32, 0.65, 0.28, 0.62, 1.00, 0.52, 0.26, 0.38, 0.30],
  [0.42, 0.25, 0.58, 0.22, 0.55, 0.52, 1.00, 0.20, 0.35, 0.28],
  [0.28, 0.62, 0.33, 0.58, 0.30, 0.26, 0.20, 1.00, 0.28, 0.24],
  [0.48, 0.34, 0.42, 0.30, 0.40, 0.38, 0.35, 0.28, 1.00, 0.42],
  [0.38, 0.30, 0.35, 0.26, 0.33, 0.30, 0.28, 0.24, 0.42, 1.00],
];

const N = ASSET_NAMES.length;

// ─── Matrix Utilities ───────────────────────────────────────────────

export function matMul(A: number[][], B: number[][]): number[][] {
  const rows = A.length, cols = B[0].length, inner = B.length;
  const C: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0));
  for (let i = 0; i < rows; i++)
    for (let k = 0; k < inner; k++)
      for (let j = 0; j < cols; j++)
        C[i][j] += A[i][k] * B[k][j];
  return C;
}

export function matVecMul(M: number[][], v: number[]): number[] {
  return M.map(row => row.reduce((s, val, j) => s + val * v[j], 0));
}

export function vecNorm(v: number[]): number {
  return Math.sqrt(v.reduce((s, x) => s + x * x, 0));
}

export function vecDot(a: number[], b: number[]): number {
  return a.reduce((s, x, i) => s + x * b[i], 0);
}

// ─── Power Iteration for Dominant Eigenvector ───────────────────────
export function powerIteration(
  M: number[][],
  maxIter: number = 50,
  tol: number = 1e-6
): { eigenvalue: number; eigenvector: number[] } {
  const n = M.length;
  let v = new Array(n).fill(1 / Math.sqrt(n));
  let eigenvalue = 0;

  for (let iter = 0; iter < maxIter; iter++) {
    const Mv = matVecMul(M, v);
    const norm = vecNorm(Mv);
    const vNew = Mv.map(x => x / norm);

    // Check convergence
    const diff = Math.sqrt(vNew.reduce((s, x, i) => s + (x - v[i]) ** 2, 0));
    v = vNew;
    eigenvalue = norm;
    if (diff < tol) break;
  }

  // Ensure all components are positive (for eigenvector centrality)
  const minVal = Math.min(...v);
  if (minVal < 0) v = v.map(x => -x);

  return { eigenvalue, eigenvector: v };
}

// ─── Eigenvector Centrality ─────────────────────────────────────────
export function eigenvectorCentrality(adjacencyMatrix: number[][]): number[] {
  const { eigenvector } = powerIteration(adjacencyMatrix);
  // Normalize to [0, 1]
  const maxVal = Math.max(...eigenvector);
  return eigenvector.map(v => v / maxVal);
}

// ─── Brandes Algorithm for Betweenness Centrality ───────────────────
export function betweennessCentrality(adjacencyMatrix: number[][], threshold: number = 0.0): number[] {
  const n = adjacencyMatrix.length;
  const CB = new Array(n).fill(0);

  for (let s = 0; s < n; s++) {
    const S: number[] = [];
    const P: number[][] = Array.from({ length: n }, () => []);
    const sigma = new Array(n).fill(0);
    sigma[s] = 1;
    const d = new Array(n).fill(-1);
    d[s] = 0;
    const Q: number[] = [s];

    // BFS
    let head = 0;
    while (head < Q.length) {
      const v = Q[head++];
      S.push(v);
      for (let w = 0; w < n; w++) {
        if (w === v || Math.abs(adjacencyMatrix[v][w]) <= threshold) continue;
        if (d[w] < 0) {
          Q.push(w);
          d[w] = d[v] + 1;
        }
        if (d[w] === d[v] + 1) {
          sigma[w] += sigma[v];
          P[w].push(v);
        }
      }
    }

    // Accumulation
    const delta = new Array(n).fill(0);
    while (S.length > 0) {
      const w = S.pop()!;
      for (const v of P[w]) {
        delta[v] += (sigma[v] / sigma[w]) * (1 + delta[w]);
      }
      if (w !== s) CB[w] += delta[w];
    }
  }

  // Normalize
  const factor = n > 2 ? 1 / ((n - 1) * (n - 2)) : 1;
  const normalized = CB.map(x => x * factor);
  const maxBC = Math.max(...normalized, 1e-10);
  return normalized.map(x => x / maxBC);
}

// ─── Degree Calculations ────────────────────────────────────────────
export function computeDegree(adjacencyMatrix: number[][], threshold: number = 0.4): number[] {
  return adjacencyMatrix.map(row =>
    row.reduce((deg, val, j) => deg + (Math.abs(val) > threshold && val !== 1 ? 1 : 0), 0)
  );
}

export function computeWeightedDegree(adjacencyMatrix: number[][]): number[] {
  return adjacencyMatrix.map(row =>
    row.reduce((s, val) => s + (val !== 1 ? Math.abs(val) : 0), 0)
  );
}

// ─── GSVI Computation ───────────────────────────────────────────────
export function computeGSVI(eigCentrality: number[], betCentrality: number[]): number {
  const n = eigCentrality.length;
  let gsvi = 0;
  for (let i = 0; i < n; i++) {
    const ci = 0.6 * eigCentrality[i] + 0.4 * betCentrality[i];
    gsvi += (1 / n) * ci;
  }
  return gsvi;
}

// ─── Network Density ────────────────────────────────────────────────
export function networkDensity(adjacencyMatrix: number[][], threshold: number = 0.4): number {
  const n = adjacencyMatrix.length;
  let edges = 0;
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++)
      if (Math.abs(adjacencyMatrix[i][j]) > threshold) edges++;
  return (2 * edges) / (n * (n - 1));
}

// ─── Spectral Risk Ratio ────────────────────────────────────────────
export function spectralRiskRatio(adjacencyMatrix: number[][]): number {
  const { eigenvalue } = powerIteration(adjacencyMatrix);
  return eigenvalue / adjacencyMatrix.length;
}

// ─── Cholesky Decomposition ─────────────────────────────────────────
export function choleskyDecomposition(matrix: number[][]): number[][] {
  const n = matrix.length;
  const L: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  const eps = 1e-10; // Ridge for numerical stability

  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = 0;
      for (let k = 0; k < j; k++) {
        sum += L[i][k] * L[j][k];
      }
      if (i === j) {
        const val = matrix[i][i] - sum + eps;
        L[i][j] = Math.sqrt(Math.max(val, eps));
      } else {
        L[i][j] = (matrix[i][j] - sum) / L[j][j];
      }
    }
  }
  return L;
}

// ─── Box-Muller Transform ───────────────────────────────────────────
export function boxMuller(u1?: number, u2?: number): [number, number] {
  let v1 = u1 ?? 0;
  let v2 = u2 ?? 0;
  while (v1 === 0) v1 = Math.random();
  while (v2 === 0) v2 = Math.random();
  const mag = Math.sqrt(-2 * Math.log(v1));
  return [
    mag * Math.cos(2 * Math.PI * v2),
    mag * Math.sin(2 * Math.PI * v2),
  ];
}

export function generateNormals(n: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < n; i += 2) {
    const [z1, z2] = boxMuller();
    result.push(z1);
    if (i + 1 < n) result.push(z2);
  }
  return result;
}

// ─── Stress Covariance ──────────────────────────────────────────────
export function stressCovariance(alpha: number, vols: number[]): number[][] {
  const n = vols.length;
  const sigma: number[][] = [];
  // Σ_stress(α) = (1-α)Σ + α Σ_max
  // where Σ = D * C * D (D = diag of vols, C = correlation)
  // and Σ_max = σσᵀ (all correlations = 1)
  for (let i = 0; i < n; i++) {
    sigma[i] = [];
    for (let j = 0; j < n; j++) {
      const original = vols[i] * CORRELATION_MATRIX[i][j] * vols[j];
      const stressed = vols[i] * vols[j]; // correlation = 1
      sigma[i][j] = (1 - alpha) * original + alpha * stressed;
    }
  }
  return sigma;
}

// ─── Portfolio Variance ─────────────────────────────────────────────
export function portfolioVariance(weights: number[], covMatrix: number[][]): number {
  let variance = 0;
  const n = weights.length;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      variance += weights[i] * weights[j] * covMatrix[i][j];
  return variance;
}

// ─── Get Volatilities Array ─────────────────────────────────────────
export function getVolatilities(): number[] {
  return ASSET_NAMES.map(name => ASSET_PARAMS[name].sigma);
}

// ─── Contagion Simulation ───────────────────────────────────────────
export function contagionStep(
  w: number[],
  adjacencyMatrix: number[][],
  beta: number
): number[] {
  const n = w.length;
  const Aw = matVecMul(adjacencyMatrix, w);
  const wNew = w.map((wi, i) => wi + beta * Aw[i]);
  // Normalize
  const sum = wNew.reduce((s, x) => s + Math.abs(x), 0);
  return wNew.map(x => Math.abs(x) / sum);
}

// ─── Indian Number Format ───────────────────────────────────────────
export function formatINR(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatINRPrecise(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);
}
