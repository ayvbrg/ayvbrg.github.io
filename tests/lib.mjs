import { readdirSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { parseHTML } from 'linkedom';

/** Build output roots produced by tests/build.mjs. */
export const distReal = new URL('../dist-test-real/', import.meta.url);
export const distTest = new URL('../dist-test/', import.meta.url);

export const read = (out, path) => readFileSync(new URL(path, out), 'utf8');
export const document = (out, path) => parseHTML(read(out, path)).document;
export const pages = (out) => readdirSync(out, { recursive: true }).filter((f) => f.endsWith('.html'));

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
