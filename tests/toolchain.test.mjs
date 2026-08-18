import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { build } from './lib.mjs';

// Only node/npm and the system binaries — deliberately no mise.
const nodeBin = dirname(process.execPath);
const PATH = `${nodeBin}:/usr/bin:/bin`;

test('the production build runs as a plain npm script without mise on PATH', () => {
  const mise = spawnSync('/bin/sh', ['-c', 'command -v mise'], { env: { PATH } });
  assert.notEqual(mise.status, 0, 'mise must be unreachable for this test to mean anything');

  const { status, stderr } = build(join(nodeBin, 'npm'), 'dist-test-nomise', {
    PATH,
    CONTENT_DIR: 'tests/fixtures/entries',
    SITE_URL: 'https://example.test',
  });
  assert.equal(status, 0, stderr);
});
