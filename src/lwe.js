// Toy Learning With Errors (LWE) public-key encryption, Regev style, one bit at a time.
//
// TOY ONLY. Real schemes such as ML-KEM (FIPS 203) use module lattices, far larger
// parameters, structured polynomials and careful noise sampling. Nothing here is secure.
//
// Setup (all arithmetic mod q, q prime):
//   secret    s in Z_q^n
//   public    A (m x n, uniform), b = A*s + e, with each error e_i uniform in [-B, B]
//   encrypt   pick random 0/1 vector r of length m
//             u = A^T r,   v = <b, r> + bit * floor(q/2)
//   decrypt   d = v - <s, u> = <e, r> + bit * floor(q/2)
//             answer 1 if |centered d| > q/4, else 0
// So decryption works exactly when the accumulated noise <e, r> stays inside (-q/4, q/4).

import { randInt } from './prng.js';

export const Q = 3329; // the prime modulus used by ML-KEM, reused here for familiarity

export const mod = (x, q = Q) => ((x % q) + q) % q;

/** Representative of x mod q in (-q/2, q/2]. */
export const center = (x, q = Q) => {
  const r = mod(x, q);
  return r > q / 2 ? r - q : r;
};

function dotMod(a, b, q) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return mod(sum, q);
}

export function keygen(rng, { n, m, B, q = Q }) {
  const A = Array.from({ length: m }, () =>
    Array.from({ length: n }, () => randInt(rng, 0, q - 1)),
  );
  const s = Array.from({ length: n }, () => randInt(rng, 0, q - 1));
  const e = Array.from({ length: m }, () => (B === 0 ? 0 : randInt(rng, -B, B)));
  const b = A.map((row, i) => mod(dotMod(row, s, q) + e[i], q));
  return { pk: { A, b, n, m, B, q }, sk: { s, q }, e };
}

export function encrypt(rng, pk, bit) {
  const { A, b, n, m, q } = pk;
  const r = Array.from({ length: m }, () => (rng() < 0.5 ? 1 : 0));
  const u = new Array(n).fill(0);
  let v = 0;
  for (let i = 0; i < m; i++) {
    if (r[i] === 0) continue;
    for (let j = 0; j < n; j++) u[j] += A[i][j];
    v += b[i];
  }
  return {
    u: u.map((x) => mod(x, q)),
    v: mod(v + bit * Math.floor(q / 2), q),
    r,
  };
}

export function decrypt(sk, ct) {
  const { s, q } = sk;
  const d = center(ct.v - dotMod(s, ct.u, q), q);
  return { bit: Math.abs(d) > q / 4 ? 1 : 0, d };
}

/** The noise term <e, r> that decryption has to absorb (centered). */
export function noiseTerm(sk, ct, bit) {
  const { d } = decrypt(sk, ct);
  return center(d - bit * Math.floor(sk.q / 2), sk.q);
}

/** Run `trials` full keygen/encrypt/decrypt rounds and collect failures and noise samples. */
export function simulate(rng, params, trials) {
  let failures = 0;
  const noise = new Array(trials);
  for (let t = 0; t < trials; t++) {
    const { pk, sk } = keygen(rng, params);
    const bit = rng() < 0.5 ? 1 : 0;
    const ct = encrypt(rng, pk, bit);
    if (decrypt(sk, ct).bit !== bit) failures++;
    noise[t] = noiseTerm(sk, ct, bit);
  }
  return { trials, failures, rate: failures / trials, noise };
}

// Complementary error function, Abramowitz and Stegun 7.1.26 (abs error < 1.5e-7).
export function erfc(x) {
  const z = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * z);
  const poly =
    t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  const y = poly * Math.exp(-z * z);
  return x >= 0 ? y : 2 - y;
}

/** Standard deviation of <e, r> when e_i ~ uniform{-B..B} and r_i ~ Bernoulli(1/2). */
export function noiseStdDev({ m, B }) {
  return Math.sqrt((m * B * (B + 1)) / 6);
}

/** Normal approximation of P(|<e, r>| > q/4), the chance a bit decrypts wrongly. */
export function analyticFailureRate({ m, B, q = Q }) {
  const sigma = noiseStdDev({ m, B });
  if (sigma === 0) return 0;
  return erfc(q / 4 / (sigma * Math.SQRT2));
}

function modInv(a, q) {
  let [t, newT] = [0, 1];
  let [r, newR] = [q, mod(a, q)];
  while (newR !== 0) {
    const k = Math.floor(r / newR);
    [t, newT] = [newT, t - k * newT];
    [r, newR] = [newR, r - k * newR];
  }
  return mod(t, q);
}

/**
 * The "obvious" attack: treat b = A*s + e as a linear system and run Gauss-Jordan
 * elimination mod q. With no noise this recovers s exactly. With any noise it solves
 * n noisy equations exactly, so the answer is wrong. Real attacks use lattice reduction,
 * and that is why real parameters are far larger than the toy values here.
 */
export function solveSecret(pk) {
  const { A, b, n, m, q } = pk;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = -1;
    for (let r = c; r < m; r++) {
      if (M[r][c] !== 0) {
        p = r;
        break;
      }
    }
    if (p === -1) return { ok: false, reason: 'singular' };
    [M[c], M[p]] = [M[p], M[c]];
    const inv = modInv(M[c][c], q);
    M[c] = M[c].map((x) => mod(x * inv, q));
    for (let r = 0; r < m; r++) {
      if (r === c || M[r][c] === 0) continue;
      const f = M[r][c];
      M[r] = M[r].map((x, j) => mod(x - f * M[c][j], q));
    }
  }
  const s = Array.from({ length: n }, (_, c) => M[c][n]);
  let residual = 0;
  for (let i = 0; i < m; i++) {
    residual = Math.max(residual, Math.abs(center(dotMod(A[i], s, q) - b[i], q)));
  }
  return { ok: true, s, residual };
}

export function bytesToBits(bytes) {
  const bits = [];
  for (const byte of bytes) for (let k = 7; k >= 0; k--) bits.push((byte >> k) & 1);
  return bits;
}

export function bitsToBytes(bits) {
  const out = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < out.length; i++) {
    let v = 0;
    for (let k = 0; k < 8; k++) v = (v << 1) | bits[i * 8 + k];
    out[i] = v;
  }
  return out;
}
