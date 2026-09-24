import * as store from './store/index.js';
import t from './ui/strings/en.js';
import { h } from './ui/dom.js';
import { show, clear } from './ui/view.js';
import { stopAllScans } from './ui/team/scanner.js';
import * as unlock from './ui/screens/unlock.js';
import * as home from './ui/screens/home.js';
import * as log from './ui/screens/log.js';
import * as recent from './ui/screens/recent.js';
import * as team from './ui/screens/team.js';
import * as settings from './ui/screens/settings.js';

const AUTO_LOCK_MS = 2 * 60 * 1000;
const SCREENS = { home, log, recent, team, settings };

const nav = document.getElementById('nav');
const status = document.getElementById('status');

document.title = t.appName;
document.getElementById('app-name').textContent = t.appName;

const navButtons = Object.keys(SCREENS).map((name) =>
  h('button', { type: 'button', class: 'nav-button', 'data-screen': name, text: t.nav[name], onclick: () => go(name) }),
);
nav.setAttribute('aria-label', t.nav.label);
nav.append(...navButtons);

let statusTimer = 0;
function announce(message) {
  // Clear first so repeating the same message is announced again; fade it out after a while.
  clearTimeout(statusTimer);
  status.textContent = '';
  statusTimer = setTimeout(() => {
    status.textContent = message;
    statusTimer = setTimeout(() => (status.textContent = ''), 6000);
  }, 50);
}

const ctx = {
  go,
  announce,
  onUnlocked() {
    // Retention runs on unlock (decision 0003); failure must not block the app.
    store.purge().catch(() => {});
    go('home');
  },
  lockNow() {
    lockApp(t.settings.locked);
  },
  onWiped() {
    lockApp(t.settings.wiped);
  },
};

function go(name) {
  stopAllScans();
  if (!store.isUnlocked()) return showUnlock();
  nav.hidden = false;
  for (const button of navButtons) {
    if (button.dataset.screen === name) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  }
  return show(SCREENS[name], ctx);
}

function showUnlock() {
  nav.hidden = true;
  return show(unlock, ctx);
}

function lockApp(message) {
  stopAllScans();
  store.lock();
  clear();
  showUnlock();
  if (message) announce(message);
}

// Auto-lock after 2 minutes hidden. The timer covers a backgrounded tab; the timestamp check covers
// browsers that throttle or freeze timers while hidden.
let hiddenAt = 0;
let hiddenTimer = 0;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopAllScans(); // never leave the camera running in the background
    hiddenAt = Date.now();
    hiddenTimer = setTimeout(() => store.isUnlocked() && lockApp(), AUTO_LOCK_MS);
    return;
  }
  clearTimeout(hiddenTimer);
  if (hiddenAt && Date.now() - hiddenAt >= AUTO_LOCK_MS && store.isUnlocked()) lockApp(t.autoLocked);
  hiddenAt = 0;
});

showUnlock();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch((err) => {
    console.error('Service worker registration failed:', err);
  });
}
