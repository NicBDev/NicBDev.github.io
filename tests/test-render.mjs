// Gate test: the built site (_site/) reflects the content files.
// - Every section with "tile": true has its own page at /<id>/; disabled sections have none.
// - The home page's section cards and the header nav match site.json, in order.
// - Each section page's Previous/Next links follow the config order.
// - Every role, project, skill and certification appears on its section's page.
// Run after `npm run build`.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SITE = join(ROOT, '_site');
const readJson = (name) => JSON.parse(readFileSync(join(ROOT, 'content', `${name}.json`), 'utf8'));

const site = readJson('site');
const profile = readJson('profile');
const experience = readJson('experience');
const skills = readJson('skills');
const projects = readJson('projects');
const education = readJson('education');

const decode = (raw) =>
  raw
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
const pagePath = (id) => join(SITE, id, 'index.html');
const readPage = (id) => (existsSync(pagePath(id)) ? decode(readFileSync(pagePath(id), 'utf8')) : '');

const failures = [];
let checked = 0;
function check(condition, message) {
  checked += 1;
  if (!condition) failures.push(message);
}
function expectOn(id, text, what) {
  check(readPage(id).includes(text), `/${id}/ is missing ${what}: "${text}"`);
}
const hrefsIn = (html, pattern) => [...html.matchAll(pattern)].map((m) => m[1]);
const sameList = (actual, expected, what) =>
  check(actual.join(',') === expected.join(','), `${what} is [${actual.join(', ')}], expected [${expected.join(', ')}]`);

const tiles = site.sections.filter((s) => s.enabled && s.tile);
const isPage = (id) => tiles.some((s) => s.id === id);

// One page per tile section; none for disabled or non-tile sections.
for (const section of site.sections) {
  if (section.id === 'hero') continue;
  const exists = existsSync(pagePath(section.id));
  if (isPage(section.id)) check(exists, `section "${section.id}" should have a page at /${section.id}/`);
  else check(!exists, `section "${section.id}" is disabled or has tile: false, but /${section.id}/ exists`);
}

// Home page: hero content, section cards in config order, and structured data.
const home = decode(readFileSync(join(SITE, 'index.html'), 'utf8'));
check(home.includes(profile.name), 'home page is missing the profile name');
profile.links.forEach((l) => check(home.includes(`href="${l.url}"`), `home page is missing link "${l.label}"`));
const tilesHtml = home.match(/<nav class="section-tiles"[^>]*>([\s\S]*?)<\/nav>/)?.[1] ?? '';
sameList(hrefsIn(tilesHtml, /<a class="tile" href="\/([^"/]+)\/"/g), tiles.map((s) => s.id), 'home section cards');
const jsonLd = home.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
try {
  check(JSON.parse(jsonLd)['@type'] === 'Person', 'home JSON-LD @type is not Person');
} catch {
  check(false, 'home JSON-LD block is missing or not valid JSON');
}

// Header nav: tile sections flagged nav, in order.
const navHtml = home.match(/<nav class="nav"[^>]*>([\s\S]*?)<\/nav>/)?.[1] ?? '';
sameList(hrefsIn(navHtml, /href="\/([^"/]+)\/"/g), tiles.filter((s) => s.nav).map((s) => s.id), 'header nav');

// Each section page: marked current in the nav (if it's in the nav), correct prev/next, own canonical URL.
tiles.forEach((section, i) => {
  const html = readPage(section.id);
  if (section.nav) {
    check(html.includes(`href="/${section.id}/" aria-current="page"`), `/${section.id}/ nav doesn't mark itself current`);
  }
  const canonical = new URL(`${section.id}/`, site.url).href;
  check(html.includes(`<link rel="canonical" href="${canonical}">`), `/${section.id}/ has the wrong canonical URL`);
  const prev = html.match(/class="pager-link pager-prev" href="\/([^"/]+)\/"/)?.[1] ?? null;
  const next = html.match(/class="pager-link pager-next" href="\/([^"/]+)\/"/)?.[1] ?? null;
  const expectedPrev = tiles[i - 1]?.id ?? null;
  const expectedNext = tiles[i + 1]?.id ?? null;
  check(prev === expectedPrev, `/${section.id}/ Previous links to ${prev}, expected ${expectedPrev ?? 'none'}`);
  check(next === expectedNext, `/${section.id}/ Next links to ${next}, expected ${expectedNext ?? 'none'}`);
});

// Content lands on the right page.
if (isPage('about')) profile.about.paragraphs.forEach((p, i) => expectOn('about', p, `about paragraph ${i + 1}`));
if (isPage('experience')) {
  for (const employer of experience.employers) {
    expectOn('experience', employer.name, 'employer');
    for (const role of employer.roles) {
      expectOn('experience', role.title, 'role title');
      role.bullets.forEach((b) => expectOn('experience', b, `bullet under "${role.title}"`));
    }
  }
}
if (isPage('skills')) skills.groups.forEach((g) => g.items.forEach((item) => expectOn('skills', `<li>${item}</li>`, 'skill')));
if (isPage('projects')) projects.projects.forEach((p) => expectOn('projects', p.name, 'project'));
if (isPage('education')) education.certifications.forEach((c) => expectOn('education', c.name, 'certification'));
if (isPage('contact')) {
  profile.contact.links.forEach((item) => {
    const link = profile.links.find((l) => l.id === item.linkId);
    expectOn('contact', `href="${link.url}"`, `contact link "${item.label}"`);
  });
}

// 404 page exists and isn't indexed.
const notFound = existsSync(join(SITE, '404.html')) ? readFileSync(join(SITE, '404.html'), 'utf8') : '';
check(notFound.includes('<meta name="robots" content="noindex">'), '404.html is missing or indexable');

if (failures.length > 0) {
  console.error(`FAIL: ${failures.length} rendering problem(s):`);
  failures.forEach((f) => console.error(`  - ${f}`));
  process.exit(1);
}

console.log(`PASS: ${checked} rendering check(s) across ${tiles.length + 1} page(s) — the site matches the content files.`);
