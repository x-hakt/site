export const prerender = false;

import type { APIRoute } from 'astro';
import { adminEnabled, oauthStart, STATE_COOKIE, stateCookieOpts } from '../../lib/admin';

/* Kick off the Google OAuth flow: stash a random state in a cookie, bounce to Google. */
export const GET: APIRoute = async ({ cookies }) => {
  if (!adminEnabled()) return new Response('Not found', { status: 404 });

  const { url, state } = oauthStart();
  cookies.set(STATE_COOKIE, state, stateCookieOpts);
  return new Response(null, { status: 302, headers: { location: url } });
};
