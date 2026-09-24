import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { computeBattery } from '../src/battery.js';

const mock = JSON.parse(readFileSync(new URL('../mock/activities.json', import.meta.url))).records;
const TODAY = new Date(2026, 8, 24);

const day = (date, parts) => parts.map(([dayPart, type, durationMin, intensity, extra]) =>
  ({ date, dayPart, type, durationMin, intensity, ...extra }));

test('no records -> full battery', () => {
  assert.deepEqual(computeBattery([], TODAY), { level: 100, suggestCover: false });
});

test('mock data gives a believable mid-range level', () => {
  const { level, suggestCover } = computeBattery(mock, TODAY);
  assert.ok(Number.isInteger(level));
  assert.ok(level > 25 && level < 95, `level ${level}`);
  assert.equal(suggestCover, false);
});

test('every prefix of the mock data stays within 0..100', () => {
  for (let i = 0; i <= mock.length; i++) {
    const { level } = computeBattery(mock.slice(0, i), TODAY);
    assert.ok(level >= 0 && level <= 100);
  }
});

test('a few heavy days in a row suggest cover', () => {
  const heavy = ['2026-09-21', '2026-09-22', '2026-09-23'].flatMap((d) => day(d, [
    ['morning', 'action', 180, 3],
    ['afternoon', 'support', 120, 2],
    ['night', 'sleep', 300, 1],
  ]));
  const result = computeBattery(heavy, TODAY);
  assert.equal(result.suggestCover, true, `level ${result.level}`);
  assert.ok(result.level < 25);
});

test('rest recharges and order within a day does not depend on input order', () => {
  const work = day('2026-09-23', [['morning', 'action', 180, 2]]);
  const rested = [...day('2026-09-23', [['evening', 'rest', 120, 1]]), ...work];
  assert.ok(computeBattery(rested, TODAY).level > computeBattery(work, TODAY).level);
});

test('high cortisol makes the next day drain more', () => {
  const next = day('2026-09-23', [['morning', 'meeting', 120, 2]]);
  const calm = [...day('2026-09-22', [['night', 'sleep', 420, 1, { biomarkers: { cortisolNmolL: 12, source: 'mock' } }]]), ...next];
  const high = [...day('2026-09-22', [['night', 'sleep', 420, 1, { biomarkers: { cortisolNmolL: 28, source: 'mock' } }]]), ...next];
  assert.ok(computeBattery(high, TODAY).level < computeBattery(calm, TODAY).level);
});

test('selfCheck nudges toward what the person reports', () => {
  const r = day('2026-09-23', [['morning', 'admin', 60, 1]]);
  const drained = computeBattery([{ ...r[0], selfCheck: 5 }], TODAY).level;
  const fresh = computeBattery([{ ...r[0], selfCheck: 1 }], TODAY).level;
  const none = computeBattery(r, TODAY).level;
  assert.ok(drained < none && none <= fresh);
});

test('records outside the 14-day window are ignored', () => {
  const old = day('2026-09-01', [['morning', 'action', 600, 3]]);
  assert.equal(computeBattery(old, TODAY).level, 100);
});
