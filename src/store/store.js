// Store logic over an injected backend, so it can be tested in Node with an in-memory backend.
// Backend interface (all async):
//   getMeta() -> { salt, iterations, verifier } | undefined
//   setMeta(meta)
//   putRecord(key, blob)            blob = { iv, ct }
//   allRecords() -> [{ key, blob }]
//   deleteRecords(keys)
//   getDoc(name) -> blob | undefined  named encrypted documents (e.g. 'team')
//   putDoc(name, blob)
//   deleteDoc(name)
//   destroy()                       delete everything, including meta and docs
// At rest there is only meta (salt, iteration count, encrypted verifier) and opaque
// encrypted blobs under random keys — no plaintext record fields, not even dates.

import { deriveKey, randomSalt, encrypt, decrypt, makeVerifier, checkVerifier, PBKDF2_ITERATIONS } from './crypto.js';
import { createRecord, validateRecord, compareRecords, isExpired } from './record.js';
import { validateTeam, currentSummary } from '../team/model.js';

const TEAM_DOC = 'team';
const PLAN_DOC = 'plan';
const PLAN_FIELD_MAX = 80;

// Private if-then rest plan (decision 0006): { when, then }, each 1–80 characters.
export function validatePlan(plan) {
  if (plan === null || typeof plan !== 'object' || Array.isArray(plan)) throw new Error('Invalid plan: expected an object');
  for (const key of Object.keys(plan)) {
    if (key !== 'when' && key !== 'then') throw new Error(`Invalid plan: "${key}" is not allowed`);
  }
  const out = {};
  for (const field of ['when', 'then']) {
    const value = typeof plan[field] === 'string' ? plan[field].trim() : plan[field];
    if (typeof value !== 'string') throw new Error(`Invalid plan: ${field} must be text`);
    const len = [...value].length;
    if (len < 1 || len > PLAN_FIELD_MAX) throw new Error(`Invalid plan: ${field} must be 1–${PLAN_FIELD_MAX} characters`);
    if (/[\u0000-\u001f\u007f]/.test(value)) throw new Error(`Invalid plan: ${field} contains control characters`);
    out[field] = value;
  }
  return out;
}

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

  // Drops an expired summary, on disk too.
  async function getTeam(today = new Date()) {
    const k = requireKey();
    const blob = await backend.getDoc(TEAM_DOC);
    if (!blob) return null;
    const stored = await decrypt(k, blob);
    let team;
    let dropSummary = false;
    try {
      team = validateTeam(stored);
      dropSummary = team.summary !== null && !currentSummary(team, today);
    } catch (err) {
      // A summary saved in an older format (e.g. before `rested`) is dropped
      // rather than locking the person out of their team.
      if (!stored?.summary) throw err;
      team = validateTeam({ ...stored, summary: null });
      dropSummary = true;
    }
    if (dropSummary) {
      const fresh = { ...team, summary: null };
      await backend.putDoc(TEAM_DOC, await encrypt(k, fresh));
      return fresh;
    }
    return team;
  }

  async function saveTeam(team) {
    const k = requireKey();
    validateTeam(team);
    await backend.putDoc(TEAM_DOC, await encrypt(k, team));
  }

  async function clearTeam() {
    requireKey();
    await backend.deleteDoc(TEAM_DOC);
  }

  async function getPlan() {
    const k = requireKey();
    const blob = await backend.getDoc(PLAN_DOC);
    return blob ? validatePlan(await decrypt(k, blob)) : null;
  }

  async function savePlan(plan) {
    const k = requireKey();
    await backend.putDoc(PLAN_DOC, await encrypt(k, validatePlan(plan)));
  }

  async function clearPlan() {
    requireKey();
    await backend.deleteDoc(PLAN_DOC);
  }

  async function wipe() {
    key = null;
    await backend.destroy();
  }

  return { isSetUp, unlock, lock, isUnlocked, save, list, purge, getTeam, saveTeam, clearTeam, getPlan, savePlan, clearPlan, wipe };
}

// In-memory backend for tests.
export function memoryBackend() {
  let meta;
  const rows = new Map();
  const docs = new Map();
  return {
    async getMeta() { return meta; },
    async setMeta(m) { meta = m; },
    async putRecord(k, blob) { rows.set(k, blob); },
    async allRecords() { return [...rows].map(([key, blob]) => ({ key, blob })); },
    async deleteRecords(keys) { for (const k of keys) rows.delete(k); },
    async getDoc(name) { return docs.get(name); },
    async putDoc(name, blob) { docs.set(name, blob); },
    async deleteDoc(name) { docs.delete(name); },
    async destroy() { meta = undefined; rows.clear(); docs.clear(); },
    _rows: rows,
    _docs: docs,
  };
}
