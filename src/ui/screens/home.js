// Battery gauge. Estimate only; no history, streaks or charts (decision 0002).
import * as store from '../../store/index.js';
import { computeBattery } from '../../battery.js';
import { fullRestDays } from '../../rest.js';
import t from '../strings/en.js';
import { h, heading } from '../dom.js';

function band(level) {
  if (level >= 70) return 'high';
  if (level >= 40) return 'mid';
  if (level >= 20) return 'low';
  return 'veryLow';
}

function gauge(level) {
  const b = band(level);
  const fill = h('div', { class: 'battery-fill' });
  fill.style.setProperty('--level', `${level}%`);
  return h(
    'div',
    { class: `battery battery-${b}`, role: 'img', 'aria-label': t.home.gaugeLabel(level, t.home.bands[b]) },
    h('div', { class: 'battery-body', 'aria-hidden': 'true' }, fill),
    h(
      'p',
      { class: 'battery-text', 'aria-hidden': 'true' },
      h('span', { class: 'battery-level', text: `${level}%` }),
      h('span', { class: 'battery-band', text: t.home.bands[b] }),
    ),
  );
}

const endCue = (calm = false) => h('p', { class: 'end-cue', text: calm ? t.endCalm : t.end });

export async function render(ctx) {
  const screen = h('section', { class: 'screen' }, heading(t.home.heading));

  let records;
  try {
    records = await store.list();
  } catch {
    screen.append(h('p', { class: 'error', role: 'alert', text: t.home.loadError }));
    return screen;
  }

  if (!records.length) {
    screen.append(
      h('p', { text: t.home.empty }),
      h('button', { type: 'button', class: 'primary', text: t.home.logCta, onclick: () => ctx.go('log') }),
      endCue(),
    );
    return screen;
  }

  const { level, suggestCover } = computeBattery(records, new Date());
  const rounded = Math.max(0, Math.min(100, Math.round(level)));
  screen.append(gauge(rounded), h('p', { class: 'hint', text: t.home.estimate }));

  if (suggestCover) {
    const plan = await store.getPlan().catch(() => null);
    screen.append(
      h(
        'aside',
        { class: 'card cover', 'aria-labelledby': 'cover-heading' },
        h('h3', { id: 'cover-heading', text: t.home.coverHeading }),
        h('p', { text: t.home.cover }),
        plan && h('p', { class: 'plan-reminder', text: t.home.planReminder(plan) }),
        h('p', { class: 'hint', text: t.home.coverNote }),
      ),
    );
  }

  // Private progress (decision 0006): own rest days only, as an invitation, never a warning or comparison.
  const { thisWeek, lastWeek } = fullRestDays(records, new Date());
  screen.append(
    h(
      'section',
      { class: 'card rest', 'aria-labelledby': 'rest-heading' },
      h('h3', { id: 'rest-heading', text: t.home.restHeading }),
      // Last week is mentioned only alongside rest already taken, never next to a zero.
      h('p', { text: thisWeek > 0 ? [t.home.restDays(thisWeek), lastWeek > 0 && t.home.restWeekBefore(lastWeek)].filter(Boolean).join(' ') : t.home.restNone }),
      h('p', { class: 'hint', text: t.home.restDefinition }),
    ),
    endCue(!suggestCover),
  );
  return screen;
}
