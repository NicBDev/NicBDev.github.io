// Gate test: the built page (_site/index.html) reflects the content files. Every role, project,
// skill and certification appears, disabled sections are absent, and the nav matches site.json.
// Run after `npm run build`.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const readJson = (name) => JSON.parse(readFileSync(join(ROOT, 'content', `${name}.json`), 'utf8'));

const site = readJson('site');
const profile = readJson('profile');
const experience = readJson('experience');
const skills = readJson('skills');
const projects = readJson('projects');
const education = readJson('education');

const raw = readFileSync(join(ROOT, '_site', 'index.html'), 'utf8');
const html = raw
  .replace(/&#39;/g, "'")
  .replace(/&quot;/g, '"')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&amp;/g, '&');

const failures = [];
let checked = 0;
function expectText(text, what) {
  checked += 1;
  if (!html.includes(text)) failures.push(`missing ${what}: "${text}"`);
}

const enabled = (id) => site.sections.some((s) => s.id === id && s.enabled);

// Section presence / absence. The hero renders with id="top" so the logo link works.
for (const section of site.sections) {
  const domId = section.id === 'hero' ? 'top' : section.id;
  const present = html.includes(`<section id="${domId}"`);
  checked += 1;
  if (section.enabled && !present) failures.push(`section "${section.id}" is enabled but not rendered`);
  if (!section.enabled && present) failures.push(`section "${section.id}" is disabled but still rendered`);
}

// Nav links: exactly the enabled nav sections, in config order.
const navHtml = html.match(/<nav class="nav"[^>]*>([\s\S]*?)<\/nav>/)?.[1] ?? '';
const navIds = [...navHtml.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]);
const expectedNav = site.sections.filter((s) => s.enabled && s.nav).map((s) => s.id);
checked += 1;
if (navIds.join(',') !== expectedNav.join(',')) {
  failures.push(`nav order is [${navIds.join(', ')}], expected [${expectedNav.join(', ')}]`);
}

expectText(profile.name, 'profile name');
profile.links.forEach((l) => expectText(`href="${l.url}"`, `link "${l.label}"`));

if (enabled('about')) profile.about.paragraphs.forEach((p, i) => expectText(p, `about paragraph ${i + 1}`));
if (enabled('experience')) {
  for (const employer of experience.employers) {
    expectText(employer.name, 'employer');
    for (const role of employer.roles) {
      expectText(role.title, 'role title');
      role.bullets.forEach((b) => expectText(b, `bullet under "${role.title}"`));
    }
  }
}
if (enabled('skills')) skills.groups.forEach((g) => g.items.forEach((item) => expectText(`<li>${item}</li>`, 'skill')));
if (enabled('projects')) projects.projects.forEach((p) => expectText(p.name, 'project'));
if (enabled('education')) education.certifications.forEach((c) => expectText(c.name, 'certification'));

// Structured data must be valid JSON.
const jsonLd = raw.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
checked += 1;
try {
  const data = JSON.parse(jsonLd);
  if (data['@type'] !== 'Person') failures.push('JSON-LD @type is not Person');
} catch {
  failures.push('JSON-LD block is missing or not valid JSON');
}

if (failures.length > 0) {
  console.error(`FAIL: ${failures.length} rendering problem(s):`);
  failures.forEach((f) => console.error(`  - ${f}`));
  process.exit(1);
}

console.log(`PASS: ${checked} rendering check(s) — the built page matches the content files.`);
