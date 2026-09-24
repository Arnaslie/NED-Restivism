import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createTeam, validateTeam, teamCryptoKey, invitePayload, joinFromInvite, makeSnapshot, summarize,
  acceptSummary, currentSummary, validateSnapshot, toBase64url, fromBase64url,
} from '../src/team/model.js';

const TODAY = new Date(2026, 8, 24, 15, 0);
const LOW = { level: 12, suggestCover: true };
const OK = { level: 70, suggestCover: false };

const newTeam = (extra = {}) => createTeam({
  name: 'River', purpose: 'Look after each other', commitments: ['Rest is part of the work'], pseudonym: 'Heron', ...extra,
});
const withShare = (team, pseudonym) => ({ ...team, me: { ...team.me, pseudonym, shareStatus: true } });

test('createTeam: random ids, defaults, trimmed input', () => {
  const t = newTeam({ pseudonym: '  Heron ' });
  assert.equal(fromBase64url(t.id).length, 16);
  assert.equal(fromBase64url(t.key).length, 32);
  assert.equal(fromBase64url(t.me.memberId).length, 8);
  assert.deepEqual(t.me, { memberId: t.me.memberId, pseudonym: 'Heron', shareStatus: false });
  assert.equal(t.summary, null);
  assert.notEqual(newTeam().key, t.key);
  assert.equal(createTeam({ purpose: 'p', pseudonym: 'A' }).name, '');
});

test('validateTeam enforces limits and rejects unknown fields', () => {
  const t = newTeam();
  const bad = [
    { name: 'x'.repeat(31) },
    { covenant: { purpose: '', commitments: [] } },
    { covenant: { purpose: 'x'.repeat(201), commitments: [] } },
    { covenant: { purpose: 'p', commitments: ['a', 'b', 'c', 'd', 'e', 'f'] } },
    { covenant: { purpose: 'p', commitments: ['x'.repeat(81)] } },
    { covenant: { purpose: 'p', commitments: [], notes: 'x' } },
    { me: { ...t.me, pseudonym: '' } },
    { me: { ...t.me, pseudonym: 'x'.repeat(21) } },
    { me: { ...t.me, pseudonym: 'a\nb' } },
    { me: { ...t.me, shareStatus: 'yes' } },
    { me: { ...t.me, level: 40 } },
    { key: toBase64url(new Uint8Array(16)) },
    { id: 'not base64!' },
    { v: 2 },
    { location: 'x' },
  ];
  for (const patch of bad) assert.throws(() => validateTeam({ ...t, ...patch }), /Invalid team data/, JSON.stringify(patch).slice(0, 60));
  assert.equal(validateTeam({ ...t, name: 'x'.repeat(30), me: { ...t.me, pseudonym: 'é'.repeat(20) } }).name.length, 30);
  assert.throws(() => newTeam({ commitments: ['1', '2', '3', '4', '5', '6'] }), /commitments/);
});

test('teamCryptoKey is a non-extractable AES-GCM key', async () => {
  const key = await teamCryptoKey(newTeam());
  assert.equal(key.extractable, false);
  assert.equal(key.algorithm.name, 'AES-GCM');
  assert.equal(key.algorithm.length, 256);
  await assert.rejects(crypto.subtle.exportKey('raw', key));
});

test('invite + join keeps covenant, gets own identity, no summary', () => {
  const t = newTeam();
  const leader = acceptSummary(t, summarize(t, [makeSnapshot(t, OK, TODAY)], TODAY), TODAY);
  const inv = invitePayload(leader);
  assert.deepEqual(Object.keys(inv).sort(), ['covenant', 'id', 'key', 'name', 'v']);
  const member = joinFromInvite(JSON.parse(JSON.stringify(inv)), 'Kestrel');
  assert.deepEqual(member.covenant, leader.covenant);
  assert.equal(member.id, leader.id);
  assert.equal(member.key, leader.key);
  assert.notEqual(member.me.memberId, leader.me.memberId);
  assert.deepEqual({ ...member.me, memberId: 0 }, { memberId: 0, pseudonym: 'Kestrel', shareStatus: false });
  assert.equal(member.summary, null);
  assert.throws(() => joinFromInvite({ ...inv, me: leader.me }, 'K'), /not allowed/);
  assert.throws(() => joinFromInvite(inv, ''), /pseudonym/);
});

test('makeSnapshot carries only the low bit, share only when opted in', () => {
  const t = newTeam();
  const s = makeSnapshot(t, LOW, TODAY);
  assert.deepEqual(Object.keys(s).sort(), ['date', 'low', 'nonce', 'teamId', 'v']);
  assert.equal(s.low, true);
  assert.equal(s.date, '2026-09-24');
  assert.notEqual(makeSnapshot(t, LOW, TODAY).nonce, s.nonce);
  const shared = makeSnapshot(withShare(t, 'Heron'), OK, TODAY);
  assert.deepEqual(shared.share, { pseudonym: 'Heron', band: 'ok' });
  assert.equal(shared.low, false);
  assert.ok(!JSON.stringify(shared).includes('70'));
  validateSnapshot(shared);
});

test('summarize: dedupe, wrong team, wrong date, share-only statuses, expiry date', () => {
  const t = newTeam();
  const other = newTeam();
  const a = makeSnapshot(withShare(t, 'Swift'), LOW, TODAY);
  const b = makeSnapshot(t, LOW, TODAY);
  const c = makeSnapshot(withShare(t, 'Heron'), OK, TODAY);
  const snaps = [
    a, b, c,
    { ...b },                                        // same nonce scanned twice
    makeSnapshot(other, LOW, TODAY),                 // other team
    makeSnapshot(t, LOW, new Date(2026, 8, 23)),     // yesterday
    { ...b, nonce: 'bad', low: 'yes' },              // malformed
  ];
  const s = summarize(t, snaps, TODAY);
  assert.deepEqual(s, {
    v: 1, teamId: t.id, date: '2026-09-24', expires: '2026-09-26', total: 3, low: 2,
    statuses: [{ pseudonym: 'Heron', band: 'ok' }, { pseudonym: 'Swift', band: 'low' }],
  });
  // No reference to snapshot objects is kept.
  assert.notEqual(s.statuses[1], a.share);
  a.share.pseudonym = 'Changed';
  assert.equal(s.statuses[1].pseudonym, 'Swift');
});

test('summarize hides low when fewer than 3 checked in', () => {
  const t = newTeam();
  const s = summarize(t, [makeSnapshot(t, LOW, TODAY), makeSnapshot(withShare(t, 'Heron'), LOW, TODAY)], TODAY);
  assert.equal(s.total, 2);
  assert.equal(s.low, null);
  assert.deepEqual(s.statuses, [{ pseudonym: 'Heron', band: 'low' }]);
  assert.throws(() => summarize(t, [], TODAY), /No check-ins/);
});

test('acceptSummary rejects other team, expired, and tampered summaries', () => {
  const t = newTeam();
  const s = summarize(t, [makeSnapshot(t, OK, TODAY)], TODAY);
  const accepted = acceptSummary(t, s, TODAY);
  assert.deepEqual(accepted.summary, s);
  assert.equal(t.summary, null, 'input team not mutated');
  assert.throws(() => acceptSummary(newTeam(), s, TODAY), /different team/);
  assert.ok(acceptSummary(t, s, new Date(2026, 8, 26, 23)));
  assert.throws(() => acceptSummary(t, s, new Date(2026, 8, 27)), /expired/);
  assert.throws(() => acceptSummary(t, { ...s, low: 0 }, TODAY), /hidden/);
  assert.throws(() => acceptSummary(t, { ...s, expires: '2026-10-30' }, TODAY), /expires/);
  assert.throws(() => acceptSummary(t, { ...s, level: 40 }, TODAY), /not allowed/);
});

test('currentSummary is null when missing or expired', () => {
  const t = newTeam();
  assert.equal(currentSummary(t, TODAY), null);
  const withS = acceptSummary(t, summarize(t, [makeSnapshot(t, OK, TODAY)], TODAY), TODAY);
  assert.equal(currentSummary(withS, new Date(2026, 8, 26)).total, 1);
  assert.equal(currentSummary(withS, new Date(2026, 8, 27)), null);
});

test('base64url round-trip', () => {
  const bytes = crypto.getRandomValues(new Uint8Array(33));
  assert.deepEqual(fromBase64url(toBase64url(bytes)), bytes);
  assert.equal(fromBase64url('a+b/'), null);
});
