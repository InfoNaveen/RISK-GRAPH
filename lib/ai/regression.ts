function transpose(M: number[][]): number[][] {
  const rows = M.length;
  const cols = M[0]?.length || 0;
  const result: number[][] = Array.from({ length: cols }, () => new Array(rows).fill(0));
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result[j][i] = M[i][j];
    }
  }
  return result;
}

function matMul(A: number[][], B: number[][]): number[][] {
  const rowsA = A.length;
  const colsA = A[0]?.length || 0;
  const colsB = B[0]?.length || 0;
  const result: number[][] = Array.from({ length: rowsA }, () => new Array(colsB).fill(0));
  for (let i = 0; i < rowsA; i++) {
    for (let j = 0; j < colsB; j++) {
      let sum = 0;
      for (let k = 0; k < colsA; k++) {
        sum += A[i][k] * B[k][j];
      }
      result[i][j] = sum;
    }
  }
  return result;
}

function matVec(A: number[][], v: number[]): number[] {
  const rows = A.length;
  const cols = A[0]?.length || 0;
  const result: number[] = new Array(rows).fill(0);
  for (let i = 0; i < rows; i++) {
    let sum = 0;
    for (let j = 0; j < cols; j++) {
      sum += A[i][j] * v[j];
    }
    result[i] = sum;
  }
  return result;
}

function invertMatrix(M: number[][]): number[][] {
  const n = M.length;
  // Create augmented matrix [M | I]
  const aug: number[][] = Array.from({ length: n }, (_, i) => {
    const row = new Array(2 * n).fill(0);
    for (let j = 0; j < n; j++) {
      row[j] = M[i][j];
    }
    row[n + i] = 1;
    return row;
  });

  // Gauss-Jordan with partial pivoting
  for (let col = 0; col < n; col++) {
    // Find pivot
    let maxVal = Math.abs(aug[col][col]);
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > maxVal) {
        maxVal = Math.abs(aug[row][col]);
        maxRow = row;
      }
    }

    // Swap rows
    if (maxRow !== col) {
      const temp = aug[col];
      aug[col] = aug[maxRow];
      aug[maxRow] = temp;
    }

    const pivot = aug[col][col];
    if (Math.abs(pivot) < 1e-12) {
      // Singular — add regularization
      aug[col][col] = 1e-12;
    }

    const pivotVal = aug[col][col];
    // Scale pivot row
    for (let j = 0; j < 2 * n; j++) {
      aug[col][j] /= pivotVal;
    }

    // Eliminate column in all other rows
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = aug[row][col];
      for (let j = 0; j < 2 * n; j++) {
        aug[row][j] -= factor * aug[col][j];
      }
    }
  }

  // Extract inverse
  const inverse: number[][] = Array.from({ length: n }, (_, i) => {
    return aug[i].slice(n);
  });

  return inverse;
}

const FEATURE_NAMES = ['Lag1_Vol', 'Lag2_Vol', 'Lag1_Return', 'Centrality', 'Network_Density'] as const;

export interface FeatureImportance {
  name: string;
  coefficient: number;
  tStat: number;
}

export interface OLSResult {
  coefficients: number[];
  intercept: number;
  rSquared: number;
  predictions: number[];
  confidenceBands: { upper: number[]; lower: number[] };
  featureImportance: FeatureImportance[];
}

export function olsRegression(X: number[][], y: number[]): OLSResult {
  const n = X.length;
  const p = X[0]?.length || 0;

  if (n === 0 || p === 0) {
    return {
      coefficients: [],
      intercept: 0,
      rSquared: 0,
      predictions: [],
      confidenceBands: { upper: [], lower: [] },
      featureImportance: [],
    };
  }

  // Prepend intercept column (column of 1s)
  const Xaug: number[][] = X.map((row) => [1, ...row]);
  const pAug = p + 1;

  // OLS: β = (XᵀX)⁻¹ Xᵀy
  const Xt = transpose(Xaug);
  const XtX = matMul(Xt, Xaug);
  const XtXinv = invertMatrix(XtX);
  const Xty = matVec(Xt, y);
  const beta = matVec(XtXinv, Xty);

  const intercept = beta[0];
  const coefficients = beta.slice(1);

  // Predictions
  const predictions = matVec(Xaug, beta);

  // R²
  let yMean = 0;
  for (let i = 0; i < n; i++) yMean += y[i];
  yMean /= n || 1;

  let ssTot = 0;
  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    ssTot += (y[i] - yMean) * (y[i] - yMean);
    ssRes += (y[i] - predictions[i]) * (y[i] - predictions[i]);
  }

  const rSquared = 1 - ssRes / (ssTot || 1);

  // σ² (residual variance)
  const dof = Math.max(n - pAug, 1);
  const sigma2 = ssRes / dof;
  const sigma = Math.sqrt(sigma2);

  // Standard errors of coefficients
  const se: number[] = new Array(pAug).fill(0);
  for (let j = 0; j < pAug; j++) {
    se[j] = Math.sqrt(Math.abs(XtXinv[j][j]) * sigma2);
  }

  // t-statistics
  const tStats: number[] = new Array(pAug).fill(0);
  for (let j = 0; j < pAug; j++) {
    tStats[j] = beta[j] / (se[j] || 1);
  }

  // Confidence bands at 1.96σ
  const upper: number[] = new Array(n).fill(0);
  const lower: number[] = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    upper[i] = predictions[i] + 1.96 * sigma;
    lower[i] = predictions[i] - 1.96 * sigma;
  }

  // Feature importance (skip intercept)
  const featureImportance: FeatureImportance[] = coefficients.map((coef, idx) => ({
    name: FEATURE_NAMES[idx] || `Feature_${idx}`,
    coefficient: coef,
    tStat: tStats[idx + 1],
  }));

  return {
    coefficients,
    intercept,
    rSquared,
    predictions,
    confidenceBands: { upper, lower },
    featureImportance,
  };
}
