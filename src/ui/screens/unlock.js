// First run: create a passphrase. Later runs: unlock. No hints, no recovery.
import * as store from '../../store/index.js';
import t from '../strings/en.js';
import { h, heading, errorBox, busy, nextId } from '../dom.js';

const MIN_LENGTH = 8;

function field(label, autocomplete, hint) {
  const id = nextId('pass');
  const hintId = hint ? `${id}-hint` : null;
  const input = h('input', {
    id,
    type: 'password',
    autocomplete,
    autocapitalize: 'off',
    spellcheck: 'false',
    required: true,
    'aria-describedby': hintId,
  });
  const wrap = h('div', { class: 'field' }, h('label', { for: id, text: label }), hint && h('p', { id: hintId, class: 'hint', text: hint }), input);
  return { wrap, input };
}

export async function render(ctx) {
  const firstRun = !(await store.isSetUp());
  const s = firstRun ? t.setup : t.unlock;
  const error = errorBox();
  const pass = field(s.passphrase, firstRun ? 'new-password' : 'current-password', firstRun && t.setup.passphraseHint);
  const again = firstRun && field(t.setup.confirm, 'new-password');
  const submit = h('button', { type: 'submit', class: 'primary', text: s.submit });

  const form = h('form', { class: 'stack', novalidate: true }, pass.wrap, again && again.wrap, error, submit);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    error.textContent = '';
    form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
    const value = pass.input.value;

    if (firstRun) {
      if (value.length < MIN_LENGTH) return fail(t.setup.tooShort, pass.input);
      if (value !== again.input.value) return fail(t.setup.mismatch, again.input);
    } else if (!value) {
      return fail(t.unlock.empty, pass.input);
    }

    const ok = await busy(submit, s.busy, () => store.unlock(value).catch(() => false));
    pass.input.value = '';
    if (again) again.input.value = '';
    if (!ok) return fail(t.unlock.wrong, pass.input);
    ctx.onUnlocked();
  });

  function fail(message, input) {
    error.textContent = message;
    input.setAttribute('aria-invalid', 'true');
    input.focus();
  }

  return h(
    'section',
    { class: 'screen' },
    heading(s.heading),
    firstRun && h('p', { text: t.setup.intro }),
    firstRun && h('p', { class: 'warning', text: t.setup.warning }),
    form,
  );
}
