import { spawnSync } from "node:child_process";

const nodeMajor = Number.parseInt(process.versions.node.split(".")[0], 10);
if (nodeMajor !== 24) {
  console.error(
    `Node 24 required. Current runtime is v${process.versions.node}. Run "mise install" then "mise exec -- npm run build".`,
  );
  process.exit(1);
}

if (!process.env.SITE_URL) {
  console.error("Missing SITE_URL: set SITE_URL for production builds.");
  process.exit(1);
}

const result = spawnSync("npx", ["astro", "build"], {
  stdio: "inherit",
  env: process.env,
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
