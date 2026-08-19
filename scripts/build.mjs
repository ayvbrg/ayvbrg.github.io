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

const astro = spawnSync("npx", ["astro", "build"], {
  stdio: "inherit",
  env: process.env,
});

if (astro.status !== 0) {
  process.exit(astro.status ?? 1);
}

// Run Pagefind to index the built site for /log search
const pagefind = spawnSync(
  "npx",
  ["pagefind", "--site", "dist", "--glob", "log/**/*.html"],
  { stdio: "inherit", env: process.env },
);

if (pagefind.status !== 0) {
  process.exit(pagefind.status ?? 1);
}
