# NicBDev.github.io

Nicholas Burt's personal profile / résumé site, live at https://nicbdev.github.io/.

The content lives in JSON files and is rendered to static HTML by [Eleventy](https://www.11ty.dev/). GitHub Actions validates, builds, tests and deploys it to GitHub Pages.

## Updating content

All résumé content lives in `content/`. Edit the JSON, not the HTML:

| File | Contains |
|---|---|
| `content/profile.json` | Name, headline, location, links (LinkedIn, GitHub, résumé), About text, contact text |
| `content/experience.json` | Employers → roles → bullets (dates as `YYYY-MM`, `null` end = Present) |
| `content/skills.json` | Skill groups and their items |
| `content/projects.json` | Project cards |
| `content/education.json` | Degrees and certifications (certifications are shown newest first automatically) |
| `content/site.json` | Page title/SEO text, and the **order and visibility of sections** |

Each file is checked against a schema in `schemas/`. VS Code uses the `$schema` line at the top of each file for autocomplete and inline errors.

See [ONBOARDING.md](ONBOARDING.md) for step-by-step recipes (adding a job, project, skill or certification).

## Structure

- `content/`: the data (the only folder needed for everyday updates)
- `schemas/`: JSON Schemas defining what each content file may contain
- `src/`: Eleventy templates (`index.njk` for the home page, `section-page.njk` for one page per section, `404.njk`, `_includes/`), `styles.css`, `script.js`, and template helpers in `src/lib/filters.js`
- `eleventy.config.js`: loads `content/*.json` as template data and registers the helpers
- `tests/`: gate tests (see below)
- `_site/`: build output (git-ignored; this is what gets deployed)

## Commands

```bash
npm install
npm run serve    # live-reloading preview at http://localhost:8000
npm run build    # write the site to _site/
npm test         # full gate suite
```

## Tests

`npm test` runs, in order:

- `test:content`: every content file matches its schema, plus cross-field rules (e.g. contact links refer to real links, end dates aren't before start dates)
- `test:unit`: unit tests for the template helpers (`node --test`)
- `build`: Eleventy build into `_site/`
- `test:html`: HTML validation of every built page (`html-validate`)
- `test:links`: every local `href`/`src` on every built page resolves to a real file, and every `#anchor` matches an id
- `test:render`: each enabled section has its own page and disabled ones don't; the home cards, header nav and Previous/Next links follow `site.json`; every role, project, skill and certification appears on its section's page
- `test:privacy`: regression guard that fails if an email address or phone-number-shaped string appears in the sources (including JSON and templates) or the built output. The site intentionally shows no direct contact info, only GitHub and LinkedIn links.

There's also a periodic (non-gate) check that hits every external link over the network:

```bash
npm run build && npm run test:external-links
```

It's allowed to be slower and to fail transiently (network blips), unlike the gate tests.

## Deployment

`.github/workflows/ci.yml` runs `npm test` on every pull request. On pushes to `main` it also uploads `_site/` and deploys it to GitHub Pages. Merging to `main` is the deploy.

GitHub Pages must be set to **Settings → Pages → Source: GitHub Actions**.
