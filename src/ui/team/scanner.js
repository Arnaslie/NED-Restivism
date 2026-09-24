// QR input: camera (only where BarcodeDetector supports QR) plus an always-available paste box.
// onCode(text) may be async; if it throws, its message is shown. Call stopAllScans() when leaving
// a screen, locking or hiding the page so the camera never stays on.
import { isScanSupported, startScan } from '../../share/scan.js';
import t from '../strings/en.js';
import { h, nextId, errorBox } from '../dom.js';

const active = new Set();

export function stopAllScans() {
  for (const stop of [...active]) stop();
}

// continuous: keep scanning after each code (check-in loop). Otherwise the camera stops after one code.
export function scanner({ onCode, continuous = false }) {
  const s = t.team.scanner;
  const error = errorBox();
  const camera = h('div', { class: 'scanner-camera stack' });
  const pasteId = nextId('paste');
  const paste = h('textarea', { id: pasteId, rows: '3', autocapitalize: 'off', autocomplete: 'off', spellcheck: 'false' });
  const useButton = h('button', { type: 'button', text: s.use });

  let busy = false;
  async function handle(text) {
    if (busy) return;
    busy = true;
    error.textContent = '';
    try {
      await onCode(text);
      return true;
    } catch (err) {
      error.textContent = err?.message || t.team.genericError;
      return false;
    } finally {
      busy = false;
    }
  }

  useButton.addEventListener('click', async () => {
    const text = paste.value.trim();
    if (!text) {
      error.textContent = s.empty;
      paste.focus();
      return;
    }
    if (await handle(text)) paste.value = '';
  });

  const node = h(
    'div',
    { class: 'scanner stack' },
    camera,
    h('div', { class: 'field' }, h('label', { for: pasteId, text: s.paste }), paste),
    useButton,
    error,
  );

  isScanSupported()
    .catch(() => false)
    .then((supported) => {
      if (supported) camera.append(...cameraControls());
    });

  function cameraControls() {
    const toggle = h('button', { type: 'button', class: 'primary', text: s.startCamera });
    const video = h('video', { class: 'scanner-video', muted: true, playsinline: true, 'aria-label': s.video, hidden: true });
    let session = null;
    let last = '';

    function stop() {
      session?.stop();
      session = null;
      active.delete(stop);
      video.hidden = true;
      toggle.textContent = s.startCamera;
    }

    function loop() {
      session = startScan(video);
      const mine = session;
      mine.result.then(
        async (text) => {
          if (session !== mine) return; // stopped meanwhile
          // The camera sees the same QR many times a second; only react when it changes.
          if (text !== last) {
            last = text;
            await handle(text);
          }
          if (session !== mine) return;
          if (continuous) loop();
          else stop();
        },
        () => {
          if (session !== mine) return;
          stop();
          error.textContent = s.cameraError;
        },
      );
    }

    toggle.addEventListener('click', () => {
      if (session) return stop();
      error.textContent = '';
      last = '';
      video.hidden = false;
      toggle.textContent = s.stopCamera;
      active.add(stop);
      loop();
    });

    return [toggle, video];
  }

  return node;
}
