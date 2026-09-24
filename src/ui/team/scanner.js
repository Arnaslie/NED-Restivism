// Camera QR scanner. No paste fallback by design (threat model: no copy/paste of codes).
// onCode(text) may be async; if it throws, its message is shown and scanning can continue.
import { isScanSupported, startScan } from '../../share/scan.js';
import t from '../strings/en.js';
import { h, errorBox } from '../dom.js';
import { onLeave } from './session.js';

// continuous: keep scanning after each code (check-in loop). Otherwise the camera stops after one good code.
export function scanner({ onCode, continuous = false }) {
  const s = t.team.scanner;
  const error = errorBox();
  const node = h('div', { class: 'scanner stack' }, error);

  isScanSupported()
    .catch(() => false)
    .then((supported) => {
      if (supported) node.prepend(...cameraControls());
      else error.textContent = s.noCamera;
    });

  function cameraControls() {
    const toggle = h('button', { type: 'button', class: 'primary', text: s.startCamera });
    const video = h('video', { class: 'scanner-video', playsinline: true, 'aria-label': s.video, hidden: true });
    video.muted = true;
    let session = null;
    let unregister = () => {};
    let last = '';

    function stop() {
      unregister();
      session?.stop();
      session = null;
      video.hidden = true;
      toggle.textContent = s.startCamera;
    }

    async function handle(text) {
      error.textContent = '';
      try {
        await onCode(text);
        return true;
      } catch (err) {
        error.textContent = err?.message || t.team.genericError;
        return false;
      }
    }

    function loop() {
      const mine = startScan(video);
      session = mine;
      mine.result.then(
        async (text) => {
          if (session !== mine) return; // stopped meanwhile
          // The camera sees the same QR many times a second; only react when it changes.
          const ok = text === last ? false : await handle(text);
          last = text;
          if (session !== mine) return;
          if (ok && !continuous) stop();
          else loop();
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
      unregister = onLeave(stop, { onHide: true });
      loop();
    });

    return [toggle, video];
  }

  return node;
}
