// Gate test: this site must never leak a personal email address or phone number.
// Regression test for an explicit decision: the public site shows LinkedIn/GitHub only,
// no direct contact info. See conversation history / commit for context.
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve, extname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const EMAIL_PATTERN = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const PHONE_PATTERN = /(\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4})/;

// Content lives in JSON and templates in .njk, so both are scanned too.
const CHECK_EXTENSIONS = new Set(['.html', '.js', '.css', '.md', '.json', '.njk']);
// _site (the built, published output) is deliberately scanned: it is exactly what goes public.
const SKIP_DIRS = new Set(['node_modules', '.git']);
// npm-generated and never published; it contains package maintainers' emails.
const SKIP_FILES = new Set(['package-lock.json']);

function collectFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name) || SKIP_FILES.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectFiles(full));
    } else if (CHECK_EXTENSIONS.has(extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

let failures = [];
for (const file of collectFiles(ROOT)) {
  const content = readFileSync(file, 'utf8');
  const emailMatch = content.match(EMAIL_PATTERN);
  if (emailMatch) {
    failures.push(`${file}: found email-like string "${emailMatch[0]}"`);
  }
  const phoneMatch = content.match(PHONE_PATTERN);
  if (phoneMatch) {
    failures.push(`${file}: found phone-like string "${phoneMatch[0]}"`);
  }
}

if (failures.length > 0) {
  console.error(`FAIL: privacy guard tripped — public contact info leaked into the site:`);
  failures.forEach((f) => console.error(`  - ${f}`));
  process.exit(1);
}

console.log('PASS: no email or phone number found in site source.');
