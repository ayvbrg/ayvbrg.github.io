import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();

async function waitForFile(path, timeoutMs = 60_000) {
  const start = Date.now();
  while (!existsSync(path)) {
    if (Date.now() - start > timeoutMs) {
      throw new Error(`Timed out waiting for file: ${path}`);
    }
    // Keep it simple and dependency-free: polling is fine for this test.
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

function assertStringsInOrder(html, strings) {
  let cursor = 0;
  for (const s of strings) {
    const idx = html.indexOf(s, cursor);
    assert.ok(idx !== -1, `Missing string: ${s}`);
    cursor = idx + s.length;
  }
}

function countOccurrences(haystack, needle) {
  return haystack.split(needle).length - 1;
}

test("production build emits /faq and /404", async () => {
  const faqPath = join(repoRoot, "dist/faq/index.html");
  const notFoundPath = join(repoRoot, "dist/404.html");

  await waitForFile(faqPath);
  await waitForFile(notFoundPath);

  assert.equal(existsSync(faqPath), true);
  assert.equal(existsSync(notFoundPath), true);
});

test("/faq renders the FAQ question set in order", async () => {
  const faqPath = join(repoRoot, "dist/faq/index.html");
  await waitForFile(faqPath);

  const faqHtml = readFileSync(faqPath, "utf8");

  const questions = [
    "What do I work on?",
    "What do I write about here?",
    "Why is the site called ayvbrg.log?",
    "What am I curious about?",
    "How can I follow new Entries?",
    "How can I report an error or contact you?",
    "Do I revise older Entries?",
  ];
  assertStringsInOrder(faqHtml, questions);

  assert.equal(faqHtml.includes("ayvbrg"), true);
  // Avoid matching `yvbrg` as a substring of the correct `ayvbrg`.
  assert.equal(/(^|[^a])yvbrg/.test(faqHtml), false);
  assert.equal(
    countOccurrences(faqHtml, "Research Engineer at Dashtoon"),
    1,
  );
});

test("/404 links back to Landing and Log", async () => {
  const notFoundPath = join(repoRoot, "dist/404.html");
  await waitForFile(notFoundPath);

  const notFoundHtml = readFileSync(notFoundPath, "utf8");
  assert.match(notFoundHtml, /href="\/"/);
  assert.match(notFoundHtml, /href="\/log\//);
});

