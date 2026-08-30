import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/*
  "a landlocked captain's log" — one collection of notes under src/content/notes/.

  Taxonomy (XH-12), sea words but the plain meaning stays obvious:
    sea     one named region this note belongs to      "Sea of Development"
    waters  sub-areas within/around that sea           ["deploys", "traefik"]
    cargo   loose keyword tags                         ["ssh", "systemd"]

  `sea` is a free string on purpose (add one by typing it in a note's
  frontmatter). Known seas get a blurb and an order in src/seas.ts; unknown
  ones still render, just plainly.
*/
const notes = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(),
    // one-line standfirst shown on the index and under the title
    summary: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    sea: z.string(),
    waters: z.array(z.string()).default([]),
    cargo: z.array(z.string()).default([]),
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
