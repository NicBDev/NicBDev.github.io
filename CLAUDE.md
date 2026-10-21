# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-page personal profile/resume site in plain HTML, CSS, and JS. There's no framework, no bundler, and no build step. GitHub Pages serves the `main` branch root directly at https://nicbdev.github.io/, so **pushing to `main` deploys**.

## Commands

```bash
npm install                  # only dev dependency is html-validate
npm test                     # gate suite: test:html → test:links → test:privacy
npm run test:html            # html-validate index.html (default rules, no config file)
npm run test:links           # every local href/src in index.html must exist on disk
npm run test:privacy         # fails if an email- or phone-shaped string appears anywhere
npm run test:external-links  # network check of external hrefs (not a gate; may flake)
npm run serve                # python3 http.server on http://localhost:8000
```

CI (`.github/workflows/test.yml`, Node 20) runs `npm ci && npm test` on every push and PR to `main`. Each test is a standalone Node ESM script in `tests/` with no test framework. Run one by calling its npm script or `node tests/<file>.mjs`.

## Architecture and conventions

- `index.html` holds all of the resume content, split into anchored `<section>`s (`#top`, `#about`, `#experience`, `#skills`, `#projects`, `#education`, `#contact`). The header nav links to these anchors. If you add or rename a section, update the nav too.
- `styles.css` is a clean, recruiter-oriented design: light by default, with a dark palette that follows the system setting. It's built on CSS custom properties in `:root`, which are redefined under `@media (prefers-color-scheme: dark)`. Use those tokens (`--bg`, `--text-dim`, `--accent`, `--border`, etc.) rather than hard-coded colors so both themes keep working. It loads Inter from Google Fonts. Sections alternate backgrounds with the `.section` / `.section.alt` classes, and there's a `@media print` block so the page prints as a one-column résumé.
- Experience is grouped under one employer block (Apple), with each role as an `<li class="job">` in an `<ol class="timeline">`.
- `script.js` is a dependency-free IIFE that does two things: it toggles the mobile nav (`.nav-toggle` / `.nav-open`, keeping `aria-expanded` in sync) and fills in the footer year (`#year`).
- The gate tests are meant to stay deterministic, free (no network), and fast (under 2s). Anything that needs the network belongs in `check-external-links.mjs`.

## Privacy constraint (important)

On purpose, the site shows **no direct contact info**: only GitHub and LinkedIn links. `tests/test-privacy.mjs` enforces this by regex-scanning every `.html`, `.js`, `.css`, and `.md` file in the repo, including this file and the README. It skips only `node_modules` and `.git`. Never add an email address or a phone-number-shaped string (three digits, three digits, four digits) to any of those files, including in examples or docs, or CI will fail.
