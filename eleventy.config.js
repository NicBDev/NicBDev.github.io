import { readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import * as filters from './src/lib/filters.js';

const CONTENT_DIR = 'content';

function readContent(file) {
  const { $schema, ...data } = JSON.parse(readFileSync(join(CONTENT_DIR, file), 'utf8'));
  return data;
}

export default function (eleventyConfig) {
  // Each content/<name>.json becomes a global template variable called <name>.
  for (const file of readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.json'))) {
    eleventyConfig.addGlobalData(basename(file, '.json'), () => readContent(file));
  }
  // One entry per section that gets its own page (src/section-page.njk paginates over this).
  // Backgrounds don't alternate on a single-section page, so alt is always off.
  eleventyConfig.addGlobalData('sectionPages', () =>
    filters
      .withNeighbors(filters.tileSections(readContent('site.json').sections))
      .map((section) => ({ ...section, alt: false })),
  );
  eleventyConfig.addWatchTarget(CONTENT_DIR);

  eleventyConfig.addFilter('formatMonth', filters.formatMonth);
  eleventyConfig.addFilter('dateRange', filters.dateRange);
  eleventyConfig.addFilter('employerSpan', filters.employerSpan);
  eleventyConfig.addFilter('pluralize', filters.pluralize);
  eleventyConfig.addFilter('sortByYearDesc', filters.sortByYearDesc);
  eleventyConfig.addFilter('enabledSections', filters.enabledSections);
  eleventyConfig.addFilter('navSections', filters.navSections);
  eleventyConfig.addFilter('tileSections', filters.tileSections);
  eleventyConfig.addFilter('sectionSummary', filters.sectionSummary);
  eleventyConfig.addFilter('sectionUrl', filters.sectionUrl);
  eleventyConfig.addFilter('absoluteUrl', filters.absoluteUrl);
  eleventyConfig.addFilter('findLink', filters.findLink);
  eleventyConfig.addFilter('personJsonLd', filters.personJsonLd);

  eleventyConfig.addPassthroughCopy({ 'src/styles.css': 'styles.css', 'src/script.js': 'script.js' });

  return {
    dir: { input: 'src', includes: '_includes', output: '_site' },
    templateFormats: ['njk'],
    htmlTemplateEngine: 'njk',
  };
}
