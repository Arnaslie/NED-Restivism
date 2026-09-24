// All user-facing English strings. Add sibling files (sn.js, nd.js) with the same keys for Shona / Ndebele.
export default {
  appName: 'Rest Assured',

  nav: {
    label: 'Main',
    home: 'Battery',
    log: 'Log',
    recent: 'Recent',
    team: 'Team',
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

  team: {
    heading: 'Team',
    back: 'Back',
    done: 'Done',
    cancel: 'Cancel',
    genericError: 'Something went wrong. Try again.',
    loadError: 'Could not load your team.',
    preparing: 'Preparing…',

    none: {
      intro: 'A team starts with a covenant: a few shared words about how you look after each other, including rest.',
      start: 'Start a team',
      join: 'Join a team',
    },

    // Covenant copy is placeholder from docs/covenant-prompts.md until the final content arrives.
    start: {
      heading: 'Start a team',
      intro: 'Write your covenant together. Rest is part of the work — say how you will make room for it.',
      neutral: 'Keep it neutral — no names of people, places or groups.',
      name: 'Team name (optional)',
      nameHint: 'Up to 30 characters. Something only you would recognise.',
      purpose: 'What brings us together?',
      purposeHint: 'One or two sentences about how you look after each other. Keep it simple.',
      purposePlaceholder: 'We look after each other so that all of us can keep going for the long run.',
      commitments: 'Our commitments',
      commitmentsHint: 'Up to 5, each up to 80 characters.',
      commitment: (n) => `Commitment ${n}`,
      commitmentPlaceholders: [
        "We rest without apology, and we protect each other's rest.",
        'Asking someone to cover for you is normal. We say yes when we can.',
        'No one carries a task alone. Every task has someone ready to step in.',
        'We ask "how are you?" before we ask "is it done?"',
        'Each of us takes one full day off a week, and the rest of us guard it.',
      ],
      addCommitment: 'Add a commitment',
      removeCommitment: (n) => `Remove commitment ${n}`,
      pseudonym: 'Your name in the team',
      pseudonymHint: 'A made-up name, up to 20 characters. Not your real name.',
      suggestAnother: 'Suggest another',
      purposeRequired: 'Write a few words about what brings you together.',
      pseudonymRequired: 'Choose a name for the team.',
      submit: 'Create team',
      busy: 'Creating…',
      created: 'Team created.',
    },

    join: {
      heading: 'Join a team',
      scanStep: 'Scan the invite QR on the other phone.',
      notInvite: 'That is not an invite code.',
      codeStep: 'Type the join code they read aloud.',
      code: 'Join code',
      codeHint: 'Letters and numbers, like 7KQ2-M9XD-4T.',
      badCode: 'That join code does not look right. Check it and try again.',
      wrongCode: 'Wrong join code, or not an invite. Check the code and try again.',
      open: 'Open invite',
      opening: 'Opening…',
      covenantStep: 'Read the covenant together before you join.',
      agree: 'We agree',
      mustAgree: 'Tick "We agree" to join.',
      submit: 'Join team',
      busy: 'Joining…',
      joined: 'You joined the team.',
    },

    home: {
      unnamed: 'Your team',
      covenant: 'Our covenant',
      summaryHeading: 'Latest check-in',
      noSummary: 'No recent check-in. Run one together to see how the team is doing.',
      lowCount: (low, total) => `${low} of ${total} of us are running low`,
      hiddenCount: 'Fewer than 3 people checked in, so the team total stays hidden.',
      clearsAfter: (expires) => `Clears after ${expires}`,
      lowNote: 'Running low is a signal to share the load, not a failure.',
      statusesHeading: 'Shared by choice',
      bands: { ok: 'Okay', low: 'Running low' },

      shareHeading: 'Sharing',
      shareOffText: 'You are counted in the team total only. Your name and status are not shared.',
      shareOnText: 'Your chosen name and "okay" or "running low" are shared with your team at each check-in, for 48 hours.',
      never: 'Your battery level and activities are never shared.',
      shareTurnOn: 'Share my status',
      shareTurnOff: 'Stop sharing my status',
      shareConfirmText: (pseudonym) =>
        `At each check-in, your team will see "${pseudonym}" and whether you are "okay" or "running low". Each summary clears after 48 hours. Your battery level and activities stay on this phone.`,
      shareConfirm: 'Yes, share it',
      shareOn: 'Your status will be shared at the next check-in.',
      shareOff: 'Your status will not be shared.',

      actions: 'Check-in',
      runCheckin: 'Run check-in',
      joinCheckin: 'Join a check-in',
      scanSummary: 'Scan summary',
      invite: 'Invite someone',

      settingsHeading: 'Team settings',
      freshNote: 'Start fresh gives the team a new key. Everyone must be re-invited in person. Use it if a phone is taken or lost, or someone leaves on bad terms.',
      fresh: 'Start fresh',
      freshConfirmText: 'Start fresh now? Old invites and codes stop working, and everyone must be re-invited in person.',
      freshConfirm: 'Yes, start fresh',
      freshDone: 'Started fresh. Invite everyone again.',
      leaveNote: 'Leave deletes this team and its covenant from this phone.',
      leave: 'Leave team',
      leaveConfirmText: 'Leave this team? You will need a new invite to rejoin.',
      leaveConfirm: 'Yes, leave',
      left: 'You left the team.',
    },

    checkin: {
      heading: 'Run check-in',
      startIntro: 'Everyone taps "Join a check-in" and scans this code. Then scan the code each phone shows.',
      scanStatuses: 'Scan statuses',
      count: (n) => (n === 1 ? '1 person scanned (plus you)' : `${n} people scanned (plus you)`),
      added: 'Added.',
      duplicate: 'Already scanned.',
      notStatus: 'That is not a status code for this check-in.',
      finish: 'Finish',
      busy: 'Finishing…',
      summaryHeading: 'Check-in summary',
      summaryIntro: 'Everyone scans this with "Scan summary". The codes you scanned have been discarded.',
    },

    joinCheckin: {
      heading: 'Join a check-in',
      scanStart: 'Scan the check-in code on the phone running it.',
      notStart: 'That is not a check-in code from this team.',
      statusIntro: 'Show this to the phone running the check-in. Only that phone can read it.',
      contains: 'It says only whether you are running low.',
      containsShared: (pseudonym) => `Because you share your status, it also shows "${pseudonym}" with "okay" or "running low".`,
      never: 'It never contains your battery level or activities.',
      next: 'Scan summary',
    },

    scanSummary: {
      heading: 'Scan summary',
      intro: 'Scan the summary QR on the phone that ran the check-in.',
      notSummary: 'That is not a summary code from this team.',
      updated: 'Team summary updated.',
    },

    invite: {
      heading: 'Invite someone',
      intro: 'Do this in person. The QR alone is not enough: read the join code aloud to the person joining.',
      showCode: 'Show join code',
      codeLabel: 'Join code',
      hidden: 'The invite was hidden. Make a new one if you still need it.',
      again: 'Make a new invite',
      busy: 'Preparing invite…',
    },

    scanner: {
      startCamera: 'Start camera',
      stopCamera: 'Stop camera',
      cameraError: 'Could not use the camera. Check that this app may use it, then try again.',
      noCamera: 'Scanning needs a phone with a camera. This device has none we can use.',
      video: 'Camera view',
    },

    qr: 'QR code',
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
