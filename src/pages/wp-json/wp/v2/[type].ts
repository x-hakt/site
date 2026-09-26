export const prerender = false;
import type { APIRoute } from 'astro';
import yaml from 'js-yaml';
import { access } from 'node:fs/promises';
import path from 'node:path';
import { parseNote, publishNote, saveDraft, serialize } from '../../../../lib/notes';
import { renderNote } from '../../../../lib/render-note';
import { syncContent } from '../../../../lib/content-git';
import {
  guard, json, addressOf, TRACKS, tags, htmlToMdx, firstParagraph, freeSlug, slugify,
  validMediaId, mediaUrl, MEDIA_DIR, siteUrl,
} from '../../../../lib/wp-bridge';

// PLN-12: create a note. status "publish" puts it live (after the same render check /admin
// does); anything else ("draft", "pending", "private") saves a draft for /admin. Create-only.
const sydneyDate = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney' }).format(new Date());

export const POST: APIRoute = async ({ params, request, clientAddress }) => {
  const denied = guard(request, addressOf(request, clientAddress));
  if (denied) return denied;
  if (params.type !== 'notes') return json({ code: 'rest_no_route', message: 'Only notes can be created here.' }, 404);

  let body: any;
  try { body = await request.json(); } catch { return json({ code: 'rest_invalid_json', message: 'Send JSON.' }, 400); }
  const title = typeof body?.title === 'string' ? body.title.trim() : String(body?.title?.raw ?? '').trim();
  const html = typeof body?.content === 'string' ? body.content : String(body?.content?.raw ?? '');
  if (title.length < 2) return json({ code: 'rest_missing_title', message: 'A note needs a title.' }, 400);
  if (!html.trim()) return json({ code: 'rest_missing_content', message: 'A note needs content.' }, 400);
  if (html.length > 1_000_000) return json({ code: 'rest_too_large', message: 'Note exceeds the 1 MB limit.' }, 413);
  const publish = body.status === 'publish';

  const trackIds = Array.isArray(body.categories) ? body.categories.map(Number) : [];
  const tracks = trackIds.map((id: number) => TRACKS[id - 1]).filter(Boolean);
  const known = new Map((await tags()).map((t) => [t.id, t.name]));
  const tech = (Array.isArray(body.tags) ? body.tags.map(Number) : []).map((id: number) => known.get(id)).filter(Boolean);

  let hero: { src: string; alt: string } | undefined;
  if (body.featured_media) {
    const id = String(body.featured_media);
    if (!validMediaId(id)) return json({ code: 'rest_invalid_featured_media', message: 'Unknown featured image.' }, 400);
    try { await access(path.join(MEDIA_DIR, id)); } catch { return json({ code: 'rest_invalid_featured_media', message: 'Unknown featured image.' }, 400); }
    hero = { src: mediaUrl(id), alt: title };
  }

  const frontmatter = {
    title,
    summary: firstParagraph(html) || title,
    date: sydneyDate(),
    // the schema needs at least one track; the operator can change it in /admin
    tracks: tracks.length ? [...new Set(tracks)] : ['infrastructure'],
    tech: [...new Set(tech)],
    ...(hero ? { hero } : {}),
    draft: !publish,
  };

  return serialize(async () => {
    const slug = await freeSlug(typeof body.slug === 'string' && body.slug ? body.slug : slugify(title));
    const raw = '---\n' + yaml.dump(frontmatter, { lineWidth: -1 }) + '---\n\n' + htmlToMdx(html);
    try {
      parseNote(slug, raw);
      if (publish) await renderNote(parseNote(slug, raw));
    } catch (e) {
      return json({ code: 'rest_invalid_note', message: e instanceof Error ? e.message : 'The note did not validate.' }, 422);
    }
    const paths = publish ? await publishNote(slug, raw) : [await saveDraft(slug, raw)];
    const warning = await syncContent(paths, `bridge: ${publish ? 'publish' : 'draft'} ${slug}`);
    const link = siteUrl(publish ? `/notes/${slug}/` : `/admin/preview/${slug}`);
    return json({
      id: slug, slug, status: publish ? 'publish' : 'draft', link,
      title: { raw: title }, ...(warning ? { warning } : {}),
    }, 201);
  });
};
