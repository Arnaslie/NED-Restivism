# Team protocol (draft v1)

Contract for [decision 0005](decisions/0005-teams-status-covenant.md). History, infra and UI build against this in parallel. Change it by PR, with every owner reviewing.

## Flows

**Create** — Leader enters an optional team name, the covenant (purpose + up to 5 commitments) and their own pseudonym. The app creates a random team id and a random 256-bit team key.

**Invite** (in person) — Leader taps *Invite*: the app makes a join code (e.g. `7KQ2-M9XD-4T`) and shows the invite QR. The leader reads the code aloud. The newcomer scans, types the code, reads the covenant, ticks *We agree*, picks a pseudonym, joins.

**Check-in** (in person) — The person running it (anyone) taps *Run check-in* and scans each member's *My status* QR, then taps *Finish*. Their phone adds its own status, builds the summary, discards the individual snapshots, and shows the summary QR. Everyone scans it.

**Leave** — Deletes the team from this phone. Panic wipe deletes it too.

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

Status snapshot (kind `s`, sealed with the team key):
```js
{ v: 1, teamId, date: "YYYY-MM-DD", nonce: "base64url 8 bytes", low: true,
  share: { pseudonym: "Heron", band: "low" } }   // `share` only when me.shareStatus
```
`low` / `band` = battery level below 25 (same threshold as `suggestCover`). `band` is `"ok"` or `"low"`.

Summary (kind `c`, sealed with the team key):
```js
{ v: 1, teamId, date: "YYYY-MM-DD", expires: "YYYY-MM-DD",   // date + 2 days
  total: 5, low: 2,                                           // low is null when total < 3
  statuses: [{ pseudonym: "Heron", band: "low" }] }
```

## Wire format (QR text)

`<kind>1.<base64url(bytes)>` where kind is `j`, `s` or `c`.
- Plaintext = UTF-8 JSON, compressed with `CompressionStream('deflate-raw')` before encryption.
- `s` / `c`: bytes = `iv(12) | ciphertext`, AES-GCM with the team key, `additionalData` = the kind prefix (`"s1"` / `"c1"`), so one kind can't be passed off as another.
- `j`: bytes = `salt(16) | iv(12) | ciphertext`, key = PBKDF2-SHA256(join code, salt, 600000) → AES-GCM, `additionalData` = `"j1"`.
- Join code: 10 random Crockford base32 characters (~50 bits), shown as `XXXX-XXXX-XX`. When typed: uppercase, remove `-` and spaces, map O→0, I/L→1.
- Neutral prefixes only: no app name or activist words in anything a QR contains.

## APIs

### `src/share/` — infra
```js
// codec.js
sealWithKey(kind, obj, cryptoKey) -> Promise<string>      // kind 's' | 'c'
openWithKey(text, cryptoKey)      -> Promise<{ kind, obj }> // throws Error('Not a valid code') on any failure
sealWithCode(obj, joinCode)       -> Promise<string>      // kind 'j'
openWithCode(text, joinCode)      -> Promise<obj>         // throws Error('Wrong code or not an invite')
newJoinCode()                     -> "XXXX-XXXX-XX"
normalizeJoinCode(input)          -> "XXXXXXXXXX" | null
kindOf(text)                      -> 'j' | 's' | 'c' | null
// qr.js
renderQR(text)                    -> SVGElement            // no inline styles; sized by CSS
// scan.js
isScanSupported()                 -> Promise<boolean>      // BarcodeDetector with qr_code
startScan(videoElement)           -> { result: Promise<string>, stop() }  // resolves with the first QR text
```

### `src/team/model.js` — history (pure, no DOM, no storage)
```js
createTeam({ name, purpose, commitments, pseudonym }) -> team   // validates; random id/key/memberId
validateTeam(team)                  -> team                    // throws Error(readable) if invalid
teamCryptoKey(team)                 -> Promise<CryptoKey>      // non-extractable AES-GCM from team.key
invitePayload(team)                 -> { v, id, name, key, covenant }
joinFromInvite(invite, pseudonym)   -> team                    // new memberId, shareStatus false, summary null
makeSnapshot(team, battery, today)  -> snapshot                // battery = computeBattery(...) result
summarize(team, snapshots, today)   -> summary                 // ignores other teamIds and dates, de-duplicates nonces,
                                                               // drops low when total < 3
acceptSummary(team, summary, today) -> team                    // rejects other teamId or expired; returns team with summary set
currentSummary(team, today)         -> summary | null          // null when missing or expired
```

### `src/store/index.js` additions — history
```js
getTeam()      -> Promise<team | null>   // throws if locked; drops an expired summary on read
saveTeam(team) -> Promise<void>          // validates, encrypts, stores
clearTeam()    -> Promise<void>
```
Stored in a new IndexedDB store `docs` (database version 2; upgrade creates it if missing). `wipe()` clears it too.
