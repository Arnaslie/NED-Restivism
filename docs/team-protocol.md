# Team protocol (draft v1)

Contract for [decision 0005](decisions/0005-teams-status-covenant.md). History, infra and UI build against this in parallel. Change it by PR, with every owner reviewing.

## Flows

**Create** — The person starting the team enters an optional team name, the covenant (purpose + up to 5 commitments) and their own pseudonym. The app creates a random team id and a random 256-bit team key.

**Invite** (in person) — Any member taps *Invite*: the app makes a join code (e.g. `7KQ2-M9XD-4T`) and shows the invite QR. They read the code aloud. The newcomer scans, types the code, reads the covenant, ticks *We agree*, picks a pseudonym, joins.

**Check-in** (in person) — The person running it (anyone) taps *Run check-in*. Their phone creates a one-time key pair and shows the **start QR**. Each member scans it, and their phone shows a **status QR sealed to that one check-in**: only the runner's phone can open it, so other members photographing it learn nothing. The runner scans each status QR, then taps *Finish*: their phone adds its own status, builds the summary, deletes the one-time private key and the individual snapshots, and shows the **summary QR**. Everyone scans it.

**Start fresh** (key rotation, manual) — Re-creates the team with the same name and covenant but a new id and key; the old team is deleted from this phone and everyone is re-invited in person. Recommended after an arrest, a lost phone or someone leaving on bad terms.

**Leave** — Deletes the team from this phone. Panic wipe deletes it too.

**UI rules** (threat model R4, R7–R10) — The invite QR hides itself after 2 minutes and when leaving the screen; the join code appears only on tap. Pseudonyms are suggested from a neutral word list. No copy, share or paste for any code: QR scanning only. No leader/admin/founder labels. Turning on status sharing shows exactly what is shared and asks for explicit consent.

## Data

Team document — stored encrypted on-device (one per phone, v1 = one team):
```js
{
  v: 1,
  id: "base64url 16 bytes",
  name: "",                          // optional, ≤ 30 chars
  key: "base64url 32 bytes",         // team key (raw AES-256)
  covenant: { purpose: "…", commitments: ["…"] },   // purpose ≤ 200, 0–5 commitments ≤ 80 each
  me: { memberId: "base64url 8 bytes", pseudonym: "Heron", shareStatus: false },  // pseudonym 1–20 chars
  summary: null | Summary            // latest check-in result, dropped once expired
}
```

Invite payload (kind `j`, sealed with the join code): `{ v: 1, id, name, key, covenant }`

Check-in start (kind `k`, sealed with the team key):
```js
{ v: 1, teamId, checkinId: "base64url 8 bytes", pub: "base64url raw P-256 public key (65 bytes)" }
```

Status snapshot (kind `s`, sealed to the check-in — see wire format):
```js
{ v: 1, teamId, checkinId, nonce: "base64url 8 bytes", low: true, rested: true,
  share: { pseudonym: "Heron", band: "low" } }   // `share` only when me.shareStatus
// rested = at least one full rest day in the last 7 days (decision 0006)
```
`low` / `band` = battery level below 25 (same threshold as `suggestCover`). `band` is `"ok"` or `"low"`.

Summary (kind `c`, sealed with the team key):
```js
{ v: 1, teamId, expires: "YYYY-MM-DD",       // check-in day + 2 days; no date stored (R6)
  total: 5, low: 2, rested: 3,                // low and rested are null when total < 3; total ≤ 100
  statuses: [{ pseudonym: "Heron", band: "low" }] }   // sorted by pseudonym, length ≤ total
```

## Wire format (QR text)

`<kind>1.<base64url(bytes)>` where kind is `j`, `k`, `s` or `c`.
- Plaintext = UTF-8 JSON, compressed with `CompressionStream('deflate-raw')` before encryption.
- `k` / `c`: bytes = `iv(12) | ciphertext`, AES-GCM with the team key, `additionalData` = the kind prefix (`"k1"` / `"c1"`), so one kind can't be passed off as another.
- `s`: bytes = `memberPub(65) | iv(12) | ciphertext`. The member generates a fresh ECDH P-256 key pair per status, derives `ECDH(memberPriv, runnerPub)` → HKDF-SHA256 (salt = checkinId bytes, info = `"s1"`) → AES-GCM-256, `additionalData` = `"s1"`, then discards its private key. The runner's private key is a non-extractable in-memory `CryptoKey`, never stored, dropped at Finish, cancel, lock or screen change.
- `j`: bytes = `salt(16) | iv(12) | ciphertext`, key = PBKDF2-SHA256(join code, salt, 600000) → AES-GCM, `additionalData` = `"j1"`.
- Join code: 10 random Crockford base32 characters (~50 bits), shown as `XXXX-XXXX-XX`. When typed: uppercase, remove `-` and spaces, map O→0, I/L→1.
- Neutral prefixes only: no app name or activist words in anything a QR contains.

## APIs

### `src/share/` — infra
```js
// codec.js
sealWithKey(kind, obj, cryptoKey) -> Promise<string>      // kind 'k' | 'c'
openWithKey(text, cryptoKey)      -> Promise<{ kind, obj }> // throws Error('Not a valid code') on any failure
startCheckin(teamCryptoKey, teamId) -> Promise<{ checkinId, code, openStatus(text) -> Promise<snapshot>, end() }>
                                  // code = the `k` QR text; openStatus throws Error('Not a valid code'); end() drops the private key
openCheckinStart(text, teamCryptoKey) -> Promise<{ teamId, checkinId, pub }>   // throws Error('Not a valid code')
sealStatus(snapshot, start)       -> Promise<string>      // start = result of openCheckinStart; `s` QR text
sealWithCode(obj, joinCode)       -> Promise<string>      // kind 'j'
openWithCode(text, joinCode)      -> Promise<obj>         // throws Error('Wrong code or not an invite')
newJoinCode()                     -> "XXXX-XXXX-XX"
normalizeJoinCode(input)          -> "XXXXXXXXXX" | null
kindOf(text)                      -> 'j' | 's' | 'c' | null
// qr.js
renderQR(text)                    -> SVGElement            // no inline styles; sized by CSS
// scan.js
isScanSupported()                 -> Promise<boolean>      // true when a camera API exists
startScan(videoElement)           -> { result: Promise<string>, stop() }  // BarcodeDetector if available, else vendored jsQR
```

### `src/team/model.js` — history (pure, no DOM, no storage)
```js
createTeam({ name, purpose, commitments, pseudonym }) -> team   // validates; random id/key/memberId
validateTeam(team)                  -> team                    // throws Error(readable) if invalid
teamCryptoKey(team)                 -> Promise<CryptoKey>      // non-extractable AES-GCM from team.key
invitePayload(team)                 -> { v, id, name, key, covenant }
joinFromInvite(invite, pseudonym)   -> team                    // new memberId, shareStatus false, summary null
makeSnapshot(team, battery, checkinId, rested) -> snapshot     // battery = computeBattery(...) result; rested = boolean
summarize(team, snapshots, checkinId, today) -> summary       // ignores other teamIds/checkinIds, de-duplicates nonces,
                                                               // drops low when total < 3; expires = today + 2
startFresh(team)                    -> team                    // same name/covenant/me, new id + key, summary null
suggestPseudonym()                  -> string                  // random pick from a neutral word list
acceptSummary(team, summary, today) -> team                    // rejects other teamId or expired; returns team with summary set
currentSummary(team, today)         -> summary | null          // null when missing or expired
```

### `src/rest.js` — history (pure, decision 0006)
```js
fullRestDays(records, today) -> { thisWeek, lastWeek }   // days 0–6 back vs 7–13 back
restedThisWeek(records, today) -> boolean                // thisWeek >= 1
```

### `src/store/index.js` additions — history
```js
getTeam()      -> Promise<team | null>   // throws if locked; drops an expired summary on read
saveTeam(team) -> Promise<void>          // validates, encrypts, stores
clearTeam()    -> Promise<void>
getPlan()      -> Promise<{ when, then } | null>   // private if-then rest plan (0006); each 1–80 chars
savePlan(plan) -> Promise<void>
clearPlan()    -> Promise<void>
```
Stored in a new IndexedDB store `docs` (database version 2; upgrade creates it if missing). `wipe()` clears it too.

## Model notes (history)
Behaviour of `src/team/model.js` beyond the signatures above:
- **Validation** rejects unknown fields everywhere. Text lengths count characters (code points); control characters and blank required text are rejected. Ids, keys, nonces and `checkinId` must be base64url of the exact byte length.
- **`summarize` throws `No check-ins for this team`** when no snapshot counts (all malformed, other team or other check-in). In normal use the runner's own snapshot is always included, so this signals a bug or a wrong-team scan.
- `summarize` skips malformed snapshots silently, and copies fields into new objects, so the summary holds no reference to any snapshot.
- `makeSnapshot` and `summarize` throw if `checkinId` isn't 8 bytes of base64url.
- **`acceptSummary` caps `expires` at today + 2**: a summary from a phone whose clock is ahead is kept, but never past 48h on this phone.
- `startFresh` also gives a new `memberId`; `me.pseudonym` and `me.shareStatus` carry over.
- `suggestPseudonym` picks uniformly from the exported `PSEUDONYMS` list (60 nature words and objects; nothing political, religious, military or activist-coded, and no Zimbabwean party or leader symbols).
- Extra exports: `validateCheckinStart(obj)` (kind `k` payload; `pub` must be a 65-byte uncompressed P-256 key), `validateSnapshot`, `validateSummary`, `PSEUDONYMS`, `LIMITS`, `toBase64url`, `fromBase64url`.
- **`rested` (0006)** is required: `makeSnapshot` throws without a boolean, and `summarize` skips snapshots without it (e.g. from a phone on an older version), so they don't count in `total` either. Summary `rested` follows the same rules as `low`: `null` when total < 3, else 0–total.
- `getTeam` drops a stored summary it can no longer validate (e.g. saved before `rested` existed) instead of failing, and keeps the team.
- Rest plan (`getPlan`/`savePlan`): `when` and `then` are trimmed, 1–80 characters, no control characters, no other fields. Stored as its own encrypted doc; `clearTeam()` leaves it, `wipe()` removes it.
