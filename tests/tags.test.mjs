import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build, distTest, document, entryLinks, expected, pages } from './lib.mjs';

const TAGS = [...new Set(expected.flatMap((entry) => entry.tags))];

/** The public fixture Entries each Tag view must list, in the Log's order. */
const byTag = Object.fromEntries(
  TAGS.map((tag) => [tag, expected.filter((entry) => entry.tags.includes(tag))]),
);

const row = (doc, slug) => doc.querySelector(`main a[href="/log/${slug}/"]`)?.closest('li');

test('every Tag with public Entries is emitted at /tags/<tag>/', () => {
  const emitted = pages(distTest);
  for (const tag of TAGS) {
    assert.ok(emitted.includes(`tags/${tag}/index.html`), `${tag} must have a Tag view`);
  }
});

test('a Tag view names its Tag and lists exactly that Tag’s public Entries, newest first', () => {
  for (const [tag, rows] of Object.entries(byTag)) {
    const doc = document(distTest, `tags/${tag}/index.html`);
    assert.equal(doc.querySelector('main h1')?.textContent, tag, `${tag}: the page must name its Tag`);
    assert.deepEqual(
      entryLinks(doc),
      rows.map(({ slug }) => `/log/${slug}/`),
      `${tag}: wrong Entries or wrong order`,
    );
  }
});

// One row shape, not two: the same Entry must render byte-identically on both.
// This carries the row's fields too — log.test.mjs pins them on the Log side.
test('a Tag row is the same row shape as the Log row', () => {
  const log = document(distTest, 'log/index.html');
  for (const [tag, rows] of Object.entries(byTag)) {
    const doc = document(distTest, `tags/${tag}/index.html`);
    for (const { slug } of rows) {
      assert.equal(row(doc, slug).outerHTML, row(log, slug).outerHTML, `${tag}/${slug}: row differs from the Log`);
    }
  }
});

test('the Tag list on a row is named for assistive technology', () => {
  const list = row(document(distTest, 'log/index.html'), 'first-entry').querySelector('ul');
  assert.equal(list?.getAttribute('aria-label'), 'Tags');
});

test('the Tags on an Entry page link to their Tag view', () => {
  const doc = document(distTest, 'log/first-entry/index.html');
  for (const tag of ['devlog', 'random']) {
    assert.ok(doc.querySelector(`article a[href="/tags/${tag}/"]`), `${tag} must be linked from the Entry`);
  }
});

test('drafts and future-dated Entries are absent from Tag views', () => {
  // Both live under devlog, so the Tag they carry does have a Tag view.
  const doc = document(distTest, 'tags/devlog/index.html');
  assert.doesNotMatch(doc.querySelector('main').textContent, /Draft Fixture Entry/);
  assert.doesNotMatch(doc.querySelector('main').textContent, /Future Fixture Entry/);
  assert.deepEqual(entryLinks(doc), ['/log/first-entry/']);
});

// The fixture set gives every Tag a public Entry, so an empty Tag needs its own
// content set: one public Entry, one draft, one future, on three distinct Tags.
test('a Tag whose only Entries are unpublished gets no Tag view', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ayvbrg-empty-tag-'));
  const outDir = 'dist-test-empty-tag';
  const out = new URL(`../${outDir}/`, import.meta.url);
  try {
    const write = (slug, tag, date, extra = '') =>
      writeFileSync(
        join(dir, `${slug}.md`),
        `---\ntitle: ${slug}\ndate: ${date}\nsummary: Empty-Tag fixture Entry.\ntags: [${tag}]\n${extra}---\n\nBody.\n`,
      );
    write('published', 'devlog', '2026-01-02');
    write('drafted', 'experiment', '2026-01-02', 'draft: true\n');
    write('future', 'random', '2099-01-01');
    const { status, stderr } = build('npm', outDir, { CONTENT_DIR: dir, SITE_URL: 'https://example.test' });
    assert.equal(status, 0, stderr);
    assert.deepEqual(
      pages(out).filter((page) => page.startsWith('tags/')),
      ['tags/devlog/index.html'],
      'only a Tag with a public Entry may have a Tag view',
    );
  } finally {
    for (const path of [dir, out]) rmSync(path, { recursive: true, force: true });
  }
});
