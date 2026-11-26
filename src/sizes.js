// Published key, ciphertext and signature sizes, in bytes.
// Sources: NIST FIPS 203 (ML-KEM), NIST FIPS 204 (ML-DSA), RFC 7748 (X25519),
// RFC 8032 (Ed25519), RFC 8017 (RSA). RSA sizes are the modulus length for a 2048-bit key.
// "shorVulnerable" means a large quantum computer running Shor's algorithm would break it.

export const KEMS = [
  { name: 'X25519', publicKey: 32, response: 32, shorVulnerable: true, source: 'RFC 7748' },
  { name: 'RSA-2048 (key transport)', publicKey: 256, response: 256, shorVulnerable: true, source: 'RFC 8017' },
  { name: 'ML-KEM-512', publicKey: 800, response: 768, shorVulnerable: false, source: 'FIPS 203' },
  { name: 'ML-KEM-768', publicKey: 1184, response: 1088, shorVulnerable: false, source: 'FIPS 203' },
  { name: 'ML-KEM-1024', publicKey: 1568, response: 1568, shorVulnerable: false, source: 'FIPS 203' },
];

export const SIGS = [
  { name: 'Ed25519', publicKey: 32, response: 64, shorVulnerable: true, source: 'RFC 8032' },
  { name: 'RSA-2048', publicKey: 256, response: 256, shorVulnerable: true, source: 'RFC 8017' },
  { name: 'ML-DSA-44', publicKey: 1312, response: 2420, shorVulnerable: false, source: 'FIPS 204' },
  { name: 'ML-DSA-65', publicKey: 1952, response: 3309, shorVulnerable: false, source: 'FIPS 204' },
  { name: 'ML-DSA-87', publicKey: 2592, response: 4627, shorVulnerable: false, source: 'FIPS 204' },
];

/** Bytes that cross the wire for one exchange: public key plus ciphertext/signature. */
export const totalBytes = (item) => item.publicKey + item.response;

export const ratioTo = (item, base) => totalBytes(item) / totalBytes(base);
