// Shows a sealed code as a QR only. No copy or text fallback by design (threat model R8).
import { renderQR } from '../../share/qr.js';
import t from '../strings/en.js';
import { h } from '../dom.js';

export function qrDisplay(text) {
  const qr = renderQR(text);
  qr.classList.add('qr');
  qr.setAttribute('role', 'img');
  qr.setAttribute('aria-label', t.team.qr);
  return h('div', { class: 'qr-frame' }, qr);
}
