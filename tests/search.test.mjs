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
    timeout: 60_000,
  });
}

test("Log search: Pagefind assets exist after production build", () => {
  const tmpContent = mkdtempSync(join(tmpdir(), "search-test-"));
  cpSync(fixtureDir, tmpContent, { recursive: true });
  const result = runBuild({ SITE_URL: "https://example.test", CONTENT_DIR: tmpContent });
  assert.equal(result.status, 0, result.stderr || result.stdout);

  // Pagefind emits a pagefind directory
  assert.equal(existsSync(join(repoRoot, "dist/pagefind")), true, "pagefind directory exists");
  assert.equal(existsSync(join(repoRoot, "dist/pagefind/pagefind.js")), true, "pagefind.js exists");

  // /log/ references pagefind
  const logHtml = readFileSync(join(repoRoot, "dist/log/index.html"), "utf8");
  assert.match(logHtml, /pagefind/, "log page references pagefind");
  assert.match(logHtml, /search-input/, "search input present");

  // No-results state references Tag links
  assert.match(logHtml, /No results/, "no-results text present");
  assert.match(logHtml, /\/tags\/devlog\//, "devlog tag link in no-results");

  rmSync(tmpContent, { recursive: true, force: true });
});
