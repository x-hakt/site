export const prerender = false;
import type { APIRoute } from 'astro';
import { parseNote, publishNote, saveDraft, serialize } from '../../../../lib/notes';
import { renderNote } from '../../../../lib/render-note';
import { syncContent } from '../../../../lib/content-git';
import { guard, json, addressOf, freeSlug, siteUrl, buildNote, BridgeInputError } from '../../../../lib/wp-bridge';

// PLN-12: create a note. status "publish" puts it live (after the same render check /admin
// does); anything else ("draft", "pending", "private") saves a draft for /admin. Create-only.
export const POST: APIRoute = async ({ params, request, clientAddress }) => {
  const denied = guard(request, addressOf(request, clientAddress));
  if (denied) return denied;
  if (params.type !== 'notes') return json({ code: 'rest_no_route', message: 'Only notes can be created here.' }, 404);

  let body: any;
  try { body = await request.json(); } catch { return json({ code: 'rest_invalid_json', message: 'Send JSON.' }, 400); }
  let built;
  try { built = await buildNote(body); }
  catch (e) {
    if (e instanceof BridgeInputError) return json({ code: e.code, message: e.message }, e.status);
    throw e;
  }
  const { raw: builtRaw, title, publish, wantedSlug } = built;

  return serialize(async () => {
    const slug = await freeSlug(wantedSlug);
    const raw = builtRaw;
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
