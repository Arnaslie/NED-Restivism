// QR text codec for team sharing (docs/team-protocol.md, "Wire format").
// Text = `<kind>1.<base64url(bytes)>`; plaintext is deflate-raw compressed JSON.
//   k / c: bytes = iv(12) | AES-GCM ciphertext, team key, additionalData = "k1" / "c1"
//   s:     bytes = memberPub(65) | iv(12) | ciphertext, key = HKDF-SHA256(ECDH(member, runner),
//          salt = checkinId bytes, info "s1") -> AES-GCM, additionalData = "s1". Only the runner can open it.
//   j:     bytes = salt(16) | iv(12) | ciphertext, key = PBKDF2-SHA256(join code, salt, 600000)
// Failures to open throw one generic message so nothing leaks about why.

const PBKDF2_ITERATIONS = 600000;
const SALT_BYTES = 16;
const IV_BYTES = 12;
const TAG_BYTES = 16;
const PUB_BYTES = 65; // raw uncompressed P-256 point
const CHECKIN_ID_BYTES = 8;
const ECDH = { name: 'ECDH', namedCurve: 'P-256' };
const MAX_PLAINTEXT_BYTES = 64 * 1024; // refuse to inflate anything bigger (decompression bombs)

const KEY_ERROR = 'Not a valid code';
const CODE_ERROR = 'Wrong code or not an invite';

// Crockford base32: no I, L, O, U.
const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const JOIN_CODE_LENGTH = 10;
const JOIN_CODE_RE = /^[0-9A-HJKMNP-TV-Z]{10}$/;
const TEXT_RE = /^([jksc])1\.([A-Za-z0-9_-]+)$/;

const enc = new TextEncoder();
const dec = new TextDecoder('utf-8', { fatal: true });

// ---- base64url ------------------------------------------------------------

function toBase64url(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64url(text) {
  if (text.length % 4 === 1) throw new Error('bad base64url');
  const bin = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

// ---- compression ------------------------------------------------------------

async function deflate(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function inflate(bytes) {
  const reader = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();
  const chunks = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > MAX_PLAINTEXT_BYTES) {
      await reader.cancel();
      throw new Error('too large');
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

// ---- helpers ------------------------------------------------------------------

function concat(...parts) {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

function parseText(text) {
  const match = typeof text === 'string' ? TEXT_RE.exec(text.trim()) : null;
  if (!match) throw new Error('bad text');
  return { kind: match[1], bytes: fromBase64url(match[2]) };
}

async function encryptObj(kind, obj, key, iv) {
  const plain = await deflate(enc.encode(JSON.stringify(obj)));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: enc.encode(`${kind}1`) }, key, plain);
  return new Uint8Array(ct);
}

async function decryptObj(kind, key, iv, ct) {
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv, additionalData: enc.encode(`${kind}1`) }, key, ct);
  const obj = JSON.parse(dec.decode(await inflate(new Uint8Array(plain))));
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) throw new Error('not an object');
  return obj;
}

async function codeKey(code, salt) {
  const base = await crypto.subtle.importKey('raw', enc.encode(code), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: PBKDF2_ITERATIONS },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt', 'encrypt'],
  );
}

// ECDH(ourPriv, theirPub) -> HKDF-SHA256(salt = checkinId bytes, info "s1") -> AES-GCM key.
async function statusKey(privateKey, publicKey, checkinIdBytes) {
  const shared = await crypto.subtle.deriveBits({ name: 'ECDH', public: publicKey }, privateKey, 256);
  const base = await crypto.subtle.importKey('raw', shared, 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: checkinIdBytes, info: enc.encode('s1') },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

// Throws unless `pub` is a valid raw P-256 public key.
function importPub(pubBytes) {
  if (pubBytes.length !== PUB_BYTES) throw new Error('bad public key');
  return crypto.subtle.importKey('raw', pubBytes, ECDH, true, []);
}

function checkinIdBytes(checkinId) {
  const bytes = typeof checkinId === 'string' && /^[A-Za-z0-9_-]+$/.test(checkinId) ? fromBase64url(checkinId) : null;
  if (!bytes || bytes.length !== CHECKIN_ID_BYTES) throw new Error('bad checkinId');
  return bytes;
}

// ---- public API -----------------------------------------------------------------

// kind 'k' | 'c', cryptoKey = AES-GCM team key.
export async function sealWithKey(kind, obj, cryptoKey) {
  if (kind !== 'k' && kind !== 'c') throw new TypeError("kind must be 'k' or 'c'");
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const ct = await encryptObj(kind, obj, cryptoKey, iv);
  return `${kind}1.${toBase64url(concat(iv, ct))}`;
}

// -> { kind, obj }. Throws Error('Not a valid code') on any failure.
export async function openWithKey(text, cryptoKey) {
  try {
    const { kind, bytes } = parseText(text);
    if ((kind !== 'k' && kind !== 'c') || bytes.length < IV_BYTES + TAG_BYTES) throw new Error('bad kind');
    const obj = await decryptObj(kind, cryptoKey, bytes.subarray(0, IV_BYTES), bytes.subarray(IV_BYTES));
    return { kind, obj };
  } catch {
    throw new Error(KEY_ERROR);
  }
}

// Runner side. Creates a one-time ECDH key pair whose private key never leaves this closure
// (non-extractable, never stored). `code` is the `k` QR text to show. end() drops the key;
// openStatus() fails from then on.
export async function startCheckin(teamCryptoKey, teamId) {
  if (typeof teamId !== 'string' || !teamId) throw new TypeError('teamId required');
  const idBytes = crypto.getRandomValues(new Uint8Array(CHECKIN_ID_BYTES));
  const checkinId = toBase64url(idBytes);
  const pair = await crypto.subtle.generateKey(ECDH, false, ['deriveBits']);
  let privateKey = pair.privateKey;
  const pub = toBase64url(new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey)));
  const code = await sealWithKey('k', { v: 1, teamId, checkinId, pub }, teamCryptoKey);

  async function openStatus(text) {
    try {
      if (!privateKey) throw new Error('ended');
      const { kind, bytes } = parseText(text);
      if (kind !== 's' || bytes.length < PUB_BYTES + IV_BYTES + TAG_BYTES) throw new Error('bad kind');
      const memberPub = await importPub(bytes.subarray(0, PUB_BYTES));
      const key = await statusKey(privateKey, memberPub, idBytes);
      const iv = bytes.subarray(PUB_BYTES, PUB_BYTES + IV_BYTES);
      const obj = await decryptObj('s', key, iv, bytes.subarray(PUB_BYTES + IV_BYTES));
      if (obj.teamId !== teamId || obj.checkinId !== checkinId) throw new Error('other check-in');
      return obj;
    } catch {
      throw new Error(KEY_ERROR);
    }
  }

  function end() {
    privateKey = null;
  }

  return { checkinId, code, openStatus, end };
}

// Member side: `k` text -> { teamId, checkinId, pub }. Throws Error('Not a valid code') on any failure.
export async function openCheckinStart(text, teamCryptoKey) {
  try {
    const { kind, obj } = await openWithKey(text, teamCryptoKey);
    const { v, teamId, checkinId, pub } = obj;
    if (kind !== 'k' || v !== 1 || typeof teamId !== 'string' || !teamId) throw new Error('bad start');
    checkinIdBytes(checkinId);
    if (typeof pub !== 'string' || !/^[A-Za-z0-9_-]+$/.test(pub)) throw new Error('bad pub');
    await importPub(fromBase64url(pub));
    return { teamId, checkinId, pub };
  } catch {
    throw new Error(KEY_ERROR);
  }
}

// Member side: seals a status snapshot so only the runner of `start` can open it.
// A fresh key pair per status; its private key is dropped when this returns.
export async function sealStatus(snapshot, start) {
  if (!start || snapshot?.checkinId !== start.checkinId || snapshot?.teamId !== start.teamId) {
    throw new TypeError('Snapshot does not match this check-in');
  }
  const idBytes = checkinIdBytes(start.checkinId);
  const runnerPub = await importPub(fromBase64url(start.pub));
  const pair = await crypto.subtle.generateKey(ECDH, false, ['deriveBits']);
  const memberPub = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));
  const key = await statusKey(pair.privateKey, runnerPub, idBytes);
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const ct = await encryptObj('s', snapshot, key, iv);
  return `s1.${toBase64url(concat(memberPub, iv, ct))}`;
}

// Seals an invite with a join code (any accepted spelling, see normalizeJoinCode).
export async function sealWithCode(obj, joinCode) {
  const code = normalizeJoinCode(joinCode);
  if (!code) throw new TypeError('Invalid join code');
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const ct = await encryptObj('j', obj, await codeKey(code, salt), iv);
  return `j1.${toBase64url(concat(salt, iv, ct))}`;
}

// -> obj. Throws Error('Wrong code or not an invite') on any failure.
export async function openWithCode(text, joinCode) {
  try {
    const code = normalizeJoinCode(joinCode);
    const { kind, bytes } = parseText(text);
    if (!code || kind !== 'j' || bytes.length < SALT_BYTES + IV_BYTES + TAG_BYTES) throw new Error('bad input');
    const salt = bytes.subarray(0, SALT_BYTES);
    const iv = bytes.subarray(SALT_BYTES, SALT_BYTES + IV_BYTES);
    return await decryptObj('j', await codeKey(code, salt), iv, bytes.subarray(SALT_BYTES + IV_BYTES));
  } catch {
    throw new Error(CODE_ERROR);
  }
}

// 10 random Crockford base32 characters (50 bits), shown as "XXXX-XXXX-XX".
export function newJoinCode() {
  // 256 is a multiple of 32, so `byte & 31` is uniform.
  const chars = Array.from(crypto.getRandomValues(new Uint8Array(JOIN_CODE_LENGTH)), (b) => CROCKFORD[b & 31]).join('');
  return `${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8)}`;
}

// Typed code -> "XXXXXXXXXX" or null. Uppercases, drops "-" and spaces, maps O->0 and I/L->1.
export function normalizeJoinCode(input) {
  if (typeof input !== 'string') return null;
  const code = input
    .toUpperCase()
    .replace(/[\s-]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1');
  return JOIN_CODE_RE.test(code) ? code : null;
}

// 'j' | 'k' | 's' | 'c' | null, from the prefix only (does not check the payload).
export function kindOf(text) {
  if (typeof text !== 'string') return null;
  const match = TEXT_RE.exec(text.trim());
  return match ? match[1] : null;
}
