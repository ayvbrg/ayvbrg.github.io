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

test("Tag views: routes exist, filter correctly, exclude drafts/future", () => {
  const tmpContent = mkdtempSync(join(tmpdir(), "tags-test-"));
  cpSync(fixtureDir, tmpContent, { recursive: true });
  const result = runBuild({ SITE_URL: "https://example.test", CONTENT_DIR: tmpContent });
  assert.equal(result.status, 0, result.stderr || result.stdout);

  assert.equal(existsSync(join(repoRoot, "dist/tags/devlog/index.html")), true, "devlog tag page");
  assert.equal(existsSync(join(repoRoot, "dist/tags/experiment/index.html")), true, "experiment tag page");
  assert.equal(existsSync(join(repoRoot, "dist/tags/random/index.html")), true, "random tag page");

  const devlogHtml = readFileSync(join(repoRoot, "dist/tags/devlog/index.html"), "utf8");
  assert.match(devlogHtml, /a-yesterday-devlog/, "devlog page lists devlog entry");
  assert.ok(!devlogHtml.includes("entry-draft"), "draft excluded from tag view");
  assert.ok(!devlogHtml.includes("entry-future"), "future excluded from tag view");

  rmSync(tmpContent, { recursive: true, force: true });
});
