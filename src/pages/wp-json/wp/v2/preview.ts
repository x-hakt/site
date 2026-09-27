export const prerender = false;
import type { APIRoute } from 'astro';
import { parseNote } from '../../../../lib/notes';
import { renderNote } from '../../../../lib/render-note';
import { guard, json, addressOf, siteUrl, buildNote, BridgeInputError, storePreview } from '../../../../lib/wp-bridge';

// PLN-25: the planner's "Site preview". Builds the note exactly as creating it would (same
// HTML-to-MDX, frontmatter, figures) without saving anything, checks it renders, and returns a
// short-lived, unguessable URL where the real note page shows it. Nothing is written to disk.
export const POST: APIRoute = async ({ request, clientAddress }) => {
  const denied = guard(request, addressOf(request, clientAddress));
  if (denied) return denied;
  let body: any;
  try { body = await request.json(); } catch { return json({ code: 'rest_invalid_json', message: 'Send JSON.' }, 400); }
  try {
    const { raw } = await buildNote({ ...body, status: 'draft' });
    await renderNote(parseNote('preview', raw));
    return json({ url: siteUrl(`/bridge-preview/${storePreview(raw)}`) });
  } catch (e) {
    if (e instanceof BridgeInputError) return json({ code: e.code, message: e.message }, e.status);
    return json({ code: 'rest_preview_failed', message: e instanceof Error ? e.message : 'This draft does not render yet.' }, 422);
  }
};
