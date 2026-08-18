// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

if (process.argv.includes('build') && !process.env.SITE_URL) {
  console.error('SITE_URL is required for a production build, e.g. SITE_URL=https://ayvbrg.example npm run build');
  process.exit(1);
}

export default defineConfig({
  site: process.env.SITE_URL ?? 'http://localhost:4321',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [mdx()],
});
