# Lattice Lab

An interactive STEM lab that shows, with running code, why a quantum computer breaks RSA, why lattice-based encryption is built to resist it, and what the switch costs in bytes.

Built for the Global STEM Innovation Challenge 2026, category **Education & Accessibility** (it also fits Engineering & Scientific Computing).

**Live demo:** `https://manonmayiv.github.io/lattice-lab/` (after GitHub Pages is enabled, see "Publish" below)
**Author:** Manonmayi Vedam (solo entry)

## The problem

Most encryption in use today depends on factoring (RSA) or discrete logarithms (elliptic curves). Shor's 1994 algorithm solves both quickly on a large quantum computer. Encrypted data can be recorded now and decrypted later, so the migration has to start before such a machine exists. NIST published the first post-quantum standards in August 2024: FIPS 203 (ML-KEM) and FIPS 204 (ML-DSA), both lattice-based.

The people who must plan that migration, and the students who will build it, mostly meet these ideas as equations. Lattice Lab lets them run the ideas.

## What it does

| Experiment | What you do | What it shows |
|---|---|---|
| 1. Break a lock | Pick N = p × q, pick a base a, run Shor's classical post-processing | Factoring reduces to finding the period of a^x mod N. Brute-force period search is timed on 192 small semiprimes to show why counting cannot scale. |
| 2. Hide a secret in noise | Move sliders for dimension n, samples m, noise B. Encrypt a message, run 2,000 trials, attack with algebra | A toy Learning With Errors scheme. Decryption works while noise stays under q/4. With zero noise, Gaussian elimination recovers the secret. With noise B = 2, it recovers 0 of 16 entries. |
| 3. Count the bytes | Read bar charts and tables | Published sizes of X25519, RSA-2048, Ed25519, ML-KEM and ML-DSA. ML-KEM-768 moves 2,272 bytes per exchange against 64 for X25519 (35.5 times). |
| Quiz | Five questions with explanations | Retrieval practice on the three experiments. |

Every random choice comes from a seeded generator, so the same settings and seed give the same numbers. The default seed is 2026.

## Measured results

These come from the code in this repository, not from estimates.

- 18 automated tests pass (`npm test`).
- Toy LWE, n = 16, m = 64, q = 3329, B = 300, seed 2027 (the page's default seed plus one), 2,000 trials: **772 wrong bits (38.60%)** against a normal-curve prediction of **39.64%**.
- Brute-force order finding, 192 searches on semiprimes of 10 to 24 bits: fitted slope **0.87** in log2(steps) per bit. Extrapolating that line to 2,048 bits gives about 2^1,771 steps. This is a trend line from small sizes, and the number field sieve is a much better classical attack than brute force.

## How to run

No build step and no dependencies.

```bash
npm test            # unit tests (Node 18+)
npm run serve       # then open http://localhost:8080
```

ES modules need a web server, so opening `index.html` straight from disk will not work in most browsers.

## Publish (GitHub Pages)

```bash
git remote add origin https://github.com/ManonmayiV/lattice-lab.git
git push -u origin main
# then: repository Settings -> Pages -> Deploy from branch -> main / root
```

## Project layout

```
index.html        page structure and plain-language explanations
styles.css        layout, focus styles, contrast-checked colours
src/prng.js       seeded random numbers (not cryptographic)
src/lwe.js        toy LWE: keygen, encrypt, decrypt, simulation, algebra attack
src/shor.js       order finding, Shor post-processing, scaling experiment
src/sizes.js      published key, ciphertext and signature sizes
src/svg.js        dependency-free SVG chart builders
src/quiz.js       quiz content
src/app.js        wires the modules to the page
tests/            node:test suites for lwe, shor, sizes and quiz data
docs/screenshots/ screenshots of each experiment
```

## Accessibility

- Keyboard operable, visible focus ring, skip link, labelled controls.
- Results are announced through `aria-live` regions.
- Every chart has a `<title>`, a `<desc>` and a matching data table.
- Charts never rely on colour alone. Fail zones and Shor-vulnerable bars use hatching plus text labels.
- Text and control colours were chosen for at least 4.5:1 contrast on white. This was chosen by design and has not been checked with an external audit tool.
- `prefers-reduced-motion` is respected (the page has no animation).

## Limits you should know about

- **Toy parameters.** n is at most 32 and q = 3329. Real ML-KEM uses module lattices at a much larger scale. Small LWE instances can be broken by lattice reduction, so experiment 2 teaches the role of noise and makes no security claim.
- **No quantum simulation.** The period is found classically. The page does not claim to run a quantum speedup.
- **Brute force is a teaching baseline.** It is not the best classical factoring attack.
- **Sizes are as published.** A real TLS handshake adds framing, certificates and hybrid key shares that are out of scope.
- **Not tested with a screen reader or on mobile hardware.** I checked the layout in desktop Chrome only.

## Tools, attribution and AI-assistance disclosure

- Built with plain HTML, CSS and JavaScript (ES modules) and Node's built-in test runner. No third-party libraries are shipped.
- Standards used for data: NIST FIPS 203, NIST FIPS 204, RFC 7748, RFC 8032, RFC 8017.
- Papers behind the ideas: Shor (1994); Regev (2005).
- **AI use:** an AI coding assistant helped write and test the code and documentation. I reviewed the results, and `docs/EXPLAIN_IT.md` records how each part works.
- **Pre-existing work:** none of this code was written before the competition period. The idea comes from my doctoral research topic, securing AI workloads as quantum computing matures.

## Team

Solo entry: Manonmayi Vedam, design, implementation, testing and documentation.
