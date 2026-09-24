import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createTeam, validateTeam, teamCryptoKey, invitePayload, joinFromInvite, makeSnapshot, summarize,
  acceptSummary, currentSummary, validateSummary, validateSnapshot, validateCheckinStart, startFresh, suggestPseudonym, PSEUDONYMS,
  toBase64url, fromBase64url,
} from '../src/team/model.js';

const TODAY = new Date(2026, 8, 24, 15, 0);
const LOW = { level: 12, suggestCover: true };
const OK = { level: 70, suggestCover: false };
const newId = () => toBase64url(crypto.getRandomValues(new Uint8Array(8)));
const CID = newId();

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
  const leader = acceptSummary(t, summarize(t, [makeSnapshot(t, OK, CID, false)], CID, TODAY), TODAY);
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
  const s = makeSnapshot(t, LOW, CID, false);
  assert.deepEqual(Object.keys(s).sort(), ['checkinId', 'low', 'nonce', 'rested', 'teamId', 'v']);
  assert.equal(s.rested, false);
  assert.equal(makeSnapshot(t, LOW, CID, true).rested, true);
  assert.throws(() => makeSnapshot(t, LOW, CID), /rested/);
  assert.throws(() => makeSnapshot(t, LOW, CID, 'yes'), /rested/);
  assert.throws(() => validateSnapshot({ ...s, rested: undefined }), /rested/);
  assert.equal(s.low, true);
  assert.equal(s.checkinId, CID);
  assert.notEqual(makeSnapshot(t, LOW, CID, false).nonce, s.nonce);
  assert.throws(() => makeSnapshot(t, LOW, 'short', false), /checkinId/);
  const shared = makeSnapshot(withShare(t, 'Heron'), OK, CID, false);
  assert.deepEqual(shared.share, { pseudonym: 'Heron', band: 'ok' });
  assert.equal(shared.low, false);
  assert.ok(!JSON.stringify(shared).includes('70'));
  validateSnapshot(shared);
});

test('summarize: dedupe, wrong team, wrong check-in, share-only statuses, expiry, no date', () => {
  const t = newTeam();
  const other = newTeam();
  const a = makeSnapshot(withShare(t, 'Swift'), LOW, CID, true);
  const b = makeSnapshot(t, LOW, CID, true);
  const c = makeSnapshot(withShare(t, 'Heron'), OK, CID, false);
  const snaps = [
    a, b, c,
    { ...b },                                        // same nonce scanned twice
    makeSnapshot(other, LOW, CID, false),                   // other team
    makeSnapshot(t, LOW, newId(), false),                   // another check-in (e.g. replayed old status)
    { ...b, nonce: 'bad', low: 'yes' },              // malformed
    { ...b, nonce: newId(), date: '2026-09-24' },    // unknown field
  ];
  const s = summarize(t, snaps, CID, TODAY);
  assert.deepEqual(s, {
    v: 1, teamId: t.id, expires: '2026-09-26', total: 3, low: 2, rested: 2,
    statuses: [{ pseudonym: 'Heron', band: 'ok' }, { pseudonym: 'Swift', band: 'low' }],
  });
  // No reference to snapshot objects is kept.
  assert.notEqual(s.statuses[1], a.share);
  a.share.pseudonym = 'Changed';
  assert.equal(s.statuses[1].pseudonym, 'Swift');
});

test('summarize hides low when fewer than 3 checked in', () => {
  const t = newTeam();
  const s = summarize(t, [makeSnapshot(t, LOW, CID, false), makeSnapshot(withShare(t, 'Heron'), LOW, CID, false)], CID, TODAY);
  assert.equal(s.total, 2);
  assert.equal(s.low, null);
  assert.equal(s.rested, null);
  assert.deepEqual(s.statuses, [{ pseudonym: 'Heron', band: 'low' }]);
  assert.throws(() => summarize(t, [], CID, TODAY), /No check-ins/);
  assert.throws(() => summarize(t, [makeSnapshot(t, LOW, newId(), false)], CID, TODAY), /No check-ins/);
});

test('acceptSummary rejects other team, expired, and tampered summaries', () => {
  const t = newTeam();
  const s = summarize(t, [makeSnapshot(t, OK, CID, false)], CID, TODAY);
  const accepted = acceptSummary(t, s, TODAY);
  assert.deepEqual(accepted.summary, s);
  assert.equal(t.summary, null, 'input team not mutated');
  assert.throws(() => acceptSummary(newTeam(), s, TODAY), /different team/);
  assert.ok(acceptSummary(t, s, new Date(2026, 8, 26, 23)));
  assert.throws(() => acceptSummary(t, s, new Date(2026, 8, 27)), /expired/);
  assert.throws(() => acceptSummary(t, { ...s, low: 0 }, TODAY), /hidden/);
  assert.throws(() => acceptSummary(t, { ...s, expires: '2026-13-01' }, TODAY), /expires/);
  assert.throws(() => acceptSummary(t, { ...s, date: '2026-09-24' }, TODAY), /not allowed/);
  // A summary claiming a far expiry is capped at today + 2.
  assert.equal(acceptSummary(t, { ...s, expires: '2026-10-30' }, TODAY).summary.expires, '2026-09-26');
  assert.throws(() => acceptSummary(t, { ...s, level: 40 }, TODAY), /not allowed/);
});

test('currentSummary is null when missing or expired', () => {
  const t = newTeam();
  assert.equal(currentSummary(t, TODAY), null);
  const withS = acceptSummary(t, summarize(t, [makeSnapshot(t, OK, CID, false)], CID, TODAY), TODAY);
  assert.equal(currentSummary(withS, new Date(2026, 8, 26)).total, 1);
  assert.equal(currentSummary(withS, new Date(2026, 8, 27)), null);
});

test('base64url round-trip', () => {
  const bytes = crypto.getRandomValues(new Uint8Array(33));
  assert.deepEqual(fromBase64url(toBase64url(bytes)), bytes);
  assert.equal(fromBase64url('a+b/'), null);
});

test('startFresh keeps name, covenant and member settings, rotates id and key', () => {
  const base = withShare(newTeam(), 'Wren');
  const t = acceptSummary(base, summarize(base, [makeSnapshot(base, OK, CID, false)], CID, TODAY), TODAY);
  const fresh = startFresh(t);
  assert.equal(fresh.name, t.name);
  assert.deepEqual(fresh.covenant, t.covenant);
  assert.notEqual(fresh.covenant, t.covenant);
  assert.equal(fresh.me.pseudonym, 'Wren');
  assert.equal(fresh.me.shareStatus, true);
  assert.notEqual(fresh.id, t.id);
  assert.notEqual(fresh.key, t.key);
  assert.notEqual(fresh.me.memberId, t.me.memberId);
  assert.equal(fresh.summary, null);
  // Old-team codes don't count in the new team.
  assert.throws(() => summarize(fresh, [makeSnapshot(t, LOW, CID, false)], CID, TODAY), /No check-ins/);
});

test('suggestPseudonym picks from a neutral list of about 60 valid words', () => {
  assert.ok(PSEUDONYMS.length >= 55 && PSEUDONYMS.length <= 65);
  assert.equal(new Set(PSEUDONYMS).size, PSEUDONYMS.length);
  for (const p of PSEUDONYMS) assert.match(p, /^[A-Z][a-z]{1,19}$/);
  const banned = /^(rooster|cockerel|crocodile|palm|fist|eagle|dove|phoenix|rebel|comrade|freedom|spark|flame|arrow|shield|soldier|angel|saint)$/i;
  assert.ok(!PSEUDONYMS.some((p) => banned.test(p)));
  const picks = new Set(Array.from({ length: 300 }, suggestPseudonym));
  assert.ok([...picks].every((p) => PSEUDONYMS.includes(p)));
  assert.ok(picks.size > 30, 'spread across the list');
  // Every suggestion is a valid pseudonym.
  assert.equal(newTeam({ pseudonym: suggestPseudonym() }).summary, null);
});

test('validateCheckinStart checks ids and P-256 public key', async () => {
  const pair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits']);
  const pub = toBase64url(new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey)));
  const t = newTeam();
  const start = { v: 1, teamId: t.id, checkinId: CID, pub };
  assert.equal(validateCheckinStart(start), start);
  assert.throws(() => validateCheckinStart({ ...start, pub: toBase64url(new Uint8Array(65)) }), /uncompressed/);
  assert.throws(() => validateCheckinStart({ ...start, pub: toBase64url(new Uint8Array(33)) }), /65 bytes/);
  assert.throws(() => validateCheckinStart({ ...start, checkinId: t.id }), /checkinId/);
  assert.throws(() => validateCheckinStart({ ...start, extra: 1 }), /not allowed/);
});

test('summary rested count: validated, hidden below 3, never above total', () => {
  const t = newTeam();
  const snaps = [true, false, true, true].map((r) => makeSnapshot(t, OK, CID, r));
  const s = summarize(t, snaps, CID, TODAY);
  assert.equal(s.total, 4);
  assert.equal(s.rested, 3);
  assert.equal(s.low, 0);
  const two = summarize(t, snaps.slice(0, 2), CID, TODAY);
  assert.equal(two.rested, null);
  assert.throws(() => validateSummary({ ...s, rested: 5 }), /rested/);
  assert.throws(() => validateSummary({ ...s, rested: undefined }), /rested/);
  assert.throws(() => validateSummary({ ...two, rested: 1 }), /hidden/);
  const { rested, ...old } = s;
  assert.throws(() => acceptSummary(t, old, TODAY), /rested/);
});
