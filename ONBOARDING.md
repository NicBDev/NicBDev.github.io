# Onboarding: NicBDev.github.io

A guide to maintaining and changing this site, written for someone taking over development.

## Contents

1. [The mental model](#1-the-mental-model)
2. [Your daily loop](#2-your-daily-loop)
3. [How CSS connects to HTML](#3-how-css-connects-to-html)
4. [Debugging layout with browser DevTools](#4-debugging-layout-with-browser-devtools)
5. [Common tasks](#5-common-tasks)
6. [Tests: the safety net](#6-tests-the-safety-net)
7. [Git: saving and publishing your work](#7-git-saving-and-publishing-your-work)
8. [Your first exercise](#8-your-first-exercise)
9. [Quick reference](#9-quick-reference)
10. [Further reading](#10-further-reading)

---

## 1. The mental model

The site is three files and a browser. There's nothing to compile, and no framework or database.

| File | What it controls | Example change |
|---|---|---|
| `index.html` | **What** is on the page: text, links, sections | Add a job bullet, a new project, a button |
| `styles.css` | **How** it looks: colours, spacing, fonts, layout | Change a gap, the accent colour, font sizes |
| `script.js` | **Behaviour**: the mobile menu and the footer year | Rarely touched |

The browser reads `index.html`, which links to `styles.css` and `script.js`. GitHub Pages serves these exact files to the public, so what you see locally is what visitors get.

[↑ Back to contents](#contents)

---

## 2. Your daily loop

```bash
cd ~/Projects/NicBDev.github.io     # always start in the repo folder
npm run serve                        # start the preview at http://localhost:8000
```

Then: **edit a file → save → refresh the browser.** That's the whole loop. Stop the server with `Ctrl+C`.

> **Common mistake:** running `npm` from the wrong folder gives
> `ENOENT: no such file or directory, open '.../package.json'`.
> The fix is to `cd` into the repo folder first.

Use an editor like **VS Code**. Open the folder with `code .` or with **File → Open Folder**.

[↑ Back to contents](#contents)

---

## 3. How CSS connects to HTML

HTML elements carry **class names**, and CSS rules target those classes:

```html
<section id="top" class="hero">        <!-- index.html -->
```

```css
.hero { padding: 112px 0 40px; }       /* styles.css: applies to anything with class="hero" */
```

How to read `padding: 112px 0 40px;`: it gives values for **top**, **left/right**, and **bottom**. Padding is space *inside* an element's edges, and margin is space *outside* them.

### Patterns used in `styles.css`

| Pattern | Meaning |
|---|---|
| `.hero + .section` | "A `.section` that comes directly after `.hero`." Used to change only the About section's top spacing. |
| `@media (max-width: 760px) { … }` | Rules that apply only on narrow screens (phones). Many changes need to be made twice: once for desktop and once inside this block. |
| `@media (prefers-color-scheme: dark) { … }` | The dark-mode colours, applied automatically when the visitor's system is in dark mode. |
| `@media print { … }` | How the page looks when printed or saved as a PDF. |
| `var(--accent)` | A **design token**: a named value defined once at the top of the file in `:root`. |

### Design tokens

Colours and a few other shared values are defined once at the top of `styles.css`:

```css
:root {
  --accent: #1d4ed8;   /* light mode */
  ...
}
@media (prefers-color-scheme: dark) {
  :root {
    --accent: #7aa2ff; /* dark mode */
    ...
  }
}
```

To change the blue across the whole site, change `--accent` in **both** places. Use the tokens instead of typing colours directly, so light and dark mode both keep working.

[↑ Back to contents](#contents)

---

## 4. Debugging layout with browser DevTools

This is the most useful skill for visual changes. Here is how to find out why there's an unexpected gap, for example.

### One-time setup (Safari)

**Safari → Settings → Advanced →** check **"Show features for web developers."**

### Step by step

1. Open http://localhost:8000.
2. **Right-click the area you're curious about → Inspect Element.**
3. Hover over elements in the panel. Safari shades **padding in green** and **margins in orange** on the page.
4. In the right-hand **Styles** panel, click a value (for example `88px`) and type a new one. The page updates instantly, **but nothing is saved.**
5. When it looks right, copy that value into `styles.css` and save. DevTools is for experimenting; the file is the real change.

### Worked example: the gap below the hero buttons

- **Symptom:** a large blank space between the LinkedIn / GitHub / Resume buttons and the About section.
- **Inspect:** the hero had 88px of bottom padding, and the About section had 88px of top padding. Both are white, so 176px of empty space stacked up with no divider.
- **Fix in `styles.css`:**
  ```css
  .hero { padding: 112px 0 40px; }          /* smaller bottom padding */
  .hero + .section { padding-top: 48px; }   /* smaller top padding on About only */
  ```
  The same change was repeated inside `@media (max-width: 760px)` with smaller values for phones.

### Finding code

- In VS Code: `Cmd+Shift+F` searches all files.
- In the terminal: `grep -n "hero" styles.css`.

[↑ Back to contents](#contents)

---

## 5. Common tasks

| Task | How |
|---|---|
| Edit text or bullets | Find the text in `index.html` and change it. |
| Add a project | Copy an existing `<a class="project-card">…</a>` block in the Projects section, paste it and edit it. |
| Add a job or role | Copy a `<li class="job">…</li>` inside `<ol class="timeline">`. |
| Add a section to the nav | Create `<section id="something" class="section">` and add `<a href="#something">Something</a>` inside `<nav>`. |
| Change the colour scheme | Edit the tokens at the top of `styles.css` (both light and dark). |
| Change the résumé link | Edit the `href` on the **Get Resume** button in the hero section of `index.html`. |

**HTML special characters:** write `&amp;` instead of `&` in text, or the HTML validator will fail.

**Section backgrounds alternate:** use `class="section"` (white) or `class="section alt"` (light grey) to keep the rhythm.

[↑ Back to contents](#contents)

---

## 6. Tests: the safety net

```bash
npm install     # first time only
npm test        # run before every commit
```

`npm test` runs three checks:

| Check | Command | What it catches |
|---|---|---|
| HTML validation | `npm run test:html` | Unclosed tags, typos in attributes, invalid markup |
| Local links | `npm run test:links` | `href`/`src` values pointing at files that don't exist |
| Privacy guard | `npm run test:privacy` | Any email address or phone number in `.html`, `.css`, `.js` or `.md` files |

> **The privacy guard is deliberate.** The site shows only LinkedIn and GitHub, never direct contact info. It also scans Markdown docs like this one, so don't paste an email address or phone number into any file, even as an example.

GitHub runs `npm test` automatically on every push and pull request. You'll see a ✓ or ✗ next to your commit on GitHub.

### Optional: external link check

```bash
npm run test:external-links
```

This checks that outside links such as LinkedIn, GitHub and the résumé still respond. It uses the network and can fail at random, so run it now and then rather than on every change.

[↑ Back to contents](#contents)

---

## 7. Git: saving and publishing your work

> **The most important rule:** pushing to `main` puts the change on the live site immediately. Always work on a branch, then merge through a pull request.

### The workflow

```bash
git status                          # what's changed?
git switch -c my-change             # start a new branch for new work
# ...edit, save, refresh, repeat...
npm test                            # must pass
git add index.html styles.css       # stage the files you changed
git commit -m "Tighten hero spacing"
git push -u origin my-change        # upload the branch to GitHub
gh pr create --fill                 # open a pull request (or use the GitHub website)
```

Then on GitHub:

1. Open the pull request.
2. Wait for the test check to show **✓**.
3. Click **Merge**.
4. The live site at https://nicbdev.github.io/ updates within a minute or two.

### Handy git commands

| Command | What it does |
|---|---|
| `git status` | Show changed files and the current branch |
| `git diff` | Show exactly what changed, line by line |
| `git restore styles.css` | Throw away unsaved edits to a file (can't be undone) |
| `git switch main` | Go back to the main branch |
| `git pull` | Download the latest changes from GitHub |
| `git log --oneline` | List recent commits |

[↑ Back to contents](#contents)

---

## 8. Your first exercise

Practise the whole loop once with a small, safe change:

1. `git switch main && git pull` to start from the latest code.
2. `git switch -c practice-change` to create a branch.
3. `npm run serve`, then open http://localhost:8000.
4. Change one thing, such as a word in the About section, or `--accent` to a different colour.
5. Refresh and confirm you see it.
6. `npm test` and confirm everything passes.
7. Commit, push and open a pull request (see [section 7](#7-git-saving-and-publishing-your-work)).
8. Close the PR without merging if it was only practice, or merge it if you want to keep the change.

[↑ Back to contents](#contents)

---

## 9. Quick reference

```bash
cd ~/Projects/NicBDev.github.io   # go to the project
npm run serve                     # preview at http://localhost:8000
npm test                          # run the checks
git switch -c <branch-name>       # start new work
git add <files> && git commit -m "message"
git push -u origin <branch-name>
gh pr create --fill               # open a pull request
```

| I want to change… | Look in… |
|---|---|
| Words, links, sections | `index.html` |
| Colours, spacing, fonts, layout | `styles.css` |
| Phone layout | `styles.css` → `@media (max-width: 760px)` |
| Dark mode colours | `styles.css` → `@media (prefers-color-scheme: dark)` |
| Mobile menu behaviour | `script.js` |
| The CI test run | `.github/workflows/test.yml` |

[↑ Back to contents](#contents)

---

## 10. Further reading

- [`README.md`](README.md): project overview and commands.
- [`CLAUDE.md`](CLAUDE.md): a more technical summary of the architecture and conventions.
- [MDN Web Docs](https://developer.mozilla.org/): the best reference for any HTML or CSS property. Search "MDN padding," "MDN flexbox," "MDN grid," and so on.

[↑ Back to contents](#contents)
