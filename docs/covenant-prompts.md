# Covenant prompts (placeholder copy)

> **PLACEHOLDER — not final content.** Temporary copy for the covenant screen ([0005](decisions/0005-teams-status-covenant.md)) until the curriculum owner's "Seven Shifts" content is available. Replace it then. Draft for review by the team's activist; items marked **(verify)** need their check. Translations into Shona and Ndebele are still to do and need a native speaker's review.

## Rules for this copy
- **Safe on a searched phone.** Everything here, and everything we suggest people write, should read like a family, church, study or savings group looking after itself. The covenant is stored on every member's phone ([threat model](threat-model.md#teams-0005), T11).
- **About how we treat each other, not what we do.** No mention of the group's work, cause, plans, places or people.
- Plain, short words that translate well. Commitments ≤ 80 characters, purpose ≤ 200 (protocol limits).
- Use "we", never "you must". Rest is normal, not a reward; asking for cover is normal, not a failure.

### Words to keep out of UI copy and defaults
Not shown to users as a list (a list of "forbidden words" on a phone is itself a signal). For the UI engineer and reviewers only:
activist, activism, protest, demonstration, action, campaign, movement, struggle, resistance, cause, mission, comrade, cell, cadre, organiser, leader, rights, democracy, election, regime, government, state, party, police, arrest, security, safe house, sanctions, foreign, donor, funding, NGO, PVO, frontline. **(verify with the activist: add local-language and slang terms)**

## Purpose prompt
Field label: **What brings us together?**

Hint (under the field): *One or two sentences about how you look after each other. Keep it simple.*

Example shown as placeholder text in the empty field:
> We look after each other so that all of us can keep going for the long run.

## Example commitments
Offered as editable suggestions; a team may keep, change or delete any of them.

1. We rest without apology, and we protect each other's rest.
2. Asking someone to cover for you is normal. We say yes when we can.
3. No one carries a task alone. Every task has someone ready to step in.
4. We ask "how are you?" before we ask "is it done?"
5. Each of us takes one full day off a week, and the rest of us guard it.

Alternates:
- When one of us is running low, the rest of us slow down with them.
- We go home when we are tired. The work will still be there tomorrow.
- We do not praise people for going without sleep.

## Framings
Optional one-line intros the creator can pick when setting up the covenant. They change the tone of the suggestions, not the protocol. Labels shown in the app: **Faith**, **Community**, **Everyday**. (The spec calls the middle one "movement"; that word must not appear in the app.)

| Framing | Intro line | Extra suggested commitment |
|---|---|---|
| Faith | *Rest is a gift we receive, not a prize we earn.* | We keep a day of rest, and we keep it for each other too. |
| Community | *We are in this for years, not weeks. Staying well is part of it.* | I am because we are: when one of us is tired, all of us carry it. |
| Everyday | *Tired people make mistakes. Rested people make good choices.* | We plan for rest the way we plan everything else. |

Notes:
- The Community line draws on *ubuntu* / *unhu* ("I am because we are"), widely used in Zimbabwe in both Ndebele and Shona **(verify the activist is comfortable with this and the preferred local wording)**.
- The Faith line is written to fit Christian majority usage without quoting scripture, so it also sits comfortably for other faiths **(verify)**.

## Rest plans and reminders
Copy for [0006](decisions/0006-humane-design-patterns.md). Same rules as above. The rest plan is private free text stored on the phone ([threat model](threat-model.md#humane-design-0006), H2), so suggestions stay about the person's own body and time. They never mention the work, places, people or days of the week.

### If-then rest plan
Screen prompt: **Make one rest plan.** Hint: *Pick one, or write your own. Only you will see it.*

"When…" suggestions:
1. When my battery shows low,
2. When I have worked three days in a row,
3. When I start skipping meals,
4. When I can't sleep because of the day,
5. When someone offers to cover for me,
6. When a busy week ends,

"I will…" suggestions:
1. I will take the rest of the day off.
2. I will switch my phone off for the evening.
3. I will sleep before I answer any more messages.
4. I will spend an afternoon with family or friends.
5. I will eat a proper meal and go for a walk.
6. I will ask someone in the group to cover for me.

Field hint for writing your own (both fields): *Keep it about you: how you feel and what you'll do. No names or places.*

### Closing line (stopping cue)
Shown at the end of every screen:
> That's all for now. Go and rest.

Alternate for screens reached when the battery is fine: *That's everything. Put the phone down for a while.*

### Fresh-start messages (after a check-in)
Rotate; never numbered, never "day 3 of…".
1. A fresh start for all of us. Last week is done; this one is new.
2. Clean page. Rest counts from today.
3. Whatever last week was, this week we look after each other.

### Private rest-days line (Battery screen)
From `fullRestDays(records, today)`. The window is rolling (last 7 days / the 7 before), so the copy says "last 7 days", not "this week". It is never shown in red or with a warning icon.

| Case | Wording |
|---|---|
| thisWeek ≥ 1 | *You had {n} full rest day(s) in the last 7 days. Rest is part of the work.* |
| thisWeek ≥ 1, lastWeek shown | add: *({m} the week before.)* — only when m ≥ 1; never "more"/"less"/"better" |
| thisWeek = 0 | *No full rest day in the last 7 days yet. Is there a day you could keep free?* |
| thisWeek = 0 and lastWeek ≥ 1 | same as above. **Do not** mention last week, because the comparison reads as a warning. |

Pluralise via locale files ("1 full rest day" / "2 full rest days"). Shona and Ndebele plural rules differ; leave it to translators.

### Activity labels
The stored codes stay as they are; only the on-screen labels change (the threat model's item 19).

| Code | Current label | Proposed label | Why |
|---|---|---|---|
| `action` | Action | **Out and about** | "Action" reads as protest action on a searched phone. The proposed label covers field work, events and visits alike **(verify it sounds natural locally)** |
| `admin` | Admin | **Desk work** | "Admin" doubles as a role word (see R9). "Desk work" is plain and translates easily |

### "Rest is resistance" and similar framing
**Recommendation: not on-screen, not in defaults.** Use it at most in training or facilitator material, off the phone, if the activist agrees **(verify)**.
- "Resistance" is on the avoid list above. On a searched phone, rest framed as *resistance* reads as opposition to the state. Under the Patriotic Act and PVO Amendment Act climate ([threat model F](threat-model.md#f-legal-pressure-on-groups)), that is exactly the language we keep off the device.
- The phrase comes from Tricia Hersey / The Nap Ministry and her 2022 book *Rest Is Resistance*. It is rooted in a specific US Black-liberation context. Using it needs attribution, and it may not travel well **(verify how it lands with Zimbabwean teams)**.
- The safe on-screen equivalent is already our line: **"Rest is part of the work."** It carries the same idea (rest is not selfish) without naming an opponent. Similar alternatives: *"Rest keeps us going."*, *"A rested team lasts longer."*
- Avoid too: "self-care is a political act", "radical rest", "sustaining the struggle".

## Translation status
| Text | English | Shona | Ndebele |
|---|---|---|---|
| Purpose prompt + hint | draft | to do | to do |
| 5 commitments + alternates | draft | to do | to do |
| Framings | draft | to do | to do |
| Rest plan suggestions, closing line, fresh starts, rest-days line, activity labels | draft | to do | to do |

Put strings in the UI locale files (`src/ui/strings/`), not in code.
