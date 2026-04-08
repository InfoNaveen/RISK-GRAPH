export interface HMMParams {
  pi: number[];
  A: number[][];
  mu: number[];
  sigma: number[];
}

export const REGIME_LABELS = ['Bear', 'Sideways', 'Bull'] as const;
export const REGIME_COLORS = ['#C0392B', '#C9A84C', '#1A6B3C'] as const;

function gaussian(x: number, mu: number, sigma: number): number {
  const s = sigma || 1e-300;
  const coeff = 1.0 / (s * Math.sqrt(2 * Math.PI));
  const exponent = -0.5 * Math.pow((x - mu) / s, 2);
  return coeff * Math.exp(exponent);
}

export function forward(obs: number[], params: HMMParams): number[][] {
  const T = obs.length;
  const N = params.pi.length;
  const alpha: number[][] = Array.from({ length: T }, () => new Array(N).fill(0));

  // Initialization
  for (let j = 0; j < N; j++) {
    alpha[0][j] = params.pi[j] * gaussian(obs[0], params.mu[j], params.sigma[j]);
  }

  // Induction
  for (let t = 1; t < T; t++) {
    for (let j = 0; j < N; j++) {
      let sum = 0;
      for (let i = 0; i < N; i++) {
        sum += alpha[t - 1][i] * params.A[i][j];
      }
      alpha[t][j] = sum * gaussian(obs[t], params.mu[j], params.sigma[j]);
    }

    // Scale to prevent underflow
    let scale = 0;
    for (let j = 0; j < N; j++) {
      scale += alpha[t][j];
    }
    scale = scale || 1e-300;
    for (let j = 0; j < N; j++) {
      alpha[t][j] /= scale;
    }
  }

  return alpha;
}

export function backward(obs: number[], params: HMMParams): number[][] {
  const T = obs.length;
  const N = params.pi.length;
  const beta: number[][] = Array.from({ length: T }, () => new Array(N).fill(0));

  // Initialization
  for (let j = 0; j < N; j++) {
    beta[T - 1][j] = 1;
  }

  // Induction
  for (let t = T - 2; t >= 0; t--) {
    for (let i = 0; i < N; i++) {
      let sum = 0;
      for (let j = 0; j < N; j++) {
        sum += params.A[i][j] * gaussian(obs[t + 1], params.mu[j], params.sigma[j]) * beta[t + 1][j];
      }
      beta[t][i] = sum;
    }

    // Scale
    let scale = 0;
    for (let j = 0; j < N; j++) {
      scale += beta[t][j];
    }
    scale = scale || 1e-300;
    for (let j = 0; j < N; j++) {
      beta[t][j] /= scale;
    }
  }

  return beta;
}

export function trainHMM(observations: number[], maxIter: number = 40): HMMParams {
  const N = 3;
  const T = observations.length;

  if (T < 2) {
    return {
      pi: [0.33, 0.34, 0.33],
      A: [
        [0.7, 0.2, 0.1],
        [0.1, 0.8, 0.1],
        [0.1, 0.2, 0.7],
      ],
      mu: [-0.002, 0.0001, 0.002],
      sigma: [0.02, 0.008, 0.015],
    };
  }

  const params: HMMParams = {
    pi: [0.33, 0.34, 0.33],
    A: [
      [0.7, 0.2, 0.1],
      [0.1, 0.8, 0.1],
      [0.1, 0.2, 0.7],
    ],
    mu: [-0.002, 0.0001, 0.002],
    sigma: [0.02, 0.008, 0.015],
  };

  for (let iter = 0; iter < maxIter; iter++) {
    // E-step: compute gamma and xi
    const alpha = forward(observations, params);
    const beta = backward(observations, params);

    // Compute gamma[t][i] = P(state i at time t | obs)
    const gamma: number[][] = Array.from({ length: T }, () => new Array(N).fill(0));
    for (let t = 0; t < T; t++) {
      let denom = 0;
      for (let j = 0; j < N; j++) {
        denom += alpha[t][j] * beta[t][j];
      }
      denom = denom || 1e-300;
      for (let j = 0; j < N; j++) {
        gamma[t][j] = (alpha[t][j] * beta[t][j]) / denom;
      }
    }

    // Compute xi[t][i][j] = P(state i at t, state j at t+1 | obs)
    const xi: number[][][] = Array.from({ length: T - 1 }, () =>
      Array.from({ length: N }, () => new Array(N).fill(0))
    );
    for (let t = 0; t < T - 1; t++) {
      let denom = 0;
      for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
          denom +=
            alpha[t][i] *
            params.A[i][j] *
            gaussian(observations[t + 1], params.mu[j], params.sigma[j]) *
            beta[t + 1][j];
        }
      }
      denom = denom || 1e-300;
      for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
          xi[t][i][j] =
            (alpha[t][i] *
              params.A[i][j] *
              gaussian(observations[t + 1], params.mu[j], params.sigma[j]) *
              beta[t + 1][j]) /
            denom;
        }
      }
    }

    // M-step: update parameters
    // Update pi
    for (let i = 0; i < N; i++) {
      params.pi[i] = gamma[0][i];
    }

    // Update A
    for (let i = 0; i < N; i++) {
      let gammaSum = 0;
      for (let t = 0; t < T - 1; t++) {
        gammaSum += gamma[t][i];
      }
      gammaSum = gammaSum || 1e-300;

      for (let j = 0; j < N; j++) {
        let xiSum = 0;
        for (let t = 0; t < T - 1; t++) {
          xiSum += xi[t][i][j];
        }
        params.A[i][j] = xiSum / gammaSum;
      }
    }

    // Update mu and sigma
    for (let j = 0; j < N; j++) {
      let gammaSum = 0;
      let weightedSum = 0;
      let weightedSqSum = 0;

      for (let t = 0; t < T; t++) {
        gammaSum += gamma[t][j];
        weightedSum += gamma[t][j] * observations[t];
      }

      gammaSum = gammaSum || 1e-300;
      params.mu[j] = weightedSum / gammaSum;

      for (let t = 0; t < T; t++) {
        const diff = observations[t] - params.mu[j];
        weightedSqSum += gamma[t][j] * diff * diff;
      }
      params.sigma[j] = Math.sqrt(weightedSqSum / gammaSum) || 1e-300;
    }
  }

  return params;
}

export function viterbi(observations: number[], params: HMMParams): number[] {
  const T = observations.length;
  const N = params.pi.length;

  if (T === 0) return [];

  // Log domain for numerical stability
  const logDelta: number[][] = Array.from({ length: T }, () => new Array(N).fill(0));
  const psi: number[][] = Array.from({ length: T }, () => new Array(N).fill(0));

  // Initialization
  for (let j = 0; j < N; j++) {
    const g = gaussian(observations[0], params.mu[j], params.sigma[j]) || 1e-300;
    logDelta[0][j] = Math.log((params.pi[j] || 1e-300)) + Math.log(g);
    psi[0][j] = 0;
  }

  // Recursion
  for (let t = 1; t < T; t++) {
    for (let j = 0; j < N; j++) {
      let bestVal = -Infinity;
      let bestIdx = 0;
      for (let i = 0; i < N; i++) {
        const val = logDelta[t - 1][i] + Math.log(params.A[i][j] || 1e-300);
        if (val > bestVal) {
          bestVal = val;
          bestIdx = i;
        }
      }
      const g = gaussian(observations[t], params.mu[j], params.sigma[j]) || 1e-300;
      logDelta[t][j] = bestVal + Math.log(g);
      psi[t][j] = bestIdx;
    }
  }

  // Backtracking
  const path = new Array(T).fill(0);
  let bestFinal = -Infinity;
  for (let j = 0; j < N; j++) {
    if (logDelta[T - 1][j] > bestFinal) {
      bestFinal = logDelta[T - 1][j];
      path[T - 1] = j;
    }
  }

  for (let t = T - 2; t >= 0; t--) {
    path[t] = psi[t + 1][path[t + 1]];
  }

  return path;
}
