# Devpost submission: copy each block into the matching field

Hackathon: STEM Innovation Challenge 2026 (https://stem-innovation-challenge-2026.devpost.com/)
Category to state in the description: **Education & Accessibility** (also fits Engineering & Scientific Computing)

---

## Project title

Lattice Lab

## Tagline (short)

Run the experiments that show why quantum computers break RSA and why lattice encryption resists them.

## Project description (paste into "About the project")

### The problem

Most encryption in use today rests on factoring large numbers or on discrete logarithms. In 1994 Peter Shor showed that a big enough quantum computer solves both. Nobody has built that computer yet, but an attacker can record encrypted traffic today and decrypt it later. NIST published the first post-quantum standards in August 2024 (FIPS 203 and FIPS 204), and both are built on lattices.

My doctoral research asks how AI workloads can be secured as quantum computing matures, and I keep running into the same gap. The engineers and students who must plan this migration meet Shor's algorithm and lattice cryptography as equations. Few have seen either one run.

### The solution and who it is for

Lattice Lab is a single web page with three experiments. It is aimed at students, self-taught developers and security teams who need an intuition for the threat before they read a standard. It needs no install and no account, and it runs offline once loaded.

1. **Break a lock.** Pick a small N = p × q and a base a. The page finds the repeat length of a^x mod N, then turns it into the factors, the way Shor's algorithm does after its quantum step. A timing run on 192 small semiprimes shows why counting the period cannot scale.
2. **Hide a secret in noise.** A toy Learning With Errors scheme encrypts a message bit by bit. Sliders set the dimension, the number of samples and the noise size. You can watch a message survive, then break when noise passes q/4. A one-click attack solves the equations with algebra. At zero noise it recovers the secret. At noise 2 it recovers none of the 16 secret entries.
3. **Count the bytes.** Charts and tables put published sizes side by side. ML-KEM-768 moves 2,272 bytes per exchange against 64 for X25519, which is 35.5 times more.

A five-question quiz closes the page with an explanation for every answer.

### Technologies, languages and tools

Plain HTML, CSS and JavaScript (ES modules). Charts are hand-built SVG. Tests use Node's built-in test runner. There are no third-party libraries in the shipped page. Data comes from NIST FIPS 203 and 204 and RFCs 7748, 8032 and 8017.

### Key features

- Seeded randomness: the same settings and seed reproduce the same numbers, so anyone can check a result.
- 18 automated tests, including one that compares a 2,000-trial simulation against a closed-form prediction (38.60% observed, 39.64% predicted at noise 300).
- Plain-language summary above every experiment, with the technical detail below it.
- Accessibility: keyboard use, skip link, live-region announcements, a text table behind every chart, and hatching plus labels so colour is never the only signal.

### Challenges

The brute-force timings were noisy. With three semiprimes per size, the fitted growth slope bounced between 0.58 and 1.03 depending on which sizes I included. I raised the default to 192 searches, and the page now reports the slope it measures (0.87 in the default run) and labels the 2048-bit figure as an extrapolation.

My first bar chart clipped its longest label and its largest value, and my first set of SVG charts reused element ids, which would have given the wrong spoken title to a screen reader. I made the ids unique per chart and widened the layout.

The harder judgment was honesty. A toy lattice scheme with n = 16 is breakable with lattice reduction, and brute force is not the best way to attack RSA. I kept both facts on the page, in the limits section, instead of letting the demo imply more than it shows.

### What I would build next

- Module-LWE with polynomial arithmetic, so the toy matches the structure of ML-KEM.
- A lattice-reduction attack on small parameters, so learners can see where "too small" breaks.
- A hybrid key-share view (X25519 plus ML-KEM) with real handshake sizes.
- A test with screen-reader users, which I have not done.

### Pre-existing work and AI-assistance disclosure

No code in this project existed before the competition period. The idea comes from my doctoral research topic. An AI coding assistant helped write and test the code and documentation. I reviewed the output, and `docs/EXPLAIN_IT.md` in the repository explains each part.

---

## Built with

html5, css3, javascript, svg, node.js

## "Try it out" links

- Live demo: https://manonmayiv.github.io/lattice-lab/   (works only after you push and enable Pages)
- Source code: https://github.com/ManonmayiV/lattice-lab   (works only after you push)

## Image gallery

Upload these from `docs/screenshots/`:
1. `00-top.png` header and quiz
2. `01-shor.png` experiment 1 with the scaling chart
3. `02-lwe.png` experiment 2 with the noise histogram
4. `03-sizes.png` experiment 3

## Team information

Solo entry. Manonmayi Vedam: concept, design, implementation, testing, documentation and demo.

---

## Demo video script (about 2 minutes 30 seconds, recommended not mandatory)

Screen-record the live page. Speak plainly. Do not read the page aloud.

**0:00 to 0:20. The problem.**
"Most encryption today depends on factoring. A large quantum computer breaks that, and attackers can record data now to decrypt later. NIST has already published replacements. I built Lattice Lab so people can see why."

**0:20 to 1:00. Experiment 1.**
Open N = 15, base 7, click Run one trial. "The powers of 7 repeat every four steps. That repeat length gives the factors 3 and 5." Click Measure the growth. "A quantum computer finds the repeat quickly. Counting it on a normal machine doubles the work with every added bit. In my run the slope was about 0.87."

**1:00 to 1:55. Experiment 2.**
Noise at 0, click Solve the equations: "With no noise the secret falls out of plain algebra." Set noise to 2, click again: "With noise of just 2, the attack recovers none of the 16 entries." Set noise to 300, encrypt "Hi!": "Now the receiver cannot read it either. Noise passed q over 4." Click Run 2,000 trials: "772 wrong bits, 38.6 percent, against a predicted 39.6."

**1:55 to 2:20. Experiment 3.**
"The new standards cost bytes. ML-KEM-768 uses 2,272 bytes per exchange against 64 for X25519."

**2:20 to 2:35. Close.**
"Everything is a toy on purpose, and the page says so. The code, tests and docs are on GitHub. Thanks for watching."

---

## Rules check (from the Devpost overview and /rules pages)

| Requirement | Where it is met |
|---|---|
| Original technology-based STEM project | Cryptography and mathematics learning tool |
| Project title and description | Blocks above |
| Problem, solution and audience, technologies, features, challenges, future improvements | All six headings in the description |
| Working link, screenshots or video | Live demo link, `docs/screenshots/`, video script |
| Public repository with documentation | `README.md`, `docs/EXPLAIN_IT.md`, tests |
| Team members and responsibilities | Team information block |
| Substantially built during the event period | Built November 25, 2026, inside the November 23 to 25 window |
| Pre-existing work disclosed | Stated: none |
| AI use disclosed and explainable | Stated, plus `docs/EXPLAIN_IT.md` |
| Third-party material attributed | Standards and papers listed in the README |
