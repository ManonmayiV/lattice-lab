import { test } from 'node:test';
import assert from 'node:assert/strict';
import { KEMS, SIGS, totalBytes, ratioTo } from '../src/sizes.js';
import { QUIZ } from '../src/quiz.js';

const find = (list, name) => list.find((x) => x.name === name);

test('ML-KEM-768 sizes match FIPS 203', () => {
  const k = find(KEMS, 'ML-KEM-768');
  assert.equal(k.publicKey, 1184);
  assert.equal(k.response, 1088);
  assert.equal(totalBytes(k), 2272);
});

test('ratio versus X25519 is computed from totals', () => {
  const x = find(KEMS, 'X25519');
  assert.equal(totalBytes(x), 64);
  assert.equal(ratioTo(find(KEMS, 'ML-KEM-768'), x), 2272 / 64);
});

test('signature sizes match FIPS 204 for ML-DSA-65', () => {
  const s = find(SIGS, 'ML-DSA-65');
  assert.equal(s.publicKey, 1952);
  assert.equal(s.response, 3309);
});

test('only lattice schemes are marked as not Shor-vulnerable', () => {
  for (const item of [...KEMS, ...SIGS]) {
    assert.equal(item.shorVulnerable, !/^ML-/.test(item.name));
  }
});

test('quiz answers point at real options', () => {
  assert.equal(QUIZ.length, 5);
  for (const item of QUIZ) {
    assert.ok(Number.isInteger(item.answer) && item.answer >= 0 && item.answer < item.options.length);
    assert.ok(item.why.length > 20);
  }
});
