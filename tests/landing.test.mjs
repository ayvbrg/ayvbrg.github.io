import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();

test("Landing: four sections present, placeholder copy, recent Entries link", () => {
  // Relies on a dist from a prior build-output test run
  const html = readFileSync(join(repoRoot, "dist/index.html"), "utf8");

  // Identity section
  assert.match(html, /Ayushman Buragohain/);

  // Selected work placeholders
  assert.match(html, /placeholder: work row/);

  // Recent Entries section with link to complete Log
  assert.match(html, /Recent Entries/);
  assert.match(html, /href="\/log\/"/);

  // Elsewhere links
  assert.match(html, /github\.com\/ayvbrg/);
  assert.match(html, /linkedin\.com\/in\/ayushman-buragohain/);
  assert.match(html, /aburagohain160@gmail\.com/);
  assert.match(html, /\/rss\.xml/);

  // No invented real copy
  assert.match(html, /placeholder/i, "contains placeholder markers");
});
