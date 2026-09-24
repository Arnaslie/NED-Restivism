# 0005. Teams: covenant, aggregate status, opt-in individual status, in-person QR check-ins

- Status: accepted
- Date: 2026-09-24
- Supersedes: the "never shared" part of [0002](0002-personal-battery-on-device.md). The battery *level* and activity history still never leave the device.

## Context
We want to move from one person to teams, so a team can see its load and build a culture where rest is expected. Seeing each other's battery helps with that. It is also the biggest new risk: one seized or forcibly unlocked phone, or one infiltrator, would reveal everyone's state ([threat model](../threat-model.md)).

## Decision
1. **Covenant is the way in.** A team is created by one person, who writes a short covenant (a purpose and up to 5 commitments, in the team's own words). Joining means reading and accepting it.
2. **Aggregate status for everyone (option C).** After a check-in, each phone shows "N of M of us are running low". The count is **hidden when fewer than 3 people** checked in, and is not even transmitted in that case.
3. **Individual status only by opt-in (option B).** Each member chooses whether to share a coarse band (`ok` / `low`) with their pseudonym. Off by default. Never the level, never activities.
4. **Sync = in-person QR check-ins, no server.** Members show an encrypted status QR; the person running the check-in scans them, then shows one encrypted summary QR that everyone scans. Snapshots are "as of the last check-in", not live.
5. **Everything shared expires after 48h** (summary and statuses), and is stored encrypted like everything else.
6. **Invites are encrypted with a spoken join code.** The invite QR carries the team key, so it is sealed with a one-time code read aloud in the room. A photo of the QR alone is not enough.
7. **No scoring.** No comparisons between people or teams, no streaks, no history of past check-ins.

Protocol, formats and APIs: [team-protocol.md](../team-protocol.md).

## Consequences
- The person running a check-in briefly sees each member's `low` bit while scanning. The app does not store it; only the summary is kept. This is the same as asking out loud in the room.
- Any member (or any unlocked member phone) holds the team key and can read the team's QR codes. No key rotation in this version: people who leave keep the key. Rotation → future decision.
- A seized unlocked phone shows the latest summary for up to 48h: team size, low count, and opted-in pseudonyms with their band.
- Adds one vendored QR-encoding library (first exception to "no dependencies" in 0001), reviewed and pinned. Scanning uses the browser's built-in `BarcodeDetector` where available, with a paste-the-code fallback.
- Out of scope: roles/rota, norm checking, care-lead rotation, key rotation, live sync.
