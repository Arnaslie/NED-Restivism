# 0004. Static hosting on GitHub Pages, no server-side user data

- Status: accepted
- Date: 2026-09-24

## Context
The threat model assumes anything stored on a server can be subpoenaed, seized or leaked, and that the network may be watched. We promise that sessions are "torn down": nothing server-side can identify a user. We also need a free, reproducible deploy for the hackathon.

## Decision
**"Sessions torn down" means:** no accounts, no logins, no backend, no database, no user data on any server. All user data lives encrypted on the device (0003). The server only ever hands out the same static files to everyone.

**Hosting:** GitHub Pages, deployed by `.github/workflows/deploy.yml` on every push to `main` (and manually via `workflow_dispatch`). The workflow publishes only the app: `index.html`, `manifest.webmanifest`, `sw.js`, `src/`, `icons/`, `mock/`. `docs/`, `scripts/` and `.github/` are not published.

**No network calls after load:** the app requests only same-origin static files. The Content-Security-Policy in `index.html` enforces this (`default-src 'self'`, `connect-src 'self'`, no inline script, `object-src 'none'`, `base-uri 'none'`, `form-action 'none'`), and `<meta name="referrer" content="no-referrer">` stops the app leaking its URL to anything it links to. No cookies, analytics, fonts, CDNs or third-party scripts. The CSP is a meta tag because static hosts cannot set headers; meta CSP cannot express `frame-ancestors`, so clickjacking protection is not enforced on Pages.

**Offline:** `sw.js` precaches the app shell at install (network-first afterwards, 0001), so after one visit the app works with no connection and makes no requests at all.

## Consequences
Honest tradeoffs of GitHub Pages:
- GitHub and its CDN (Fastly) see every visitor's IP address, user agent and which files they fetch, and GitHub keeps access logs we cannot see or disable. That reveals *that* an IP loaded the app, though not anything the user entered.
- A `*.github.io` URL is easy to block and marks the visitor to a network observer. HTTPS hides paths, not the hostname (SNI).
- GitHub can be compelled or can take the site down.

What the hackathon deploy still guarantees: no user data leaves the device, there is nothing server-side to identify a user by, and the app does not phone home.

**Production options (revisit before real use):**
1. Self-host the static files on a server we control with access logging disabled.
2. Use a host with a published no-log policy, ideally in a favourable jurisdiction.
3. Distribute offline: sideload a zipped copy or share over local transfer (Bluetooth, SD card), so users never contact a server at all. Works during shutdowns. Caveat: service workers and ES modules do not run from `file://`, so this needs a local server on `localhost` or a packaged wrapper (e.g. a TWA/APK), which is extra work.

Also revisit if we ever add a feature that needs a server (sync, push notifications): that would break this decision and needs a new ADR.
