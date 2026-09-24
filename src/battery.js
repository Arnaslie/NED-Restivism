// Personal energy "battery": an ESTIMATED STRESS LOAD for self-reflection, not a medical
// measurement. Pure function of the activist's own records; computed on-device only (decision 0002).
//
// Model (walks records oldest -> newest over the 14-day retention window):
//   - Start at 100 at the beginning of the window.
//   - Work drains:     DRAIN[type] x hours x intensity  (x cortisol factor, see below)
//   - Rest/sleep recharge: RECHARGE[type] x hours       (intensity ignored)
//   - selfCheck (1 fresh .. 5 drained) nudges the level SELF_CHECK_PULL of the way toward
//     what the person reported (1 -> 100, 3 -> 50, 5 -> 0). The person knows best.
//   - Mock cortisol above CORTISOL_HIGH on a record makes the NEXT day's drain heavier:
//     x (1 + (cortisol - CORTISOL_HIGH) / CORTISOL_SCALE), capped at CORTISOL_MAX_FACTOR.
//   - Clamp to 0..100 after every step, so sleep can't bank energy above full.
// Tuned so mock/activities.json gives a mid-range curve and a few heavy days in a row
// drop below SUGGEST_COVER_BELOW.

import { dayNumber, localDate, compareRecords, RETENTION_DAYS } from './store/record.js';

export const SUGGEST_COVER_BELOW = 25;

const DRAIN = { action: 4, support: 3.5, travel: 2, meeting: 2.5, admin: 2 }; // per hour at intensity 1
const RECHARGE = { rest: 3.5, sleep: 2.5 }; // per hour
const SELF_CHECK_PULL = 0.25;
const CORTISOL_HIGH = 20;
const CORTISOL_SCALE = 20;
const CORTISOL_MAX_FACTOR = 1.5;

const clamp = (x) => Math.min(100, Math.max(0, x));

export function computeBattery(records, today = new Date()) {
  const end = dayNumber(localDate(today));
  const start = end - RETENTION_DAYS;
  const inWindow = records
    .filter((r) => {
      const d = dayNumber(r.date);
      return d >= start && d <= end;
    })
    .sort(compareRecords);

  let level = 100;
  const cortisolFactor = new Map(); // day number -> drain multiplier

  for (const r of inWindow) {
    const day = dayNumber(r.date);
    const hours = r.durationMin / 60;

    if (r.type in RECHARGE) {
      level = clamp(level + RECHARGE[r.type] * hours);
    } else {
      const drain = (DRAIN[r.type] ?? 0) * hours * r.intensity * (cortisolFactor.get(day) ?? 1);
      level = clamp(level - drain);
    }

    if (r.selfCheck !== undefined) {
      const reported = ((5 - r.selfCheck) / 4) * 100;
      level = clamp(level + (reported - level) * SELF_CHECK_PULL);
    }

    const c = r.biomarkers?.cortisolNmolL;
    if (typeof c === 'number' && c > CORTISOL_HIGH) {
      const f = Math.min(CORTISOL_MAX_FACTOR, 1 + (c - CORTISOL_HIGH) / CORTISOL_SCALE);
      cortisolFactor.set(day + 1, Math.max(cortisolFactor.get(day + 1) ?? 1, f));
    }
  }

  const rounded = Math.round(level);
  return { level: rounded, suggestCover: rounded < SUGGEST_COVER_BELOW };
}
