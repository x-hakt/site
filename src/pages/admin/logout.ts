export const prerender = false;

import type { APIRoute } from 'astro';
import { COOKIE, cookieOpts } from '../../lib/admin';

export const POST: APIRoute = async ({ cookies }) => {
  cookies.delete(COOKIE, { path: cookieOpts.path });
  return new Response(null, { status: 303, headers: { location: '/admin' } });
};
