# NED-Restivism

Hackathon PWA. Plain HTML/CSS/JS, no build step.

## Run

```sh
npx serve .
```

Then open the printed `http://localhost` URL. Service workers only run on `localhost` or HTTPS.

## Layout

- `index.html` — entry page
- `src/` — app code (`app.js`) and styles
- `sw.js` — service worker (network-first, offline fallback)
- `manifest.webmanifest`, `icons/` — install metadata
- `docs/` — decisions and ideas, see [docs/README.md](docs/README.md)
