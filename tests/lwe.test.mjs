import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/prng.js';
import {
  Q, center, mod, keygen, encrypt, decrypt, noiseTerm, simulate,
  analyticFailureRate, solveSecret, bytesToBits, bitsToBytes,
} from '../src/lwe.js';

const base = { n: 16, m: 64 };

test('center maps residues into (-q/2, q/2]', () => {
  assert.equal(center(Q - 1), -1);
  assert.equal(center(1), 1);
  assert.equal(center(1664), 1664);
  assert.equal(center(1665), 1665 - Q);
  assert.equal(mod(-1), Q - 1);
});

test('low noise: every bit round-trips', () => {
  const rng = mulberry32(1);
  for (let t = 0; t < 300; t++) {
    const { pk, sk } = keygen(rng, { ...base, B: 2 });
    for (const bit of [0, 1]) {
      assert.equal(decrypt(sk, encrypt(rng, pk, bit)).bit, bit);
    }
  }
});

test('the decryption noise equals <e, r> exactly', () => {
  const rng = mulberry32(7);
  for (let t = 0; t < 50; t++) {
    const { pk, sk, e } = keygen(rng, { ...base, B: 40 });
    const bit = t % 2;
    const ct = encrypt(rng, pk, bit);
    let expected = 0;
    for (let i = 0; i < e.length; i++) expected += e[i] * ct.r[i];
    assert.equal(noiseTerm(sk, ct, bit), center(expected));
  }
});

test('Monte Carlo failure rate matches the normal approximation', () => {
  const params = { ...base, B: 150 };
  const predicted = analyticFailureRate(params);
  const { rate } = simulate(mulberry32(2026), params, 8000);
  assert.ok(predicted > 0.05 && predicted < 0.5, `predicted ${predicted}`);
  assert.ok(Math.abs(rate - predicted) < 0.03, `observed ${rate} vs predicted ${predicted}`);
});

test('failure rate rises with noise', () => {
  const low = simulate(mulberry32(3), { ...base, B: 20 }, 1500).rate;
  const high = simulate(mulberry32(3), { ...base, B: 400 }, 1500).rate;
  assert.equal(low, 0);
  assert.ok(high > 0.2);
});

test('noise-free system is solved exactly, noisy system is not', () => {
  const clean = keygen(mulberry32(5), { ...base, B: 0 });
  const solved = solveSecret(clean.pk);
  assert.ok(solved.ok);
  assert.deepEqual(solved.s, clean.sk.s);
  assert.equal(solved.residual, 0);

  const noisy = keygen(mulberry32(5), { ...base, B: 1 });
  const attempt = solveSecret(noisy.pk);
  assert.ok(attempt.ok);
  const matches = attempt.s.filter((v, i) => v === noisy.sk.s[i]).length;
  assert.ok(matches < base.n / 2, `matched ${matches} of ${base.n}`);
  assert.ok(attempt.residual > 100, `residual ${attempt.residual}`);
});

test('text survives the bit round trip', () => {
  const bytes = new TextEncoder().encode('Hi, lattice!');
  assert.equal(new TextDecoder().decode(bitsToBytes(bytesToBits(bytes))), 'Hi, lattice!');
});
