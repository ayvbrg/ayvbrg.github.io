import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();

test("Landing: identity, icons, recent entries, shelf", () => {
  const html = readFileSync(join(repoRoot, "dist/index.html"), "utf8");

  assert.match(html, /Ayushman Buragohain/);
  assert.match(html, /I build AI tooling for comics at Dashtoon\./);
  assert.match(html, /Dev logs, experiments, books, and the occasional thought\./);

  assert.match(html, /aria-label="GitHub"/);
  assert.match(html, /github\.com\/ayvbrg/);
  assert.match(html, /aria-label="X"/);
  assert.match(html, /x\.com\/__hsuya/);
  assert.match(html, /aria-label="Kaggle"/);
  assert.match(html, /kaggle\.com\/benihime91/);
  assert.match(html, /aria-label="Email"/);
  assert.match(html, /aburagohain160@gmail\.com/);
  assert.match(html, /aria-label="RSS feed"/);
  assert.match(html, /\/rss\.xml/);

  assert.equal(html.includes("linkedin.com"), false);
  assert.equal(html.includes("Selected work"), false);
  assert.equal(html.includes("placeholder: work row"), false);

  assert.match(html, /Recent entries/);
  assert.match(html, /href="\/log\/"/);
  assert.match(html, /min read/);

  assert.match(html, /id="shelf"/);
  assert.match(html, /On the shelf/);
  assert.match(html, /Reading/);
  assert.match(html, /Watching/);
});
