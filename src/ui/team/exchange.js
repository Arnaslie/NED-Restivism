// In-person QR exchanges: my status, run check-in, scan summary, invite.
import * as store from '../../store/index.js';
import { computeBattery } from '../../battery.js';
import { makeSnapshot, summarize, acceptSummary, teamCryptoKey, invitePayload } from '../../team/model.js';
import { sealWithKey, openWithKey, sealWithCode, newJoinCode } from '../../share/codec.js';
import t from '../strings/en.js';
import { h, heading, busy } from '../dom.js';
import { scanner } from './scanner.js';
import { codeDisplay } from './code.js';

const back = (api) => h('button', { type: 'button', class: 'link-button', text: t.team.back, onclick: () => api.go('home') });
const screen = (api, title, ...children) => h('section', { class: 'screen stack' }, back(api), heading(title), ...children);

async function mySnapshot(team) {
  const battery = computeBattery(await store.list(), new Date());
  return makeSnapshot(team, battery, new Date());
}

// Opens a sealed code and checks it is the expected kind for this team; throws a readable Error otherwise.
async function openTeamCode(team, text, kind, message) {
  let opened;
  try {
    opened = await openWithKey(text, await teamCryptoKey(team));
  } catch {
    throw new Error(message);
  }
  if (opened.kind !== kind || opened.obj?.teamId !== team.id) throw new Error(message);
  return opened.obj;
}

export async function status(api) {
  const s = t.team.status;
  const { team } = api;
  const text = await sealWithKey('s', await mySnapshot(team), await teamCryptoKey(team));
  return screen(
    api,
    s.heading,
    h('p', { text: s.intro }),
    codeDisplay(text, api.announce),
    h('p', { class: 'hint', text: s.contains }),
    team.me.shareStatus && h('p', { class: 'hint', text: s.containsShared(team.me.pseudonym) }),
    h('p', { class: 'hint', text: s.never }),
  );
}

export async function checkin(api) {
  const s = t.team.checkin;
  const { team } = api;
  // Held only in memory for the length of this check-in; cleared on finish and never stored.
  const scanned = new Map(); // nonce -> snapshot
  const count = h('p', { class: 'scan-count', role: 'status', 'aria-live': 'polite', text: s.count(0) });
  const finish = h('button', { type: 'button', class: 'primary', text: s.finish });
  const body = h('div', { class: 'stack' });

  body.append(
    h('p', { text: s.intro }),
    count,
    scanner({
      continuous: true,
      onCode: async (text) => {
        const snap = await openTeamCode(team, text, 's', s.notStatus);
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

  const section = screen(api, s.heading, body);

  finish.addEventListener('click', async () => {
    let text;
    try {
      text = await busy(finish, s.busy, async () => {
        const summary = summarize(team, [await mySnapshot(team), ...scanned.values()], new Date());
        await api.save(acceptSummary(team, summary, new Date()));
        return sealWithKey('c', summary, await teamCryptoKey(team));
      });
    } catch (err) {
      api.announce(err?.message || t.team.genericError);
      return;
    }
    scanned.clear();
    // Show the summary QR in place; the heading changes so focus goes there.
    const title = heading(s.summaryHeading);
    section.replaceChildren(
      title,
      h('p', { text: s.summaryIntro }),
      codeDisplay(text, api.announce),
      h('button', { type: 'button', text: t.team.done, onclick: () => api.go('home') }),
    );
    title.focus();
  });

  return section;
}

export async function scanSummary(api) {
  const s = t.team.scanSummary;
  return screen(
    api,
    s.heading,
    h('p', { text: s.intro }),
    scanner({
      onCode: async (text) => {
        const summary = await openTeamCode(api.team, text, 'c', s.notSummary);
        await api.save(acceptSummary(api.team, summary, new Date()));
        api.announce(s.updated);
        api.go('home');
      },
    }),
  );
}

export async function invite(api) {
  const s = t.team.invite;
  const code = newJoinCode();
  const text = await sealWithCode(invitePayload(api.team), code);
  return screen(
    api,
    s.heading,
    h('p', { text: s.intro }),
    h('div', { class: 'join-code' }, h('p', { class: 'hint', text: s.codeLabel }), h('p', { class: 'join-code-value', text: code, 'aria-label': code.split('').join(' ') })),
    codeDisplay(text, api.announce),
    h('button', { type: 'button', text: t.team.done, onclick: () => api.go('home') }),
  );
}
