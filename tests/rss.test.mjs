import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, cpSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";

const repoRoot = process.cwd();
const fixtureDir = join(repoRoot, "tests/fixtures/entries");

function runBuild(extraEnv = {}) {
  return spawnSync("npm", ["run", "build"], {
    cwd: repoRoot,
    env: { ...process.env, ...extraEnv },
    encoding: "utf8",
  });
}

test("RSS feed: exists and has correct structure", () => {
  const tmpContent = mkdtempSync(join(tmpdir(), "rss-test-"));
  cpSync(fixtureDir, tmpContent, { recursive: true });
  const result = runBuild({ SITE_URL: "https://example.test", CONTENT_DIR: tmpContent });
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const rssPath = join(repoRoot, "dist/rss.xml");
  assert.equal(existsSync(rssPath), true, "/rss.xml exists");

  const xml = readFileSync(rssPath, "utf8");

  // Channel metadata
  assert.match(xml, /<title>ayvbrg\.log<\/title>/);
  assert.match(xml, /dev work, experiments, side quests/);
  assert.match(xml, /<language>en<\/language>/);
  assert.match(xml, /https:\/\/example\.test\/rss\.xml/);

  // Items: drafts/future excluded
  assert.ok(!xml.includes("entry-draft"), "draft excluded from RSS");
  assert.ok(!xml.includes("entry-future"), "future excluded from RSS");

  // Item structure
  assert.match(xml, /<guid[^>]*>https:\/\/example\.test\/log\//);
  assert.match(xml, /<link>https:\/\/example\.test\/log\//);
  assert.match(xml, /<category>/);
  assert.match(xml, /<description>/);

  // Ordering: yesterday entry should appear before last-week entry
  const yesterdayIdx = xml.indexOf("a-yesterday-devlog");
  const lastweekIdx = xml.indexOf("entry-lastweek-experiment");
  assert.ok(yesterdayIdx < lastweekIdx, "newest first ordering");

  // Tie-break: tie-alpha before tie-beta (same date, ascending slug)
  const alphaIdx = xml.indexOf("tie-alpha");
  const betaIdx = xml.indexOf("tie-beta");
  assert.ok(alphaIdx < betaIdx, "same-date tie-break by ascending slug");

  // No content:encoded
  assert.ok(!xml.includes("content:encoded"), "summary-only items");

  // GUID is permalink
  assert.match(xml, /<guid isPermaLink="true">/);

  rmSync(tmpContent, { recursive: true, force: true });
});
