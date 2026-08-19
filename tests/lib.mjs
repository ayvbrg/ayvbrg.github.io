import { readdirSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { parseHTML } from 'linkedom';

/** Build output roots produced by tests/build.mjs. */
export const distReal = new URL('../dist-test-real/', import.meta.url);
export const distTest = new URL('../dist-test/', import.meta.url);

export const read = (out, path) => readFileSync(new URL(path, out), 'utf8');
export const document = (out, path) => parseHTML(read(out, path)).document;
export const pages = (out) => readdirSync(out, { recursive: true }).filter((f) => f.endsWith('.html'));

/** The public fixture Entries, in the order the Log must list them. */
export const expected = [
  {
    slug: 'tie-alpha',
    title: 'Tie Alpha Fixture Entry',
    date: '2026-06-07',
    summary: 'Shares a publication date with Tie Beta; sorts first by slug.',
    tags: ['random'],
  },
  {
    slug: 'tie-beta',
    title: 'Tie Beta Fixture Entry',
    date: '2026-06-07',
    summary: 'Shares a publication date with Tie Alpha; sorts second by slug.',
    tags: ['random'],
  },
  {
    slug: 'second-entry',
    title: 'Second Fixture Entry',
    date: '2026-03-04',
    summary: 'The newer fixture Entry.',
    tags: ['experiment'],
  },
  {
    slug: 'mdx-entry',
    title: 'MDX Fixture Entry',
    date: '2026-02-03',
    summary: 'An MDX Entry, proving MDX renders through the same build.',
    tags: ['experiment'],
  },
  {
    slug: 'first-entry',
    title: 'First Fixture Entry',
    date: '2026-01-02',
    summary: 'The older fixture Entry.',
    tags: ['devlog', 'random'],
  },
];

/** The Entry links a page lists, in document order. */
export const entryLinks = (doc) =>
  [...doc.querySelectorAll('main a')]
    .map((a) => a.getAttribute('href'))
    .filter((href) => href.startsWith('/log/'));

/**
 * Run a production build with the given npm, output directory, and env overrides.
 * Builds share the project's `.astro` content store, so two running at once
 * clobber each other's collection: keep `--test-concurrency=1` on `npm test`.
 */
export const build = (npm, outDir, env) =>
  spawnSync(npm, ['run', 'build', '--', '--outDir', outDir], {
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
