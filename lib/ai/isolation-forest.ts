export interface ITree {
  feature?: number;
  split?: number;
  left?: ITree;
  right?: ITree;
  size?: number;
}

// Seeded LCG random number generator
function lcgRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (1664525 * state + 1013904223) | 0;
    return (state >>> 0) / 4294967296;
  };
}

// Expected path length correction: c(n) = 2*(ln(n-1) + 0.5772) - 2*(n-1)/n
function expectedPathLength(n: number): number {
  if (n <= 1) return 0;
  if (n === 2) return 1;
  return 2 * (Math.log(n - 1) + 0.5772156649) - 2 * (n - 1) / n;
}

export function buildTree(
  data: number[][],
  depth: number,
  maxDepth: number,
  seed: number
): ITree {
  if (depth >= maxDepth || data.length <= 1) {
    return { size: data.length };
  }

  const rng = lcgRandom(seed + depth * 7919);
  const numFeatures = data[0]?.length || 1;
  const feature = Math.floor(rng() * numFeatures);

  let minVal = Infinity;
  let maxVal = -Infinity;
  for (let i = 0; i < data.length; i++) {
    const v = data[i][feature];
    if (v < minVal) minVal = v;
    if (v > maxVal) maxVal = v;
  }

  if (minVal === maxVal) {
    return { size: data.length };
  }

  const split = minVal + rng() * (maxVal - minVal);

  const leftData: number[][] = [];
  const rightData: number[][] = [];

  for (let i = 0; i < data.length; i++) {
    if (data[i][feature] < split) {
      leftData.push(data[i]);
    } else {
      rightData.push(data[i]);
    }
  }

  if (leftData.length === 0 || rightData.length === 0) {
    return { size: data.length };
  }

  return {
    feature,
    split,
    left: buildTree(leftData, depth + 1, maxDepth, seed + 31),
    right: buildTree(rightData, depth + 1, maxDepth, seed + 37),
  };
}

export function pathLen(point: number[], tree: ITree, depth: number): number {
  // Leaf node
  if (tree.left === undefined || tree.right === undefined) {
    return depth + expectedPathLength(tree.size || 1);
  }

  const featureVal = point[tree.feature || 0];
  if (featureVal < (tree.split || 0)) {
    return pathLen(point, tree.left, depth + 1);
  }
  return pathLen(point, tree.right, depth + 1);
}

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < arr.length; i++) sum += arr[i];
  return sum / (arr.length || 1);
}

function stdDev(arr: number[]): number {
  if (arr.length <= 1) return 0;
  const m = mean(arr);
  let sumSq = 0;
  for (let i = 0; i < arr.length; i++) {
    const diff = arr[i] - m;
    sumSq += diff * diff;
  }
  return Math.sqrt(sumSq / (arr.length - 1 || 1));
}

export interface IsolationForestResult {
  scores: number[];
  anomalyFlags: boolean[];
  threshold: number;
}

export function isolationForest(
  data: number[][],
  numTrees: number = 100,
  sampleSize: number = 64
): IsolationForestResult {
  if (data.length === 0) {
    return { scores: [], anomalyFlags: [], threshold: 0 };
  }

  const maxDepth = Math.ceil(Math.log2(sampleSize || 1));
  const rng = lcgRandom(42);
  const trees: ITree[] = [];

  // Build trees on random subsamples
  for (let t = 0; t < numTrees; t++) {
    const sample: number[][] = [];
    const actualSampleSize = Math.min(sampleSize, data.length);
    for (let i = 0; i < actualSampleSize; i++) {
      const idx = Math.floor(rng() * data.length);
      sample.push(data[idx]);
    }
    trees.push(buildTree(sample, 0, maxDepth, t * 1000 + 42));
  }

  // Score each point
  const c = expectedPathLength(sampleSize);
  const scores: number[] = new Array(data.length);

  for (let i = 0; i < data.length; i++) {
    let totalPathLen = 0;
    for (let t = 0; t < numTrees; t++) {
      totalPathLen += pathLen(data[i], trees[t], 0);
    }
    const avgPath = totalPathLen / (numTrees || 1);
    scores[i] = Math.pow(2, -(avgPath / (c || 1)));
  }

  const meanScore = mean(scores);
  const stdScore = stdDev(scores);
  const threshold = meanScore + 2 * stdScore;

  const anomalyFlags = scores.map((s) => s > threshold);

  return { scores, anomalyFlags, threshold };
}
