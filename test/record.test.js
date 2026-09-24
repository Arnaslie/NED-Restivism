import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  validateFields, validateRecord, createRecord, compareRecords, retentionCutoff, isExpired, dayNumber,
} from '../src/store/record.js';

const mock = JSON.parse(readFileSync(new URL('../mock/activities.json', import.meta.url))).records;
const base = { date: '2026-09-22', dayPart: 'morning', type: 'action', durationMin: 120, intensity: 2 };

test('accepts a minimal valid record and every mock record', () => {
  assert.deepEqual(validateFields(base), base);
  for (const r of mock) assert.deepEqual(validateRecord(r), r);
});

test('accepts optional selfCheck and biomarkers', () => {
  const f = { ...base, selfCheck: 4, biomarkers: { cortisolNmolL: 18.2, source: 'mock' } };
  assert.deepEqual(validateFields(f), f);
});

test('rejects bad enums and ranges', () => {
  const bad = [
    { dayPart: 'noon' }, { type: 'protest' }, { intensity: 0 }, { intensity: 4 }, { intensity: 2.5 },
    { durationMin: 0 }, { durationMin: 45 }, { durationMin: -30 }, { durationMin: '60' }, { durationMin: 1470 },
    { selfCheck: 0 }, { selfCheck: 6 }, { date: '2026-9-22' }, { date: '2026-02-30' }, { date: '2026-09-22T10:00' },
    { biomarkers: { cortisolNmolL: 10, source: 'lab' } }, { biomarkers: { cortisolNmolL: 'high', source: 'mock' } },
  ];
  for (const patch of bad) assert.throws(() => validateFields({ ...base, ...patch }), /Invalid activity/, JSON.stringify(patch));
  const { type, ...missing } = base;
  assert.throws(() => validateFields(missing), /type/);
});

test('rejects unknown fields such as location, notes, names, exact times', () => {
  for (const extra of [{ location: 'x' }, { notes: 'x' }, { names: ['x'] }, { time: '10:00' }]) {
    assert.throws(() => validateFields({ ...base, ...extra }), /not allowed/);
  }
  assert.throws(() => validateFields({ ...base, biomarkers: { cortisolNmolL: 10, source: 'mock', place: 'x' } }), /not allowed/);
  assert.throws(() => validateFields({ ...base, id: 'x' }), /not allowed/, 'caller must not set id');
});

test('createRecord assigns uuid and version', () => {
  const r = createRecord(base);
  assert.equal(r.v, 1);
  assert.match(r.id, /^[0-9a-f-]{36}$/);
  assert.notEqual(createRecord(base).id, r.id);
});

test('compareRecords orders by date then dayPart', () => {
  const rs = [
    { date: '2026-09-11', dayPart: 'morning' }, { date: '2026-09-10', dayPart: 'night' },
    { date: '2026-09-10', dayPart: 'morning' }, { date: '2026-09-10', dayPart: 'evening' },
  ].sort(compareRecords);
  assert.deepEqual(rs.map((r) => `${r.date} ${r.dayPart}`),
    ['2026-09-10 morning', '2026-09-10 evening', '2026-09-10 night', '2026-09-11 morning']);
});

test('retention: keeps exactly 14 days back, drops older', () => {
  const today = new Date(2026, 8, 24, 23, 59);
  assert.equal(retentionCutoff(today), '2026-09-10');
  assert.equal(isExpired({ date: '2026-09-10' }, today), false);
  assert.equal(isExpired({ date: '2026-09-09' }, today), true);
  assert.equal(mock.filter((r) => isExpired(r, today)).length, 0);
  assert.equal(mock.filter((r) => isExpired(r, new Date(2026, 8, 26))).length, 6); // Sep 10 + Sep 11
});

test('retention crosses month and year boundaries', () => {
  assert.equal(retentionCutoff(new Date(2026, 2, 5)), '2026-02-19');
  assert.equal(retentionCutoff(new Date(2027, 0, 3)), '2026-12-20');
  assert.ok(Number.isNaN(dayNumber('nope')));
});
