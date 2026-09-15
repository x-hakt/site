export const prerender = false;
import rss from '@astrojs/rss';
import { publishedNotes } from '../lib/notes';
import type { APIContext } from 'astro';
import { site } from '../site';

export async function GET(context: APIContext) {
  const notes = (await publishedNotes()).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );

  return rss({
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    site: context.site ?? site.url,
    items: notes.map((note) => ({
      title: note.data.title,
      description: note.data.summary,
      pubDate: note.data.date,
      link: `/notes/${note.id}/`,
      categories: [...note.data.tracks, ...note.data.tech],
    })),
  });
}
