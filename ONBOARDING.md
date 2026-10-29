# Onboarding: NicBDev.github.io

A guide to maintaining and changing this site, written for someone taking over development.

## Contents

1. [The mental model](#1-the-mental-model)
2. [Your daily loop](#2-your-daily-loop)
3. [Updating content (the everyday task)](#3-updating-content-the-everyday-task)
4. [How templates work](#4-how-templates-work)
5. [How CSS connects to HTML](#5-how-css-connects-to-html)
6. [Debugging layout with browser DevTools](#6-debugging-layout-with-browser-devtools)
7. [Tests: the safety net](#7-tests-the-safety-net)
8. [Git, pull requests and deployment](#8-git-pull-requests-and-deployment)
9. [Your first exercise](#9-your-first-exercise)
10. [Quick reference](#10-quick-reference)
11. [Further reading](#11-further-reading)

---

## 1. The mental model

The site separates **what it says** from **how it looks**:

```
content/*.json  ──►  src/ templates (.njk)  ──►  Eleventy build  ──►  _site/index.html  ──►  GitHub Pages
  (the facts)         (the HTML structure)                              (what visitors get)
```

| Folder / file | What it controls | When you touch it |
|---|---|---|
| `content/` | **What** the page says: jobs, projects, skills, links, About text | Almost every change |
| `schemas/` | The *rules* for each content file: required fields, date format, allowed values | When you add a new kind of field |
| `src/_includes/` | **The HTML structure** of each section (templates) | When you change layout or markup |
| `src/styles.css` | **How** it looks: colours, spacing, fonts | Visual changes |
| `src/script.js` | **Behaviour**: the mobile menu and the footer year | Rarely |
| `src/lib/filters.js` | Small helper functions templates use (date formatting, sorting…) | Rarely |
| `_site/` | The generated website. **Never edit it by hand**; it's rebuilt every time | Never |

**Key idea:** content stores only *facts*, and the templates compute everything else. For example, you write `"start": "2025-07", "end": null`, and the page shows "Jul 2025 — Present". The "3 roles" count, the certificate order, the nav menu and the alternating grey/white backgrounds are all calculated, so they can't get out of sync.

[↑ Back to contents](#contents)

---

## 2. Your daily loop

```bash
cd ~/Projects/NicBDev.github.io     # always start in the repo folder
npm install                          # first time, or after pulling dependency changes
npm run serve                        # live preview at http://localhost:8000
```

Then: **edit a file → save.** The browser **reloads automatically**. Stop the server with `Ctrl+C`.

> **Common mistake:** running `npm` from the wrong folder gives
> `ENOENT: no such file or directory, open '.../package.json'`.
> The fix is to `cd` into the repo folder first.

Use **VS Code** (`code .` opens the folder). When you edit a file in `content/`, VS Code reads the `$schema` line at the top and gives you **autocomplete and red squiggles** for missing or misspelled fields.

[↑ Back to contents](#contents)

---

## 3. Updating content (the everyday task)

Every recipe below follows the same pattern: **edit JSON → check the preview → `npm test` → commit and open a PR.**

> **JSON rules that trip people up:**
> - Every item in a list is separated by a comma, but there's **no comma after the last item**.
> - Strings use **double quotes** `"like this"`.
> - Write plain text (`IS&T`, `don't`). Don't use HTML codes like `&amp;`; the templates handle escaping.
>
> If you get it wrong, `npm test` tells you the exact file and location.

### Add a new job (new employer)

In `content/experience.json`, add an object at the **top** of `employers` (most recent first):

```json
{
  "name": "Acme Corp",
  "roles": [
    {
      "title": "Senior Software Engineer",
      "team": "Platform Quality",
      "start": "2027-01",
      "end": null,
      "bullets": [
        "First accomplishment, starting with a strong verb.",
        "Second accomplishment, with a number if possible."
      ]
    }
  ]
},
```

- `end: null` means current and shows as **Present**. When you leave, change it to `"YYYY-MM"`.
- The employer's date span and "N roles" label are calculated for you.

### Add a new role at the same employer (promotion, transfer)

Add a new object at the **top** of that employer's `roles` list. Set the previous role's `end` to the month it ended.

### Add or edit a project

In `content/projects.json`, add to `projects` (cards show in list order):

```json
{
  "name": "My New Project",
  "url": "https://github.com/NicBDev/my-new-project",
  "description": "One or two sentences: the problem, what you built, and what it shows.",
  "tags": ["TypeScript", "Playwright"]
}
```

### Add a skill or a skill group

In `content/skills.json`, add a string to a group's `items`, or add a new group:

```json
{ "name": "Mobile", "items": ["SwiftUI", "UIKit"] }
```

Duplicate skills within a group are rejected by the tests.

### Add a certification

In `content/education.json`, add to `certifications`. **Order doesn't matter**, because they're always shown newest first:

```json
{ "name": "AWS Certified Developer – Associate", "issuer": "Amazon Web Services", "year": 2027 }
```

### Change the About text, headline or location

Edit `content/profile.json`:

- `lead`: the one- or two-sentence summary under your name.
- `about.paragraphs`: one string per paragraph.
- `about.facts`: the label/value list beside the About text.

### Change a link (LinkedIn, GitHub, résumé) or add a new button

Links are defined **once**, in `profile.links`, and reused by the top buttons, the contact section and the search-engine data:

```json
{ "id": "resume", "label": "Get Resume", "url": "https://…", "icon": "document", "primary": false }
```

- `primary: true` makes it the filled, highlighted button.
- `icon` must be one of `linkedin`, `github`, `document` or `none`.
- The contact section's buttons point at links by `linkId`, so renaming an `id` means updating `contact.links` too. The tests will catch it if you forget.

### Hide, show, rename or reorder sections

Everything is in `content/site.json` → `sections`:

```json
{ "id": "education", "label": "Education", "heading": "Education & Certifications", "enabled": true, "nav": true, "tile": true }
```

| To… | Do this |
|---|---|
| Hide a section | `"enabled": false`. It disappears from the page *and* the nav. |
| Reorder | Move its line up or down in the list |
| Change the nav text | Edit `label` |
| Use a longer heading on the page | Add `heading` (otherwise `label` is used) |
| Keep it on the page but out of the nav | `"nav": false` |
| Show or hide its card in the button grid below the hero | `"tile": true` / `false` |
| Change the card's subtitle | Add `"description": "…"`. Otherwise it's calculated from the content (e.g. "3 roles at Apple", "2 projects") |

Backgrounds keep alternating correctly, and the cards follow the same order, no matter what you hide or move.

[↑ Back to contents](#contents)

---

## 4. How templates work

Templates are HTML with placeholders. They live in `src/_includes/`, use the **Nunjucks** language (`.njk`), and Eleventy fills them in from the JSON.

```njk
{# src/_includes/sections/projects.njk (simplified) #}
{% for project in projects.projects %}
  <a class="project-card" href="{{ project.url }}">
    <h3>{{ project.name }}</h3>
    <p>{{ project.description }}</p>
  </a>
{% endfor %}
```

| Syntax | Meaning |
|---|---|
| `{{ project.name }}` | Insert a value (automatically HTML-escaped, which is safe) |
| `{% for x in list %}…{% endfor %}` | Repeat for each item |
| `{% if condition %}…{% endif %}` | Only render when true |
| `{{ role.start \| dateRange(role.end) }}` | Pass a value through a **filter** (a helper from `src/lib/filters.js`) |
| `{# … #}` | Comment, not output |

How the page is assembled:

- `src/_includes/base.njk`: the `<head>` (title, SEO, link previews, structured data) and page shell
- `src/_includes/header.njk` / `footer.njk`: the top bar (nav built from `site.json`) and footer
- `src/index.njk`: loops over the enabled sections and includes `sections/<id>.njk` for each
- `src/_includes/sections/*.njk`: one file per section

**Adding a brand-new section type** (e.g. "Talks") takes four steps:

1. Create `content/talks.json` and `schemas/talks.schema.json`.
2. Create `src/_includes/sections/talks.njk`.
3. Add `"talks"` to the `id` list in `schemas/site.schema.json`.
4. Add an entry to `content/site.json`.

[↑ Back to contents](#contents)

---

## 5. How CSS connects to HTML

HTML elements carry **class names**, and CSS rules in `src/styles.css` target those classes:

```html
<section id="top" class="hero">        <!-- from src/_includes/sections/hero.njk -->
```

```css
.hero { padding: 112px 0 40px; }       /* src/styles.css: applies to anything with class="hero" */
```

How to read `padding: 112px 0 40px;`: it gives values for **top**, **left/right**, and **bottom**. Padding is space *inside* an element's edges, and margin is space *outside* them.

### Patterns used in `src/styles.css`

| Pattern | Meaning |
|---|---|
| `.hero + .section` | "A `.section` that comes directly after `.hero`." |
| `@media (max-width: 760px) { … }` | Rules for narrow screens (phones). Many changes need to be made twice: desktop and inside this block. |
| `@media (prefers-color-scheme: dark) { … }` | Dark-mode colours, applied automatically from the visitor's system setting. |
| `@media print { … }` | How the page looks when printed or saved as a PDF. |
| `var(--accent)` | A **design token**: a named value defined once at the top of the file in `:root`. |

### Design tokens

```css
:root {
  --accent: #1d4ed8;   /* light mode */
}
@media (prefers-color-scheme: dark) {
  :root {
    --accent: #7aa2ff; /* dark mode */
  }
}
```

To change the blue site-wide, change `--accent` in **both** places. Use tokens instead of typing colours directly, so both themes keep working.

> If you rename a class in a template, update `src/styles.css` too, or that element loses its styling.

[↑ Back to contents](#contents)

---

## 6. Debugging layout with browser DevTools

The most useful skill for visual changes.

### One-time setup (Safari)

**Safari → Settings → Advanced →** check **"Show features for web developers."**

### Step by step

1. Open http://localhost:8000.
2. **Right-click the area you're curious about → Inspect Element.**
3. Hover over elements in the panel. Safari shades **padding in green** and **margins in orange**.
4. In the **Styles** panel, click a value (e.g. `88px`) and type a new one. The page updates instantly, **but nothing is saved.**
5. When it looks right, copy the value into `src/styles.css`.

DevTools shows the **built** HTML. To change the markup itself, edit the template in `src/_includes/`, not what you see in DevTools.

### Worked example: the gap below the hero buttons

- **Symptom:** a large blank space between the hero buttons and the About section.
- **Inspect:** the hero had 88px of bottom padding, and About had 88px of top padding. Both are white, so 176px of empty space stacked up.
- **Fix in `src/styles.css`:**
  ```css
  .hero { padding: 112px 0 40px; }
  .hero + .section { padding-top: 48px; }
  ```
  The same change was repeated inside `@media (max-width: 760px)` with smaller values for phones.

### Finding code

- In VS Code: `Cmd+Shift+F` searches all files.
- In the terminal: `grep -rn "hero" src/`.

[↑ Back to contents](#contents)

---

## 7. Tests: the safety net

```bash
npm test        # run before every commit
```

`npm test` runs these steps in order and stops at the first failure:

| Step | Command | What it catches |
|---|---|---|
| 1. Content check | `npm run test:content` | JSON typos, missing fields, misspelled keys, bad dates (`2025-13`), unknown icons, contact links pointing at a missing link id, end dates before start dates |
| 2. Unit tests | `npm run test:unit` | Bugs in the helper functions (date formatting, sorting, section logic) |
| 3. Build | `npm run build` | Template errors |
| 4. HTML validation | `npm run test:html` | Invalid markup in the built page |
| 5. Local links | `npm run test:links` | Links to files that don't exist |
| 6. Render check | `npm run test:render` | Something in the JSON that didn't make it onto the page; a hidden section that still shows; nav order wrong |
| 7. Privacy guard | `npm run test:privacy` | Any email address or phone number, in the sources *or* the built page |

Failures tell you exactly where the problem is:

```
FAIL: 1 content problem(s):
  - experience.json /employers/0/roles/0/start: Use YYYY-MM, e.g. 2025-07 (got "2025-13")
```

Read `/employers/0/roles/0/start` as "first employer → first role → `start` field" (counting starts at 0).

> **The privacy guard is deliberate.** The site shows only LinkedIn, GitHub and the résumé link, never direct contact info. It also scans JSON and Markdown (including this file), so don't paste an email address or phone number anywhere, even as an example.

### Optional: external link check

```bash
npm run build && npm run test:external-links
```

This checks that LinkedIn, GitHub, the résumé and other outside links still respond. It uses the network and can fail at random, so run it now and then.

[↑ Back to contents](#contents)

---

## 8. Git, pull requests and deployment

> **The most important rule:** merging to `main` puts the change on the live site. Always work on a branch and merge through a pull request.

### The workflow

```bash
git switch main && git pull         # start from the latest code
git switch -c add-new-project       # new branch for new work
# ...edit, preview, repeat...
npm test                            # must pass
git add content/projects.json       # stage the files you changed
git commit -m "Add new project card"
git push -u origin add-new-project  # first push of a new branch needs -u
gh pr create --fill                 # open a pull request (or use the GitHub website)
```

> Seeing `fatal: The current branch … has no upstream branch`? You ran plain `git push` on a new branch. Use `git push -u origin <branch-name>` once. To make Git do it automatically for every new branch:
> `git config --global push.autoSetupRemote true`

### What happens on GitHub

`.github/workflows/ci.yml` runs automatically:

| Event | What runs |
|---|---|
| Pull request opened or updated | **test** job: `npm ci` + `npm test`. You'll see ✓ or ✗ on the PR. |
| Merge to `main` | **test**, then **deploy**: the built `_site/` is published to https://nicbdev.github.io/ |

If the tests fail on `main`, **nothing is deployed** and the live site stays as it was.

Watch progress in the repo's **Actions** tab. The live site updates a minute or two after the deploy job finishes.

> **One-time setting:** GitHub repo → **Settings → Pages → Source: "GitHub Actions"**. Without it, deploys won't publish.

### Handy git commands

| Command | What it does |
|---|---|
| `git status` | Show changed files and the current branch |
| `git diff` | Show exactly what changed, line by line |
| `git restore <file>` | Throw away unsaved edits to a file (can't be undone) |
| `git switch main` | Go back to the main branch |
| `git pull` | Download the latest changes from GitHub |
| `git log --oneline` | List recent commits |

[↑ Back to contents](#contents)

---

## 9. Your first exercise

Practise the whole loop with a real content change:

1. `git switch main && git pull`
2. `git switch -c practice-content`
3. `npm run serve` and open http://localhost:8000.
4. In `content/skills.json`, add a skill to any group. Watch it appear when you save.
5. In `content/site.json`, set Education to `"enabled": false`. It vanishes from the page and the nav. Set it back to `true`.
6. Break something on purpose: change a `start` date to `"2025-13"` and run `npm test`. Read the error, then fix it.
7. `npm test` passes, then commit, push and open a PR ([section 8](#8-git-pull-requests-and-deployment)).
8. Watch the ✓ appear on the PR. Merge it to keep the change, or close it if it was only practice.

[↑ Back to contents](#contents)

---

## 10. Quick reference

```bash
cd ~/Projects/NicBDev.github.io   # go to the project
npm run serve                     # live preview at http://localhost:8000
npm test                          # run all checks
npm run build                     # build _site/ without serving
git switch -c <branch-name>       # start new work
git add <files> && git commit -m "message"
git push -u origin <branch-name>
gh pr create --fill               # open a pull request
```

| I want to change… | Look in… |
|---|---|
| Jobs, roles, bullets | `content/experience.json` |
| Projects | `content/projects.json` |
| Skills | `content/skills.json` |
| Degrees, certifications | `content/education.json` |
| Name, headline, About, links, contact text | `content/profile.json` |
| Section order/visibility, page title, SEO text | `content/site.json` |
| Allowed fields / validation rules | `schemas/*.schema.json` |
| A section's HTML structure | `src/_includes/sections/<id>.njk` |
| `<head>`, link previews, structured data | `src/_includes/base.njk` |
| Colours, spacing, fonts, layout | `src/styles.css` |
| Phone layout | `src/styles.css` → `@media (max-width: 760px)` |
| Dark mode colours | `src/styles.css` → `@media (prefers-color-scheme: dark)` |
| Date formatting, sorting, section logic | `src/lib/filters.js` (+ `tests/filters.test.mjs`) |
| Mobile menu behaviour | `src/script.js` |
| CI / deployment | `.github/workflows/ci.yml` |

[↑ Back to contents](#contents)

---

## 11. Further reading

- [`README.md`](README.md): project overview and commands.
- [`CLAUDE.md`](CLAUDE.md): a more technical summary of the architecture and conventions.
- [Eleventy docs](https://www.11ty.dev/docs/): the static site generator.
- [Nunjucks templating docs](https://mozilla.github.io/nunjucks/templating.html): template syntax.
- [JSON Schema: Getting Started](https://json-schema.org/learn/getting-started-step-by-step): how the `schemas/` files work.
- [MDN Web Docs](https://developer.mozilla.org/): the reference for any HTML or CSS property.

[↑ Back to contents](#contents)
