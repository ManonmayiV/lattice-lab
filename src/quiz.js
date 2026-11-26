// Five check-your-understanding questions. `answer` is the index of the correct option.

export const QUIZ = [
  {
    q: 'Which step of factoring does a quantum computer speed up in Shor\'s algorithm?',
    options: [
      'Finding the period of a^x mod N',
      'Guessing the factors one by one',
      'Sorting the list of primes',
      'Hashing N several times',
    ],
    answer: 0,
    why: 'The quantum part finds the repeating period r. The factors then come from gcd(a^(r/2) - 1, N) and gcd(a^(r/2) + 1, N), which is ordinary arithmetic.',
  },
  {
    q: 'In the LWE lab, set noise to B = 0 and run the attack, then set B = 1 and run it again. What changes?',
    options: [
      'Nothing, the secret is recovered both times',
      'With B = 0 the secret is recovered, with B = 1 the recovered secret is wrong',
      'With B = 1 the secret is recovered faster',
      'The attack crashes when B is not zero',
    ],
    answer: 1,
    why: 'Without noise the problem is plain linear algebra. A noise of only 1 per equation makes the exact solution to any n equations wrong.',
  },
  {
    q: 'Why is "harvest now, decrypt later" a concern before large quantum computers exist?',
    options: [
      'Quantum computers can already read all traffic',
      'An attacker can store encrypted data today and decrypt it once a quantum computer exists',
      'Hash functions stop working over time',
      'Certificates expire faster',
    ],
    answer: 1,
    why: 'Data that must stay secret for many years is at risk from recordings made today, even though the decrypting machine does not exist yet.',
  },
  {
    q: 'Why does ML-KEM-768 need far more bytes on the wire than X25519?',
    options: [
      'It uses weaker math',
      'Its keys and ciphertexts are vectors and matrices of numbers mod q, not one curve point',
      'It adds a password',
      'It compresses nothing on purpose',
    ],
    answer: 1,
    why: 'Lattice-based objects are lists of many small numbers. A 32-byte curve point becomes a 1,184-byte public key and a 1,088-byte ciphertext.',
  },
  {
    q: 'In the toy LWE scheme, when does a bit decrypt wrongly?',
    options: [
      'When the accumulated noise term grows past q/4',
      'When the message is longer than 8 characters',
      'When n is odd',
      'Never, decryption is always exact',
    ],
    answer: 0,
    why: 'Decryption rounds to the nearest of 0 and q/2. Noise larger than q/4 pushes the value across the halfway point and flips the bit.',
  },
];
