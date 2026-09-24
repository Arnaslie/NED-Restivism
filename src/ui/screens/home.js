// Battery gauge. Estimate only; no history, streaks or charts (decision 0002).
import * as store from '../../store/index.js';
import { computeBattery } from '../../battery.js';
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
    );
    return screen;
  }

  const { level, suggestCover } = computeBattery(records, new Date());
  const rounded = Math.max(0, Math.min(100, Math.round(level)));
  screen.append(gauge(rounded), h('p', { class: 'hint', text: t.home.estimate }));

  if (suggestCover) {
    screen.append(
      h(
        'aside',
        { class: 'card cover', 'aria-labelledby': 'cover-heading' },
        h('h3', { id: 'cover-heading', text: t.home.coverHeading }),
        h('p', { text: t.home.cover }),
        h('p', { class: 'hint', text: t.home.coverNote }),
      ),
    );
  }
  return screen;
}
