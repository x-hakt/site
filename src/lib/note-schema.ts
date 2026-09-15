import { z } from 'astro/zod';
const TRACKS = ['standards', 'control', 'infrastructure', 'workstation'] as const;
export const noteSchema = z.object({
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
  });
export type NoteData = z.infer<typeof noteSchema>;
