// Unit tests for the pure template helpers in src/lib/filters.js. Run with `npm run test:unit`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatMonth,
  dateRange,
  employerSpan,
  pluralize,
  sortByYearDesc,
  enabledSections,
  navSections,
  findLink,
  personJsonLd,
} from '../src/lib/filters.js';

test('formatMonth formats YYYY-MM and treats null as Present', () => {
  assert.equal(formatMonth('2025-07'), 'Jul 2025');
  assert.equal(formatMonth('2012-12'), 'Dec 2012');
  assert.equal(formatMonth(null), 'Present');
  assert.throws(() => formatMonth('2025-13'), /YYYY-MM/);
  assert.throws(() => formatMonth('July 2025'), /YYYY-MM/);
});

test('dateRange joins two months with an em dash', () => {
  assert.equal(dateRange('2025-02', '2025-06'), 'Feb 2025 — Jun 2025');
  assert.equal(dateRange('2025-07', null), 'Jul 2025 — Present');
});

test('employerSpan uses the earliest start and the latest end', () => {
  const roles = [
    { start: '2025-02', end: '2025-06' },
    { start: '2012-06', end: '2025-02' },
  ];
  assert.deepEqual(employerSpan(roles), { start: '2012-06', end: '2025-06' });
});

test('employerSpan is open-ended if any role is current', () => {
  const roles = [
    { start: '2025-07', end: null },
    { start: '2012-06', end: '2025-02' },
  ];
  assert.deepEqual(employerSpan(roles), { start: '2012-06', end: null });
});

test('pluralize', () => {
  assert.equal(pluralize(1, 'role'), '1 role');
  assert.equal(pluralize(3, 'role'), '3 roles');
});

test('sortByYearDesc sorts newest first, keeps ties stable, and does not mutate', () => {
  const certs = [
    { name: 'a', year: 2024 },
    { name: 'b', year: 2026 },
    { name: 'c', year: 2025 },
    { name: 'd', year: 2026 },
  ];
  const original = structuredClone(certs);
  assert.deepEqual(sortByYearDesc(certs).map((c) => c.name), ['b', 'd', 'c', 'a']);
  assert.deepEqual(certs, original);
});

const sections = [
  { id: 'hero', enabled: true, nav: false },
  { id: 'about', enabled: true, nav: true },
  { id: 'experience', enabled: true, nav: true },
  { id: 'skills', enabled: false, nav: true },
  { id: 'projects', enabled: true, nav: true },
  { id: 'contact', enabled: true, nav: true },
];

test('enabledSections drops disabled sections and alternates backgrounds around them', () => {
  const result = enabledSections(sections);
  assert.deepEqual(result.map((s) => s.id), ['hero', 'about', 'experience', 'projects', 'contact']);
  assert.deepEqual(result.map((s) => s.alt), [false, false, true, false, false]);
});

test('navSections keeps only enabled sections flagged for the nav, in order', () => {
  assert.deepEqual(navSections(sections).map((s) => s.id), ['about', 'experience', 'projects', 'contact']);
});

test('findLink returns the matching link or throws a helpful error', () => {
  const links = [{ id: 'github', url: 'https://github.com/x' }];
  assert.equal(findLink(links, 'github').url, 'https://github.com/x');
  assert.throws(() => findLink(links, 'twitter'), /no link with id "twitter"/);
});

test('personJsonLd builds a schema.org Person and escapes "<"', () => {
  const json = personJsonLd({
    site: { url: 'https://example.test/' },
    profile: {
      name: 'Test </script> Person',
      jobTitle: 'Engineer',
      company: 'Acme',
      location: 'Somewhere',
      links: [
        { id: 'github', url: 'https://github.com/x' },
        { id: 'resume', url: 'https://docs.example.test/r' },
      ],
    },
    education: { degrees: [{ school: 'State U' }] },
    skills: { groups: [{ items: ['A', 'B'] }, { items: ['C'] }] },
  });
  assert.ok(!json.includes('</script>'));
  const data = JSON.parse(json);
  assert.equal(data['@type'], 'Person');
  assert.equal(data.name, 'Test </script> Person');
  assert.deepEqual(data.sameAs, ['https://github.com/x']);
  assert.deepEqual(data.knowsAbout, ['A', 'B', 'C']);
  assert.equal(data.alumniOf[0].name, 'State U');
});
