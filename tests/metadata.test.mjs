import test from "node:test";
import assert from "node:assert/strict";
import {
  existsSync,
  readFileSync,
  readdirSync,
  cpSync,
  mkdtempSync,
  rmSync,
} from "node:fs";
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

test("Metadata and sitemap: canonical, OG, sitemap, JS budget", () => {
  const tmpContent = mkdtempSync(join(tmpdir(), "meta-test-"));
  cpSync(fixtureDir, tmpContent, { recursive: true });
  const result = runBuild({
    SITE_URL: "https://example.test",
    CONTENT_DIR: tmpContent,
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);

  // Canonical link on index
  const indexHtml = readFileSync(join(repoRoot, "dist/index.html"), "utf8");
  assert.match(
    indexHtml,
    /rel="canonical".*href="https:\/\/example\.test\//,
    "canonical link on landing",
  );
  assert.match(indexHtml, /og:title/, "og:title on landing");
  assert.match(indexHtml, /og:url/, "og:url on landing");
  assert.match(indexHtml, /og:description/, "og:description on landing");

  // Canonical on an Entry page
  const entryHtml = readFileSync(
    join(repoRoot, "dist/log/a-yesterday-devlog/index.html"),
    "utf8",
  );
  assert.match(
    entryHtml,
    /rel="canonical".*href="https:\/\/example\.test\/log\/a-yesterday-devlog\//,
    "canonical on entry",
  );
  // Entry description is the summary
  assert.match(entryHtml, /og:description/, "og:description on entry");
  assert.match(
    entryHtml,
    /content="Fixture summary for yesterday devlog rows\./,
    "entry summary in metadata",
  );

  // Sitemap exists
  const sitemapIndex = join(repoRoot, "dist/sitemap-index.xml");
  const sitemapFile = join(repoRoot, "dist/sitemap-0.xml");
  assert.ok(
    existsSync(sitemapIndex) || existsSync(sitemapFile),
    "sitemap exists",
  );
  // Read whichever exists
  const sitemapPath = existsSync(sitemapFile) ? sitemapFile : sitemapIndex;
  const sitemap = readFileSync(sitemapPath, "utf8");
  // If sitemap-index, read the first sitemap
  let sitemapContent = sitemap;
  if (sitemapPath === sitemapIndex && existsSync(sitemapFile)) {
    sitemapContent = readFileSync(sitemapFile, "utf8");
  }

  // Sitemap contains public routes
  assert.match(sitemapContent, /example\.test/, "sitemap uses SITE_URL");

  // No draft/future in sitemap
  assert.ok(
    !sitemapContent.includes("entry-draft"),
    "draft excluded from sitemap",
  );
  assert.ok(
    !sitemapContent.includes("entry-future"),
    "future excluded from sitemap",
  );

  // JS budget: ordinary pages only have the inline theme script
  // Check faq page — should have no <script src=> or <script type="module">
  const faqHtml = readFileSync(join(repoRoot, "dist/faq/index.html"), "utf8");
  const faqScriptSrcs = faqHtml.match(/<script[^>]*src=/g) || [];
  assert.equal(faqScriptSrcs.length, 0, "FAQ has no external script src");
  // Inline theme script only
  const faqScripts = faqHtml.match(/<script/g) || [];
  assert.equal(
    faqScripts.length,
    1,
    "FAQ has exactly one script (inline theme)",
  );

  // Pagefind only on /log/
  const logHtml = readFileSync(join(repoRoot, "dist/log/index.html"), "utf8");
  assert.match(logHtml, /pagefind/, "pagefind on log");
  assert.ok(!faqHtml.includes("pagefind"), "no pagefind on FAQ");
  assert.ok(!indexHtml.includes("pagefind"), "no pagefind on landing");

  // No external font or third-party requests across all HTML
  const htmlFiles = [];
  function collectHtml(dir) {
    for (const f of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, f.name);
      if (f.isDirectory()) collectHtml(p);
      else if (f.name.endsWith(".html")) htmlFiles.push(p);
    }
  }
  collectHtml(join(repoRoot, "dist"));

  for (const f of htmlFiles) {
    const html = readFileSync(f, "utf8");
    assert.ok(
      !html.includes("fonts.googleapis.com"),
      `no google fonts in ${f}`,
    );
    assert.ok(!html.includes("typekit"), `no typekit in ${f}`);
    assert.ok(
      !html.includes("analytics"),
      `no analytics in ${f}`,
    );
  }

  rmSync(tmpContent, { recursive: true, force: true });
});
