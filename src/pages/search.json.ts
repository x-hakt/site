import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

/*
  The spyglass index (XH-12). One flat JSON array, built at build time, fetched
  once by /map and filtered client-side. Small site, so the whole body text
  ships stripped of MDX punctuation; revisit if the payload gets past ~100 KB.
*/
export const GET: APIRoute = async () => {
  const notes = (await getCollection('notes', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );

  const index = notes.map((note) => ({
    title: note.data.title,
    summary: note.data.summary,
    url: `/notes/${note.id}`,
    date: note.data.date.toISOString().slice(0, 10),
    tracks: note.data.tracks,
    tech: note.data.tech,
    // crude text extraction: drop frontmatter, imports, JSX tags, markdown syntax
    text: note.body
      ?.replace(/^---[\s\S]*?---/, '')
      .replace(/^import .*$/gm, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/[#>*`_[\]()|]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 4000) ?? '',
  }));

  return new Response(JSON.stringify(index), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
};
