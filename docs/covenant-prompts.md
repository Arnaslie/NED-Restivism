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

## Translation status
| Text | English | Shona | Ndebele |
|---|---|---|---|
| Purpose prompt + hint | draft | to do | to do |
| 5 commitments + alternates | draft | to do | to do |
| Framings | draft | to do | to do |

Put strings in the UI locale files (`src/ui/strings/`), not in code.
