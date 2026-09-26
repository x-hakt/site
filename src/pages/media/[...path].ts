export const prerender = false;
import type { APIRoute } from 'astro';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { MEDIA_DIR, validMediaId } from '../../lib/wp-bridge';

// PLN-12: note media added at runtime (built assets under /public are fixed at build time).
const TYPES: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif' };
export const GET: APIRoute = async ({ params }) => {
  const id = String(params.path ?? '');
  if (!validMediaId(id)) return new Response('Not found', { status: 404 });
  try {
    const bytes = await readFile(path.join(MEDIA_DIR, id));
    return new Response(bytes, { headers: { 'content-type': TYPES[id.split('.').pop()!], 'cache-control': 'public, max-age=31536000, immutable' } });
  } catch {
    return new Response('Not found', { status: 404 });
  }
};
