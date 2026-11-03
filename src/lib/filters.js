// Pure helpers used by the templates. No Eleventy imports, so they can be unit-tested
// directly (see tests/filters.test.mjs).

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "2025-07" -> "Jul 2025"; null -> "Present"
export function formatMonth(value) {
  if (value === null || value === undefined) return 'Present';
  const [year, month] = String(value).split('-').map(Number);
  if (!year || !month || month < 1 || month > 12) {
    throw new Error(`formatMonth: expected "YYYY-MM", got "${value}"`);
  }
  return `${MONTHS[month - 1]} ${year}`;
}

// ("2025-02", "2025-06") -> "Feb 2025 — Jun 2025"
export function dateRange(start, end) {
  return `${formatMonth(start)} — ${formatMonth(end)}`;
}

// Earliest start and latest end across an employer's roles. Any open-ended role makes it "Present".
export function employerSpan(roles) {
  const starts = roles.map((r) => r.start).sort();
  const ends = roles.map((r) => r.end);
  const end = ends.includes(null) ? null : ends.slice().sort().at(-1);
  return { start: starts[0], end };
}

// "1 role" / "3 roles"
export function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

// Returns a new array sorted by `year`, newest first. Ties keep their original order.
export function sortByYearDesc(items) {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => b.item.year - a.item.year || a.index - b.index)
    .map(({ item }) => item);
}

// Sections with their own background treatment that sit outside the alternating rhythm.
const FIXED_BACKGROUND = new Set(['hero', 'contact']);

// Enabled sections in config order, each tagged with `alt` so backgrounds alternate
// regardless of which sections are hidden or reordered.
export function enabledSections(sections) {
  let position = 0;
  return sections
    .filter((s) => s.enabled)
    .map((s) => {
      if (FIXED_BACKGROUND.has(s.id)) return { ...s, alt: false };
      position += 1;
      return { ...s, alt: position % 2 === 0 };
    });
}

export function navSections(sections) {
  return enabledSections(sections).filter((s) => s.nav);
}

export function findLink(links, id) {
  const link = links.find((l) => l.id === id);
  if (!link) throw new Error(`findLink: no link with id "${id}" in profile.links`);
  return link;
}

// schema.org Person structured data, built from the content files.
// Deliberately contains no email or phone (see tests/test-privacy.mjs).
export function personJsonLd({ site, profile, education, skills }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    jobTitle: profile.jobTitle,
    url: site.url,
    worksFor: { '@type': 'Organization', name: profile.company },
    address: { '@type': 'PostalAddress', addressLocality: profile.location },
    sameAs: profile.links.filter((l) => l.id !== 'resume').map((l) => l.url),
    alumniOf: education.degrees.map((d) => ({ '@type': 'CollegeOrUniversity', name: d.school })),
    knowsAbout: skills.groups.flatMap((g) => g.items),
  };
  // Escape "<" so content can never close the surrounding <script> tag.
  return JSON.stringify(data, null, 2).replace(/</g, '\\u003c');
}

// Sections that get a card in the button grid, in config order.
export function tileSections(sections) {
  return enabledSections(sections).filter((s) => s.tile);
}

// One-line card subtitle. A `description` in site.json always wins; otherwise it's
// calculated from the content so it never goes stale. Unknown sections get "".
export function sectionSummary(section, data) {
  if (section.description) return section.description;
  const { experience, skills, projects, education, profile } = data;
  switch (section.id) {
    case 'experience': {
      const employers = experience.employers;
      const roles = employers.reduce((n, e) => n + e.roles.length, 0);
      return employers.length === 1
        ? `${pluralize(roles, 'role')} at ${employers[0].name}`
        : `${pluralize(roles, 'role')} across ${pluralize(employers.length, 'employer')}`;
    }
    case 'skills': {
      const items = skills.groups.reduce((n, g) => n + g.items.length, 0);
      return `${pluralize(skills.groups.length, 'group')} · ${pluralize(items, 'skill')}`;
    }
    case 'projects':
      return pluralize(projects.projects.length, 'project');
    case 'education': {
      const parts = education.degrees.map((d) => d.name);
      if (education.certifications.length) parts.push(pluralize(education.certifications.length, 'certification'));
      return parts.join(' · ');
    }
    case 'contact':
      return profile.contact.links.map((item) => findLink(profile.links, item.linkId).label).join(' · ');
    default:
      return '';
  }
}

// Attach each item's previous and next neighbour ({ id, label } or null), for prev/next links.
export function withNeighbors(items) {
  const brief = (item) => (item ? { id: item.id, label: item.label } : null);
  return items.map((item, i) => ({ ...item, prev: brief(items[i - 1]), next: brief(items[i + 1]) }));
}

// URL of a section's own page, e.g. "experience" -> "/experience/".
export function sectionUrl(id) {
  return `/${id}/`;
}

// Absolute URL for canonical/og:url, e.g. ("/experience/", "https://x.dev/") -> "https://x.dev/experience/".
export function absoluteUrl(path, base) {
  return new URL(path, base).href;
}
