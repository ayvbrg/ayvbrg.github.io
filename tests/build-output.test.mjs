import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { cpSync, mkdtempSync, rmSync } from "node:fs";
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
const fixtureValidDir = join(repoRoot, "tests/fixtures/valid-log");
const fixtureInvalidDir = join(repoRoot, "tests/fixtures/invalid-log");

function runBuild(extraEnv = {}) {
  return spawnSync("npm", ["run", "build"], {
    cwd: repoRoot,
    env: { ...process.env, ...extraEnv },
    encoding: "utf8",
  });
}

test("test harness runs on Node 24", () => {
  assert.equal(process.version.startsWith("v24."), true);
});

test("production build emits log routes with shipped content", () => {
  const result = runBuild({ SITE_URL: "https://example.test" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(existsSync(join(repoRoot, "dist/log/index.html")), true);
  assert.equal(
    existsSync(
      join(
        repoRoot,
        "dist/log/walking-skeleton-placeholder/index.html",
      ),
    ),
    true,
  );
  const logIndexHtml = readFileSync(join(repoRoot, "dist/log/index.html"), "utf8");
  assert.match(logIndexHtml, /Walking skeleton placeholder Entry/);
  assert.match(logIndexHtml, /href="\/log\/walking-skeleton-placeholder\/"/);
  const entryHtml = readFileSync(
    join(repoRoot, "dist/log/walking-skeleton-placeholder/index.html"),
    "utf8",
  );
  assert.match(entryHtml, /Walking skeleton placeholder Entry/);
});

test("production build supports fixture content collection", () => {
  const tmpContent = mkdtempSync(join(tmpdir(), "issue-13-valid-log-"));
  cpSync(fixtureValidDir, tmpContent, { recursive: true });
  const result = runBuild({
    SITE_URL: "https://example.test",
    CONTENT_DIR: tmpContent,
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(existsSync(join(repoRoot, "dist/log/index.html")), true);
  assert.equal(existsSync(join(repoRoot, "dist/log/fixture-entry/index.html")), true);
  rmSync(tmpContent, { recursive: true, force: true });
});

test("malformed fixture frontmatter fails production build", () => {
  const tmpContent = mkdtempSync(join(tmpdir(), "issue-13-invalid-log-"));
  cpSync(fixtureInvalidDir, tmpContent, { recursive: true });
  const result = runBuild({
    SITE_URL: "https://example.test",
    CONTENT_DIR: tmpContent,
  });
  const output = `${result.stdout}\n${result.stderr}`;
  assert.notEqual(result.status, 0);
  assert.match(output, /frontmatter|schema|Invalid content entry/i);
  rmSync(tmpContent, { recursive: true, force: true });
});

test("production build fails when SITE_URL is missing", () => {
  const envWithoutSiteUrl = { ...process.env };
  delete envWithoutSiteUrl.SITE_URL;
  const result = spawnSync("npm", ["run", "build"], {
    cwd: repoRoot,
    env: envWithoutSiteUrl,
    encoding: "utf8",
  });
  const output = `${result.stdout}\n${result.stderr}`;
  assert.notEqual(result.status, 0);
  assert.match(output, /SITE_URL/);
});
