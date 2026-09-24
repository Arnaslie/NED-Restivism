// Store logic over an injected backend, so it can be tested in Node with an in-memory backend.
// Backend interface (all async):
//   getMeta() -> { salt, iterations, verifier } | undefined
//   setMeta(meta)
//   putRecord(key, blob)            blob = { iv, ct }
//   allRecords() -> [{ key, blob }]
//   deleteRecords(keys)
//   destroy()                       delete everything, including meta
// At rest there is only meta (salt, iteration count, encrypted verifier) and opaque
// encrypted blobs under random keys — no plaintext record fields, not even dates.

import { deriveKey, randomSalt, encrypt, decrypt, makeVerifier, checkVerifier, PBKDF2_ITERATIONS } from './crypto.js';
import { createRecord, validateRecord, compareRecords, isExpired } from './record.js';

export function createStore(backend) {
  let key = null;

  function requireKey() {
    if (!key) throw new Error('Store is locked');
    return key;
  }

  async function readAll(k) {
    const rows = await backend.allRecords();
    return Promise.all(rows.map(async ({ key: rowKey, blob }) => ({ rowKey, record: validateRecord(await decrypt(k, blob)) })));
  }

  async function isSetUp() {
    return (await backend.getMeta()) !== undefined;
  }

  async function unlock(passphrase) {
    const meta = await backend.getMeta();
    if (!meta) {
      const salt = randomSalt();
      const k = await deriveKey(passphrase, salt, PBKDF2_ITERATIONS);
      await backend.setMeta({ salt, iterations: PBKDF2_ITERATIONS, verifier: await makeVerifier(k) });
      key = k;
    } else {
      const k = await deriveKey(passphrase, meta.salt, meta.iterations);
      if (!(await checkVerifier(k, meta.verifier))) return false;
      key = k;
    }
    await purge();
    return true;
  }

  function lock() {
    key = null;
  }

  function isUnlocked() {
    return key !== null;
  }

  async function save(fields) {
    const k = requireKey();
    const record = createRecord(fields);
    await backend.putRecord(crypto.randomUUID(), await encrypt(k, record));
    return record;
  }

  async function list() {
    const rows = await readAll(requireKey());
    return rows.map((r) => r.record).sort(compareRecords);
  }

  async function purge(today = new Date()) {
    const rows = await readAll(requireKey());
    const expired = rows.filter((r) => isExpired(r.record, today)).map((r) => r.rowKey);
    if (expired.length) await backend.deleteRecords(expired);
    return expired.length;
  }

  async function wipe() {
    key = null;
    await backend.destroy();
  }

  return { isSetUp, unlock, lock, isUnlocked, save, list, purge, wipe };
}

// In-memory backend for tests.
export function memoryBackend() {
  let meta;
  const rows = new Map();
  return {
    async getMeta() { return meta; },
    async setMeta(m) { meta = m; },
    async putRecord(k, blob) { rows.set(k, blob); },
    async allRecords() { return [...rows].map(([key, blob]) => ({ key, blob })); },
    async deleteRecords(keys) { for (const k of keys) rows.delete(k); },
    async destroy() { meta = undefined; rows.clear(); },
    _rows: rows,
  };
}
