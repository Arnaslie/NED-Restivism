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
4. **Sync = in-person QR check-ins, no server.** The person running the check-in shows a start QR with a one-time public key; members show a status QR **only that check-in can open** (ECDH, threat model R1), so other members photographing it learn nothing. The runner then shows one summary QR, sealed with the team key, that everyone scans. Snapshots are "as of the last check-in", not live.
5. **Everything shared expires after 48h** (summary and statuses), and is stored encrypted like everything else.
6. **Invites are encrypted with a spoken join code.** The invite QR carries the team key, so it is sealed with a one-time code read aloud in the room. A photo of the QR alone is not enough.
7. **Manual key rotation ("Start fresh").** Same covenant, new team key and id, everyone re-invited in person (R2).
8. **Every phone can scan.** A vendored QR scanner (jsQR) is used where the browser has no built-in `BarcodeDetector`. Codes are never copied, pasted or sent through chats (R8).
9. **No scoring.** No comparisons between people or teams, no streaks, no history of past check-ins.

Protocol, formats and APIs: [team-protocol.md](../team-protocol.md).

## Consequences
- The person running a check-in briefly sees each member's `low` bit while scanning. The app does not store it; only the summary is kept. This is the same as asking out loud in the room.
- Any member (or any unlocked member phone) holds the team key and can read start and summary QRs, but not other people's status QRs. People who leave keep the key until the team uses "Start fresh".
- A seized unlocked phone shows the latest summary for up to 48h: team size, low count, and opted-in pseudonyms with their band.
- Adds two vendored libraries (first exceptions to "no dependencies" in 0001): a QR encoder (Nayuki's QR Code generator v1.8.0, MIT, 33 KB) and jsQR for scanning (v1.4.0, Apache-2.0, 257 KB / 57 KB gzipped, only loaded on phones without a native `BarcodeDetector`). Both are reviewed and pinned; provenance and hashes are in [src/vendor/README.md](../../src/vendor/README.md). Still no npm dependencies and no build step.
- The minimum of 3 for showing the team total was kept on purpose: at exactly 3 people, "0 of 3" or "3 of 3" reveals everyone's state (threat model R3).
- Out of scope: roles/rota, norm checking, care-lead rotation, automatic key rotation, live sync.
