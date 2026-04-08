export interface IntegrityReport {
  asset: string;
  integrityScore: number;
  driftFlags: string[];
  confidenceInterval: [number, number];
  verdict: 'trusted' | 'suspicious' | 'compromised';
}

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < arr.length; i++) sum += arr[i];
  return sum / (arr.length || 1);
}

function variance(arr: number[]): number {
  if (arr.length <= 1) return 0;
  const m = mean(arr);
  let sumSq = 0;
  for (let i = 0; i < arr.length; i++) {
    const diff = arr[i] - m;
    sumSq += diff * diff;
  }
  return sumSq / (arr.length - 1 || 1);
}

function approximateKL(p: number[], q: number[]): number {
  // Histogram-based KL divergence approximation
  const bins = 20;
  const allVals = [...p, ...q];
  const minVal = Math.min(...allVals);
  const maxVal = Math.max(...allVals);
  const range = maxVal - minVal || 1;

  const histP = new Array(bins).fill(0);
  const histQ = new Array(bins).fill(0);

  for (const v of p) {
    const idx = Math.min(Math.floor(((v - minVal) / range) * bins), bins - 1);
    histP[idx]++;
  }
  for (const v of q) {
    const idx = Math.min(Math.floor(((v - minVal) / range) * bins), bins - 1);
    histQ[idx]++;
  }

  // Normalize
  const pLen = p.length || 1;
  const qLen = q.length || 1;
  let kl = 0;
  for (let i = 0; i < bins; i++) {
    const pProb = (histP[i] + 1e-10) / pLen;
    const qProb = (histQ[i] + 1e-10) / qLen;
    kl += pProb * Math.log(pProb / qProb);
  }

  return Math.abs(kl);
}

export function checkModelIntegrity(
  predictions: number[],
  historicalBaseline: number[],
  assetName: string
): IntegrityReport {
  const driftFlags: string[] = [];

  // 1. Variance collapse
  const recentPreds = predictions.slice(-20);
  const predVariance = variance(recentPreds);
  const baselineVariance = variance(historicalBaseline);
  if (predVariance < baselineVariance * 0.1) {
    driftFlags.push('Variance Collapse');
  }

  // 2. KL divergence
  const klDiv = approximateKL(predictions, historicalBaseline);
  if (klDiv > 0.5) {
    driftFlags.push('Distribution Shift');
  }

  // 3. Z-score spike
  const baselineMean = mean(historicalBaseline);
  const baselineStd = Math.sqrt(variance(historicalBaseline)) || 1;
  const recentMean = mean(recentPreds);
  const zScore = Math.abs(recentMean - baselineMean) / baselineStd;
  if (zScore > 3) {
    driftFlags.push('Prediction Spike');
  }

  // 4. Sign flip rate
  const last10 = predictions.slice(-10);
  if (last10.length >= 2) {
    let flips = 0;
    for (let i = 1; i < last10.length; i++) {
      if ((last10[i] >= 0 && last10[i - 1] < 0) || (last10[i] < 0 && last10[i - 1] >= 0)) {
        flips++;
      }
    }
    const flipRate = flips / (last10.length - 1 || 1);
    if (flipRate > 0.6) {
      driftFlags.push('Sign Flip Instability');
    }
  }

  // Compute integrity score
  const integrityScore = Math.max(0, 1 - driftFlags.length * 0.25 - klDiv * 0.3);

  // Verdict
  let verdict: 'trusted' | 'suspicious' | 'compromised';
  if (integrityScore > 0.7) {
    verdict = 'trusted';
  } else if (integrityScore > 0.4) {
    verdict = 'suspicious';
  } else {
    verdict = 'compromised';
  }

  // Confidence interval
  const se = Math.sqrt(variance(predictions)) / Math.sqrt(predictions.length || 1);
  const predMean = mean(predictions);
  const confidenceInterval: [number, number] = [
    predMean - 1.96 * se,
    predMean + 1.96 * se,
  ];

  return {
    asset: assetName,
    integrityScore,
    driftFlags,
    confidenceInterval,
    verdict,
  };
}
