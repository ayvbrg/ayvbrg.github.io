import test from 'node:test';
import assert from 'node:assert/strict';
import { distReal, distTest, document, pages, read } from './lib.mjs';

const QUESTIONS = [
  'What do I work on?',
  'What do I write about here?',
  'Why is the site called ayvbrg.log?',
  'What am I curious about?',
  'How can I follow new Entries?',
  'How can I report an error or contact you?',
  'Do I revise older Entries?',
];

test('the FAQ emits the seven questions in order', () => {
  const doc = document(distReal, 'faq/index.html');
  const asked = [...doc.querySelectorAll('main h2')].map((h) => h.textContent.trim());
  assert.deepEqual(asked, QUESTIONS);
});

test('the FAQ answers every question it asks', () => {
  const doc = document(distReal, 'faq/index.html');
  for (const h2 of doc.querySelectorAll('main h2')) {
    assert.equal(h2.nextElementSibling?.tagName, 'P', `"${h2.textContent}" has no answer`);
    assert.ok(h2.nextElementSibling.textContent.trim().length > 40);
  }
});

test('the site-name answer uses ayvbrg and never the superseded yvbrg spelling', () => {
  const html = read(distReal, 'faq/index.html');
  assert.match(html, /ayvbrg is a compressed form of Ayushman Buragohain/);
  assert.doesNotMatch(html, /\byvbrg/i, 'the corrected spelling is ayvbrg, not yvbrg');
});

test('the FAQ names the contact email and the follow mechanism', () => {
  const text = document(distReal, 'faq/index.html').querySelector('main').textContent;
  assert.match(text, /aburagohain160@gmail\.com/);
  assert.match(text, /RSS/);
});

test('the FAQ stays durable: the current role is mentioned at most once', () => {
  const text = document(distReal, 'faq/index.html').querySelector('main').textContent;
  assert.ok((text.match(/Dashtoon/g) ?? []).length <= 1);
});

// compressHTML deletes a whitespace-only run at an element boundary, so a source
// line broken beside an inline <a> emits "onGitHub" or "GitHuband". Catch both
// boundaries on the raw HTML, where the tag is still there to anchor the match.
test('no inline link swallows the space beside it', () => {
  for (const out of [distReal, distTest]) {
    for (const page of pages(out)) {
      const html = read(out, page);
      assert.doesNotMatch(html, /\w<a[\s>]/, `${page}: missing space before an inline link`);
      assert.doesNotMatch(html, /<\/a>\w/, `${page}: missing space after an inline link`);
    }
  }
});

test('the not-found page is emitted at 404.html and links to the Landing and the Log', () => {
  assert.ok(pages(distReal).includes('404.html'));
  const hrefs = [...document(distReal, '404.html').querySelectorAll('main a')].map((a) =>
    a.getAttribute('href'),
  );
  assert.ok(hrefs.includes('/'), 'must link back to the Landing');
  assert.ok(hrefs.includes('/log/'), 'must link back to the Log');
});

test('the FAQ is reachable from the primary navigation on every emitted page', () => {
  for (const page of pages(distReal)) {
    const hrefs = [...document(distReal, page).querySelectorAll('nav a')].map((a) =>
      a.getAttribute('href'),
    );
    assert.ok(hrefs.includes('/faq/'), `${page}: primary navigation has no FAQ link`);
  }
});
