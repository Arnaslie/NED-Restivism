// Team home: covenant, latest aggregate summary, opt-in sharing, check-in actions, team settings.
// Never shows anyone's battery level or activities — only counts and opted-in bands.
import { currentSummary, startFresh } from '../../team/model.js';
import t from '../strings/en.js';
import { h, heading, busy } from '../dom.js';
import { formatDay } from '../dates.js';

const fmt = (day) => formatDay(day, document.documentElement.lang);

export function covenantView(covenant) {
  return h(
    'div',
    { class: 'covenant' },
    h('p', { class: 'covenant-purpose', text: covenant.purpose }),
    covenant.commitments.length > 0 && h('ul', {}, covenant.commitments.map((c) => h('li', { text: c }))),
  );
}

// In-page two-step confirm (never window.confirm). Returns the trigger button plus its hidden panel.
function twoStep({ label, text, confirmLabel, danger = false, onConfirm }) {
  const cls = danger ? 'danger' : null;
  const panelId = `confirm-${Math.random().toString(36).slice(2)}`;
  const trigger = h('button', { type: 'button', class: cls, text: label, 'aria-expanded': 'false', 'aria-controls': panelId });
  const message = h('p', { class: 'warning', tabindex: '-1', text });
  const yes = h('button', { type: 'button', class: cls || 'primary', text: confirmLabel });
  const no = h('button', { type: 'button', text: t.team.cancel });
  const panel = h('div', { id: panelId, class: 'stack', hidden: true }, message, h('div', { class: 'row' }, yes, no));

  const setOpen = (open) => {
    panel.hidden = !open;
    trigger.hidden = open;
    trigger.setAttribute('aria-expanded', String(open));
    (open ? message : trigger).focus();
  };
  trigger.addEventListener('click', () => setOpen(true));
  no.addEventListener('click', () => setOpen(false));
  yes.addEventListener('click', async () => {
    no.disabled = true;
    try {
      await busy(yes, t.team.preparing, onConfirm);
    } finally {
      no.disabled = false;
    }
  });
  return [trigger, panel];
}

function summaryView(summary) {
  const s = t.team.home;
  const card = h('section', { class: 'card stack', 'aria-labelledby': 'summary-heading' }, h('h3', { id: 'summary-heading', text: s.summaryHeading }));
  if (!summary) {
    card.append(h('p', { text: s.noSummary }));
    return card;
  }
  card.append(summary.low === null ? h('p', { text: s.hiddenCount }) : h('p', { class: 'summary-count', text: s.lowCount(summary.low, summary.total) }));
  if (summary.low) card.append(h('p', { class: 'hint', text: s.lowNote }));
  if (summary.statuses.length) {
    // Alphabetical, so the order says nothing about who was scanned when.
    const statuses = [...summary.statuses].sort((a, b) => a.pseudonym.localeCompare(b.pseudonym));
    card.append(
      h('h4', { text: s.statusesHeading }),
      h(
        'ul',
        { class: 'statuses' },
        statuses.map((st) => h('li', { class: `band band-${st.band}` }, h('span', { text: st.pseudonym }), h('span', { class: 'band-text', text: s.bands[st.band] }))),
      ),
    );
  }
  card.append(h('p', { class: 'hint', text: s.clearsAfter(fmt(summary.expires)) }));
  return card;
}

// Turning sharing on needs explicit consent that spells out what is shared; turning it off is immediate.
function shareSection(api) {
  const s = t.team.home;
  const { me } = api.team;
  const save = async (shareStatus) => {
    try {
      await api.save({ ...api.team, me: { ...api.team.me, shareStatus } });
    } catch {
      api.announce(t.team.genericError);
      return;
    }
    api.announce(shareStatus ? s.shareOn : s.shareOff);
    api.go('home');
  };

  const card = h('section', { class: 'card stack', 'aria-labelledby': 'share-heading' }, h('h3', { id: 'share-heading', text: s.shareHeading }));
  card.append(h('p', { text: me.shareStatus ? s.shareOnText : s.shareOffText }), h('p', { class: 'hint', text: s.never }));
  if (me.shareStatus) {
    const off = h('button', { type: 'button', text: s.shareTurnOff });
    off.addEventListener('click', () => busy(off, t.team.preparing, () => save(false)));
    card.append(off);
  } else {
    card.append(...twoStep({ label: s.shareTurnOn, text: s.shareConfirmText(me.pseudonym), confirmLabel: s.shareConfirm, onConfirm: () => save(true) }));
  }
  return card;
}

function settingsSection(api) {
  const s = t.team.home;
  const fail = () => api.announce(t.team.genericError);
  return h(
    'section',
    { class: 'card stack', 'aria-labelledby': 'team-settings-heading' },
    h('h3', { id: 'team-settings-heading', text: s.settingsHeading }),
    h('p', { class: 'hint', text: s.freshNote }),
    ...twoStep({
      label: s.fresh,
      text: s.freshConfirmText,
      confirmLabel: s.freshConfirm,
      danger: true,
      onConfirm: async () => {
        try {
          await api.save(startFresh(api.team));
        } catch {
          return fail();
        }
        api.announce(s.freshDone);
        api.go('invite');
      },
    }),
    h('p', { class: 'hint', text: s.leaveNote }),
    ...twoStep({
      label: s.leave,
      text: s.leaveConfirmText,
      confirmLabel: s.leaveConfirm,
      danger: true,
      onConfirm: async () => {
        try {
          await api.clear();
        } catch {
          return fail();
        }
        api.announce(s.left);
        api.go('none');
      },
    }),
  );
}

export async function home(api) {
  const s = t.team.home;
  const { team } = api;
  // Some views do slow crypto before they appear (key pairs, the invite's key derivation), so show a busy state.
  const action = (label, view, primary = false) => {
    const button = h('button', { type: 'button', class: primary ? 'primary' : null, text: label });
    button.addEventListener('click', () => busy(button, t.team.preparing, () => api.go(view)));
    return button;
  };

  return h(
    'section',
    { class: 'screen stack' },
    heading(team.name || s.unnamed),
    h('details', { class: 'card' }, h('summary', { text: s.covenant }), covenantView(team.covenant)),
    summaryView(currentSummary(team, new Date())),
    h(
      'section',
      { class: 'card stack', 'aria-labelledby': 'actions-heading' },
      h('h3', { id: 'actions-heading', text: s.actions }),
      action(s.joinCheckin, 'joinCheckin', true),
      action(s.runCheckin, 'checkin'),
      action(s.scanSummary, 'scanSummary'),
      action(s.invite, 'invite'),
    ),
    shareSection(api),
    settingsSection(api),
  );
}
