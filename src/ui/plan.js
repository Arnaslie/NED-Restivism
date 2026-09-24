// Private if-then rest plan form (decision 0006). Used after starting/joining a team and in Settings.
import * as store from '../store/index.js';
import t from './strings/en.js';
import { h, errorBox, busy, nextId } from './dom.js';

const MAX = 80;

function planField(label, placeholder, suggestions, value) {
  const id = nextId('plan');
  const input = h('input', { id, type: 'text', maxlength: MAX, autocomplete: 'off', placeholder });
  input.value = value ?? '';
  const chips = h(
    'div',
    { class: 'chips', role: 'group', 'aria-label': `${label} ${t.plan.suggestions}` },
    suggestions.map((text) =>
      h('button', {
        type: 'button',
        class: 'chip',
        text,
        onclick: () => {
          input.value = text;
          input.focus();
        },
      }),
    ),
  );
  return {
    input,
    wrap: h('div', { class: 'field' }, h('label', { for: id, text: label }), input, h('p', { class: 'hint', text: t.plan.suggestions }), chips),
  };
}

// secondary: { label, onClick } for "Skip for now" (team setup) or "Remove plan" (settings).
// onSaved runs after a successful save.
export function planForm({ plan, onSaved, secondary }) {
  const p = t.plan;
  const when = planField(p.when, p.whenPlaceholder, p.whenSuggestions, plan?.when);
  const then = planField(p.then, p.thenPlaceholder, p.thenSuggestions, plan?.then);
  const error = errorBox();
  const submit = h('button', { type: 'submit', class: 'primary', text: p.save });

  const form = h(
    'form',
    { class: 'stack', novalidate: true },
    when.wrap,
    then.wrap,
    error,
    h('div', { class: 'row' }, submit, secondary && h('button', { type: 'button', text: secondary.label, onclick: secondary.onClick })),
  );

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    error.textContent = '';
    const value = { when: when.input.value.trim(), then: then.input.value.trim() };
    if (!value.when) return fail(p.whenRequired, when.input);
    if (!value.then) return fail(p.thenRequired, then.input);
    try {
      await busy(submit, p.busy, () => store.savePlan(value));
    } catch {
      error.textContent = p.error;
      return;
    }
    onSaved(value);
  });

  function fail(message, input) {
    error.textContent = message;
    input.focus();
  }

  return form;
}
