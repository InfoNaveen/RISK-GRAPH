function euclidean(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = (a[i] || 0) - (b[i] || 0);
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

// Seeded LCG random number generator (deterministic)
function lcgRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (1664525 * state + 1013904223) | 0;
    return ((state >>> 0) / 4294967296);
  };
}

function kMeansPlusPlusInit(
  data: number[][],
  k: number,
  rng: () => number
): number[][] {
  const n = data.length;
  const dim = data[0]?.length || 0;
  const centroids: number[][] = [];

  // Pick first centroid randomly
  const firstIdx = Math.floor(rng() * n);
  centroids.push([...data[firstIdx]]);

  // Pick remaining centroids
  for (let c = 1; c < k; c++) {
    const distances: number[] = new Array(n).fill(Infinity);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < centroids.length; j++) {
        const d = euclidean(data[i], centroids[j]);
        distances[i] = Math.min(distances[i], d * d);
      }
    }

    let totalDist = 0;
    for (let i = 0; i < n; i++) totalDist += distances[i];

    const threshold = rng() * (totalDist || 1);
    let cumulative = 0;
    let chosenIdx = 0;
    for (let i = 0; i < n; i++) {
      cumulative += distances[i];
      if (cumulative >= threshold) {
        chosenIdx = i;
        break;
      }
    }
    centroids.push([...data[chosenIdx]]);
  }

  return centroids;
}

function assignLabels(data: number[][], centroids: number[][]): number[] {
  const labels: number[] = new Array(data.length).fill(0);
  for (let i = 0; i < data.length; i++) {
    let bestDist = Infinity;
    for (let c = 0; c < centroids.length; c++) {
      const d = euclidean(data[i], centroids[c]);
      if (d < bestDist) {
        bestDist = d;
        labels[i] = c;
      }
    }
  }
  return labels;
}

function updateCentroids(data: number[][], labels: number[], k: number): number[][] {
  const dim = data[0]?.length || 0;
  const centroids: number[][] = Array.from({ length: k }, () => new Array(dim).fill(0));
  const counts: number[] = new Array(k).fill(0);

  for (let i = 0; i < data.length; i++) {
    const c = labels[i];
    counts[c]++;
    for (let d = 0; d < dim; d++) {
      centroids[c][d] += data[i][d];
    }
  }

  for (let c = 0; c < k; c++) {
    const count = counts[c] || 1;
    for (let d = 0; d < dim; d++) {
      centroids[c][d] /= count;
    }
  }

  return centroids;
}

function computeInertia(data: number[][], labels: number[], centroids: number[][]): number {
  let inertia = 0;
  for (let i = 0; i < data.length; i++) {
    const d = euclidean(data[i], centroids[labels[i]]);
    inertia += d * d;
  }
  return inertia;
}

export function computeSilhouette(data: number[][], labels: number[], k: number): number {
  const n = data.length;
  if (n <= 1 || k <= 1) return 0;

  let totalSilhouette = 0;
  let validPoints = 0;

  for (let i = 0; i < n; i++) {
    const clusterI = labels[i];

    // Compute a(i): mean intra-cluster distance
    let intraSum = 0;
    let intraCount = 0;
    for (let j = 0; j < n; j++) {
      if (j !== i && labels[j] === clusterI) {
        intraSum += euclidean(data[i], data[j]);
        intraCount++;
      }
    }
    const a = intraSum / (intraCount || 1);

    // Compute b(i): mean nearest-cluster distance
    let bestInterDist = Infinity;
    for (let c = 0; c < k; c++) {
      if (c === clusterI) continue;
      let interSum = 0;
      let interCount = 0;
      for (let j = 0; j < n; j++) {
        if (labels[j] === c) {
          interSum += euclidean(data[i], data[j]);
          interCount++;
        }
      }
      if (interCount > 0) {
        const avgDist = interSum / interCount;
        bestInterDist = Math.min(bestInterDist, avgDist);
      }
    }
    const b = bestInterDist === Infinity ? 0 : bestInterDist;

    const maxAB = Math.max(a, b) || 1;
    const s = (b - a) / maxAB;
    totalSilhouette += s;
    validPoints++;
  }

  return totalSilhouette / (validPoints || 1);
}

export interface KMeansResult {
  labels: number[];
  centroids: number[][];
  inertia: number;
  silhouette: number;
}

export function kMeansPlusPlus(
  data: number[][],
  k: number = 3,
  maxIter: number = 150
): KMeansResult {
  if (data.length === 0) {
    return { labels: [], centroids: [], inertia: 0, silhouette: 0 };
  }

  const rng = lcgRandom(42);
  let centroids = kMeansPlusPlusInit(data, Math.min(k, data.length), rng);
  let labels = assignLabels(data, centroids);

  for (let iter = 0; iter < maxIter; iter++) {
    const newCentroids = updateCentroids(data, labels, k);
    const newLabels = assignLabels(data, newCentroids);

    // Check convergence
    let changed = false;
    for (let i = 0; i < newLabels.length; i++) {
      if (newLabels[i] !== labels[i]) {
        changed = true;
        break;
      }
    }

    centroids = newCentroids;
    labels = newLabels;

    if (!changed) break;
  }

  const inertia = computeInertia(data, labels, centroids);
  const silhouette = computeSilhouette(data, labels, k);

  return { labels, centroids, inertia, silhouette };
}

export function optimalK(data: number[][], maxK: number = 5): number {
  if (data.length < 2) return 1;

  let bestK = 2;
  let bestSilhouette = -1;

  for (let k = 2; k <= Math.min(maxK, data.length - 1); k++) {
    const result = kMeansPlusPlus(data, k);
    if (result.silhouette > bestSilhouette) {
      bestSilhouette = result.silhouette;
      bestK = k;
    }
  }

  return bestK;
}

export { euclidean };
