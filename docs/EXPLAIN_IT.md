# Explain it: how each part works

The contest requires that the submitter understands and can explain AI-assisted code. Read this once, run the page, then try to explain each section out loud without looking.

## 1. Shor's algorithm, the part that is ordinary arithmetic (`src/shor.js`)

Goal: factor N = p × q.

1. Pick a base a that shares no factor with N.
2. Look at a^0, a^1, a^2, ... mod N. The values must repeat. The repeat length r is the order.
3. A quantum computer finds r fast. `findOrder` finds it by counting, which is fine for N under about 17 million.
4. If r is even and a^(r/2) is not -1 mod N, then (a^(r/2) - 1)(a^(r/2) + 1) is a multiple of N while neither factor is. So `gcd(a^(r/2) ± 1, N)` gives p and q.
5. `shorTrial` returns `retry` with the reason when r is odd or a^(r/2) = -1. Those are real outcomes of the method, so the page shows them.

Worked example the page opens with: N = 15, a = 7. Powers of 7 mod 15 are 1, 7, 4, 13, then repeat. r = 4. 7^2 = 49 = 4 mod 15. gcd(3, 15) = 3 and gcd(5, 15) = 5.

`scalingExperiment` runs `findOrder` on semiprimes of growing size and records log2(steps). `fitLine` does a least-squares fit. The slope near 1 means work roughly doubles per extra bit, so 2048 bits is out of reach for counting.

## 2. Toy LWE (`src/lwe.js`)

- Secret s, public matrix A, public vector b = A·s + e (mod q). Each error in e is a small random integer in [-B, B].
- To encrypt a bit, add up a random subset of the rows of (A, b). Add floor(q/2) to the b-side if the bit is 1.
- To decrypt, compute v - s·u. The A·s parts cancel. What is left is the sum of the chosen errors, plus floor(q/2) for a 1 bit. If that sum is closer to 0 the bit is 0. If it is closer to q/2 the bit is 1.
- The bit goes wrong when the error sum passes q/4 = 832. `analyticFailureRate` predicts that chance with a normal curve: standard deviation sqrt(m·B·(B+1)/6).
- `solveSecret` is Gauss-Jordan elimination mod q. With B = 0 it recovers s exactly. With B ≥ 1 it solves n noisy equations exactly, which gives the wrong s.
- Why this is a toy: real schemes use much larger parameters and structured lattices, and small instances can be broken with lattice reduction.

## 3. Sizes (`src/sizes.js`)

Straight from the standards. ML-KEM-768: encapsulation key 1,184 bytes, ciphertext 1,088 bytes. X25519: 32 bytes each way. The page adds them and divides.

## 4. Tests (`tests/`)

- `lwe.test.mjs`: bits round trip at low noise; the noise equals <e, r> exactly; simulation matches the normal-curve prediction within 3 points; the algebra attack works only at B = 0.
- `shor.test.mjs`: modPow matches BigInt; N = 15 example; all eight demo numbers factor; brute-force work grows with bit length.
- `sizes.test.mjs`: sizes match the standards; quiz answer indexes are valid.

## Questions to be ready for

- Why does the decryption threshold sit at q/4? (Midway between 0 and q/2.)
- Why is a 1-bit noise enough to defeat Gaussian elimination? (The exact solution of any n noisy equations is a different vector from the true secret.)
- Where is the quantum computer? (Nowhere. Only the period-finding step is replaced by counting. That step is where Shor's speedup lives.)
- What would you change first? (Add Module-LWE with polynomial arithmetic so the toy matches ML-KEM's structure.)
