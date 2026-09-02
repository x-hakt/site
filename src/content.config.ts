import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/*
  "a landlocked captain's log" — one collection of notes under src/content/notes/.

  House rule: wrap a technical term a non-expert wouldn't know in <Term> on its
  first use — <Term k="ssh">SSH</Term>. Definitions live in src/glossary.ts;
  the hover/tap explainer is Term.astro + a controller in BaseLayout.astro.


  Taxonomy (XH-12, revised): two axes, both plain-spoken.

    tracks  what kind of work the note is about. A small fixed set, one or more
            per note. See src/tracks.ts for the list and the blurbs.
              standards       holding many things to one bar
              control         seeing and steering what runs
              infrastructure  the network, the servers, the deploy path
              workstation     the local machine and its tooling

    tech    the technologies that turn up in the note. Free keyword tags
            ("docker", "openssh", "traefik"). Drives /tech/<tag> and the
            toolbox on the map.
*/
const TRACKS = ['standards', 'control', 'infrastructure', 'workstation'] as const;

const notes = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(),
    // one-line standfirst shown on the index and under the title
    summary: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tracks: z.array(z.enum(TRACKS)).nonempty(),
    tech: z.array(z.string()).default([]),
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
