import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  output: "static",
  trailingSlash: "always",
  site: process.env.SITE_URL,
  build: {
    inlineStylesheets: "never",
  },
  integrations: [mdx(), sitemap()],
});
