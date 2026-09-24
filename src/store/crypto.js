// Passphrase-derived AES-GCM encryption via WebCrypto (browser and Node 24).
// Decision 0003: PBKDF2-SHA256, 600k iterations, 16-byte salt, AES-GCM-256, 12-byte random IV.

export const PBKDF2_ITERATIONS = 600000;
const SALT_BYTES = 16;
const IV_BYTES = 12;
const VERIFIER_TEXT = 'rest-assured:verifier:v1';

const enc = new TextEncoder();
const dec = new TextDecoder();

export function randomSalt() {
  return crypto.getRandomValues(new Uint8Array(SALT_BYTES));
}

// Returns a non-extractable AES-GCM key.
export async function deriveKey(passphrase, salt, iterations = PBKDF2_ITERATIONS) {
  if (typeof passphrase !== 'string' || passphrase.length === 0) throw new Error('Passphrase required');
  const base = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

// value (JSON-serialisable) -> { iv: Uint8Array, ct: ArrayBuffer }
export async function encrypt(key, value) {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(value)));
  return { iv, ct };
}

// Throws if the key is wrong or the blob was tampered with (GCM auth failure).
export async function decrypt(key, { iv, ct }) {
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  return JSON.parse(dec.decode(pt));
}

export function makeVerifier(key) {
  return encrypt(key, VERIFIER_TEXT);
}

export async function checkVerifier(key, verifier) {
  try {
    return (await decrypt(key, verifier)) === VERIFIER_TEXT;
  } catch {
    return false;
  }
}
