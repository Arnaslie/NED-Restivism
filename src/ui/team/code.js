// Shows a sealed code as a QR, with a "show as text" + copy fallback.
import { renderQR } from '../../share/qr.js';
import t from '../strings/en.js';
import { h, nextId } from '../dom.js';

export function codeDisplay(text, announce) {
  const c = t.team.code;
  const id = nextId('code');
  const field = h('textarea', { id, class: 'code-text', rows: '4', readonly: true, spellcheck: 'false' });
  field.value = text;
  const copy = h('button', { type: 'button', text: c.copy });
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(text);
      announce(c.copied);
    } catch {
      field.select();
      announce(c.copyFailed);
    }
  });

  const qr = renderQR(text);
  qr.classList.add('qr');
  qr.setAttribute('role', 'img');
  qr.setAttribute('aria-label', c.qr);

  return h(
    'div',
    { class: 'code-display stack' },
    h('div', { class: 'qr-frame' }, qr),
    copy,
    h('details', {}, h('summary', { text: c.show }), h('label', { for: id, class: 'visually-hidden', text: c.label }), field),
  );
}
