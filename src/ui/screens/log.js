// Log one activity. Fields mirror docs/record-format.md; no free text, no location.
import * as store from '../../store/index.js';
import t from '../strings/en.js';
import { h, heading, errorBox, busy, nextId } from '../dom.js';
import { toDay, addDays } from '../dates.js';

const DAY_PARTS = ['morning', 'afternoon', 'evening', 'night'];
const TYPES = ['action', 'meeting', 'travel', 'support', 'admin', 'rest', 'sleep'];
const DURATIONS = Array.from({ length: 24 }, (_, i) => (i + 1) * 30); // 30 min … 12 h
const WINDOW_DAYS = 14;

function radios(name, legend, options, checked) {
  return h(
    'fieldset',
    { class: 'choices' },
    h('legend', { text: legend }),
    options.map(([value, label]) => {
      const id = nextId(name);
      return h(
        'div',
        { class: 'choice' },
        h('input', { type: 'radio', id, name, value, checked: value === checked }),
        h('label', { for: id, text: label }),
      );
    }),
  );
}

function defaultDayPart(now) {
  const hour = now.getHours();
  if (hour < 5) return 'night';
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 22) return 'evening';
  return 'night';
}

export async function render(ctx) {
  const now = new Date();
  const today = toDay(now);
  const dateId = nextId('date');
  const durationId = nextId('duration');
  const error = errorBox();
  const submit = h('button', { type: 'submit', class: 'primary', text: t.log.submit });

  const form = h(
    'form',
    { class: 'stack', novalidate: true },
    h(
      'div',
      { class: 'field' },
      h('label', { for: dateId, text: t.log.date }),
      h('input', { id: dateId, name: 'date', type: 'date', value: today, max: today, min: addDays(today, -(WINDOW_DAYS - 1)), required: true }),
    ),
    radios('dayPart', t.log.dayPart, DAY_PARTS.map((v) => [v, t.dayParts[v]]), defaultDayPart(now)),
    radios('type', t.log.type, TYPES.map((v) => [v, t.types[v]]), null),
    h(
      'div',
      { class: 'field' },
      h('label', { for: durationId, text: t.log.duration }),
      h('select', { id: durationId, name: 'durationMin' }, DURATIONS.map((m) => h('option', { value: m, selected: m === 60, text: t.duration(m) }))),
    ),
    radios('intensity', t.log.intensity, [1, 2, 3].map((n) => [String(n), t.intensity[n]]), '2'),
    radios('selfCheck', t.log.selfCheck, [['', t.log.selfCheckSkip], ...[1, 2, 3, 4, 5].map((n) => [String(n), t.selfCheck[n]])], ''),
    error,
    submit,
  );

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    error.textContent = '';
    const data = new FormData(form);
    const fields = {
      date: data.get('date'),
      dayPart: data.get('dayPart'),
      type: data.get('type'),
      durationMin: Number(data.get('durationMin')),
      intensity: Number(data.get('intensity')),
    };
    if (!fields.type) {
      error.textContent = t.log.typeRequired;
      form.querySelector('input[name="type"]').focus();
      return;
    }
    if (data.get('selfCheck')) fields.selfCheck = Number(data.get('selfCheck'));

    try {
      await busy(submit, t.log.busy, () => store.save(fields));
    } catch (err) {
      error.textContent = err?.message || t.log.genericError;
      return;
    }
    ctx.announce(t.log.saved);
    ctx.go('home');
  });

  return h('section', { class: 'screen' }, heading(t.log.heading), h('p', { class: 'hint', text: t.log.intro }), form);
}
