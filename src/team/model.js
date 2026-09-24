// Team model: pure functions for decision 0005 / docs/team-protocol.md.
// No DOM, no storage. Sealing into QR text is src/share/ (infra); this module only builds
// and checks the plain objects.

import { dayNumber, fromDayNumber, localDate } from '../store/record.js';

export const TEAM_VERSION = 1;
export const SUMMARY_TTL_DAYS = 2;
export const MIN_TOTAL_FOR_LOW = 3;
export const LIMITS = {
  name: 30,
  purpose: 200,
  commitments: 5,
  commitment: 80,
  pseudonym: 20,
  members: 100, // not in the protocol: caps summary size so it stays QR-sized
};
const ID_BYTES = 16;
const KEY_BYTES = 32;
const MEMBER_ID_BYTES = 8;
const NONCE_BYTES = 8;
const CHECKIN_ID_BYTES = 8;
const P256_RAW_PUB_BYTES = 65;
const BANDS = ['ok', 'low'];

// Suggested pseudonyms: plain nature words and objects. Deliberately nothing political,
// religious, military or activist-coded — and none of the Zimbabwean party or leader
// symbols (e.g. cockerel/rooster, crocodile, open palm, fist).
export const PSEUDONYMS = [
  'Heron', 'Cedar', 'Pebble', 'Willow', 'Otter', 'Fern', 'Maple', 'Birch', 'Acorn', 'Clover',
  'Moss', 'Reed', 'Sparrow', 'Wren', 'Finch', 'Robin', 'Kestrel', 'Heather', 'Juniper', 'Hazel',
  'Pine', 'Aspen', 'Lark', 'Plover', 'Ibis', 'Egret', 'Swift', 'Tern', 'Pelican', 'Gecko',
  'Tortoise', 'Hare', 'Badger', 'Marten', 'Meerkat', 'Lantern', 'Kettle', 'Teacup', 'Basket', 'Button',
  'Pillow', 'Blanket', 'Ribbon', 'Marble', 'Meadow', 'Brook', 'Harbor', 'Island', 'Lagoon', 'Valley',
  'Dune', 'Tide', 'Cloud', 'Mist', 'Breeze', 'Thistle', 'Nutmeg', 'Saffron', 'Quill', 'Compass',
];

// --- base64url (kept local to src/team; src/share has its own) ---

export function toBase64url(bytes) {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function fromBase64url(text) {
  if (typeof text !== 'string' || !/^[A-Za-z0-9_-]*$/.test(text) || text.length % 4 === 1) return null;
  const bin = atob(text.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (text.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

function randomB64(n) {
  return toBase64url(crypto.getRandomValues(new Uint8Array(n)));
}

// --- validation helpers ---

function fail(msg) {
  throw new Error(`Invalid team data: ${msg}`);
}

function isPlainObject(x) {
  return x !== null && typeof x === 'object' && !Array.isArray(x);
}

function checkObject(obj, allowed, where) {
  if (!isPlainObject(obj)) fail(`${where} must be an object`);
  for (const key of Object.keys(obj)) {
    if (!allowed.includes(key)) fail(`${where}.${key} is not allowed`);
  }
}

function checkVersion(v, where) {
  if (v !== TEAM_VERSION) fail(`${where} has unsupported version ${v}`);
}

// Length in characters (code points); no control characters.
function checkText(value, name, min, max) {
  if (typeof value !== 'string') fail(`${name} must be text`);
  const len = [...value].length;
  if (len < min || len > max) fail(min > 0 ? `${name} must be ${min}–${max} characters` : `${name} must be at most ${max} characters`);
  if (/[\u0000-\u001f\u007f]/.test(value)) fail(`${name} contains control characters`);
  if (min > 0 && value.trim() === '') fail(`${name} must not be blank`);
}

function checkBytes(value, n, name) {
  const bytes = fromBase64url(value);
  if (!bytes || bytes.length !== n || toBase64url(bytes) !== value) fail(`${name} must be ${n} bytes, base64url`);
}

function checkDate(value, name) {
  if (Number.isNaN(dayNumber(value))) fail(`${name} must be YYYY-MM-DD`);
}

function checkCovenant(c) {
  checkObject(c, ['purpose', 'commitments'], 'covenant');
  checkText(c.purpose, 'purpose', 1, LIMITS.purpose);
  if (!Array.isArray(c.commitments) || c.commitments.length > LIMITS.commitments) {
    fail(`commitments must be a list of at most ${LIMITS.commitments}`);
  }
  c.commitments.forEach((s, i) => checkText(s, `commitment ${i + 1}`, 1, LIMITS.commitment));
}

function checkStatus(s, where) {
  checkObject(s, ['pseudonym', 'band'], where);
  checkText(s.pseudonym, 'pseudonym', 1, LIMITS.pseudonym);
  if (!BANDS.includes(s.band)) fail(`${where}.band must be ok or low`);
}

function checkInvite(inv) {
  checkObject(inv, ['v', 'id', 'name', 'key', 'covenant'], 'invite');
  checkVersion(inv.v, 'invite');
  checkBytes(inv.id, ID_BYTES, 'id');
  checkText(inv.name, 'name', 0, LIMITS.name);
  checkBytes(inv.key, KEY_BYTES, 'key');
  checkCovenant(inv.covenant);
}

const newMe = (pseudonym, shareStatus = false) => ({
  memberId: randomB64(MEMBER_ID_BYTES),
  pseudonym: typeof pseudonym === 'string' ? pseudonym.trim() : pseudonym,
  shareStatus,
});

const copyCovenant = (c) => ({ purpose: c.purpose, commitments: [...c.commitments] });

// --- check-ins, summaries and snapshots ---

// Kind `k` payload. The public key must be an uncompressed P-256 point (0x04 | x | y).
export function validateCheckinStart(s) {
  checkObject(s, ['v', 'teamId', 'checkinId', 'pub'], 'check-in');
  checkVersion(s.v, 'check-in');
  checkBytes(s.teamId, ID_BYTES, 'check-in teamId');
  checkBytes(s.checkinId, CHECKIN_ID_BYTES, 'checkinId');
  checkBytes(s.pub, P256_RAW_PUB_BYTES, 'check-in pub');
  if (fromBase64url(s.pub)[0] !== 0x04) fail('check-in pub must be an uncompressed P-256 key');
  return s;
}

export function validateSummary(s) {
  checkObject(s, ['v', 'teamId', 'expires', 'total', 'low', 'statuses'], 'summary');
  checkVersion(s.v, 'summary');
  checkBytes(s.teamId, ID_BYTES, 'summary.teamId');
  checkDate(s.expires, 'summary.expires');
  if (!Number.isInteger(s.total) || s.total < 1 || s.total > LIMITS.members) fail(`summary.total must be 1–${LIMITS.members}`);
  if (s.total < MIN_TOTAL_FOR_LOW) {
    if (s.low !== null) fail('summary.low must be hidden when fewer than 3 checked in');
  } else if (!Number.isInteger(s.low) || s.low < 0 || s.low > s.total) {
    fail('summary.low must be 0–total');
  }
  if (!Array.isArray(s.statuses) || s.statuses.length > s.total) fail('summary.statuses must be a list no longer than total');
  s.statuses.forEach((st, i) => checkStatus(st, `summary.statuses[${i}]`));
  return s;
}

export function validateSnapshot(s) {
  checkObject(s, ['v', 'teamId', 'checkinId', 'nonce', 'low', 'share'], 'snapshot');
  checkVersion(s.v, 'snapshot');
  checkBytes(s.teamId, ID_BYTES, 'snapshot.teamId');
  checkBytes(s.checkinId, CHECKIN_ID_BYTES, 'snapshot.checkinId');
  checkBytes(s.nonce, NONCE_BYTES, 'snapshot.nonce');
  if (typeof s.low !== 'boolean') fail('snapshot.low must be true or false');
  if (s.share !== undefined) {
    checkStatus(s.share, 'snapshot.share');
    if ((s.share.band === 'low') !== s.low) fail('snapshot.share.band must match low');
  }
  return s;
}

// --- public API (docs/team-protocol.md) ---

export function validateTeam(team) {
  checkObject(team, ['v', 'id', 'name', 'key', 'covenant', 'me', 'summary'], 'team');
  checkVersion(team.v, 'team');
  checkBytes(team.id, ID_BYTES, 'id');
  checkText(team.name, 'name', 0, LIMITS.name);
  checkBytes(team.key, KEY_BYTES, 'key');
  checkCovenant(team.covenant);
  checkObject(team.me, ['memberId', 'pseudonym', 'shareStatus'], 'me');
  checkBytes(team.me.memberId, MEMBER_ID_BYTES, 'me.memberId');
  checkText(team.me.pseudonym, 'pseudonym', 1, LIMITS.pseudonym);
  if (typeof team.me.shareStatus !== 'boolean') fail('me.shareStatus must be true or false');
  if (team.summary !== null) {
    validateSummary(team.summary);
    if (team.summary.teamId !== team.id) fail('summary belongs to another team');
  }
  return team;
}

export function createTeam({ name = '', purpose, commitments = [], pseudonym }) {
  return validateTeam({
    v: TEAM_VERSION,
    id: randomB64(ID_BYTES),
    name: typeof name === 'string' ? name.trim() : name,
    key: randomB64(KEY_BYTES),
    covenant: {
      purpose: typeof purpose === 'string' ? purpose.trim() : purpose,
      commitments: Array.isArray(commitments)
        ? commitments.map((c) => (typeof c === 'string' ? c.trim() : c)).filter((c) => c !== '')
        : commitments,
    },
    me: newMe(pseudonym),
    summary: null,
  });
}

export function teamCryptoKey(team) {
  const raw = fromBase64url(team.key);
  if (!raw || raw.length !== KEY_BYTES) throw new Error('Invalid team data: key must be 32 bytes, base64url');
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export function invitePayload(team) {
  validateTeam(team);
  return { v: TEAM_VERSION, id: team.id, name: team.name, key: team.key, covenant: copyCovenant(team.covenant) };
}

export function joinFromInvite(invite, pseudonym) {
  checkInvite(invite);
  return validateTeam({
    v: TEAM_VERSION,
    id: invite.id,
    name: invite.name,
    key: invite.key,
    covenant: copyCovenant(invite.covenant),
    me: newMe(pseudonym),
    summary: null,
  });
}

// Key rotation: same name, covenant and member settings; new id, key and memberId; no summary.
export function startFresh(team) {
  validateTeam(team);
  return validateTeam({
    v: TEAM_VERSION,
    id: randomB64(ID_BYTES),
    name: team.name,
    key: randomB64(KEY_BYTES),
    covenant: copyCovenant(team.covenant),
    me: newMe(team.me.pseudonym, team.me.shareStatus),
    summary: null,
  });
}

// Uniform pick (rejection sampling avoids modulo bias).
export function suggestPseudonym() {
  const limit = Math.floor(2 ** 32 / PSEUDONYMS.length) * PSEUDONYMS.length;
  const buf = new Uint32Array(1);
  do crypto.getRandomValues(buf); while (buf[0] >= limit);
  return PSEUDONYMS[buf[0] % PSEUDONYMS.length];
}

// battery = computeBattery(...) result; only its low/ok bit leaves the device.
export function makeSnapshot(team, battery, checkinId) {
  checkBytes(checkinId, CHECKIN_ID_BYTES, 'checkinId');
  const low = battery.suggestCover === true;
  const snap = { v: TEAM_VERSION, teamId: team.id, checkinId, nonce: randomB64(NONCE_BYTES), low };
  if (team.me.shareStatus) snap.share = { pseudonym: team.me.pseudonym, band: low ? 'low' : 'ok' };
  return snap;
}

// Builds a fresh summary; copies only the needed fields so no snapshot object is retained.
// Invalid snapshots, other teams, other check-ins and repeated nonces are ignored.
// Throws when nothing counts (see "Model notes" in docs/team-protocol.md).
export function summarize(team, snapshots, checkinId, today = new Date()) {
  checkBytes(checkinId, CHECKIN_ID_BYTES, 'checkinId');
  const seen = new Set();
  let total = 0;
  let low = 0;
  const statuses = [];
  for (const s of snapshots) {
    try {
      validateSnapshot(s);
    } catch {
      continue;
    }
    if (s.teamId !== team.id || s.checkinId !== checkinId || seen.has(s.nonce)) continue;
    seen.add(s.nonce);
    total += 1;
    if (s.low) low += 1;
    if (s.share) statuses.push({ pseudonym: s.share.pseudonym, band: s.share.band });
  }
  if (total === 0) throw new Error('No check-ins for this team');
  if (total > LIMITS.members) throw new Error(`Too many check-ins (max ${LIMITS.members})`);
  // Sorted so the order people were scanned in isn't revealed.
  statuses.sort((a, b) => (a.pseudonym < b.pseudonym ? -1 : a.pseudonym > b.pseudonym ? 1 : 0));
  return {
    v: TEAM_VERSION,
    teamId: team.id,
    expires: maxExpires(today),
    total,
    low: total < MIN_TOTAL_FOR_LOW ? null : low,
    statuses,
  };
}

function maxExpires(today) {
  return fromDayNumber(dayNumber(localDate(today)) + SUMMARY_TTL_DAYS);
}

function isExpired(summary, today) {
  return localDate(today) > summary.expires;
}

export function acceptSummary(team, summary, today = new Date()) {
  validateSummary(summary);
  if (summary.teamId !== team.id) throw new Error('This check-in is for a different team');
  if (isExpired(summary, today)) throw new Error('This check-in has expired');
  // Never keep it past today + 2, even if the runner's clock was ahead.
  const cap = maxExpires(today);
  return {
    ...team,
    summary: { ...summary, expires: summary.expires > cap ? cap : summary.expires, statuses: summary.statuses.map((s) => ({ pseudonym: s.pseudonym, band: s.band })) },
  };
}

export function currentSummary(team, today = new Date()) {
  const s = team?.summary;
  if (!s || isExpired(s, today)) return null;
  return s;
}
