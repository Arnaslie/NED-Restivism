# 0001. Vanilla JS PWA with no build step

- Status: accepted
- Date: 2026-09-24

## Context
Hackathon project; scope will change fast. We want an installable, offline-capable web app with zero setup time.

## Decision
Plain HTML, CSS and ES modules served as static files. No bundler, framework or npm dependencies. PWA pieces: `manifest.webmanifest` and a hand-written `sw.js`.

The service worker is **network-first**: online users always get the latest files, the cache is only an offline fallback. This avoids the stale-cache confusion of cache-first while iterating quickly.

## Consequences
- Any static server runs it; deploys to any static host.
- No TypeScript, JSX or npm imports without adding a build step. Revisit if we need a framework or libraries — Vite is the likely next step.
- When adding files the app needs offline, add them to `APP_SHELL` in `sw.js` and bump `CACHE`.
