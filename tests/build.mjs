// Produces the build output the test files read. Run by `npm test` before node --test.
import { rmSync } from 'node:fs';
import { build } from './lib.mjs';

const run = (label, outDir, env) => {
  rmSync(outDir, { recursive: true, force: true });
  const { status, stdout, stderr } = build('npm', outDir, { SITE_URL: 'https://example.test', ...env });
  if (status !== 0) {
    console.error(stdout, stderr, `\n${label} build failed; tests cannot run`);
    process.exit(1);
  }
};

// The shipped content set, exactly as production builds it.
run('real content', 'dist-test-real', {});
// The fixture set, isolated from real content by CONTENT_DIR.
run('fixture', 'dist-test', { CONTENT_DIR: 'tests/fixtures/entries' });
