// The classical half of Shor's algorithm, plus a measurement of why brute force fails.
//
// Shor's algorithm factors N by finding the period r of f(x) = a^x mod N. A quantum
// computer finds r efficiently (polynomial in the bit length of N). Everything else is
// ordinary arithmetic. Here the period is found by brute force on a classical machine,
// which is fine for tiny N and hopeless for real RSA sizes. That gap is the point.

export const SEMIPRIMES = [15, 21, 35, 77, 91, 143, 221, 323];

// Safe integer range: products stay below 2^53 when N < 2^26.
const MAX_N = 2 ** 26;

export function gcd(a, b) {
  while (b) [a, b] = [b, a % b];
  return a;
}

export function modPow(base, exp, n) {
  if (n >= MAX_N) throw new RangeError('modPow: N too large for exact double arithmetic');
  let result = 1;
  base %= n;
  while (exp > 0) {
    if (exp % 2 === 1) result = (result * base) % n;
    base = (base * base) % n;
    exp = Math.floor(exp / 2);
  }
  return result;
}

/** Smallest r > 0 with a^r = 1 (mod N). Returns null if gcd(a, N) != 1 or maxSteps is hit. */
export function findOrder(a, n, maxSteps = Infinity) {
  if (n >= MAX_N) throw new RangeError('findOrder: N too large');
  if (gcd(a, n) !== 1) return null;
  let cur = a % n;
  let r = 1;
  while (cur !== 1) {
    cur = (cur * a) % n;
    r++;
    if (r > maxSteps) return null;
  }
  return r;
}

/** One run of Shor's classical post-processing with a chosen base a. */
export function shorTrial(n, a) {
  const g = gcd(a, n);
  if (g > 1 && g < n) {
    return { a, outcome: 'lucky', note: `gcd(${a}, ${n}) = ${g} already shares a factor`, factors: [g, n / g] };
  }
  const r = findOrder(a, n);
  if (r === null) return { a, outcome: 'invalid', note: 'a must be between 2 and N-1' };
  if (r % 2 === 1) return { a, r, outcome: 'retry', note: `the order r = ${r} is odd, so pick another a` };
  const half = modPow(a, r / 2, n);
  if (half === n - 1) {
    return { a, r, half, outcome: 'retry', note: `a^(r/2) = ${half} = N-1 (that is -1 mod N), so pick another a` };
  }
  const f1 = gcd(half - 1, n);
  const f2 = gcd(half + 1, n);
  const nontrivial = [f1, f2].filter((f) => f > 1 && f < n);
  if (nontrivial.length === 0) return { a, r, half, outcome: 'retry', note: 'only trivial factors, pick another a' };
  const p = nontrivial[0];
  return { a, r, half, outcome: 'factored', factors: [p, n / p], gcds: [f1, f2] };
}

/** Try a = 2, 3, 4, ... until a trial factors N. Returns every attempt for display. */
export function factorWithShor(n, start = 2) {
  const attempts = [];
  for (let a = start; a < n; a++) {
    const t = shorTrial(n, a);
    attempts.push(t);
    if (t.factors) return { n, attempts, factors: t.factors };
  }
  return { n, attempts, factors: null };
}

/** The sequence a^0, a^1, ... mod N for x up to `count`, to show the repeating pattern. */
export function powerSequence(a, n, count) {
  const out = [];
  let cur = 1;
  for (let x = 0; x < count; x++) {
    out.push(cur);
    cur = (cur * a) % n;
  }
  return out;
}

function isPrime(x) {
  if (x < 2) return false;
  if (x % 2 === 0) return x === 2;
  for (let d = 3; d * d <= x; d += 2) if (x % d === 0) return false;
  return true;
}

function nextPrime(x) {
  while (!isPrime(x)) x++;
  return x;
}

export const bitLength = (n) => Math.floor(Math.log2(n)) + 1;

/** Deterministic semiprime with roughly `bits` bits; `k` picks a different one. */
export function semiprimeOfBits(bits, k = 0) {
  const half = Math.floor(bits / 2);
  const p = nextPrime(Math.floor(2 ** (half - 1) * 1.3) + 31 * k);
  const q = nextPrime(Math.floor(2 ** (bits - half - 1) * 1.5) + 57 * k);
  return { n: p * q, p, q };
}

/**
 * For each requested size, brute-force the order of a few bases against a few semiprimes
 * and record log2(steps). Returns every sample so the UI can show a table.
 */
export function scalingExperiment(bitSizes, { semiprimesPerSize = 6, bases = [2, 3, 5, 7], maxSteps = 6e7 } = {}) {
  const samples = [];
  for (const bits of bitSizes) {
    for (let k = 0; k < semiprimesPerSize; k++) {
      const { n, p, q } = semiprimeOfBits(bits, k);
      if (n >= MAX_N) continue;
      for (const a of bases) {
        const steps = findOrder(a, n, maxSteps);
        if (steps === null) continue;
        samples.push({ bits: bitLength(n), n, p, q, a, steps, log2steps: Math.log2(steps) });
      }
    }
  }
  return samples;
}

/** Ordinary least squares y = intercept + slope * x. */
export function fitLine(points) {
  const k = points.length;
  const mx = points.reduce((s, p) => s + p.x, 0) / k;
  const my = points.reduce((s, p) => s + p.y, 0) / k;
  let sxx = 0;
  let sxy = 0;
  for (const p of points) {
    sxx += (p.x - mx) ** 2;
    sxy += (p.x - mx) * (p.y - my);
  }
  const slope = sxy / sxx;
  return { slope, intercept: my - slope * mx };
}
