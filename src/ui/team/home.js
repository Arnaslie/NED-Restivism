// Team home: covenant, latest aggregate summary, opt-in share toggle, actions, leave.
// Never shows anyone's battery level or activities — only counts and opted-in bands.
import { currentSummary } from '../../team/model.js';
import t from '../strings/en.js';
import { h, heading, busy, nextId } from '../dom.js';
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

function summaryView(summary) {
  const s = t.team.home;
  const card = h('section', { class: 'card stack', 'aria-labelledby': 'summary-heading' }, h('h3', { id: 'summary-heading', text: s.summaryHeading }));
  if (!summary) {
    card.append(h('p', { text: s.noSummary }));
    return card;
  }
  card.append(
    summary.low === null
      ? h('p', { text: s.hiddenCount })
      : h('p', { class: 'summary-count', text: s.lowCount(summary.low, summary.total) }),
  );
  if (summary.low) card.append(h('p', { class: 'hint', text: s.lowNote }));
  if (summary.statuses.length) {
    // Alphabetical, so the order says nothing about who was scanned when.
    const statuses = [...summary.statuses].sort((a, b) => a.pseudonym.localeCompare(b.pseudonym));
    card.append(
      h('h4', { text: s.statusesHeading }),
      h(
        'ul',
        { class: 'statuses' },
        statuses.map((st) =>
          h('li', { class: `band band-${st.band}` }, h('span', { text: st.pseudonym }), h('span', { class: 'band-text', text: s.bands[st.band] })),
        ),
      ),
    );
  }
  card.append(h('p', { class: 'hint', text: s.asOf(fmt(summary.date), fmt(summary.expires)) }));
  return card;
}

function shareToggle(api) {
  const s = t.team.home;
  const id = nextId('share');
  const noteId = `${id}-note`;
  const box = h('input', { id, type: 'checkbox', checked: api.team.me.shareStatus, 'aria-describedby': noteId });
  box.addEventListener('change', async () => {
    const shareStatus = box.checked;
    box.disabled = true;
    try {
      await api.save({ ...api.team, me: { ...api.team.me, shareStatus } });
      api.announce(shareStatus ? s.shareOn : s.shareOff);
    } catch {
      box.checked = !shareStatus;
      api.announce(t.team.genericError);
    } finally {
      box.disabled = false;
    }
  });
  return h('section', { class: 'card stack' }, h('div', { class: 'check' }, box, h('label', { for: id, text: s.shareLabel })), h('p', { id: noteId, class: 'hint', text: s.shareNote }));
}

function leaveSection(api) {
  const s = t.team.home;
  const leave = h('button', { type: 'button', class: 'danger', text: s.leave, 'aria-expanded': 'false', 'aria-controls': 'leave-confirm' });
  const text = h('p', { class: 'warning', tabindex: '-1', text: s.leaveConfirmText });
  const yes = h('button', { type: 'button', class: 'danger', text: s.leaveConfirm });
  const cancel = h('button', { type: 'button', text: s.leaveCancel });
  const panel = h('div', { id: 'leave-confirm', class: 'stack', hidden: true }, text, h('div', { class: 'row' }, yes, cancel));

  const setOpen = (open) => {
    panel.hidden = !open;
    leave.hidden = open;
    leave.setAttribute('aria-expanded', String(open));
    (open ? text : leave).focus();
  };
  leave.addEventListener('click', () => setOpen(true));
  cancel.addEventListener('click', () => setOpen(false));
  yes.addEventListener('click', async () => {
    cancel.disabled = true;
    try {
      await busy(yes, s.leaveConfirm, () => api.clear());
    } catch {
      cancel.disabled = false;
      api.announce(t.team.genericError);
      return;
    }
    api.announce(s.left);
    api.go('none');
  });

  return h('section', { class: 'card stack' }, h('h3', { text: s.leaveHeading }), h('p', { class: 'hint', text: s.leaveNote }), leave, panel);
}

export async function home(api) {
  const s = t.team.home;
  const { team } = api;
  // Some views do slow crypto before they appear (the invite's key derivation), so show a busy state.
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
    shareToggle(api),
    h(
      'section',
      { class: 'card stack', 'aria-labelledby': 'actions-heading' },
      h('h3', { id: 'actions-heading', text: s.actions }),
      action(s.myStatus, 'status', true),
      action(s.runCheckin, 'checkin'),
      action(s.scanSummary, 'scanSummary'),
      action(s.invite, 'invite'),
    ),
    leaveSection(api),
  );
}
