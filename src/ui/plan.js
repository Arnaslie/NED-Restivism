// Private if-then rest plan form (decision 0006). Used after starting/joining a team and in Settings.
// Suggestions come first; writing your own is second, with a hint to keep it about yourself.
import * as store from '../store/index.js';
import t from './strings/en.js';
import { h, errorBox, busy, nextId } from './dom.js';

const MAX = 80;
const SELF_WORDS = /^I('|’|$)/; // "I", "I'll", "I’m" … are not names

// Soft check only: digits (dates, times, numbers) or a capitalised word after the first
// may be a name or place. Never blocks saving.
function mightIdentify(text) {
  if (/\d/.test(text)) return true;
  return text
    .split(/\s+/)
    .slice(1)
    .some((word) => /^\p{Lu}/u.test(word) && !SELF_WORDS.test(word));
}

function planField(label, suggestions, value) {
  const p = t.plan;
  const id = nextId('plan');
  const hintId = `${id}-hint`;
  const recheckId = `${id}-recheck`;
  const input = h('input', { id, type: 'text', maxlength: MAX, autocomplete: 'off', 'aria-describedby': `${hintId} ${recheckId}` });
  input.value = value ?? '';
  const recheck = h('p', { id: recheckId, class: 'hint recheck', 'aria-live': 'polite' });
  const own = h(
    'div',
    { class: 'field', hidden: !value },
    h('label', { for: id, text: label }),
    h('p', { id: hintId, class: 'hint', text: p.ownHint }),
    input,
    recheck,
  );

  const check = () => {
    recheck.textContent = mightIdentify(input.value) ? p.recheck : '';
  };
  input.addEventListener('input', check);
  check();

  const labelId = `${id}-group`;
  const chips = h(
    'div',
    { class: 'chips', role: 'group', 'aria-labelledby': labelId },
    suggestions.map((text) =>
      h('button', {
        type: 'button',
        class: 'chip',
        text,
        onclick: () => {
          input.value = text;
          own.hidden = false;
          check();
          input.focus();
        },
      }),
    ),
  );
  const writeOwn = h('button', {
    type: 'button',
    class: 'link-button',
    text: p.writeOwn,
    onclick: () => {
      own.hidden = false;
      input.focus();
    },
  });

  return {
    input,
    wrap: h('fieldset', { class: 'plain stack' }, h('legend', { id: labelId, text: label }), chips, writeOwn, own),
  };
}

// secondary: { label, onClick } for "Skip for now" (team setup) or "Remove plan" (settings).
// onSaved runs after a successful save.
export function planForm({ plan, onSaved, secondary }) {
  const p = t.plan;
  const when = planField(p.when, p.whenSuggestions, plan?.when);
  const then = planField(p.then, p.thenSuggestions, plan?.then);
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
    input.closest('[hidden]')?.removeAttribute('hidden');
    input.focus();
  }

  return form;
}
