import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fullRestDays, restedThisWeek } from '../src/rest.js';

const TODAY = new Date(2026, 8, 24, 20, 0); // Thursday
const r = (date, type, dayPart = 'afternoon') => ({ date, dayPart, type, durationMin: 60, intensity: 1 });

test('no records: no rest days', () => {
  assert.deepEqual(fullRestDays([], TODAY), { thisWeek: 0, lastWeek: 0 });
  assert.equal(restedThisWeek([], TODAY), false);
});

test('rest-only day counts; rest + sleep counts', () => {
  assert.deepEqual(fullRestDays([r('2026-09-24', 'rest')], TODAY), { thisWeek: 1, lastWeek: 0 });
  assert.deepEqual(fullRestDays([r('2026-09-22', 'rest'), r('2026-09-22', 'sleep', 'night')], TODAY), { thisWeek: 1, lastWeek: 0 });
  assert.equal(restedThisWeek([r('2026-09-24', 'rest')], TODAY), true);
});

test('sleep-only day does not count (sleep is neutral)', () => {
  assert.deepEqual(fullRestDays([r('2026-09-23', 'sleep', 'night')], TODAY), { thisWeek: 0, lastWeek: 0 });
});

test('any work type on the day breaks it, whatever the order', () => {
  for (const work of ['action', 'meeting', 'travel', 'support', 'admin']) {
    const recs = [r('2026-09-23', 'rest', 'morning'), r('2026-09-23', work, 'evening')];
    assert.deepEqual(fullRestDays(recs, TODAY), { thisWeek: 0, lastWeek: 0 }, work);
    assert.deepEqual(fullRestDays([...recs].reverse(), TODAY), { thisWeek: 0, lastWeek: 0 }, work);
  }
});

test('several rest records on one day count once; separate days add up', () => {
  const recs = [
    r('2026-09-20', 'rest', 'morning'), r('2026-09-20', 'rest', 'evening'),
    r('2026-09-21', 'rest'), r('2026-09-21', 'sleep', 'night'),
  ];
  assert.deepEqual(fullRestDays(recs, TODAY), { thisWeek: 2, lastWeek: 0 });
});

test('week boundaries: 0–6 back is this week, 7–13 last week, older and future ignored', () => {
  const recs = [
    r('2026-09-18', 'rest'), // 6 back -> this week
    r('2026-09-17', 'rest'), // 7 back -> last week
    r('2026-09-11', 'rest'), // 13 back -> last week
    r('2026-09-10', 'rest'), // 14 back -> ignored
    r('2026-09-25', 'rest'), // future -> ignored
  ];
  assert.deepEqual(fullRestDays(recs, TODAY), { thisWeek: 1, lastWeek: 2 });
  assert.equal(restedThisWeek(recs.slice(1), TODAY), false);
});

test('uses the local date of today, across a month boundary', () => {
  const oct2 = new Date(2026, 9, 2, 0, 30);
  assert.deepEqual(fullRestDays([r('2026-09-26', 'rest'), r('2026-09-25', 'rest')], oct2), { thisWeek: 1, lastWeek: 1 });
});

test('mock data', () => {
  const { records } = JSON.parse(readFileSync(new URL('../mock/activities.json', import.meta.url)));
  // Sep 20 and Sep 15 are full rest days (rest + sleep only): one in each week.
  assert.deepEqual(fullRestDays(records, new Date(2026, 8, 24)), { thisWeek: 1, lastWeek: 1 });
});
