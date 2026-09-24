// Lock, demo data, panic wipe (two-step, in-page — never window.confirm).
import * as store from '../../store/index.js';
import t from '../strings/en.js';
import { h, heading, busy } from '../dom.js';
import { planForm } from '../plan.js';
import { toDay, addDays, daysBetween } from '../dates.js';

// Shift the mock records so the newest lands on yesterday, then save them as new records.
async function loadDemo() {
  const response = await fetch('mock/activities.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('fetch failed');
  const { records } = await response.json();
  const newest = records.reduce((max, r) => (r.date > max ? r.date : max), records[0].date);
  const shift = daysBetween(newest, addDays(toDay(new Date()), -1));
  for (const { id, v, ...fields } of records) {
    await store.save({ ...fields, date: addDays(fields.date, shift) });
  }
  return records.length;
}

function section(title, note, ...body) {
  return h('section', { class: 'card stack' }, h('h3', { text: title }), note && h('p', { class: 'hint', text: note }), ...body);
}

export async function render(ctx) {
  const plan = await store.getPlan().catch(() => null);
  const planSection = section(
    t.plan.settingsHeading,
    t.plan.settingsNote,
    planForm({
      plan,
      onSaved: () => ctx.announce(t.plan.saved),
      secondary: plan && {
        label: t.plan.remove,
        onClick: async () => {
          try {
            await store.clearPlan();
          } catch {
            ctx.announce(t.plan.error);
            return;
          }
          ctx.announce(t.plan.removed);
          ctx.go('settings');
        },
      },
    }),
  );

  const lockButton = h('button', { type: 'button', text: t.settings.lock, onclick: () => ctx.lockNow() });

  const demoButton = h('button', { type: 'button', text: t.settings.demo });
  demoButton.addEventListener('click', async () => {
    try {
      const n = await busy(demoButton, t.settings.demoBusy, loadDemo);
      ctx.announce(t.settings.demoDone(n));
    } catch {
      ctx.announce(t.settings.demoError);
    }
  });

  // Step 1 reveals the confirm panel; step 2 wipes.
  const wipeButton = h('button', { type: 'button', class: 'danger', text: t.settings.wipe, 'aria-expanded': 'false', 'aria-controls': 'wipe-confirm' });
  const confirmText = h('p', { class: 'warning', tabindex: '-1', text: t.settings.wipeConfirmText });
  const confirmButton = h('button', { type: 'button', class: 'danger', text: t.settings.wipeConfirm });
  const cancelButton = h('button', { type: 'button', text: t.settings.wipeCancel });
  const confirmPanel = h('div', { id: 'wipe-confirm', class: 'confirm stack', hidden: true }, confirmText, h('div', { class: 'row' }, confirmButton, cancelButton));

  const setConfirm = (open) => {
    confirmPanel.hidden = !open;
    wipeButton.hidden = open;
    wipeButton.setAttribute('aria-expanded', String(open));
    (open ? confirmText : wipeButton).focus();
  };
  wipeButton.addEventListener('click', () => setConfirm(true));
  cancelButton.addEventListener('click', () => setConfirm(false));
  confirmButton.addEventListener('click', async () => {
    cancelButton.disabled = true;
    try {
      await busy(confirmButton, t.settings.wipeBusy, () => store.wipe());
    } catch {
      cancelButton.disabled = false;
      ctx.announce(t.settings.wipeError);
      return;
    }
    ctx.onWiped();
  });

  return h(
    'section',
    { class: 'screen stack' },
    heading(t.settings.heading),
    planSection,
    section(t.settings.lockHeading, t.settings.lockNote, lockButton),
    section(t.settings.demoHeading, t.settings.demoNote, demoButton),
    section(t.settings.wipeHeading, t.settings.wipeNote, wipeButton, confirmPanel),
    h('p', { class: 'end-cue', text: t.end }),
  );
}
