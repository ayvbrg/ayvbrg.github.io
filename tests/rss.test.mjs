import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DOMParser } from 'linkedom';
// The validator from the parser @astrojs/rss builds the feed with;
// linkedom silently repairs malformed XML, so it cannot tell well-formed from
// injected. The cast drops the @deprecated hint the package ships on it.
import * as fxp from 'fast-xml-parser';
const { XMLValidator } = /** @type {any} */ (fxp);
import { build, distReal, distTest, document } from './lib.mjs';

// Deliberately not the origin tests/build.mjs bakes into every other build:
// with one origin in the suite, a hardcoded feed URL is indistinguishable from
// one derived from SITE_URL.
const SITE = 'https://feed.example';

// The XML-injection surface the pinned package version exists to protect.
const HOSTILE_TITLE = 'Ampersands & <angles> & "quotes" & \'apostrophes\'';
const HOSTILE_SUMMARY = 'Escape & < > " \' and this </description></item><item><title>forged';

// 21 bulk Entries so the 20-item cap has something to cut, plus the special cases.
const bulk = Array.from({ length: 21 }, (_, i) => {
  const n = String(i + 1).padStart(2, '0');
  return {
    slug: `bulk-${n}`,
    title: `Bulk Entry ${n}`,
    date: `2026-01-${n}`,
    summary: `Summary of bulk Entry ${n}.`,
    tags: ['devlog'],
  };
});

const fixtures = [
  { slug: 'escaped', title: HOSTILE_TITLE, date: '2026-04-02', summary: HOSTILE_SUMMARY, tags: ['devlog', 'random'] },
  // Revised well after publication: an item re-dated to its `updated` day would
  // sort first and carry the wrong pubDate.
  { slug: 'revised', title: 'Revised Entry', date: '2026-04-01', summary: 'A materially revised Entry.', tags: ['experiment'], updated: '2026-06-01' },
  { slug: 'draft-entry', title: 'Draft Entry', date: '2026-05-01', summary: 'Excluded because it is a draft.', tags: ['devlog'], draft: true },
  { slug: 'future-entry', title: 'Future Entry', date: '2099-01-01', summary: 'Excluded because it is future-dated.', tags: ['devlog'] },
  ...bulk,
];

/** The 20 the feed must carry, newest first: the cap drops bulk-01..bulk-03. */
const expected = [fixtures[0], fixtures[1], ...bulk.slice(3).reverse()];

const dir = mkdtempSync(join(tmpdir(), 'ayvbrg-rss-'));
const out = new URL('../dist-test-rss/', import.meta.url);
// Not after(): the build below runs at module load, so a failing build throws
// before any hook could fire.
process.on('exit', () => {
  for (const path of [dir, out]) rmSync(path, { recursive: true, force: true });
});

for (const { slug, updated, draft, ...data } of fixtures) {
  const front = Object.entries({ ...data, updated, draft })
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join('\n');
  writeFileSync(join(dir, `${slug}.md`), `---\n${front}\n---\n\nBody of the ${slug} fixture Entry.\n`);
}

const { status, stderr } = build('npm', 'dist-test-rss', { CONTENT_DIR: dir, SITE_URL: SITE });
assert.equal(status, 0, stderr);

const xml = readFileSync(new URL('rss.xml', out), 'utf8');
const feed = new DOMParser().parseFromString(xml, 'text/xml');
const channel = feed.querySelector('channel');
const items = [...feed.querySelectorAll('item')];
const names = (element) => [...element.children].map((child) => child.tagName);
const text = (element, selector) => element.querySelector(selector)?.textContent;
const utc = (day) => new Date(`${day}T00:00:00Z`).toUTCString();

test('every production build emits the feed at /rss.xml', () => {
  for (const dist of [distReal, distTest, out]) {
    assert.ok(existsSync(new URL('rss.xml', dist)), `${dist}: no feed emitted`);
  }
  // The FAQ's follow answer names the feed; now that it exists, it links to it.
  assert.ok(document(distReal, 'faq/index.html').querySelector('main a[href="/rss.xml"]'));
});

test('the feed is well-formed RSS 2.0', () => {
  assert.equal(XMLValidator.validate(xml), true, 'the feed is not well-formed XML');
  assert.equal(feed.documentElement.tagName, 'rss');
  assert.equal(feed.documentElement.getAttribute('version'), '2.0');
  assert.equal(feed.querySelectorAll('channel').length, 1);
});

test('channel metadata is exactly the contracted set', () => {
  assert.deepEqual(
    names(channel).filter((name) => name !== 'item'),
    ['title', 'description', 'link', 'language', 'atom:link'],
  );
  assert.equal(text(channel, 'title'), 'ayvbrg.log');
  assert.equal(
    text(channel, 'description'),
    "Ayushman Buragohain's log of dev work, experiments, side quests, and occasional thoughts.",
  );
  assert.equal(text(channel, 'link'), `${SITE}/`);
  assert.equal(text(channel, 'language'), 'en');
  const self = feed.getElementsByTagName('atom:link')[0];
  assert.equal(self.getAttribute('href'), `${SITE}/rss.xml`);
  assert.equal(self.getAttribute('rel'), 'self');
  assert.equal(self.getAttribute('type'), 'application/rss+xml');
});

test('drafts and future-dated Entries are absent from the feed', () => {
  for (const slug of ['draft-entry', 'future-entry']) {
    assert.doesNotMatch(xml, new RegExp(slug), `${slug} must not reach the feed`);
  }
  assert.doesNotMatch(xml, /Draft Entry|Future Entry/);
});

test('the feed carries the 20 newest public Entries, newest first', () => {
  assert.deepEqual(
    items.map((item) => text(item, 'link')),
    expected.map(({ slug }) => `${SITE}/log/${slug}/`),
  );
});

test('every item is summary-only, with no body and no content:encoded', () => {
  assert.doesNotMatch(xml, /content:encoded|Body of the/);
  for (const [i, item] of items.entries()) {
    assert.deepEqual(
      names(item),
      ['title', 'link', 'guid', 'description', 'pubDate', ...expected[i].tags.map(() => 'category')],
      `${expected[i].slug}: unexpected item fields`,
    );
    assert.equal(text(item, 'description'), expected[i].summary, `${expected[i].slug}: wrong summary`);
  }
});

test('every item carries its title, publication date, and Tags as categories', () => {
  for (const [i, item] of items.entries()) {
    const { slug, title, date, tags } = expected[i];
    assert.equal(text(item, 'title'), title, `${slug}: wrong title`);
    assert.equal(text(item, 'pubDate'), utc(date), `${slug}: wrong publication date`);
    assert.deepEqual(
      [...item.querySelectorAll('category')].map((c) => c.textContent),
      tags,
      `${slug}: wrong categories`,
    );
  }
});

test('every GUID is the canonical Entry URL, treated as a permalink', () => {
  for (const [i, item] of items.entries()) {
    const guid = item.querySelector('guid');
    assert.equal(guid.textContent, `${SITE}/log/${expected[i].slug}/`);
    assert.equal(guid.getAttribute('isPermaLink'), 'true');
  }
});

test('a materially revised Entry keeps its GUID and original publication date', () => {
  const revised = items.filter((item) => text(item, 'link') === `${SITE}/log/revised/`);
  assert.equal(revised.length, 1, 'a revision must never duplicate the item');
  assert.equal(revised[0].querySelector('guid').textContent, `${SITE}/log/revised/`);
  assert.equal(text(revised[0], 'pubDate'), utc('2026-04-01'), 'a revision must never re-date the item');
  assert.doesNotMatch(xml, new RegExp(utc('2026-06-01')), 'the Updated date must not reach the feed');
});

test('XML-special characters are escaped and round-trip intact', () => {
  assert.equal(items.length, 20, 'an injected item would show up here');
  const escaped = items[0];
  assert.equal(text(escaped, 'title'), HOSTILE_TITLE);
  assert.equal(text(escaped, 'description'), HOSTILE_SUMMARY);
});

// XMLValidator accepts C0 control characters that no conforming XML reader will,
// so the guard has to be the schema: a feed that cannot be parsed must never build.
test('an Entry carrying a control character fails the build', () => {
  const ctrlDir = mkdtempSync(join(tmpdir(), 'ayvbrg-rss-ctrl-'));
  const ctrlOut = new URL('../dist-test-rss-ctrl/', import.meta.url);
  const write = (slug, front) =>
    writeFileSync(join(ctrlDir, `${slug}.md`), `---\n${front}\ndate: 2026-01-01\ntags: [devlog]\n---\n\nBody.\n`);
  const built = () => build('npm', 'dist-test-rss-ctrl', { CONTENT_DIR: ctrlDir, SITE_URL: SITE }).status === 0;
  try {
    write('clean', 'title: "Fine"\nsummary: "Fine."');
    assert.equal(built(), true, 'the control-free Entry must build');
    for (const front of ['title: "Bell \\u0007"\nsummary: "Fine."', 'title: "Fine"\nsummary: "Bell \\u0007."', 'title: "Noncharacter \\ufffe"\nsummary: "Fine."', 'title: "Fine"\nsummary: "Noncharacter \\uffff."']) {
      write('bad', front);
      assert.equal(built(), false, `${front} must fail the build`);
      rmSync(join(ctrlDir, 'bad.md'));
    }
  } finally {
    for (const path of [ctrlDir, ctrlOut]) rmSync(path, { recursive: true, force: true });
  }
});
