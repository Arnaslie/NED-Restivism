# NED-Restivism

Hackathon PWA. Plain HTML/CSS/JS, no build step.

## Run

```sh
python3 -m http.server 8000   # or: npx serve .
```

Then open `http://localhost:8000`. Service workers only run on `localhost` or HTTPS.

When you add, rename or delete a file the app needs offline (anything in `src/`, `icons/`, `mock/activities.json`), update `APP_SHELL` in `sw.js`, bump `CACHE`, and run:

```sh
node scripts/check-shell.mjs
```

It exits non-zero and names every file missing from `APP_SHELL` or listed but not on disk. CI runs it on every PR, along with `node --test` on `test/**/*.test.{js,mjs}` if `test/` exists.

## Deploy

Every push to `main` deploys to GitHub Pages via `.github/workflows/deploy.yml` (also runnable by hand from the Actions tab). Only the app files are published: `index.html`, `manifest.webmanifest`, `sw.js`, `src/`, `icons/`, `mock/`. See [docs/decisions/0004](docs/decisions/0004-static-hosting-no-server-data.md) for what hosting does and doesn't reveal.

One-time setup (a repo admin): **Settings -> Pages -> Build and deployment -> Source: GitHub Actions**.

## Layout

- `index.html` — entry page
- `src/` — app code (`app.js`) and styles
- `sw.js` — service worker (network-first, offline fallback)
- `manifest.webmanifest`, `icons/` — install metadata
- `docs/` — decisions and ideas, see [docs/README.md](docs/README.md)
