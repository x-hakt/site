export const prerender = false;
import { publishedNotes } from '../lib/notes';
import { site } from '../site';
import { NOTES_PAGE_SIZE } from '../lib/pagination';
const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
export async function GET() {
  const notes = await publishedNotes();
  const paths = new Set(['/', '/about/', '/map/', '/locker/', '/locker/bosun-x/', '/locker/jib/']);
  for (const n of notes) {
    paths.add('/notes/' + n.id + '/');
    for (const tag of n.data.tech) paths.add('/tech/' + tag.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') + '/');
  }
  for (let page=2; page<=Math.ceil(notes.length/NOTES_PAGE_SIZE); page++) paths.add('/page/' + page + '/');
  return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    [...paths].map(p => '<url><loc>' + escape(new URL(p, site.url).href) + '</loc></url>').join('') + '</urlset>',
    { headers: { 'content-type': 'application/xml; charset=utf-8' } });
}
