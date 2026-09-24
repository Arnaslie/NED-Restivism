# 0003. v1 storage: encrypted on-device, auto-delete, no server-side user data

- Status: accepted
- Date: 2026-09-24

## Context
An activist's activity history is the most dangerous thing the app could hold. The main threats are a seized or searched phone, and any server-side record that could identify a user.

## Decision
- **On-device only.** Activity records live in IndexedDB, encrypted with AES-GCM using a key derived from the user's passphrase (PBKDF2-SHA256 via WebCrypto; no dependencies). No plaintext at rest.
- **Auto-delete.** Records older than 14 days are purged. The battery only needs that window; older data is not kept, not even as a summary, until we decide otherwise.
- **Panic wipe** deletes the key and all records.
- **No server-side user data ("sessions torn down").** No accounts, no analytics, no backend storing user or team data. Whatever serves the app holds only the static files; request logging should be off or minimal (infra to confirm for the chosen host).
- **No free-text notes and no locations** in v1 records — see [record-format.md](../record-format.md).
- Deferred: air-gapped archive, decoy passphrase.

## Consequences
- Lost passphrase = lost data, by design.
- Purging needs the key, so it runs on unlock. A phone that is never unlocked keeps its (encrypted) old records until then. History engineer to evaluate a better scheme.
- Nothing to back up or recover server-side; switching phones means starting fresh in v1.
