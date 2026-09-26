export const prerender = false;
import type { APIRoute } from 'astro';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { atomicWriteBytes } from '../../../../lib/wp-bridge-io';
import { serialize } from '../../../../lib/notes';
import { syncContent } from '../../../../lib/content-git';
import { guard, json, addressOf, IMAGE_TYPES, MAX_MEDIA_BYTES, MEDIA_DIR, mediaUrl, siteUrl, slugify } from '../../../../lib/wp-bridge';

// PLN-12: a hero image, sent WordPress-style as the raw request body with a
// Content-Disposition filename. Stored under src/content/media/<yyyy-mm>/ and committed.
export const POST: APIRoute = async ({ request, clientAddress }) => {
  const denied = guard(request, addressOf(request, clientAddress));
  if (denied) return denied;
  const type = (request.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
  const ext = IMAGE_TYPES[type];
  if (!ext) return json({ code: 'rest_upload_invalid_type', message: 'Only PNG, JPEG, WebP or GIF images.' }, 415);
  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > MAX_MEDIA_BYTES) return json({ code: 'rest_upload_too_large', message: 'Images are limited to 10 MB.' }, 413);
  const bytes = Buffer.from(await request.arrayBuffer());
  if (!bytes.length) return json({ code: 'rest_upload_no_data', message: 'Empty upload.' }, 400);
  if (bytes.length > MAX_MEDIA_BYTES) return json({ code: 'rest_upload_too_large', message: 'Images are limited to 10 MB.' }, 413);
  const disposition = request.headers.get('content-disposition') ?? '';
  const name = /filename="?([^";]+)"?/i.exec(disposition)?.[1] ?? 'image';
  const stem = slugify(name.replace(/\.[a-z0-9]+$/i, '')).slice(0, 60) || 'image';
  const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 8);
  const id = `${new Date().toISOString().slice(0, 7)}/${hash}-${stem}.${ext}`;
  return serialize(async () => {
    const file = path.join(MEDIA_DIR, id);
    await atomicWriteBytes(file, bytes);
    await syncContent([file], `bridge: media ${id}`);
    return json({ id, source_url: siteUrl(mediaUrl(id)), media_type: 'image', mime_type: type }, 201);
  });
};
