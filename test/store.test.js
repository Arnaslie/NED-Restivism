// Store logic against the in-memory backend (IndexedDB itself can't run in Node).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore, memoryBackend } from '../src/store/store.js';
import { PBKDF2_ITERATIONS } from '../src/store/crypto.js';
import { createTeam, summarize, makeSnapshot, acceptSummary } from '../src/team/model.js';

const base = { date: '2026-09-22', dayPart: 'evening', type: 'meeting', durationMin: 60, intensity: 2 };

test('full lifecycle: setup, save, list, lock, wrong/right passphrase, purge, wipe', async () => {
  const backend = memoryBackend();
  const store = createStore(backend);

  assert.equal(await store.isSetUp(), false);
  assert.equal(store.isUnlocked(), false);
  await assert.rejects(store.list(), /locked/);
  await assert.rejects(store.save(base), /locked/);

  assert.equal(await store.unlock('first pass'), true);
  assert.equal(await store.isSetUp(), true);
  const meta = await backend.getMeta();
  assert.equal(meta.salt.length, 16);
  assert.equal(meta.iterations, PBKDF2_ITERATIONS);

  const today = new Date();
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const daysAgo = (n) => iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() - n));

  const saved = await store.save({ ...base, date: daysAgo(1), dayPart: 'night' });
  assert.equal(saved.v, 1);
  await store.save({ ...base, date: daysAgo(1), dayPart: 'morning' });
  await store.save({ ...base, date: daysAgo(20) });
  await assert.rejects(store.save({ ...base, notes: 'x' }), /not allowed/);

  // Nothing readable at rest.
  for (const blob of backend._rows.values()) {
    const text = Buffer.from(blob.ct).toString('latin1');
    assert.ok(!text.includes('meeting') && !text.includes(daysAgo(1)));
  }

  const listed = await store.list();
  assert.deepEqual(listed.map((r) => `${r.date} ${r.dayPart}`),
    [`${daysAgo(20)} evening`, `${daysAgo(1)} morning`, `${daysAgo(1)} night`]);

  store.lock();
  assert.equal(store.isUnlocked(), false);
  assert.equal(await store.unlock('wrong pass'), false);
  assert.equal(store.isUnlocked(), false);

  // Successful unlock purges the 20-day-old record.
  assert.equal(await store.unlock('first pass'), true);
  assert.equal((await store.list()).length, 2);
  assert.equal(await store.purge(), 0);

  await store.wipe();
  assert.equal(store.isUnlocked(), false);
  assert.equal(await store.isSetUp(), false);
  assert.equal(backend._rows.size, 0);

  // After wipe a new passphrase can be set.
  assert.equal(await store.unlock('new pass'), true);
  assert.deepEqual(await store.list(), []);
});

test('team doc: round-trip, encrypted at rest, expired summary dropped, clear, wipe', async () => {
  const backend = memoryBackend();
  const store = createStore(backend);
  const team = createTeam({ name: 'River', purpose: 'Look after each other', commitments: ['Rest'], pseudonym: 'Heron' });

  await assert.rejects(store.getTeam(), /locked/);
  await assert.rejects(store.saveTeam(team), /locked/);
  await store.unlock('pw');
  assert.equal(await store.getTeam(), null);
  await assert.rejects(store.saveTeam({ ...team, extra: 1 }), /not allowed/);

  const day = new Date(2026, 8, 24);
  const withSummary = acceptSummary(team, summarize(team, [makeSnapshot(team, { level: 10, suggestCover: true }, day)], day), day);
  await store.saveTeam(withSummary);
  assert.deepEqual(await store.getTeam(day), withSummary);

  const blob = backend._docs.get('team');
  const text = Buffer.from(blob.ct).toString('latin1');
  for (const s of ['Heron', 'River', 'Look after', team.key, team.id, '2026-09']) assert.ok(!text.includes(s), s);

  // Wrong passphrase can't read it; right one can.
  store.lock();
  assert.equal(await store.unlock('nope'), false);
  await assert.rejects(store.getTeam(), /locked/);
  await store.unlock('pw');

  // Expired summary is dropped on read, and on disk.
  const later = new Date(2026, 8, 27);
  assert.equal((await store.getTeam(later)).summary, null);
  assert.equal((await store.getTeam(day)).summary, null);

  await store.clearTeam();
  assert.equal(await store.getTeam(), null);

  await store.saveTeam(team);
  await store.wipe();
  assert.equal(backend._docs.size, 0);
  await store.unlock('new');
  assert.equal(await store.getTeam(), null);
});

test('purge(today) uses the given date', async () => {
  const store = createStore(memoryBackend());
  await store.unlock('pw');
  await store.save({ ...base, date: '2026-09-09' });
  await store.save({ ...base, date: '2026-09-10' });
  assert.equal(await store.purge(new Date(2026, 8, 24)), 1);
  assert.deepEqual((await store.list()).map((r) => r.date), ['2026-09-10']);
});
