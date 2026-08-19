import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, cpSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";

const nodeMajor = Number.parseInt(process.versions.node.split(".")[0], 10);
if (nodeMajor !== 24) {
  throw new Error(
    `Node 24 required for tests. Current runtime is v${process.versions.node}. Run "mise install" then "mise exec -- npm test".`,
  );
}

const repoRoot = process.cwd();
const fixtureEntriesDir = join(repoRoot, "tests/fixtures/entries");

function runBuild(extraEnv = {}) {
  return spawnSync("npm", ["run", "build"], {
    cwd: repoRoot,
    env: { ...process.env, ...extraEnv },
    encoding: "utf8",
  });
}

function readDistHtml(pathInsideDist) {
  return readFileSync(join(repoRoot, "dist", pathInsideDist), "utf8");
}

test("Log routes: index order, entry shape, exclusions (UTC)", () => {
  const tmpContent = mkdtempSync(join(tmpdir(), "issue-14-log-routes-"));
  cpSync(fixtureEntriesDir, tmpContent, { recursive: true });

  const result = runBuild({
    SITE_URL: "https://example.test",
    CONTENT_DIR: tmpContent,
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const indexHtml = readDistHtml("log/index.html");
  const entryHtml = readDistHtml("log/entry-updated/index.html");

  // Eligibility rule we want to prove: use UTC calendar dates, newest first by pubDate,
  // and for equal pubDates sort by slug (entry.id) ascending.
  const expectedPublicSlugsInOrder = [
    "a-yesterday-devlog",
    "tie-alpha",
    "tie-beta",
    "entry-updated",
    "entry-lastweek-experiment",
  ];

  const positions = expectedPublicSlugsInOrder.map((slug) =>
    indexHtml.indexOf(`data-entry-id="${slug}"`),
  );

  for (const pos of positions) {
    assert.notEqual(pos, -1, "expected slug present in /log index");
  }
  for (let i = 1; i < positions.length; i++) {
    assert.ok(
      positions[i - 1] < positions[i],
      `expected ${expectedPublicSlugsInOrder[i - 1]} before ${expectedPublicSlugsInOrder[i]}`,
    );
  }

  // Row shape: date, reading time, title, summary. Tags live on the entry
  // and /tags/<tag>, not in listing rows.
  assert.match(indexHtml, /data-pub-date="2026-08-18"/);
  assert.match(indexHtml, /Fixture summary for yesterday devlog rows\./);
  assert.match(indexHtml, /min read/);

  const entryListStart = indexHtml.indexOf('id="entry-list"');
  const noscriptStart = indexHtml.indexOf("<noscript>");
  assert.notEqual(entryListStart, -1);
  assert.notEqual(noscriptStart, -1);
  const listingRows = indexHtml.slice(entryListStart, noscriptStart);
  assert.equal(listingRows.includes("/tags/"), false);

  // Noscript fallback still points at Tag pages.
  const noscript = indexHtml.slice(noscriptStart);
  assert.match(noscript, /href="\/tags\/devlog\//);
  assert.match(noscript, /href="\/tags\/experiment\//);
  assert.match(noscript, /href="\/tags\/random\//);

  // Draft and future Entries are excluded from /log and routes.
  assert.equal(
    existsSync(join(repoRoot, "dist/log/entry-draft/index.html")),
    false,
  );
  assert.equal(
    existsSync(join(repoRoot, "dist/log/entry-future/index.html")),
    false,
  );
  assert.equal(indexHtml.includes('data-entry-id="entry-draft"'), false);
  assert.equal(indexHtml.includes('data-entry-id="entry-future"'), false);

  // Entry page: back-link, metadata order, body, and close (Updated only when set).
  const title = "Updated Fixture Entry";
  const pubDate = "2026-08-16";
  const updatedDate = "2026-08-17";
  const errorEmail = "aburagohain160@gmail.com";
  const bodySnippet = "#14";

  const backToLogIdx = entryHtml.indexOf("Back to Log");
  assert.notEqual(backToLogIdx, -1);

  const titleMatch = entryHtml.match(new RegExp(`<h1>\\s*${title}\\s*<\\/h1>`));
  assert.ok(titleMatch);
  assert.ok(titleMatch.index > backToLogIdx);

  const pubDateIdx = entryHtml.indexOf(`data-pub-date="${pubDate}"`);
  assert.notEqual(pubDateIdx, -1);
  assert.ok(pubDateIdx > titleMatch.index);

  const updatedIdx = entryHtml.indexOf(`data-updated-date="${updatedDate}"`);
  assert.notEqual(updatedIdx, -1);
  assert.ok(updatedIdx > pubDateIdx);
  assert.match(entryHtml, /min read/);
  assert.equal(entryHtml.includes("Updated:"), false);
  assert.match(entryHtml, /Updated 17 Aug 2026/);

  // Tags come after metadata.
  const tagsIdx = entryHtml.indexOf(`href="/tags/experiment/"`);
  assert.ok(tagsIdx > updatedIdx);

  // Body comes after tags.
  const bodyIdx = entryHtml.indexOf(bodySnippet);
  assert.ok(bodyIdx > tagsIdx);

  // Close comes after body.
  const emailIdx = entryHtml.indexOf(errorEmail);
  assert.ok(emailIdx > bodyIdx);
  assert.match(entryHtml, /href="\/rss\.xml"/);
  assert.match(entryHtml, /href="\/log\/"/);

  // Summary on indexes must NEVER be repeated under the Entry title (in the body).
  // It MAY appear in <head> metadata (og:description).
  const bodyStart = entryHtml.indexOf("entry-body");
  const bodySlice = bodyStart > -1 ? entryHtml.slice(bodyStart) : "";
  assert.equal(
    bodySlice.includes("Fixture summary for an Entry with a material update."),
    false,
  );

  rmSync(tmpContent, { recursive: true, force: true });
});

test("UTC eligibility is timezone-independent (TZ=Pacific/Kiritimati)", () => {
  const tmpContent = mkdtempSync(join(tmpdir(), "issue-14-log-tz-"));
  cpSync(fixtureEntriesDir, tmpContent, { recursive: true });

  const result = runBuild({
    SITE_URL: "https://example.test",
    CONTENT_DIR: tmpContent,
    TZ: "Pacific/Kiritimati",
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);

  // Future-dated Entries must not publish under UTC-based eligibility.
  assert.equal(
    existsSync(join(repoRoot, "dist/log/entry-future/index.html")),
    false,
  );

  rmSync(tmpContent, { recursive: true, force: true });
});

