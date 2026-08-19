import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();

async function waitForDistReady() {
  const distRoot = join(repoRoot, "dist");
  const cssDir = join(distRoot, "_astro");

  const start = Date.now();
  while (Date.now() - start < 20_000) {
    if (
      existsSync(distRoot) &&
      existsSync(join(distRoot, "index.html")) &&
      existsSync(cssDir)
    ) {
      const cssFiles = readdirSync(cssDir).filter((f) => f.endsWith(".css"));
      if (cssFiles.length > 0) return;
    }

    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, 100));
  }

  throw new Error(
    "Timed out waiting for dist/_astro/*.css to exist (build-output tests likely did not run yet).",
  );
}

function readBuildArtifacts() {
  const distRoot = join(repoRoot, "dist");
  const cssDir = join(distRoot, "_astro");
  const cssFiles = readdirSync(cssDir).filter((f) => f.endsWith(".css"));

  const cssContent = cssFiles
    .map((f) => readFileSync(join(cssDir, f), "utf8"))
    .join("\n");

  const htmlPaths = [
    join(distRoot, "index.html"),
    join(distRoot, "log/index.html"),
    join(distRoot, "log/walking-skeleton-placeholder/index.html"),
  ];
  const htmlContent = htmlPaths
    .filter((p) => existsSync(p))
    .map((p) => readFileSync(p, "utf8"))
    .join("\n");

  return { cssContent, htmlContent };
}

test("emitted HTML has no external font URLs", async () => {
  await waitForDistReady();
  const { htmlContent } = readBuildArtifacts();
  assert.ok(!/fonts\.googleapis\.com/i.test(htmlContent));
  assert.ok(!/typekit\.net/i.test(htmlContent));
  assert.ok(!/https?:\/\/[^"' ]*fonts/i.test(htmlContent));
});

test("emitted CSS includes dark + light token hex values", async () => {
  await waitForDistReady();
  const { cssContent } = readBuildArtifacts();
  const tokens = [
    "#0e1419",
    "#151c22",
    "#1c252c",
    "#e3e7e7",
    "#9aa4a8",
    "#829096",
    "#c46b68",
    "#edf0f1",
    "#f7f8f7",
    "#e3e7e8",
    "#20272b",
    "#59666c",
    "#606d73",
    "#954746",
  ];
  for (const hex of tokens) assert.ok(cssContent.includes(hex), `Missing ${hex}`);
});

test("inline theme script is present", async () => {
  await waitForDistReady();
  const { htmlContent } = readBuildArtifacts();
  assert.match(htmlContent, /localStorage\.getItem\(/);
  assert.match(htmlContent, /prefers-color-scheme/);
  assert.match(htmlContent, /dataset\.theme/);
});

test("reduced-motion rules are present in emitted CSS", async () => {
  await waitForDistReady();
  const { cssContent } = readBuildArtifacts();
  assert.match(cssContent, /prefers-reduced-motion:\s*reduce/i);
});

test("favicon is linked from emitted HTML", async () => {
  await waitForDistReady();
  const { htmlContent } = readBuildArtifacts();
  assert.match(htmlContent, /href="\/favicon\.svg"/);
});

test("no html/body overflow-x: scroll (or overflow-x:auto)", async () => {
  await waitForDistReady();
  const { cssContent } = readBuildArtifacts();
  assert.ok(!/overflow-x:\s*scroll/i.test(cssContent));
  assert.ok(!/body\s*\{[^}]*overflow-x:\s*auto/i.test(cssContent));
  assert.ok(!/html\s*\{[^}]*overflow-x:\s*auto/i.test(cssContent));
});

