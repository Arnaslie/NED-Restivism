// Things that must not outlive the current team view: cameras, the check-in private key,
// the invite QR. leaveAll() runs on navigation and lock; hideAll() runs when the page is hidden
// and only covers entries that should also end then (cameras, the invite).
const entries = new Set();

// Returns an unregister function. fn runs at most once.
export function onLeave(fn, { onHide = false } = {}) {
  const entry = { fn, onHide };
  entries.add(entry);
  return () => entries.delete(entry);
}

function run(filter) {
  for (const entry of [...entries]) {
    if (!filter(entry)) continue;
    entries.delete(entry);
    entry.fn();
  }
}

export const leaveAll = () => run(() => true);
export const hideAll = () => run((entry) => entry.onHide);
