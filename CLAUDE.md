# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A personal profile/résumé site: a home page plus one page per section (`/experience/`, `/projects/`, …). The content is JSON in `content/`, rendered to static HTML by Eleventy 3 (Nunjucks templates) into `_site/`. GitHub Actions (`.github/workflows/ci.yml`) tests every PR. On `main` it builds and deploys `_site/` to GitHub Pages at https://nicbdev.github.io/, so **merging to `main` deploys**. Pages' source must be set to "GitHub Actions"; the repo root is not served.

## Commands

```bash
npm install
npm run serve                # eleventy --serve, live reload at http://localhost:8000
npm run build                # eleventy → _site/
npm test                     # test:content → test:unit → build → test:html → test:links → test:render → test:privacy
npm run test:content         # ajv: content/<name>.json against schemas/<name>.schema.json + cross-field rules
npm run test:unit            # node --test tests/filters.test.mjs
npm run test:external-links  # network check of external hrefs in _site (not a gate; may flake; needs a build first)
```

`test:html`, `test:links` and `test:render` read every page in `_site/`, so they need a build first (`npm test` handles this). Tests are standalone Node ESM scripts in `tests/` with no framework, except the unit tests, which use `node:test`. Run one with its npm script or `node tests/<file>.mjs`. The package is `"type": "module"`.

## Architecture

- **Content → data:** `eleventy.config.js` registers each `content/<name>.json` as a global template variable `<name>` (`site`, `profile`, `experience`, `skills`, `projects`, `education`), with `$schema` stripped. Adding a new content file means adding a matching `schemas/<name>.schema.json`, or `test:content` fails.
- **Pages:** the section order, `enabled`, `nav`, `tile`, `description` and an optional `heading` all come from `content/site.json`.
  - `src/index.njk` (home) renders only `sections/hero.njk`, which includes the card grid (`src/_includes/section-tiles.njk`).
  - `src/section-page.njk` paginates over the global `sectionPages` to make one page per enabled `tile: true` section at `/<id>/`, rendering the same `sections/<id>.njk` partial plus a back link and Previous/Next. `sectionPages` is built in `eleventy.config.js` from `tileSections` + `withNeighbors`, with `alt` forced off.
  - The header nav (`header.njk`) lists tile sections with `nav: true`, links to `/<id>/` (`sectionUrl`) and marks the current page with `aria-current="page"`. Only link to sections that have a page.
  - Card subtitles come from `sectionSummary`: a section's `description` in `site.json` wins; otherwise it's calculated from the content. Unknown ids get an empty string.
  - `src/404.njk` → `/404.html` (served by GitHub Pages for unknown URLs, marked `noindex`).
  - A new section needs: an id in the `site.schema.json` enum, a partial in `sections/`, and an entry in `site.json`. Its page, card, nav link, sitemap entry and Previous/Next all follow automatically.
- **Headings:** partials start at `headingLevel` (2 by default; `section-page.njk` sets 1, so each page has one `<h1>`), using `<h{{ h }}>`, `<h{{ h + 1 }}>`, and so on. CSS styles headings by class (`.section-title`, `.employer-name`, `.job-title`, `.group-title`, `.project-title`, `.card-title`), never by tag, so the level can change freely.
- Built pages live in subfolders, so asset and page links must be root-absolute (`/styles.css`, `/experience/`). The `alt` background logic in `enabledSections` only matters where several sections share a page.
- **Derived, not stored:** date strings ("Jul 2025 — Present"), employer span, role counts, certification ordering, nav and backgrounds are all computed by the helpers in `src/lib/filters.js`. Content stores only facts (`YYYY-MM` dates, `null` end = Present).
- **Links are defined once** in `profile.links` (`id`, `url`, `icon`, `primary`). The contact section references them by `linkId` (resolved with `findLink`). JSON-LD `sameAs` uses every link except `resume`.
- `src/lib/filters.js` holds pure functions with no Eleventy imports, so they can be unit-tested. Keep it that way. Register any new filter in `eleventy.config.js` and test it in `tests/filters.test.mjs`.
- `src/_includes/base.njk` holds the `<head>`: a per-page `<title>` (`pageTitle` or `site.title`), canonical and `og:url` (`absoluteUrl`), Open Graph, favicon, optional `noindex`, and JSON-LD `Person` on the home page only (from `personJsonLd`, which escapes `<`). `src/sitemap.njk` lists the home page and every section page; `src/robots.njk` generates `/robots.txt`.
- **Icons:** `src/_includes/icons.njk` has an `icon(name)` macro whose names match the `icon` enum in `profile.schema.json`. Adding an icon means updating both.
- `src/styles.css` is light by default, with a dark palette under `@media (prefers-color-scheme: dark)`.
  - Use the custom-property tokens in `:root` (`--bg`, `--text-dim`, `--accent`, `--border`, …), never hard-coded colors.
  - There's a `@media print` block for printing.
  - Template markup must keep the class names the CSS expects.
- `src/script.js` is a dependency-free IIFE: it toggles the mobile nav (`.nav-toggle` / `.nav-open`, with `aria-expanded`) and fills in the footer year (`#year`).
- Nunjucks autoescapes, so write plain text in JSON (`&`, not `&amp;`). Only `| safe` trusted output such as JSON-LD and `content`.

## Privacy constraint (important)

On purpose, the site shows **no direct contact info**: only GitHub, LinkedIn and the résumé link. `tests/test-privacy.mjs` enforces this by regex-scanning every `.html`, `.js`, `.css`, `.md`, `.json` and `.njk` file in the repo, including `_site/`, this file and the README. It skips only `node_modules`, `.git` and `package-lock.json`. Never add an email address or a phone-number-shaped string (three digits, three digits, four digits) anywhere, including in examples, test fixtures, docs or JSON-LD, or CI will fail.
