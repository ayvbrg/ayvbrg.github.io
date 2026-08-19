import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const tagSchema = z.enum(["devlog", "experiment", "random"]);
const contentBase = process.env.CONTENT_DIR ?? "./src/content/log";

const log = defineCollection({
  loader: glob({ base: contentBase, pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string(),
    pubDate: z.coerce.date(),
    summary: z.string(),
    tags: z.array(tagSchema),
    updated: z.coerce.date().optional(),
    draft: z.boolean().optional(),
  }),
});

export const collections = { log };
