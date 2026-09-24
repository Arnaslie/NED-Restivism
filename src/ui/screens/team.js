// Team tab: a small switcher over the team sub-views (decision 0005, docs/team-protocol.md).
import * as store from '../../store/index.js';
import t from '../strings/en.js';
import { h } from '../dom.js';
import { leaveAll } from '../team/session.js';
import * as setup from '../team/setup.js';
import * as teamHome from '../team/home.js';
import * as exchange from '../team/exchange.js';

const VIEWS = {
  none: setup.none,
  start: setup.start,
  join: setup.join,
  home: teamHome.home,
  checkin: exchange.checkin,
  joinCheckin: exchange.joinCheckin,
  scanSummary: exchange.scanSummary,
  invite: exchange.invite,
};

export async function render(ctx) {
  const root = h('div', { class: 'team' });
  let token = 0;

  const api = {
    team: null,
    announce: ctx.announce,
    async save(team) {
      await store.saveTeam(team);
      api.team = team;
    },
    async clear() {
      await store.clearTeam();
      api.team = null;
    },
    async go(name, arg) {
      leaveAll();
      const mine = ++token;
      let node;
      try {
        node = await VIEWS[name](api, arg);
      } catch {
        if (mine === token) ctx.announce(t.team.genericError);
        return;
      }
      if (mine !== token || !root.isConnected) return;
      root.replaceChildren(node);
      window.scrollTo(0, 0);
      root.querySelector('.screen-heading')?.focus();
    },
  };

  try {
    api.team = await store.getTeam();
    root.append(await VIEWS[api.team ? 'home' : 'none'](api));
  } catch {
    root.append(h('section', { class: 'screen' }, h('h2', { class: 'screen-heading', tabindex: '-1', text: t.team.heading }), h('p', { class: 'error', role: 'alert', text: t.team.loadError })));
  }
  return root;
}

