export interface AssetFeatures {
  symbol: string;
  annualizedReturn: number;
  annualizedVolatility: number;
  sharpeProxy: number;
  maxDrawdown: number;
  skewness: number;
  kurtosis: number;
  volatilityRegime: number;
  momentumSignal: number;
  eigenvectorCentrality: number;
  betweennessCentrality: number;
  avgCorrelation: number;
  anomalyScore: number;
  clusterLabel: number;
  hmmRegime: number;
  integrityScore: number;
}

function computeLogReturns(prices: number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const prev = prices[i - 1] || 1;
    returns.push(Math.log((prices[i] || 1) / prev));
  }
  return returns;
}

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i];
  }
  return sum / (arr.length || 1);
}

function std(arr: number[]): number {
  if (arr.length <= 1) return 0;
  const m = mean(arr);
  let sumSq = 0;
  for (let i = 0; i < arr.length; i++) {
    const diff = arr[i] - m;
    sumSq += diff * diff;
  }
  return Math.sqrt(sumSq / (arr.length - 1 || 1));
}

function computeMaxDrawdown(prices: number[]): number {
  if (prices.length === 0) return 0;
  let peak = prices[0];
  let maxDD = 0;
  for (let i = 1; i < prices.length; i++) {
    if (prices[i] > peak) {
      peak = prices[i];
    }
    const dd = (peak - prices[i]) / (peak || 1);
    if (dd > maxDD) {
      maxDD = dd;
    }
  }
  return maxDD;
}

function computeSkewness(arr: number[]): number {
  if (arr.length < 3) return 0;
  const m = mean(arr);
  const s = std(arr) || 1;
  const n = arr.length;
  let sum3 = 0;
  for (let i = 0; i < n; i++) {
    sum3 += Math.pow((arr[i] - m) / s, 3);
  }
  return (n / ((n - 1) * (n - 2) || 1)) * sum3;
}

function computeKurtosis(arr: number[]): number {
  if (arr.length < 4) return 0;
  const m = mean(arr);
  const s = std(arr) || 1;
  const n = arr.length;
  let sum4 = 0;
  for (let i = 0; i < n; i++) {
    sum4 += Math.pow((arr[i] - m) / s, 4);
  }
  const rawKurt =
    ((n * (n + 1)) / (((n - 1) * (n - 2) * (n - 3)) || 1)) * sum4 -
    (3 * (n - 1) * (n - 1)) / (((n - 2) * (n - 3)) || 1);
  return rawKurt;
}

function rollingStd(arr: number[], window: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < arr.length; i++) {
    if (i < window - 1) {
      result.push(0);
    } else {
      const slice = arr.slice(i - window + 1, i + 1);
      result.push(std(slice));
    }
  }
  return result;
}

function computeReturn(prices: number[], days: number): number {
  if (prices.length < days + 1) return 0;
  const recent = prices[prices.length - 1];
  const past = prices[prices.length - 1 - days] || 1;
  return (recent - past) / (past || 1);
}

export function engineerFeatures(prices: number[]): Partial<AssetFeatures> {
  if (prices.length < 2) {
    return {
      annualizedReturn: 0,
      annualizedVolatility: 0,
      sharpeProxy: 0,
      maxDrawdown: 0,
      skewness: 0,
      kurtosis: 0,
      volatilityRegime: 0,
      momentumSignal: 0,
    };
  }

  const logReturns = computeLogReturns(prices);
  const meanReturn = mean(logReturns);
  const stdReturn = std(logReturns);

  const annualizedReturn = meanReturn * 252;
  const annualizedVolatility = stdReturn * Math.sqrt(252);
  const sharpeProxy = annualizedReturn / (annualizedVolatility || 1);
  const maxDrawdown = computeMaxDrawdown(prices);
  const skewness = computeSkewness(logReturns);
  const kurtosis = computeKurtosis(logReturns);

  const rollingVol20 = rollingStd(logReturns, 20);
  const latestRollingVol = rollingVol20[rollingVol20.length - 1] || 0;
  const volatilityRegime = latestRollingVol / (annualizedVolatility / Math.sqrt(252) || 1);

  const ret20 = computeReturn(prices, 20);
  const ret60 = computeReturn(prices, 60);
  const momentumSignal = ret20 / (Math.abs(ret60) || 1);

  return {
    annualizedReturn,
    annualizedVolatility,
    sharpeProxy,
    maxDrawdown,
    skewness,
    kurtosis,
    volatilityRegime,
    momentumSignal,
  };
}
