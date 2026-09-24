// Full rest days (decision 0006): pure, no DOM, no storage.
// A full rest day = a date with at least one `rest` record and no work records.
// `sleep` is neutral: it neither makes nor breaks a rest day.

import { dayNumber, localDate } from './store/record.js';

const WORK = new Set(['action', 'meeting', 'travel', 'support', 'admin']);

// thisWeek: days 0–6 back (including today); lastWeek: days 7–13 back.
export function fullRestDays(records, today = new Date()) {
  const end = dayNumber(localDate(today));
  const days = new Map(); // day number -> { rest, work }
  for (const r of records) {
    const back = end - dayNumber(r.date);
    if (!(back >= 0 && back <= 13)) continue;
    const d = days.get(back) ?? { rest: false, work: false };
    if (r.type === 'rest') d.rest = true;
    if (WORK.has(r.type)) d.work = true;
    days.set(back, d);
  }
  let thisWeek = 0;
  let lastWeek = 0;
  for (const [back, d] of days) {
    if (!d.rest || d.work) continue;
    if (back <= 6) thisWeek += 1;
    else lastWeek += 1;
  }
  return { thisWeek, lastWeek };
}

export function restedThisWeek(records, today = new Date()) {
  return fullRestDays(records, today).thisWeek >= 1;
}
