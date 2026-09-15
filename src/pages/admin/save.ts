export const prerender = false;
import type { APIRoute } from 'astro';
import { COOKIE, adminEnabled, sessionValid, sameOrigin } from '../../lib/admin';
import { validSlug, readWorkingSource, revision, parseNote, withStatus, saveDraft, publishNote, serialize } from '../../lib/notes';
import { renderNote } from '../../lib/render-note';
import { syncContent } from '../../lib/content-git';

const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'private, no-store' },
});
export const POST: APIRoute = async ({ request, cookies }) => {
  if (!adminEnabled()) return reply({ error: 'Not found' }, 404);
  if (!sameOrigin(request)) return reply({ error: 'Cross-site request' }, 403);
  if (!sessionValid(cookies.get(COOKIE)?.value)) return reply({ error: 'Session expired. Sign in again in another tab, then retry; your text is kept here.' }, 401);
  const form = await request.formData();
  const slug = String(form.get('slug') ?? '');
  const action = String(form.get('action') ?? '');
  const raw = String(form.get('content') ?? '').replace(/\r\n/g, '\n');
  if (!validSlug(slug) || !['draft', 'publish'].includes(action)) return reply({ error: 'Invalid note or action.' }, 400);
  if (raw.length > 1000000) return reply({ error: 'Note exceeds the 1 MB limit.' }, 413);
  return serialize(async () => {
    const current = await readWorkingSource(slug);
    if (String(form.get('revision') ?? '') !== revision(current)) {
      return reply({ error: 'This note changed since you opened it. Your text is still here. Open the latest version in another tab and reconcile the changes before saving.' }, 409);
    }
    try {
      const content = withStatus(raw, action === 'draft');
      // Publication validates actual rendering, including component errors.
      // Drafts may contain unfinished MDX; preserve it and show preview errors.
      if (action === 'publish') await renderNote(parseNote(slug, content));
      const paths = action === 'draft' ? [await saveDraft(slug, content)] : await publishNote(slug, content);
      const warning = await syncContent(paths, `admin: ${action === 'draft' ? 'draft' : 'publish'} ${slug}`);
      return reply({ ok: true, content, revision: revision(content), warning,
        message: action === 'draft' ? 'Draft saved. Ready to preview.' : 'Published. The public note is live.',
        preview: `/admin/preview/${slug}`, url: `/notes/${slug}` });
    } catch (e) {
      return reply({ error: e instanceof Error ? e.message : 'Could not save this note.' }, 422);
    }
  });
};
export const GET: APIRoute = () => new Response(null, { status: 303, headers: { location: '/admin' } });
