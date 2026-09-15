// Notes are read from disk at request time (XH-25). An empty loader disables
// legacy build-time collection discovery, including compilation of unfinished drafts.
import { defineCollection } from 'astro:content';
import { noteSchema } from './lib/note-schema';
export const collections = { notes: defineCollection({ loader: async () => [], schema: noteSchema }) };
