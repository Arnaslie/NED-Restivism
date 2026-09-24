// In-person QR exchanges: run a check-in, join a check-in, scan a summary, invite.
import * as store from '../../store/index.js';
import { computeBattery } from '../../battery.js';
import { makeSnapshot, summarize, acceptSummary, teamCryptoKey, invitePayload } from '../../team/model.js';
import { sealWithKey, openWithKey, startCheckin, openCheckinStart, sealStatus, sealWithCode, newJoinCode } from '../../share/codec.js';
import t from '../strings/en.js';
import { h, heading, busy } from '../dom.js';
import { scanner } from './scanner.js';
import { qrDisplay } from './code.js';
import { onLeave } from './session.js';

const INVITE_VISIBLE_MS = 2 * 60 * 1000;

const back = (api) => h('button', { type: 'button', class: 'link-button', text: t.team.back, onclick: () => api.go('home') });
const screen = (api, title, ...children) => h('section', { class: 'screen stack' }, back(api), heading(title), ...children);

async function mySnapshot(team, checkinId) {
  const battery = computeBattery(await store.list(), new Date());
  return makeSnapshot(team, battery, checkinId);
}

// Runner: show the start QR, scan statuses, finish into a summary.
export async function checkin(api) {
  const s = t.team.checkin;
  const { team } = api;
  const key = await teamCryptoKey(team);
  const session = await startCheckin(key, team.id);

  // Snapshots and the one-time private key live only in memory, only until Finish, cancel, navigation or lock.
  const scanned = new Map(); // nonce -> snapshot
  const end = () => {
    session.end();
    scanned.clear();
  };
  const unregister = onLeave(end);

  const count = h('p', { class: 'scan-count', role: 'status', 'aria-live': 'polite', tabindex: '-1', text: s.count(0) });
  const finish = h('button', { type: 'button', class: 'primary', text: s.finish });
  const startPanel = h('div', { class: 'stack' }, h('p', { text: s.startIntro }), qrDisplay(session.code));
  const scanButton = h('button', { type: 'button', class: 'primary', text: s.scanStatuses });
  const scanPanel = h(
    'div',
    { class: 'stack', hidden: true },
    count,
    scanner({
      continuous: true,
      onCode: async (text) => {
        let snap;
        try {
          snap = await session.openStatus(text);
        } catch {
          throw new Error(s.notStatus);
        }
        if (scanned.has(snap.nonce)) {
          count.textContent = `${s.duplicate} ${s.count(scanned.size)}`;
          return;
        }
        scanned.set(snap.nonce, snap);
        count.textContent = `${s.added} ${s.count(scanned.size)}`;
      },
    }),
    finish,
  );
  scanButton.addEventListener('click', () => {
    startPanel.hidden = true;
    scanButton.hidden = true;
    scanPanel.hidden = false;
    count.focus();
  });

  const section = screen(api, s.heading, startPanel, scanButton, scanPanel);

  finish.addEventListener('click', async () => {
    let text;
    try {
      text = await busy(finish, s.busy, async () => {
        const own = await mySnapshot(team, session.checkinId);
        const summary = summarize(team, [own, ...scanned.values()], session.checkinId, new Date());
        await api.save(acceptSummary(team, summary, new Date()));
        return sealWithKey('c', summary, key);
      });
    } catch (err) {
      api.announce(err?.message || t.team.genericError);
      return;
    }
    unregister();
    end();
    const title = heading(s.summaryHeading);
    section.replaceChildren(title, h('p', { text: s.summaryIntro }), qrDisplay(text), h('button', { type: 'button', text: t.team.done, onclick: () => api.go('home') }));
    title.focus();
  });

  return section;
}

// Member: scan the start QR, show a status QR only the runner's phone can open, then scan the summary.
export async function joinCheckin(api) {
  const s = t.team.joinCheckin;
  const { team } = api;
  const body = h('div', { class: 'stack' });
  const title = heading(s.heading);

  body.append(
    h('p', { text: s.scanStart }),
    scanner({
      onCode: async (text) => {
        let start;
        try {
          start = await openCheckinStart(text, await teamCryptoKey(team));
        } catch {
          throw new Error(s.notStart);
        }
        if (start.teamId !== team.id) throw new Error(s.notStart);
        const status = await sealStatus(await mySnapshot(team, start.checkinId), start);
        body.replaceChildren(
          h('p', { text: s.statusIntro }),
          qrDisplay(status),
          h('p', { class: 'hint', text: s.contains }),
          team.me.shareStatus && h('p', { class: 'hint', text: s.containsShared(team.me.pseudonym) }),
          h('p', { class: 'hint', text: s.never }),
          h('button', { type: 'button', class: 'primary', text: s.next, onclick: () => api.go('scanSummary') }),
        );
        title.focus();
      },
    }),
  );
  return h('section', { class: 'screen stack' }, back(api), title, body);
}

export async function scanSummary(api) {
  const s = t.team.scanSummary;
  return screen(
    api,
    s.heading,
    h('p', { text: s.intro }),
    scanner({
      onCode: async (text) => {
        let opened;
        try {
          opened = await openWithKey(text, await teamCryptoKey(api.team));
        } catch {
          throw new Error(s.notSummary);
        }
        if (opened.kind !== 'c' || opened.obj?.teamId !== api.team.id) throw new Error(s.notSummary);
        await api.save(acceptSummary(api.team, opened.obj, new Date()));
        api.announce(s.updated);
        api.go('home');
      },
    }),
  );
}

// Invite QR hides itself after 2 minutes, when leaving the screen and when the page is hidden.
// The join code shows only on tap.
export async function invite(api) {
  const s = t.team.invite;
  const code = newJoinCode();
  const text = await sealWithCode(invitePayload(api.team), code);
  const body = h('div', { class: 'stack' });
  const title = heading(s.heading);

  const reveal = h('button', { type: 'button', class: 'primary', text: s.showCode });
  const codeBox = h(
    'div',
    { class: 'join-code', hidden: true },
    h('p', { class: 'hint', text: s.codeLabel }),
    h('p', { class: 'join-code-value', text: code, 'aria-label': code.split('').join(' ') }),
  );
  reveal.addEventListener('click', () => {
    reveal.hidden = true;
    codeBox.hidden = false;
  });

  body.append(h('p', { text: s.intro }), qrDisplay(text), reveal, codeBox, h('button', { type: 'button', text: t.team.done, onclick: () => api.go('home') }));

  const hide = () => {
    clearTimeout(timer);
    unregister();
    body.replaceChildren(
      h('p', { role: 'status', text: s.hidden }),
      h('button', { type: 'button', class: 'primary', text: s.again, onclick: (e) => busy(e.currentTarget, s.busy, () => api.go('invite')) }),
      h('button', { type: 'button', text: t.team.done, onclick: () => api.go('home') }),
    );
  };
  const timer = setTimeout(hide, INVITE_VISIBLE_MS);
  const unregister = onLeave(hide, { onHide: true });

  return h('section', { class: 'screen stack' }, back(api), title, body);
}
