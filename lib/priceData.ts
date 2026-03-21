import { ASSET_NAMES, DEFAULT_PRICES, ASSET_PARAMS } from './types';
import { CORRELATION_MATRIX, choleskyDecomposition, boxMuller } from './math';

// ─── Seeded PRNG (Linear Congruential Generator) ────────────────────
let seed = 123456789;
function nextRandom(): number {
  // LCG parameters
  const m = 2 ** 31 - 1;
  const a = 48271;
  const c = 0;
  seed = (a * seed + c) % m;
  return seed / m;
}

// ─── Top-Level Static Data Generation ───────────────────────────────
export const PRICE_HISTORY_DAYS = 252;
export const SYNTHETIC_PRICES: Record<string, number[]> = {};
export const DATE_LABELS: string[] = [];

// Initialize history arrays with Start Prices
ASSET_NAMES.forEach(asset => {
  SYNTHETIC_PRICES[asset] = [DEFAULT_PRICES[asset]];
});

// For dates, we will map 1 ... 252 to some synthetic historical dates (e.g. past 1 year)
const today = new Date();
for (let t = PRICE_HISTORY_DAYS; t >= 0; t--) {
  const d = new Date(today.getTime() - t * 24 * 60 * 60 * 1000);
  // skip weekends roughly by assuming 252 business days is almost 1 historical year
  DATE_LABELS.push(d.toISOString().split('T')[0]);
}
// wait, if we push PRICE_HISTORY_DAYS + 1 dates, it maps to indices 0..252 (length 253)
// We will generate 252 *steps* after the initial day, so length is 253.
// Wait, prompt says "252-day historical price sequences". So length = 252.
// Let's make length = 252 exactly.
DATE_LABELS.length = 0; // reset
for (let t = PRICE_HISTORY_DAYS - 1; t >= 0; t--) {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(t * 1.45)); // Approximation to reach back ~365 calendar days
  DATE_LABELS.push(d.toISOString().split('T')[0]);
}

// Generate Correlated Paths
const n = ASSET_NAMES.length;
const dt = 1 / 252;
const L = choleskyDecomposition(CORRELATION_MATRIX);

for (let step = 1; step < PRICE_HISTORY_DAYS; step++) {
  // 1. Generate independent standard normals Z
  const Z = new Array(n).fill(0);
  for (let i = 0; i < n; i += 2) {
    const u1 = nextRandom();
    const u2 = nextRandom();
    const [z1, z2] = boxMuller(u1, u2);
    Z[i] = z1;
    if (i + 1 < n) Z[i + 1] = z2;
  }

  // 2. Correlate Z => W = L * Z
  const W = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = 0; j <= i; j++) {
      sum += L[i][j] * Z[j];
    }
    W[i] = sum;
  }

  // 3. Euler-Maruyama step
  ASSET_NAMES.forEach((asset, i) => {
    const { mu, sigma } = ASSET_PARAMS[asset];
    const prevPrice = SYNTHETIC_PRICES[asset][step - 1];
    const drift = (mu - 0.5 * sigma * sigma) * dt;
    const diffusion = sigma * Math.sqrt(dt) * W[i];
    
    // S_t = S_{t-1} * exp(drift + diffusion)
    const newPrice = prevPrice * Math.exp(drift + diffusion);
    SYNTHETIC_PRICES[asset].push(newPrice);
  });
}
