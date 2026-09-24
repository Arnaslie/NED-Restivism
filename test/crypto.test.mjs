import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deriveKey, randomSalt, encrypt, decrypt, makeVerifier, checkVerifier } from '../src/store/crypto.js';

// Fewer iterations keep tests fast; production default (600k) is covered in store.test.mjs.
const ITER = 1000;

test('round-trips a record and uses a fresh IV each time', async () => {
  const key = await deriveKey('correct horse', randomSalt(), ITER);
  const value = { date: '2026-09-22', type: 'action', durationMin: 120 };
  const a = await encrypt(key, value);
  const b = await encrypt(key, value);
  assert.equal(a.iv.length, 12);
  assert.notDeepEqual(a.iv, b.iv);
  assert.deepEqual(await decrypt(key, a), value);
  assert.ok(!Buffer.from(a.ct).toString('latin1').includes('2026-09-22'), 'no plaintext in ciphertext');
});

test('key is non-extractable AES-GCM-256', async () => {
  const key = await deriveKey('pw', randomSalt(), ITER);
  assert.equal(key.extractable, false);
  assert.equal(key.algorithm.name, 'AES-GCM');
  assert.equal(key.algorithm.length, 256);
  await assert.rejects(crypto.subtle.exportKey('raw', key));
});

test('wrong passphrase or wrong salt fails', async () => {
  const salt = randomSalt();
  const key = await deriveKey('right', salt, ITER);
  const blob = await encrypt(key, { x: 1 });
  await assert.rejects(decrypt(await deriveKey('wrong', salt, ITER), blob));
  await assert.rejects(decrypt(await deriveKey('right', randomSalt(), ITER), blob));

  const verifier = await makeVerifier(key);
  assert.equal(await checkVerifier(key, verifier), true);
  assert.equal(await checkVerifier(await deriveKey('wrong', salt, ITER), verifier), false);
});

test('tampered ciphertext fails', async () => {
  const key = await deriveKey('pw', randomSalt(), ITER);
  const blob = await encrypt(key, { x: 1 });
  const ct = new Uint8Array(blob.ct.slice(0));
  ct[0] ^= 1;
  await assert.rejects(decrypt(key, { iv: blob.iv, ct }));
});

test('empty passphrase is refused', async () => {
  await assert.rejects(deriveKey('', randomSalt(), ITER), /Passphrase required/);
});
