export type FrontierPoint = {
  return: number;
  vol: number;
  weights: Record<string, number>;
  sharpe: number;
};

// Gaussian elimination with partial pivoting to invert a matrix
function invertMatrix(matrix: number[][]): number[][] {
  const n = matrix.length;
  // Create augmented matrix [A | I]
  const a = matrix.map((row, i) => [
    ...row,
    ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
  ]);

  for (let i = 0; i < n; i++) {
    // Partial pivoting
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(a[k][i]) > Math.abs(a[maxRow][i])) {
        maxRow = k;
      }
    }
    // Swap rows
    const temp = a[i];
    a[i] = a[maxRow];
    a[maxRow] = temp;

    // Make diagonal 1
    const p = a[i][i];
    if (Math.abs(p) < 1e-12) {
      throw new Error("Matrix is singular or nearly singular");
    }
    for (let j = i; j < 2 * n; j++) {
      a[i][j] /= p;
    }

    // Eliminate other rows
    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = a[k][i];
        for (let j = i; j < 2 * n; j++) {
          a[k][j] -= factor * a[i][j];
        }
      }
    }
  }

  // Extract the right half [I | A^-1]
  return a.map(row => row.slice(n, 2 * n));
}

function solveWeights(
  invSigma: number[][],
  mu: number[],
  targetReturn: number
): number[] {
  const n = mu.length;
  // A = invSigma * 1
  const A = invSigma.map(row => row.reduce((sum, val) => sum + val, 0));
  // B = invSigma * mu
  const B = invSigma.map(row => row.reduce((sum, val, j) => sum + val * mu[j], 0));

  const a = A.reduce((sum, val) => sum + val, 0);       // 1^T * A
  const b = A.reduce((sum, val, i) => sum + val * mu[i], 0); // mu^T * A = 1^T * B
  const c = B.reduce((sum, val, i) => sum + val * mu[i], 0); // mu^T * B

  const D = a * c - b * b;
  
  if (Math.abs(D) < 1e-10) {
    // Fallback equeweight if determinant is too small (e.g. constant mu)
    return Array(n).fill(1/n);
  }

  const lambda1 = (a * targetReturn - b) / D;
  const lambda2 = (c - b * targetReturn) / D;

  const w = new Array(n);
  for (let i = 0; i < n; i++) {
    w[i] = lambda1 * B[i] + lambda2 * A[i];
  }
  return w;
}

export function computeEfficientFrontier(
  assets: string[],
  mu: number[],
  covMatrix: number[][],
  riskFreeRate: number = 0.065,
  longOnly: boolean = false
): FrontierPoint[] {
  const n = mu.length;
  if (n < 2) return [];

  // Add small ridge to covMatrix for numerical stability
  const eps = 1e-4;
  const ridgeCov = covMatrix.map((row, i) =>
    row.map((val, j) => (i === j ? val + eps : val))
  );

  let invSigma: number[][];
  try {
    invSigma = invertMatrix(ridgeCov);
  } catch (e) {
    console.warn("Matrix inversion failed, falling back to equal weights");
    invSigma = covMatrix.map((_, i) => Array.from({length: n}, (_, j) => i === j ? 1 : 0));
  }

  const minMu = Math.min(...mu);
  const maxMu = Math.max(...mu);
  
  // Sweep target returns
  const numSteps = 200;
  const points: FrontierPoint[] = [];

  for (let step = 0; step < numSteps; step++) {
    const targetMu = minMu + (maxMu - minMu) * (step / (numSteps - 1));
    
    let w = solveWeights(invSigma, mu, targetMu);
    
    // Projected Gradient for Long-Only
    if (longOnly) {
      for (let iter = 0; iter < 10; iter++) {
        let needsRenormalize = false;
        for (let i = 0; i < n; i++) {
          if (w[i] < 0) {
            w[i] = 0;
            needsRenormalize = true;
          }
        }
        if (!needsRenormalize) break;
        
        const sum = w.reduce((s, val) => s + val, 0);
        if (sum > 0) {
          w = w.map(val => val / sum);
        } else {
          w = Array(n).fill(1/n);
        }
      }
    }

    // Evaluate portfolio
    let pr = 0;
    let pvar = 0;
    for (let i = 0; i < n; i++) {
      pr += w[i] * mu[i];
      for (let j = 0; j < n; j++) {
        pvar += w[i] * w[j] * covMatrix[i][j];
      }
    }
    
    const pvol = Math.sqrt(pvar);
    const sharpe = pvol > 0 ? (pr - riskFreeRate) / pvol : 0;
    
    const weightsRecord: Record<string, number> = {};
    assets.forEach((asset, idx) => {
      weightsRecord[asset] = w[idx];
    });

    points.push({
      return: pr,
      vol: pvol,
      weights: weightsRecord,
      sharpe
    });
  }

  // Filter out the lower half of the parabola (inefficient part)
  // Find global minimum variance point first
  let minVol = Infinity;
  let minVolIdx = 0;
  points.forEach((pt, idx) => {
    if (pt.vol < minVol) {
      minVol = pt.vol;
      minVolIdx = idx;
    }
  });

  return points.slice(minVolIdx);
}

export function computeMinVariancePortfolio(
  assets: string[],
  covMatrix: number[][]
): FrontierPoint {
  const n = assets.length;
  // Ridge
  const eps = 1e-4;
  const ridgeCov = covMatrix.map((row, i) =>
    row.map((val, j) => (i === j ? val + eps : val))
  );

  let invSigma: number[][];
  try {
    invSigma = invertMatrix(ridgeCov);
  } catch (e) {
    invSigma = covMatrix.map((_, i) => Array.from({length: n}, (_, j) => i === j ? 1 : 0));
  }

  // w = (Sigma^-1 * 1) / (1^T * Sigma^-1 * 1)
  const A = invSigma.map(row => row.reduce((sum, val) => sum + val, 0));
  const a = A.reduce((sum, val) => sum + val, 0);
  
  const w = a !== 0 ? A.map(v => v / a) : Array(n).fill(1/n);

  let pvar = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      pvar += w[i] * w[j] * covMatrix[i][j];
    }
  }

  const weightsRecord: Record<string, number> = {};
  assets.forEach((asset, idx) => {
    weightsRecord[asset] = w[idx];
  });

  return {
    return: 0, // Ignored
    vol: Math.sqrt(pvar),
    weights: weightsRecord,
    sharpe: 0
  };
}

export function computeMaxSharpePortfolio(
  assets: string[],
  mu: number[],
  covMatrix: number[][],
  riskFreeRate: number = 0.065
): FrontierPoint {
  const n = mu.length;
  
  // Create excess returns vector
  const excessMu = mu.map(r => r - riskFreeRate);
  
  const eps = 1e-4;
  const ridgeCov = covMatrix.map((row, i) =>
    row.map((val, j) => (i === j ? val + eps : val))
  );

  let invSigma: number[][];
  try {
    invSigma = invertMatrix(ridgeCov);
  } catch (e) {
    invSigma = covMatrix.map((_, i) => Array.from({length: n}, (_, j) => i === j ? 1 : 0));
  }

  // w unnormalized = Sigma^-1 * excessMu
  const wUnnorm = invSigma.map(row => row.reduce((sum, val, j) => sum + val * excessMu[j], 0));
  const sumW = wUnnorm.reduce((sum, val) => sum + val, 0);
  
  const w = sumW !== 0 ? wUnnorm.map(val => val / sumW) : Array(n).fill(1/n);

  let pr = 0;
  let pvar = 0;
  for (let i = 0; i < n; i++) {
    pr += w[i] * mu[i];
    for (let j = 0; j < n; j++) {
      pvar += w[i] * w[j] * covMatrix[i][j];
    }
  }

  const pvol = Math.sqrt(pvar);
  const sharpe = pvol > 0 ? (pr - riskFreeRate) / pvol : 0;

  const weightsRecord: Record<string, number> = {};
  assets.forEach((asset, idx) => {
    weightsRecord[asset] = w[idx];
  });

  return {
    return: pr,
    vol: pvol,
    weights: weightsRecord,
    sharpe
  };
}

export function simulateRandomPortfolios(
  nSimulations: number,
  assets: string[],
  mu: number[],
  covMatrix: number[][],
  riskFreeRate: number = 0.065
): FrontierPoint[] {
  const n = assets.length;
  const points: FrontierPoint[] = [];

  for (let s = 0; s < nSimulations; s++) {
    // Random long-only weights
    let w = Array.from({ length: n }, () => Math.random());
    const sumW = w.reduce((sum, val) => sum + val, 0);
    w = w.map(val => val / sumW);

    let pr = 0;
    let pvar = 0;
    for (let i = 0; i < n; i++) {
      pr += w[i] * mu[i];
      for (let j = 0; j < n; j++) {
        pvar += w[i] * w[j] * covMatrix[i][j];
      }
    }

    const pvol = Math.sqrt(pvar);
    const sharpe = pvol > 0 ? (pr - riskFreeRate) / pvol : 0;

    const weightsRecord: Record<string, number> = {};
    assets.forEach((asset, idx) => {
      weightsRecord[asset] = w[idx];
    });

    points.push({
      return: pr,
      vol: pvol,
      weights: weightsRecord,
      sharpe
    });
  }

  return points;
}
