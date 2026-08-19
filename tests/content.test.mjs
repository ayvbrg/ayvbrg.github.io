import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, cpSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";

const repoRoot = process.cwd();
const fixtureDir = join(repoRoot, "tests/fixtures/content-entries");

function runBuild(extraEnv = {}) {
  return spawnSync("npm", ["run", "build"], {
    cwd: repoRoot,
    env: { ...process.env, ...extraEnv },
    encoding: "utf8",
    timeout: 60_000,
  });
}

test("Entry content surfaces: MDX renders code, callout, quote, list, disclosure", () => {
  const tmpContent = mkdtempSync(join(tmpdir(), "content-test-"));
  cpSync(fixtureDir, tmpContent, { recursive: true });
  const result = runBuild({ SITE_URL: "https://example.test", CONTENT_DIR: tmpContent });
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const mdxPath = join(repoRoot, "dist/log/mdx-fixture/index.html");
  assert.equal(existsSync(mdxPath), true, "MDX fixture entry page exists");

  const html = readFileSync(mdxPath, "utf8");

  // Code block present
  assert.match(html, /<pre/, "code block present");
  assert.match(html, /<code/, "code element present");
  assert.match(html, /greeting/, "code content rendered");

  // Inline code
  assert.match(html, /Inline.*<code>code<\/code>/s, "inline code rendered");

  // Callout
  assert.match(html, /callout/, "callout class present");

  // Blockquote
  assert.match(html, /<blockquote/, "blockquote present");

  // Lists
  assert.match(html, /<ul/, "unordered list present");
  assert.match(html, /<ol/, "ordered list present");

  // Disclosure
  assert.match(html, /<details/, "details element present");
  assert.match(html, /<summary/, "summary element present");

  // Copy button script
  assert.match(html, /copy-btn/, "copy button script present");
  assert.match(html, /clipboard/, "clipboard API referenced");

  // Content CSS surfaces
  assert.match(html, /content\.css|entry-body/, "content styles referenced or class present");

  // Long code scrolls (overflow-x: auto on pre in content.css, not on body)
  const cssFiles = readdirSync(join(repoRoot, "dist/_astro")).filter(f => f.endsWith(".css"));
  const allCss = cssFiles.map(f => readFileSync(join(repoRoot, "dist/_astro", f), "utf8")).join("");
  assert.match(allCss, /\.entry-body pre.*overflow-x:\s*auto|overflow-x:\s*auto/s, "pre has overflow-x: auto");

  rmSync(tmpContent, { recursive: true, force: true });
});
