// Gate test: every local href/src on every built page (_site/**/*.html) must resolve to a real file,
// and every same-page "#anchor" link must point at an element id on that page.
// Run after `npm run build`.
// Deterministic, no network calls — keeps this test free and fast (<2s).
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve, relative, extname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '_site');

function collectPages(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectPages(full));
    else if (extname(entry.name) === '.html') out.push(full);
  }
  return out;
}

const attrPattern = /(?:href|src)="([^"]+)"/g;
const isExternal = (url) => /^(https?:|mailto:|tel:|data:)/.test(url);

// "/experience/" -> _site/experience/index.html; "styles.css" -> relative to the page's folder.
function resolveLocal(url, pageFile) {
  const cleanPath = url.split('#')[0].split('?')[0];
  let target = cleanPath.startsWith('/') ? join(ROOT, cleanPath) : resolve(dirname(pageFile), cleanPath);
  if (cleanPath.endsWith('/') || (existsSync(target) && statSync(target).isDirectory())) {
    target = join(target, 'index.html');
  }
  return target;
}

const pages = collectPages(ROOT);
let checked = 0;
const failures = [];

for (const pageFile of pages) {
  const html = readFileSync(pageFile, 'utf8');
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  const page = relative(ROOT, pageFile);

  for (const [, url] of html.matchAll(attrPattern)) {
    if (isExternal(url)) continue;
    checked += 1;
    if (url.startsWith('#')) {
      if (url.length > 1 && !ids.has(url.slice(1))) failures.push(`${page}: ${url} -> no element with that id`);
      continue;
    }
    const target = resolveLocal(url, pageFile);
    if (!existsSync(target)) failures.push(`${page}: ${url} -> ${relative(ROOT, target)} (missing)`);
  }
}

if (checked === 0) {
  console.error('FAIL: no local links were found to check — pattern may be broken');
  process.exit(1);
}

if (failures.length > 0) {
  console.error(`FAIL: ${failures.length} local link(s) are broken:`);
  failures.forEach((f) => console.error(`  - ${f}`));
  process.exit(1);
}

console.log(`PASS: ${checked} local link(s) across ${pages.length} page(s) resolve.`);
