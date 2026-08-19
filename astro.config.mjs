import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";

export default defineConfig({
  output: "static",
  trailingSlash: "always",
  site: process.env.SITE_URL,
  build: {
    inlineStylesheets: "never",
  },
  integrations: [mdx()],
});
