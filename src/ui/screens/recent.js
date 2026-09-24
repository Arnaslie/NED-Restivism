// Read-only list of the last 14 days, newest first. No charts (decision 0002).
import * as store from '../../store/index.js';
import t from '../strings/en.js';
import { h, heading } from '../dom.js';
import { toDay, addDays, formatDay } from '../dates.js';

const DAY_PART_ORDER = { morning: 0, afternoon: 1, evening: 2, night: 3 };

function item(r) {
  const details = [t.dayParts[r.dayPart], t.duration(r.durationMin), t.intensity[r.intensity]];
  if (r.selfCheck) details.push(t.recent.selfCheck(r.selfCheck));
  return h(
    'li',
    { class: 'entry' },
    h('span', { class: 'entry-type', text: t.types[r.type] ?? r.type }),
    h('span', { class: 'entry-date', text: formatDay(r.date, document.documentElement.lang) }),
    h('span', { class: 'entry-details', text: details.join(' · ') }),
  );
}

export async function render() {
  const screen = h('section', { class: 'screen' }, heading(t.recent.heading), h('p', { class: 'hint', text: t.recent.note }));

  let records;
  try {
    records = await store.list();
  } catch {
    screen.append(h('p', { class: 'error', role: 'alert', text: t.recent.loadError }));
    return screen;
  }

  const since = addDays(toDay(new Date()), -13);
  const recent = records
    .filter((r) => r.date >= since)
    .sort((a, b) => b.date.localeCompare(a.date) || DAY_PART_ORDER[b.dayPart] - DAY_PART_ORDER[a.dayPart]);

  screen.append(
    recent.length ? h('ul', { class: 'entries' }, recent.map(item)) : h('p', { text: t.recent.empty }),
    h('p', { class: 'end-cue', text: recent.length ? t.recent.end : t.end }),
  );
  return screen;
}
