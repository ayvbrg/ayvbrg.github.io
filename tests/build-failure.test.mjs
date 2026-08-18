import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from './lib.mjs';

test('a malformed Entry fails the build', () => {
  const { status } = build('npm', 'dist-test-broken', {
    CONTENT_DIR: 'tests/fixtures/broken',
    SITE_URL: 'https://example.test',
  });
  assert.notEqual(status, 0);
});

test('a production build without SITE_URL fails and says so', () => {
  const { status, stderr } = build('npm', 'dist-test-nosite', {
    CONTENT_DIR: 'tests/fixtures/entries',
    SITE_URL: undefined,
  });
  assert.notEqual(status, 0);
  assert.match(stderr, /SITE_URL/);
});
