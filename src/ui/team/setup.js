// No team yet: start one (write the covenant) or join one (invite QR + spoken join code + agree).
import { createTeam, joinFromInvite } from '../../team/model.js';
import { kindOf, normalizeJoinCode, openWithCode } from '../../share/codec.js';
import t from '../strings/en.js';
import { h, heading, errorBox, busy, nextId } from '../dom.js';
import { scanner } from './scanner.js';
import { covenantView } from './home.js';

const MAX_COMMITMENTS = 5;

function textField({ label, hint, maxlength, multiline = false, placeholder, autocomplete = 'off' }) {
  const id = nextId('f');
  const hintId = hint ? `${id}-hint` : null;
  const input = h(multiline ? 'textarea' : 'input', {
    id,
    type: multiline ? null : 'text',
    rows: multiline ? '3' : null,
    maxlength,
    placeholder,
    autocomplete,
    'aria-describedby': hintId,
  });
  const wrap = h('div', { class: 'field' }, h('label', { for: id, text: label }), hint && h('p', { id: hintId, class: 'hint', text: hint }), input);
  return { wrap, input };
}

const pseudonymField = () => textField({ label: t.team.start.pseudonym, hint: t.team.start.pseudonymHint, maxlength: 20, autocomplete: 'nickname' });

function fail(error, message, input) {
  error.textContent = message;
  input.focus();
}

const back = (api, to) => h('button', { type: 'button', class: 'link-button', text: t.team.back, onclick: () => api.go(to) });

export async function none(api) {
  const s = t.team.none;
  return h(
    'section',
    { class: 'screen stack' },
    heading(t.team.heading),
    h('p', { text: s.intro }),
    h('button', { type: 'button', class: 'primary', text: s.start, onclick: () => api.go('start') }),
    h('button', { type: 'button', text: s.join, onclick: () => api.go('join') }),
  );
}

export async function start(api) {
  const s = t.team.start;
  const name = textField({ label: s.name, hint: s.nameHint, maxlength: 30 });
  const purpose = textField({ label: s.purpose, hint: s.purposeHint, maxlength: 200, multiline: true, placeholder: s.purposePlaceholder });
  const pseudonym = pseudonymField();
  const error = errorBox();
  const submit = h('button', { type: 'submit', class: 'primary', text: s.submit });

  const list = h('ol', { class: 'commitments' });
  const addButton = h('button', { type: 'button', text: s.addCommitment });

  function renumber() {
    [...list.children].forEach((li, i) => {
      li.querySelector('label').textContent = s.commitment(i + 1);
      li.querySelector('.remove').setAttribute('aria-label', s.removeCommitment(i + 1));
    });
    addButton.hidden = list.children.length >= MAX_COMMITMENTS;
  }

  function addRow() {
    const i = list.children.length;
    const id = nextId('commitment');
    const input = h('input', { id, type: 'text', maxlength: 80, autocomplete: 'off', placeholder: s.commitmentPlaceholders[i] });
    const remove = h('button', { type: 'button', class: 'remove', text: '✕' });
    const li = h('li', { class: 'commitment' }, h('label', { for: id }), h('div', { class: 'row-input' }, input, remove));
    remove.addEventListener('click', () => {
      const next = li.nextElementSibling || li.previousElementSibling;
      li.remove();
      renumber();
      (next?.querySelector('input') || addButton).focus();
    });
    list.append(li);
    renumber();
    return input;
  }
  addButton.addEventListener('click', () => addRow().focus());
  addRow();

  const form = h(
    'form',
    { class: 'stack', novalidate: true },
    h('p', { class: 'warning', text: s.neutral }),
    name.wrap,
    purpose.wrap,
    h('fieldset', { class: 'stack plain' }, h('legend', { text: s.commitments }), h('p', { class: 'hint', text: s.commitmentsHint }), list, addButton),
    pseudonym.wrap,
    error,
    submit,
  );

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    error.textContent = '';
    if (!purpose.input.value.trim()) return fail(error, s.purposeRequired, purpose.input);
    if (!pseudonym.input.value.trim()) return fail(error, s.pseudonymRequired, pseudonym.input);
    try {
      const team = createTeam({
        name: name.input.value.trim(),
        purpose: purpose.input.value.trim(),
        commitments: [...list.querySelectorAll('input')].map((i) => i.value.trim()).filter(Boolean),
        pseudonym: pseudonym.input.value.trim(),
      });
      await busy(submit, s.busy, () => api.save(team));
    } catch (err) {
      error.textContent = err?.message || t.team.genericError;
      return;
    }
    api.announce(s.created);
    api.go('home');
  });

  return h('section', { class: 'screen' }, back(api, 'none'), heading(s.heading), h('p', { text: s.intro }), form);
}

// Three steps in one view: invite QR -> join code -> covenant + agree + pseudonym.
export async function join(api) {
  const s = t.team.join;
  const body = h('div', { class: 'stack' });
  const title = heading(s.heading);
  const section = h('section', { class: 'screen' }, back(api, 'none'), title, body);

  const step = (...nodes) => {
    body.replaceChildren(...nodes);
    title.focus();
  };

  function scanStep() {
    return [
      h('p', { text: s.scanStep }),
      scanner({
        onCode: async (text) => {
          if (kindOf(text) !== 'j') throw new Error(s.notInvite);
          step(...codeStep(text));
        },
      }),
    ];
  }

  function codeStep(inviteText) {
    const code = textField({ label: s.code, hint: s.codeHint, maxlength: 16, autocomplete: 'off' });
    code.input.setAttribute('autocapitalize', 'characters');
    code.input.setAttribute('spellcheck', 'false');
    const error = errorBox();
    const submit = h('button', { type: 'submit', class: 'primary', text: s.open });
    const form = h('form', { class: 'stack', novalidate: true }, code.wrap, error, submit);
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      error.textContent = '';
      const normalized = normalizeJoinCode(code.input.value);
      if (!normalized) {
        error.textContent = s.badCode;
        code.input.focus();
        return;
      }
      let invite;
      try {
        invite = await busy(submit, s.opening, () => openWithCode(inviteText, normalized));
      } catch {
        error.textContent = s.wrongCode;
        code.input.focus();
        return;
      }
      step(...covenantStep(invite));
    });
    return [h('p', { text: s.codeStep }), form];
  }

  function covenantStep(invite) {
    const agreeId = nextId('agree');
    const agree = h('input', { id: agreeId, type: 'checkbox' });
    const pseudonym = pseudonymField();
    const error = errorBox();
    const submit = h('button', { type: 'submit', class: 'primary', text: s.submit });
    const form = h(
      'form',
      { class: 'stack', novalidate: true },
      h('div', { class: 'check' }, agree, h('label', { for: agreeId, text: s.agree })),
      pseudonym.wrap,
      error,
      submit,
    );
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      error.textContent = '';
      if (!agree.checked) {
        error.textContent = s.mustAgree;
        agree.focus();
        return;
      }
      if (!pseudonym.input.value.trim()) return fail(error, t.team.start.pseudonymRequired, pseudonym.input);
      try {
        const team = joinFromInvite(invite, pseudonym.input.value.trim());
        await busy(submit, s.busy, () => api.save(team));
      } catch (err) {
        error.textContent = err?.message || t.team.genericError;
        return;
      }
      invite = null;
      api.announce(s.joined);
      api.go('home');
    });
    return [
      h('p', { text: s.covenantStep }),
      h('div', { class: 'card' }, invite.name && h('h3', { text: invite.name }), covenantView(invite.covenant)),
      form,
    ];
  }

  body.append(...scanStep());
  return section;
}
