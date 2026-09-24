// All user-facing English strings. Add sibling files (sn.js, nd.js) with the same keys for Shona / Ndebele.
export default {
  appName: 'Rest Assured',

  nav: {
    label: 'Main',
    home: 'Battery',
    log: 'Log',
    recent: 'Recent',
    settings: 'Settings',
  },

  setup: {
    heading: 'Choose a passphrase',
    intro: 'Your passphrase encrypts everything this app keeps on this phone. Nothing is sent anywhere.',
    warning: 'If you forget it, your data cannot be recovered — by design. There are no hints and no reset.',
    passphrase: 'Passphrase',
    passphraseHint: 'At least 8 characters. A few unrelated words work well.',
    confirm: 'Enter it again',
    submit: 'Create passphrase',
    busy: 'Setting up…',
    tooShort: 'Use at least 8 characters.',
    mismatch: 'The two passphrases do not match.',
  },

  unlock: {
    heading: 'Unlock',
    passphrase: 'Passphrase',
    submit: 'Unlock',
    busy: 'Unlocking…',
    wrong: 'That passphrase did not work. Try again.',
    empty: 'Enter your passphrase.',
  },

  home: {
    heading: 'Your battery',
    estimate: 'An estimate from what you logged in the last 14 days — not a medical measurement.',
    gaugeLabel: (level, band) => `Battery ${level}%, ${band}`,
    bands: {
      high: 'Well rested',
      mid: 'Steady',
      low: 'Running low',
      veryLow: 'Very low',
    },
    empty: 'Nothing logged yet. Log an activity to see an estimate.',
    logCta: 'Log an activity',
    coverHeading: 'Time to recharge',
    cover: 'Your battery is low. Consider asking a teammate to hold your role.',
    coverNote: 'Rest is part of the work, not a failure. Only you can see this.',
    loadError: 'Could not load your entries.',
  },

  log: {
    heading: 'Log an activity',
    intro: 'Only the day, day part and kind of activity are kept. No notes, no places, no names.',
    date: 'Date',
    dayPart: 'Part of the day',
    type: 'Activity',
    duration: 'How long',
    intensity: 'How demanding',
    selfCheck: 'How do you feel? (optional)',
    selfCheckSkip: 'Skip',
    submit: 'Save',
    busy: 'Saving…',
    saved: 'Saved.',
    genericError: 'Could not save this entry.',
    typeRequired: 'Choose an activity.',
  },

  recent: {
    heading: 'Last 14 days',
    note: 'Entries older than 14 days are deleted automatically.',
    empty: 'No entries in the last 14 days.',
    selfCheck: (n) => `Feeling ${n}/5`,
    loadError: 'Could not load your entries.',
  },

  settings: {
    heading: 'Settings',
    lockHeading: 'Lock',
    lockNote: 'The app also locks itself after 2 minutes in the background.',
    lock: 'Lock now',
    locked: 'Locked.',
    demoHeading: 'Demo data',
    demoNote: 'Adds 14 days of made-up entries so you can try the app.',
    demo: 'Load demo data',
    demoBusy: 'Loading…',
    demoDone: (n) => `Added ${n} demo entries.`,
    demoError: 'Could not load demo data.',
    wipeHeading: 'Panic wipe',
    wipeNote: 'Deletes your passphrase and every entry on this phone immediately.',
    wipe: 'Panic wipe',
    wipeConfirmText: 'Delete everything now? This cannot be undone.',
    wipeConfirm: 'Yes, delete everything',
    wipeCancel: 'Cancel',
    wipeBusy: 'Deleting…',
    wiped: 'Everything was deleted.',
    wipeError: 'Could not delete. Try again.',
  },

  dayParts: {
    morning: 'Morning',
    afternoon: 'Afternoon',
    evening: 'Evening',
    night: 'Night',
  },

  types: {
    action: 'Action',
    meeting: 'Meeting',
    travel: 'Travel',
    support: 'Support',
    admin: 'Admin',
    rest: 'Rest',
    sleep: 'Sleep',
  },

  intensity: {
    1: 'Light',
    2: 'Moderate',
    3: 'Heavy',
  },

  selfCheck: {
    1: '1 · Fresh',
    2: '2',
    3: '3',
    4: '4',
    5: '5 · Drained',
  },

  duration: (min) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (!h) return `${m} min`;
    return m ? `${h} h ${m} min` : `${h} h`;
  },

  autoLocked: 'Locked after time in the background.',
};
