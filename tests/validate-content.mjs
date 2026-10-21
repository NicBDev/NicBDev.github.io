// Gate test: every content/<name>.json must match schemas/<name>.schema.json, plus a few
// cross-field rules JSON Schema can't express. Runs before the build so bad content fails fast
// with a readable message instead of a template error.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve, basename } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CONTENT_DIR = join(ROOT, 'content');
const SCHEMA_DIR = join(ROOT, 'schemas');

// verbose: errors carry the failing value and schema, used for friendlier messages below.
const ajv = new Ajv2020({ allErrors: true, verbose: true });
addFormats(ajv);

const failures = [];
const content = {};

const files = readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.json'));
if (files.length === 0) {
  console.error('FAIL: no content files found in content/');
  process.exit(1);
}

for (const file of files) {
  const name = basename(file, '.json');
  const schemaPath = join(SCHEMA_DIR, `${name}.schema.json`);
  if (!existsSync(schemaPath)) {
    failures.push(`${file}: no matching schema at schemas/${name}.schema.json`);
    continue;
  }

  let data;
  try {
    data = JSON.parse(readFileSync(join(CONTENT_DIR, file), 'utf8'));
  } catch (err) {
    failures.push(`${file}: invalid JSON — ${err.message}`);
    continue;
  }

  const validate = ajv.compile(JSON.parse(readFileSync(schemaPath, 'utf8')));
  if (!validate(data)) {
    for (const e of validate.errors) {
      const where = e.instancePath || '(top level)';
      failures.push(`${file} ${where}: ${describe(e)}`);
    }
    continue;
  }
  content[name] = data;
}

// Turn an ajv error into a message a person editing the JSON can act on.
function describe(error) {
  const got = JSON.stringify(error.data);
  if (error.keyword === 'pattern' || error.keyword === 'format') {
    const hint = error.parentSchema?.description ?? error.message;
    return `${hint} (got ${got})`;
  }
  if (error.keyword === 'enum') return `must be one of ${error.params.allowedValues.join(', ')} (got ${got})`;
  if (error.keyword === 'additionalProperties') return `unknown field "${error.params.additionalProperty}" — check for a typo`;
  return error.message;
}

// Cross-field rules
function check(condition, message) {
  if (!condition) failures.push(message);
}

if (content.site) {
  const ids = content.site.sections.map((s) => s.id);
  check(new Set(ids).size === ids.length, 'site.json /sections: each section id may appear only once');
}

if (content.profile) {
  const linkIds = content.profile.links.map((l) => l.id);
  check(new Set(linkIds).size === linkIds.length, 'profile.json /links: each link id must be unique');
  content.profile.contact.links.forEach((item, i) => {
    check(
      linkIds.includes(item.linkId),
      `profile.json /contact/links/${i}: linkId "${item.linkId}" does not match any id in /links (${linkIds.join(', ')})`,
    );
  });
}

if (content.experience) {
  content.experience.employers.forEach((employer, e) => {
    employer.roles.forEach((role, r) => {
      if (role.end !== null) {
        check(
          role.end >= role.start,
          `experience.json /employers/${e}/roles/${r}: end (${role.end}) is before start (${role.start})`,
        );
      }
    });
  });
}

if (failures.length > 0) {
  console.error(`FAIL: ${failures.length} content problem(s):`);
  failures.forEach((f) => console.error(`  - ${f}`));
  process.exit(1);
}

console.log(`PASS: ${files.length} content file(s) match their schemas.`);
