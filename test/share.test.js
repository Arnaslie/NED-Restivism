import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  sealWithKey,
  openWithKey,
  sealWithCode,
  openWithCode,
  newJoinCode,
  normalizeJoinCode,
  kindOf,
} from '../src/share/codec.js';
import { qrPath } from '../src/share/qr.js';
import { QrCode } from '../src/vendor/qrcodegen.js';

const teamKey = () => crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);

const snapshot = {
  v: 1,
  teamId: 'q5Zk1yX0bH4mS2cP9wT7eA',
  date: '2026-09-24',
  nonce: 'mQ3xT9bLr0A',
  low: true,
  share: { pseudonym: 'Heron', band: 'low' },
};
const summary = {
  v: 1,
  teamId: 'q5Zk1yX0bH4mS2cP9wT7eA',
  date: '2026-09-24',
  expires: '2026-09-26',
  total: 5,
  low: 2,
  statuses: [{ pseudonym: 'Heron', band: 'low' }],
};
const invite = {
  v: 1,
  id: 'q5Zk1yX0bH4mS2cP9wT7eA',
  name: 'Tuesday group',
  key: 'Zm9vYmFyYmF6cXV4Zm9vYmFyYmF6cXV4Zm9vYmFyYmE',
  covenant: { purpose: 'We look after each other so we can keep going.', commitments: ['Rest is part of the work.'] },
};

// Varied pseudo-random words so deflate cannot shrink it much: a worst-ish case payload.
function bulkyText(n, seed) {
  const words = ['rest', 'care', 'share', 'load', 'sleep', 'walk', 'call', 'meal', 'pause', 'help', 'check', 'hold'];
  let s = seed;
  const out = [];
  while (out.join(' ').length < n) {
    s = (s * 1103515245 + 12345) % 2147483648;
    out.push(words[s % words.length] + (s % 97));
  }
  return out.join(' ').slice(0, n);
}

test('status (s) and summary (c) round-trip with the team key', async () => {
  const key = await teamKey();
  const s = await sealWithKey('s', snapshot, key);
  const c = await sealWithKey('c', summary, key);
  assert.match(s, /^s1\.[A-Za-z0-9_-]+$/);
  assert.match(c, /^c1\.[A-Za-z0-9_-]+$/);
  assert.deepEqual(await openWithKey(s, key), { kind: 's', obj: snapshot });
  assert.deepEqual(await openWithKey(c, key), { kind: 'c', obj: summary });
  assert.notEqual(await sealWithKey('s', snapshot, key), s, 'fresh IV each time');
  assert.ok(!s.includes('Heron') && !c.includes('Heron'), 'no plaintext in the QR text');
});

test('sealWithKey only accepts s and c', async () => {
  const key = await teamKey();
  await assert.rejects(sealWithKey('j', invite, key), TypeError);
  await assert.rejects(sealWithKey('x', invite, key), TypeError);
});

test('wrong key, tampering, garbage and invites all fail with the generic message', async () => {
  const key = await teamKey();
  const s = await sealWithKey('s', snapshot, key);
  const generic = { message: 'Not a valid code' };
  await assert.rejects(openWithKey(s, await teamKey()), generic);
  const flipped = s.slice(0, -2) + (s.at(-2) === 'A' ? 'B' : 'A') + s.at(-1);
  await assert.rejects(openWithKey(flipped, key), generic);
  for (const bad of ['', 's1.', 's1.!!!', 'x1.abcd', 'hello', null, 42, s.slice(0, 20)]) {
    await assert.rejects(openWithKey(bad, key), generic);
  }
  await assert.rejects(openWithKey(await sealWithCode(invite, newJoinCode()), key), generic);
});

test('a status cannot be passed off as a summary (kind is authenticated)', async () => {
  const key = await teamKey();
  const s = await sealWithKey('s', snapshot, key);
  await assert.rejects(openWithKey('c' + s.slice(1), key), { message: 'Not a valid code' });
});

test('invite (j) round-trips with the join code, in any typed spelling', async () => {
  const code = '7KQ2-M9XD-40';
  const j = await sealWithCode(invite, code);
  assert.match(j, /^j1\.[A-Za-z0-9_-]+$/);
  assert.equal(kindOf(j), 'j');
  assert.deepEqual(await openWithCode(j, code), invite);
  assert.deepEqual(await openWithCode(j, ' 7kq2 m9xd 4o '), invite);
});

test('wrong join code or a non-invite fails with the generic message', async () => {
  const key = await teamKey();
  const j = await sealWithCode(invite, '7KQ2-M9XD-40');
  const generic = { message: 'Wrong code or not an invite' };
  await assert.rejects(openWithCode(j, '7KQ2-M9XD-41'), generic);
  await assert.rejects(openWithCode(j, 'not a code'), generic);
  await assert.rejects(openWithCode(await sealWithKey('s', snapshot, key), '7KQ2-M9XD-40'), generic);
  await assert.rejects(openWithCode('j1.AAAA', '7KQ2-M9XD-40'), generic);
  await assert.rejects(openWithCode('s' + j.slice(1), '7KQ2-M9XD-40'), generic);
});

test('normalizeJoinCode', () => {
  assert.equal(normalizeJoinCode('7KQ2-M9XD-4T'), '7KQ2M9XD4T');
  assert.equal(normalizeJoinCode('7kq2m9xd4t'), '7KQ2M9XD4T');
  assert.equal(normalizeJoinCode(' 7kq2 - m9xd - 4t\n'), '7KQ2M9XD4T');
  assert.equal(normalizeJoinCode('OOOO-IIII-LL'), '0000111111');
  assert.equal(normalizeJoinCode('oooo-iiii-ll'), '0000111111');
  assert.equal(normalizeJoinCode('7KQ2-M9XD-4'), null, 'too short');
  assert.equal(normalizeJoinCode('7KQ2-M9XD-4TT'), null, 'too long');
  assert.equal(normalizeJoinCode('7KQ2-M9XD-4U'), null, 'U is not Crockford');
  assert.equal(normalizeJoinCode('7KQ2_M9XD_4T'), null);
  assert.equal(normalizeJoinCode(''), null);
  assert.equal(normalizeJoinCode(null), null);
  assert.equal(normalizeJoinCode(1234567890), null);
});

test('newJoinCode: XXXX-XXXX-XX in Crockford base32, normalises to itself, ~50 bits', () => {
  const codes = Array.from({ length: 2000 }, newJoinCode);
  for (const code of codes) {
    assert.match(code, /^[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{2}$/);
    assert.equal(normalizeJoinCode(code), code.replace(/-/g, ''));
  }
  assert.equal(new Set(codes).size, codes.length, 'no repeats');
  // All 32 symbols appear in every position (20000 draws, each symbol ~625 times).
  const seen = new Set(codes.join('').replace(/-/g, ''));
  assert.equal(seen.size, 32);
  assert.equal(10 * Math.log2(32), 50);
});

test('kindOf', () => {
  assert.equal(kindOf('s1.abc'), 's');
  assert.equal(kindOf('c1.abc'), 'c');
  assert.equal(kindOf('j1.abc'), 'j');
  assert.equal(kindOf(' c1.abc\n'), 'c');
  assert.equal(kindOf('x1.abc'), null);
  assert.equal(kindOf('s2.abc'), null);
  assert.equal(kindOf('https://example.org'), null);
  assert.equal(kindOf(''), null);
  assert.equal(kindOf(undefined), null);
});

test('a 1.3 KB payload seals and fits in one QR code', async (t) => {
  const key = await teamKey();
  const cases = {
    // Near the covenant limits: name 30, purpose 200, 5 commitments of 80.
    'max invite-sized (words)': {
      ...invite,
      name: bulkyText(30, 1),
      covenant: { purpose: bulkyText(200, 2), commitments: [3, 4, 5, 6, 7].map((s) => bulkyText(80, s)) },
      pad: bulkyText(520, 8),
    },
    // Worst case: random characters that deflate cannot shrink.
    'incompressible': { ...summary, pad: toB64(crypto.getRandomValues(new Uint8Array(975))) },
  };
  for (const [label, obj] of Object.entries(cases)) {
    const json = JSON.stringify(obj);
    assert.ok(json.length >= 1300, `${label} payload is ${json.length} bytes`);
    const text = await sealWithKey('c', obj, key);
    assert.deepEqual((await openWithKey(text, key)).obj, obj);
    const { version } = qrPath(text); // throws "Data too long" if it does not fit
    assert.ok(version <= 40);
    t.diagnostic(`${label}: ${json.length} B JSON -> ${text.length} chars, QR version ${version}`);
  }
});

function toB64(bytes) {
  return btoa(String.fromCharCode(...bytes));
}

test('decompression bombs are refused', async () => {
  const key = await teamKey();
  const text = await sealWithKey('c', { pad: 'a'.repeat(100 * 1024) }, key);
  assert.ok(text.length < 1000, 'compresses small');
  await assert.rejects(openWithKey(text, key), { message: 'Not a valid code' });
});

test('QR encoder: matrix has the right size, finder patterns and quiet zone', () => {
  const qr = QrCode.encodeText('c1.' + 'A'.repeat(200), QrCode.Ecc.MEDIUM);
  assert.equal(qr.size, qr.version * 4 + 17);
  assert.ok(qr.errorCorrectionLevel.ordinal >= QrCode.Ecc.MEDIUM.ordinal, 'at least ECC level M');
  // 7x7 finder pattern: dark ring, light ring, dark 3x3 core, in three corners.
  const finder = (ox, oy) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const ring = Math.max(Math.abs(x - 3), Math.abs(y - 3));
        assert.equal(qr.getModule(ox + x, oy + y), ring !== 2, `finder at ${ox},${oy} (${x},${y})`);
      }
    }
  };
  finder(0, 0);
  finder(qr.size - 7, 0);
  finder(0, qr.size - 7);

  const { size, d } = qrPath('c1.' + 'A'.repeat(200));
  assert.equal(size, qr.size + 8, '4-module quiet zone each side');
  const cells = [...d.matchAll(/M(\d+),(\d+)h1v1h-1z/g)].map((m) => [Number(m[1]), Number(m[2])]);
  let dark = 0;
  for (let y = 0; y < qr.size; y++) for (let x = 0; x < qr.size; x++) if (qr.getModule(x, y)) dark++;
  assert.equal(cells.length, dark);
  assert.ok(cells.every(([x, y]) => x >= 4 && y >= 4 && x < size - 4 && y < size - 4));
});
