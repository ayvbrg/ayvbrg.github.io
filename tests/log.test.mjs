import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { distReal, distTest, document, pages } from './lib.mjs';

test('every public fixture Entry is emitted at /log/<slug>/', () => {
  const emitted = pages(distTest);
  assert.ok(emitted.includes('log/first-entry/index.html'));
  assert.ok(emitted.includes('log/second-entry/index.html'));
  assert.ok(emitted.includes('log/mdx-entry/index.html'));
  assert.ok(!emitted.includes('log/draft-entry/index.html'), 'draft Entry must not be emitted');
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

test('the Log lists public Entries newest first and omits drafts', () => {
  const hrefs = [...document(distTest, 'log/index.html').querySelectorAll('main a')].map((a) =>
    a.getAttribute('href'),
  );
  assert.deepEqual(hrefs, ['/log/second-entry/', '/log/mdx-entry/', '/log/first-entry/']);
});

test('the real content build lists at least one Entry in the Log', () => {
  const hrefs = [...document(distReal, 'log/index.html').querySelectorAll('main a')].map((a) =>
    a.getAttribute('href'),
  );
  assert.ok(hrefs.some((href) => href.startsWith('/log/')));
});

// Observes the hrefs the templates write and the directory build format: every
// internal link must be in canonical trailing-slash form and land on a page that
// was actually emitted. A dead or slash-less link on any page fails here.
test('every internal link resolves to an emitted page with a trailing slash', () => {
  for (const out of [distReal, distTest]) {
    for (const page of pages(out)) {
      const hrefs = [...document(out, page).querySelectorAll('a')]
        .map((a) => a.getAttribute('href'))
        .filter((href) => href.startsWith('/'));
      for (const href of hrefs) {
        assert.match(href, /\/$/, `${page}: ${href} must end in a trailing slash`);
        assert.ok(existsSync(new URL(`.${href}index.html`, out)), `${page}: ${href} has no emitted page`);
      }
    }
  }
});
