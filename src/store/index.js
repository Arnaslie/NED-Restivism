// Public store API. See docs/record-format.md and docs/decisions/0003.
// Team: docs/team-protocol.md. save/list/purge and the team/plan calls throw 'Store is locked' until unlock() succeeds.

import { createStore } from './store.js';
import { idbBackend } from './idb.js';

const store = createStore(idbBackend);

export const isSetUp = () => store.isSetUp();
export const unlock = (passphrase) => store.unlock(passphrase);
export const lock = () => store.lock();
export const isUnlocked = () => store.isUnlocked();
export const save = (fields) => store.save(fields);
export const list = () => store.list();
export const purge = (today = new Date()) => store.purge(today);
export const getTeam = () => store.getTeam();
export const saveTeam = (team) => store.saveTeam(team);
export const clearTeam = () => store.clearTeam();
export const getPlan = () => store.getPlan();
export const savePlan = (plan) => store.savePlan(plan);
export const clearPlan = () => store.clearPlan();
export const wipe = () => store.wipe();
