// Periodic check (not part of the gate suite): verifies every external link
// in index.html actually resolves with a real network call. Run before ship
// and nightly via `npm run test:external-links` — allowed to be flaky/slow,
// unlike the gate tests.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');

const attrPattern = /(?:href)="(https?:\/\/[^"]+)"/g;
const urls = new Set();
let match;
while ((match = attrPattern.exec(html)) !== null) {
  urls.add(match[1]);
}

console.log(`Checking ${urls.size} external link(s)...`);

let failures = [];
for (const url of urls) {
  try {
    const res = await fetch(url, { method: 'GET', redirect: 'follow' });
    const status = res.status;
    const ok = status >= 200 && status < 400;
    console.log(`${ok ? 'OK  ' : 'FAIL'} ${status}  ${url}`);
    if (!ok) failures.push(`${url} -> HTTP ${status}`);
  } catch (err) {
    console.log(`FAIL ERR   ${url}`);
    failures.push(`${url} -> ${err.message}`);
  }
}

if (failures.length > 0) {
  console.error(`\n${failures.length} external link(s) failed:`);
  failures.forEach((f) => console.error(`  - ${f}`));
  process.exit(1);
}

console.log('\nAll external links resolved.');
