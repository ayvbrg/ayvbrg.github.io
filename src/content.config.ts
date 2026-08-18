import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

// CONTENT_DIR is the fixture seam: test builds point it at tests/fixtures/*
// so fixture Entries never ship and real Entries never reach the tests.
const log = defineCollection({
  loader: glob({
    base: process.env.CONTENT_DIR ?? 'src/content/log',
    pattern: '**/*.{md,mdx}',
  }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string(),
    tags: z.array(z.enum(['devlog', 'experiment', 'random'])),
    updated: z.coerce.date().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { log };
