import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build, distReal, distTest, document, pages, read } from './lib.mjs';

/** The public fixture Entries, in the order the Log must list them. */
const expected = [
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

const logIndex = () => document(distTest, 'log/index.html');
const entryLinks = (doc) =>
  [...doc.querySelectorAll('main a')]
    .map((a) => a.getAttribute('href'))
    .filter((href) => href.startsWith('/log/'));

test('every public fixture Entry is emitted at /log/<slug>/', () => {
  const emitted = pages(distTest);
  for (const { slug } of expected) {
    assert.ok(emitted.includes(`log/${slug}/index.html`), `${slug} must be emitted`);
  }
  assert.ok(!emitted.includes('log/draft-entry/index.html'), 'draft Entry must not be emitted');
  assert.ok(!emitted.includes('log/future-entry/index.html'), 'future Entry must not be emitted');
});

test('a Markdown Entry renders its title and body', () => {
  const doc = document(distTest, 'log/first-entry/index.html');
  assert.equal(doc.querySelector('h1').textContent, 'First Fixture Entry');
  assert.match(doc.querySelector('article').textContent, /Body of the first fixture Entry/);
});

test('an MDX Entry renders its title and body', () => {
  const doc = document(distTest, 'log/mdx-entry/index.html');
  assert.equal(doc.querySelector('h1').textContent, 'MDX Fixture Entry');
  assert.match(doc.querySelector('article').textContent, /Body of the MDX fixture Entry/);
});

test('the Log lists public Entries newest first', () => {
  assert.deepEqual(
    entryLinks(logIndex()),
    expected.map(({ slug }) => `/log/${slug}/`),
  );
});

test('drafts and future-dated Entries are absent from the Log', () => {
  const text = logIndex().querySelector('main').textContent;
  assert.doesNotMatch(text, /Draft Fixture Entry/);
  assert.doesNotMatch(text, /Future Fixture Entry/);
});

test('every Log row carries title, publication date, summary, and linked Tags', () => {
  const doc = logIndex();
  for (const { slug, title, date, summary, tags } of expected) {
    const row = doc.querySelector(`main a[href="/log/${slug}/"]`).closest('li');
    assert.match(row.textContent, new RegExp(title), `${slug}: missing title`);
    const time = row.querySelector('time');
    assert.equal(time?.getAttribute('datetime'), date, `${slug}: missing publication date`);
    assert.ok(row.textContent.includes(summary), `${slug}: missing summary`);
    assert.deepEqual(
      [...row.querySelectorAll('a')]
        .map((a) => a.getAttribute('href'))
        .filter((href) => href.startsWith('/tags/')),
      tags.map((tag) => `/tags/${tag}/`),
      `${slug}: missing linked Tags`,
    );
  }
});

test('an Entry orders back-link, title, date, Updated, Tags, body, then the close', () => {
  const article = document(distTest, 'log/second-entry/index.html').querySelector('article');
  const text = article.textContent;
  const marks = [
    ['back-link', text.indexOf('Back to the Log')],
    ['title', text.indexOf('Second Fixture Entry')],
    ['publication date', text.indexOf('2026-03-04')],
    ['Updated date', text.indexOf('2026-04-05')],
    ['Tags', text.indexOf('experiment')],
    ['body', text.indexOf('Body of the second fixture Entry')],
    ['close', text.lastIndexOf('Back to the Log')],
  ];
  for (const [label, at] of marks) assert.notEqual(at, -1, `${label} is missing`);
  for (let i = 1; i < marks.length; i++) {
    assert.ok(
      marks[i][1] > marks[i - 1][1],
      `${marks[i][0]} must come after ${marks[i - 1][0]}`,
    );
  }
});

test('the Updated date is rendered only when a material revision set it', () => {
  const revised = document(distTest, 'log/second-entry/index.html').querySelector('article');
  assert.deepEqual(
    [...revised.querySelectorAll('time')].map((t) => t.getAttribute('datetime')),
    ['2026-03-04', '2026-04-05'],
  );
  assert.match(revised.textContent, /Updated/);

  const plain = document(distTest, 'log/first-entry/index.html').querySelector('article');
  assert.deepEqual(
    [...plain.querySelectorAll('time')].map((t) => t.getAttribute('datetime')),
    ['2026-01-02'],
  );
  assert.doesNotMatch(plain.textContent, /Updated/);
});

test('an Entry closes with an error-report email, RSS, and a way back to the Log', () => {
  const article = document(distTest, 'log/second-entry/index.html').querySelector('article');
  const body = article.textContent.indexOf('Body of the second fixture Entry');
  const after = (selector) => {
    const link = article.querySelector(selector);
    assert.ok(link, `${selector} is missing from the close`);
    assert.ok(
      article.textContent.indexOf(link.textContent) > body,
      `${selector} must come after the body`,
    );
    return link;
  };
  assert.equal(
    after('a[href^="mailto:"]').getAttribute('href'),
    'mailto:aburagohain160@gmail.com',
  );
  after('a[href="/rss.xml"]');
  assert.ok(
    [...article.querySelectorAll('a[href="/log/"]')].length >= 2,
    'the close must link back to the Log',
  );
});

test('the summary is not repeated on the Entry page', () => {
  for (const { slug, summary } of expected) {
    const article = document(distTest, `log/${slug}/index.html`).querySelector('article');
    assert.ok(!article.textContent.includes(summary), `${slug}: summary must not appear on the Entry`);
  }
});

test('an Entry page carries no reading time, author bio, share buttons, or previous/next links', () => {
  for (const { slug } of expected) {
    const page = `log/${slug}/index.html`;
    assert.doesNotMatch(
      read(distTest, page),
      /min read|reading time|share|author bio|\bbio\b|previous entry|next entry|related entr/i,
      `${slug}: unwanted Entry furniture`,
    );
    assert.equal(
      document(distTest, page).querySelectorAll('a[rel~="prev"], a[rel~="next"]').length,
      0,
      `${slug}: no previous/next links`,
    );
  }
});

// The blocker this pins: publication dates are calendar days, so an eligibility
// rule read in the build machine's local zone emits a different site per machine.
// "Today" cannot be a static date, so the boundary Entries are written here.
test('the Entry routes a build emits do not depend on its timezone', () => {
  const utcDay = (offset = 0) =>
    new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
  const startedOn = utcDay();
  const dir = mkdtempSync(join(tmpdir(), 'ayvbrg-boundary-'));
  const outs = [];
  try {
    for (const [slug, date] of [
      ['today', utcDay(0)],
      ['tomorrow', utcDay(1)],
    ]) {
      writeFileSync(
        join(dir, `${slug}.md`),
        `---\ntitle: Boundary ${slug}\ndate: ${date}\nsummary: Boundary fixture Entry.\ntags: [devlog]\n---\n\nBody of the boundary fixture Entry.\n`,
      );
    }
    // Poles either side of UTC: Kiritimati (UTC+14) runs a day ahead of the UTC
    // day once the UTC hour reaches 10, Niue (UTC-11) a day behind it before 11,
    // so at every hour at least one pole disagrees with a local-day rule.
    const emitted = [];
    for (const TZ of ['Pacific/Niue', 'Pacific/Kiritimati']) {
      const outDir = `dist-test-tz-${TZ.split('/').pop()}`;
      outs.push(new URL(`../${outDir}/`, import.meta.url));
      const { status, stderr } = build('npm', outDir, {
        TZ,
        CONTENT_DIR: dir,
        SITE_URL: 'https://example.test',
      });
      assert.equal(status, 0, stderr);
      emitted.push([
        TZ,
        pages(outs.at(-1)).filter((page) => page.startsWith('log/') && page !== 'log/index.html'),
      ]);
    }
    // Crossing UTC midnight mid-test would date the fixtures against one day and
    // build them against the next, so skip rather than fail on a stale premise.
    if (utcDay() !== startedOn) return;
    for (const [TZ, routes] of emitted) {
      assert.deepEqual(routes, ['log/today/index.html'], `TZ=${TZ} emitted a different Log`);
    }
  } finally {
    for (const out of [dir, ...outs]) rmSync(out, { recursive: true, force: true });
  }
});

test('the real content build lists at least one Entry in the Log', () => {
  assert.ok(entryLinks(document(distReal, 'log/index.html')).length > 0);
});

// Observes the hrefs the templates write and the directory build format: every
// internal link must be in canonical trailing-slash form and land on a page that
// was actually emitted. A dead or slash-less link on any page fails here.
// The feed is a file route, not a page, and ticket #17 emits it; it is exempt.
test('every internal link resolves to an emitted page with a trailing slash', () => {
  for (const out of [distReal, distTest]) {
    for (const page of pages(out)) {
      const hrefs = [...document(out, page).querySelectorAll('a')]
        .map((a) => a.getAttribute('href'))
        .filter((href) => href.startsWith('/') && href !== '/rss.xml');
      for (const href of hrefs) {
        assert.match(href, /\/$/, `${page}: ${href} must end in a trailing slash`);
        assert.ok(existsSync(new URL(`.${href}index.html`, out)), `${page}: ${href} has no emitted page`);
      }
    }
  }
});
