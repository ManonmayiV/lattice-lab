import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SEMIPRIMES, gcd, modPow, findOrder, shorTrial, factorWithShor,
  powerSequence, scalingExperiment, fitLine, semiprimeOfBits, bitLength,
} from '../src/shor.js';

test('gcd and modPow agree with BigInt', () => {
  assert.equal(gcd(48, 18), 6);
  for (const [b, e, n] of [[2, 100, 91], [7, 1234, 323], [3, 99999, 1000003]]) {
    assert.equal(modPow(b, e, n), Number((BigInt(b) ** BigInt(e)) % BigInt(n)));
  }
});

test('textbook example: order of 7 mod 15 is 4 and factors are 3 and 5', () => {
  assert.equal(findOrder(7, 15), 4);
  const t = shorTrial(15, 7);
  assert.equal(t.outcome, 'factored');
  assert.deepEqual([...t.factors].sort((x, y) => x - y), [3, 5]);
});

test('retry cases are reported, not hidden', () => {
  assert.equal(shorTrial(15, 14).outcome, 'retry'); // 14 = -1 mod 15, order 2, a^(r/2) = -1
  assert.equal(shorTrial(21, 2).r, 6);
});

test('every demo semiprime is factored correctly', () => {
  for (const n of SEMIPRIMES) {
    const res = factorWithShor(n);
    assert.ok(res.factors, `no factors for ${n}`);
    assert.equal(res.factors[0] * res.factors[1], n);
    assert.ok(res.factors.every((f) => f > 1 && f < n));
  }
});

test('power sequence repeats with the order as its period', () => {
  const seq = powerSequence(2, 15, 12);
  assert.deepEqual(seq, [1, 2, 4, 8, 1, 2, 4, 8, 1, 2, 4, 8]);
});

test('brute-force work grows exponentially with bit length', () => {
  const samples = scalingExperiment([10, 12, 14, 16, 18, 20, 22, 24]);
  assert.ok(samples.length >= 150);
  const { slope } = fitLine(samples.map((s) => ({ x: s.bits, y: s.log2steps })));
  assert.ok(slope > 0.6 && slope < 1.4, `slope ${slope}`);
  // doubling N's bit length must much more than double the work
  const mean = (bits) => { const v = samples.filter((x) => x.bits === bits).map((x) => x.log2steps); return v.reduce((a, b) => a + b, 0) / v.length; };
  assert.ok(mean(23) - mean(13) > 6);
  const { n } = semiprimeOfBits(20, 0);
  assert.ok(bitLength(n) >= 19 && bitLength(n) <= 20);
});
