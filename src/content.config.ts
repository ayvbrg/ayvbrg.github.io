import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const XML_TEXT = /^[^\x00-\x08\x0b\x0c\x0e-\x1f\ufffe\uffff]*$/;

// CONTENT_DIR is the fixture seam: test builds point it at tests/fixtures/*
// so fixture Entries never ship and real Entries never reach the tests.
const log = defineCollection({
  loader: glob({
    base: process.env.CONTENT_DIR ?? 'src/content/log',
    pattern: '**/*.{md,mdx}',
  }),
  schema: z.object({
    // C0 control characters are illegal in XML: a title or summary carrying one
    // emits a feed no conforming reader can parse, so fail the build instead.
    title: z.string().regex(XML_TEXT),
    date: z.coerce.date(),
    summary: z.string().regex(XML_TEXT),
    tags: z.array(z.enum(['devlog', 'experiment', 'random'])),
    updated: z.coerce.date().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { log };
