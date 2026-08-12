// Gate test: every local href/src referenced in index.html must resolve to a real file.
// Deterministic, no network calls — keeps this test free and fast (<2s).
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');

const attrPattern = /(?:href|src)="([^"]+)"/g;
const isLocal = (url) =>
  url &&
  !url.startsWith('http://') &&
  !url.startsWith('https://') &&
  !url.startsWith('mailto:') &&
  !url.startsWith('tel:') &&
  !url.startsWith('data:') &&
  !url.startsWith('#');

let checked = 0;
let failures = [];
let match;
while ((match = attrPattern.exec(html)) !== null) {
  const url = match[1];
  if (!isLocal(url)) continue;
  checked += 1;
  const cleanPath = url.split('#')[0].split('?')[0];
  const filePath = join(ROOT, cleanPath);
  if (!existsSync(filePath)) {
    failures.push(`${url} -> ${filePath}`);
  }
}

if (checked === 0) {
  console.error('FAIL: no local links were found to check — pattern may be broken');
  process.exit(1);
}

if (failures.length > 0) {
  console.error(`FAIL: ${failures.length} local link(s) point to missing files:`);
  failures.forEach((f) => console.error(`  - ${f}`));
  process.exit(1);
}

console.log(`PASS: ${checked} local link(s) resolve to real files.`);
