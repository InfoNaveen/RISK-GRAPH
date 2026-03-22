// ─── Quantitative Math Library ──────────────────────────────────────
// All quantitative computations run client-side. No external API calls.

import { ASSET_NAMES, ASSET_PARAMS, type AssetName } from './types';

// ─── Jacobi Eigenvalue Decomp for symmetric matrices ──────────────────
export function jacobiEigenvalue(matrix: number[][], maxIter = 1000, tol = 1e-9): { eigenvalues: number[], eigenvectors: number[][] } {
  const n = matrix.length;
  let A = matrix.map(row => [...row]);
  let V: number[][] = Array.from({length: n}, (_, i) => Array.from({length: n}, (_, j) => i === j ? 1 : 0));
  
  for (let iter = 0; iter < maxIter; iter++) {
    let maxOffDiag = 0;
    let p = 0, q = 0;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const val = Math.abs(A[i][j]);
        if (val > maxOffDiag) {
          maxOffDiag = val;
          p = i;
          q = j;
        }
      }
    }
    
    if (maxOffDiag < tol) break;
    
    const diff = A[q][q] - A[p][p];
    let t = 0;
    if (Math.abs(diff) < tol) {
      t = A[p][q] > 0 ? 1 : -1;
    } else {
      const theta = diff / (2 * A[p][q]);
      t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
    }
    
    const c = 1 / Math.sqrt(t * t + 1);
    const s = t * c;
    
    for (let i = 0; i < n; i++) {
      if (i !== p && i !== q) {
        const aip = A[i][p];
        const aiq = A[i][q];
        A[i][p] = c * aip - s * aiq;
        A[p][i] = A[i][p];
        A[i][q] = s * aip + c * aiq;
        A[q][i] = A[i][q];
      }
    }
    const app = A[p][p];
    const aqq = A[q][q];
    const apq = A[p][q];
    A[p][p] = c * c * app - 2 * s * c * apq + s * s * aqq;
    A[q][q] = s * s * app + 2 * s * c * apq + c * c * aqq;
    A[p][q] = 0;
    A[q][p] = 0;
    
    for (let i = 0; i < n; i++) {
        const vip = V[i][p];
        const viq = V[i][q];
        V[i][p] = c * vip - s * viq;
        V[i][q] = s * vip + c * viq;
    }
  }
  
  return { eigenvalues: A.map((row, i) => row[i]), eigenvectors: V };
}

// ─── nearestPSD correlation matrix correction ───────────────────────
export function nearestPSD(matrix: number[][], epsilon = 1e-6): number[][] {
  const n = matrix.length;
  const { eigenvalues, eigenvectors } = jacobiEigenvalue(matrix);
  const clippedEig = eigenvalues.map(v => Math.max(v, epsilon));
  
  const res: number[][] = Array.from({length: n}, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      let sum = 0;
      for (let k = 0; k < n; k++) {
        sum += eigenvectors[i][k] * clippedEig[k] * eigenvectors[j][k];
      }
      res[i][j] = sum;
    }
  }
  
  for (let i=0; i<n; i++) {
    for (let j=0; j<n; j++) {
      if (i !== j) {
        res[i][j] = res[i][j] / Math.sqrt(res[i][i] * res[j][j]);
      }
    }
  }
  for (let i=0; i<n; i++) res[i][i] = 1.0;
  
  return res;
}

// ─── 13×13 Correlation Matrix (Equities + Gold, Silver, RealEstate) ───
const RAW_CORRELATION_MATRIX: number[][] = [
  [1.00, 0.35, 0.52, 0.30, 0.50, 0.45, 0.42, 0.28, 0.48, 0.38, 0.10, 0.12, 0.25],
  [0.35, 1.00, 0.40, 0.68, 0.38, 0.32, 0.25, 0.62, 0.34, 0.30, 0.12, 0.15, 0.30],
  [0.52, 0.40, 1.00, 0.36, 0.72, 0.65, 0.58, 0.33, 0.42, 0.35, 0.08, 0.10, 0.22],
  [0.30, 0.68, 0.36, 1.00, 0.34, 0.28, 0.22, 0.58, 0.30, 0.26, 0.15, 0.18, 0.35],
  [0.50, 0.38, 0.72, 0.34, 1.00, 0.62, 0.55, 0.30, 0.40, 0.33, 0.05, 0.08, 0.20],
  [0.45, 0.32, 0.65, 0.28, 0.62, 1.00, 0.52, 0.26, 0.38, 0.30, 0.14, 0.16, 0.28],
  [0.42, 0.25, 0.58, 0.22, 0.55, 0.52, 1.00, 0.20, 0.35, 0.28, 0.11, 0.13, 0.24],
  [0.28, 0.62, 0.33, 0.58, 0.30, 0.26, 0.20, 1.00, 0.28, 0.24, 0.09, 0.11, 0.26],
  [0.48, 0.34, 0.42, 0.30, 0.40, 0.38, 0.35, 0.28, 1.00, 0.42, 0.13, 0.17, 0.32],
  [0.38, 0.30, 0.35, 0.26, 0.33, 0.30, 0.28, 0.24, 0.42, 1.00, 0.07, 0.09, 0.21],
  [0.10, 0.12, 0.08, 0.15, 0.05, 0.14, 0.11, 0.09, 0.13, 0.07, 1.00, 0.72, 0.25],
  [0.12, 0.15, 0.10, 0.18, 0.08, 0.16, 0.13, 0.11, 0.17, 0.09, 0.72, 1.00, 0.20],
  [0.25, 0.30, 0.22, 0.35, 0.20, 0.28, 0.24, 0.26, 0.32, 0.21, 0.25, 0.20, 1.00],
];

export const CORRELATION_MATRIX = nearestPSD(RAW_CORRELATION_MATRIX);
export const lambdaMax = Math.max(...jacobiEigenvalue(CORRELATION_MATRIX).eigenvalues);

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
export function stressCovariance(alpha: number, vols: number[], covMatrix: number[][] = CORRELATION_MATRIX): number[][] {
  const n = vols.length;
  const sigma: number[][] = [];
  for (let i = 0; i < n; i++) {
    sigma[i] = [];
    for (let j = 0; j < n; j++) {
      const original = vols[i] * covMatrix[i][j] * vols[j];
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

// ─── Get Volatilities & Drifts ──────────────────────────────────────
export function getVolatilities(tickers?: string[]): number[] {
  const assets = tickers ? tickers.filter(t => ASSET_NAMES.includes(t as any)) : ASSET_NAMES;
  return assets.map(name => ASSET_PARAMS[name as AssetName].sigma);
}

export function getDrifts(tickers?: string[]): number[] {
  const assets = tickers ? tickers.filter(t => ASSET_NAMES.includes(t as any)) : ASSET_NAMES;
  return assets.map(name => ASSET_PARAMS[name as AssetName].mu);
}

// ─── Get Correlation Sub Matrix ─────────────────────────────────────
export function getCorrelationSubMatrix(tickers: string[], matrix: number[][] = CORRELATION_MATRIX): number[][] {
  const indices = tickers
    .map(t => ASSET_NAMES.indexOf(t as any))
    .filter(i => i !== -1);
  if (indices.length < 2) return [[1]];
  
  const subMatrix: number[][] = [];
  for (let i = 0; i < indices.length; i++) {
    subMatrix[i] = [];
    for (let j = 0; j < indices.length; j++) {
      subMatrix[i][j] = matrix[indices[i]][indices[j]];
    }
  }
  return nearestPSD(subMatrix);
}

// ─── Compute Histogram ──────────────────────────────────────────────
export function computeHistogram(values: number[], numBins: number): { binEdges: number[], counts: number[], density: number[] } {
  if (values.length === 0) return { binEdges: [], counts: [], density: [] };
  const maxV = Math.max(...values);
  const minV = Math.min(...values);
  const step = (maxV - minV) / numBins;
  const binEdges = Array.from({length: numBins + 1}, (_, i) => minV + i * step);
  const counts = new Array(numBins).fill(0);
  for (const v of values) {
    let bin = Math.floor((v - minV) / step);
    if (bin >= numBins) bin = numBins - 1;
    if (bin < 0) bin = 0;
    counts[bin]++;
  }
  const density = counts.map(c => c / (values.length * step || 1));
  return { binEdges, counts, density };
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

// ─── NEW ADDITIONS FOR MODULES 8-11 ─────────────────────────────────

export function computeAllEigenvalues(matrix: number[][]): number[] {
  const n = matrix.length;
  let A = matrix.map(row => [...row]);
  const eigenvals: number[] = [];

  for (let i = 0; i < n; i++) {
    const { eigenvalue, eigenvector } = powerIteration(A, 200, 1e-7);
    eigenvals.push(eigenvalue);
    
    // Deflate: A = A - lambda * v * v^T
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        A[r][c] -= eigenvalue * eigenvector[r] * eigenvector[c];
      }
    }
  }

  // Ensure they are sorted descending
  return eigenvals.sort((a, b) => b - a);
}

export function computeMarginalRiskContribution(weights: number[], covMatrix: number[][]): number[] {
  const sigmaP = Math.sqrt(portfolioVariance(weights, covMatrix));
  if (sigmaP === 0) return weights.map(() => 0);
  
  const covTimesW = matVecMul(covMatrix, weights); // (Σw)_i
  return covTimesW.map(val => val / sigmaP);
}

export function computeComponentRiskContribution(weights: number[], covMatrix: number[][]): number[] {
  const mrc = computeMarginalRiskContribution(weights, covMatrix);
  return weights.map((w, i) => w * mrc[i]);
}

export function computeRollingVolatility(returns: number[], window: number): number[] {
  const result: number[] = [];
  for (let t = 0; t < returns.length; t++) {
    if (t < window - 1) {
      result.push(NaN);
    } else {
      const windowReturns = returns.slice(t - window + 1, t + 1);
      const mean = windowReturns.reduce((sum, r) => sum + r, 0) / window;
      const variance = windowReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (window - 1);
      result.push(Math.sqrt(variance) * Math.sqrt(252));
    }
  }
  return result;
}

export function computeDrawdown(prices: number[]): number[] {
  let runningMax = prices[0];
  return prices.map(price => {
    if (price > runningMax) runningMax = price;
    return (price - runningMax) / runningMax; // always <= 0
  });
}

export function computeMaxDrawdown(prices: number[]): { mdd: number, peakIdx: number, troughIdx: number } {
  const drawdowns = computeDrawdown(prices);
  let mdd = 0;
  let troughIdx = 0;
  let peakIdx = 0;
  
  for (let i = 0; i < drawdowns.length; i++) {
    if (drawdowns[i] < mdd) {
      mdd = drawdowns[i];
      troughIdx = i;
    }
  }
  
  // Find the peak that led to this trough
  let maxP = prices[0];
  for (let i = 0; i <= troughIdx; i++) {
    if (prices[i] > maxP) {
      maxP = prices[i];
      peakIdx = i;
    }
  }
  
  return { mdd, peakIdx, troughIdx };
}

