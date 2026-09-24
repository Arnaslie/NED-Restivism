// Thin IndexedDB backend for store.js. Holds only meta and encrypted blobs.

const DB_NAME = 'rest-assured';
const DB_VERSION = 2; // v2 adds DOCS
const META = 'meta';
const RECORDS = 'records';
const DOCS = 'docs';
const STORES = [META, RECORDS, DOCS];
const META_KEY = 'meta';

let dbPromise = null;

function req(r) {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

function open() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const r = indexedDB.open(DB_NAME, DB_VERSION);
      // Create whatever is missing, so a v1 database upgrades in place.
      r.onupgradeneeded = () => {
        for (const name of STORES) {
          if (!r.result.objectStoreNames.contains(name)) r.result.createObjectStore(name);
        }
      };
      r.onsuccess = () => {
        const db = r.result;
        // Another tab wiped or upgraded: drop our connection so it can proceed.
        db.onversionchange = () => {
          db.close();
          dbPromise = null;
        };
        resolve(db);
      };
      r.onerror = () => reject(r.error);
    });
    dbPromise.catch(() => { dbPromise = null; });
  }
  return dbPromise;
}

async function tx(stores, mode, fn) {
  const db = await open();
  const t = db.transaction(stores, mode);
  const result = fn(t);
  await new Promise((resolve, reject) => {
    t.oncomplete = resolve;
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error || new Error('Transaction aborted'));
  });
  return result;
}

export const idbBackend = {
  async getMeta() {
    const db = await open();
    return req(db.transaction(META).objectStore(META).get(META_KEY));
  },

  setMeta(meta) {
    return tx([META], 'readwrite', (t) => { t.objectStore(META).put(meta, META_KEY); });
  },

  putRecord(key, blob) {
    return tx([RECORDS], 'readwrite', (t) => { t.objectStore(RECORDS).put(blob, key); });
  },

  async allRecords() {
    const db = await open();
    const store = db.transaction(RECORDS).objectStore(RECORDS);
    const [keys, blobs] = await Promise.all([req(store.getAllKeys()), req(store.getAll())]);
    return keys.map((key, i) => ({ key, blob: blobs[i] }));
  },

  deleteRecords(keys) {
    return tx([RECORDS], 'readwrite', (t) => {
      const s = t.objectStore(RECORDS);
      for (const k of keys) s.delete(k);
    });
  },

  async getDoc(name) {
    const db = await open();
    return req(db.transaction(DOCS).objectStore(DOCS).get(name));
  },

  putDoc(name, blob) {
    return tx([DOCS], 'readwrite', (t) => { t.objectStore(DOCS).put(blob, name); });
  },

  deleteDoc(name) {
    return tx([DOCS], 'readwrite', (t) => { t.objectStore(DOCS).delete(name); });
  },

  // Clear first so the data is gone even if deleteDatabase is blocked by another open tab.
  async destroy() {
    await tx(STORES, 'readwrite', (t) => {
      for (const name of STORES) t.objectStore(name).clear();
    });
    const db = await dbPromise;
    db?.close();
    dbPromise = null;
    await new Promise((resolve, reject) => {
      const r = indexedDB.deleteDatabase(DB_NAME);
      r.onsuccess = resolve;
      r.onerror = () => reject(r.error);
      r.onblocked = resolve; // stores are already empty; deletion completes when other tabs close
    });
  },
};
