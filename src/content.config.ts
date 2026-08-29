import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/*
  "notes from the workbench" — the only collection for now (style guide s.01:
  it's Notes, not "the blog"). One .mdx file per note under src/content/notes/.
*/
const notes = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(),
    // one-line standfirst shown on the index and under the title
    summary: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    // the systems this note documents, e.g. ["nebula", "ssh", "traefik"]
    topics: z.array(z.string()).default([]),
    // hero diagram: path under /public or an imported asset, plus its alt text
    hero: z
      .object({
        src: z.string(),
        alt: z.string(),
      })
      .optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { notes };
