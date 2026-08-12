# NicBDev.github.io

Nicholas Burt's personal profile / resume site. Plain HTML, CSS, and JS — no framework, no build step. Served directly by GitHub Pages from the `main` branch root at https://nicbdev.github.io/.

## Structure

- `index.html` — page content
- `styles.css` — dark developer-themed styles
- `script.js` — mobile nav toggle + footer year, no dependencies
- `tests/` — gate tests (see below)

## Editing content

All resume content lives directly in `index.html`. Update the relevant `<section>` and open a PR — CI runs the gate tests automatically.

## Tests

Gate tests are deterministic, free, and run in under 2 seconds. They run in CI on every push/PR via `.github/workflows/test.yml`.

```bash
npm install
npm test
```

This runs:

- `test:html` — HTML validation (`html-validate`)
- `test:links` — every local `href`/`src` in `index.html` resolves to a real file
- `test:privacy` — regression guard: fails the build if an email address or phone-number-shaped string ever gets committed to the site. This site intentionally shows no direct contact info, only GitHub and LinkedIn links.

There's also a periodic (non-gate) check that hits every external link over the network:

```bash
npm run test:external-links
```

Run this before shipping a content change and occasionally after — it's allowed to be slower and to fail transiently (network blips), unlike the gate tests.

## Local preview

```bash
npm run serve
# then open http://localhost:8000
```

## Deployment

No build step. GitHub Pages serves `main` directly. Pushing to `main` is the deploy.
