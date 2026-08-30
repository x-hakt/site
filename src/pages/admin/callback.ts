export const prerender = false;

import type { APIRoute } from 'astro';
import {
  adminEnabled,
  oauthFinish,
  issueSession,
  COOKIE,
  cookieOpts,
  STATE_COOKIE,
  stateCookieOpts,
} from '../../lib/admin';

const back = (e?: string) =>
  new Response(null, { status: 303, headers: { location: e ? `/admin?e=${e}` : '/admin' } });

export const GET: APIRoute = async ({ url, cookies }) => {
  if (!adminEnabled()) return new Response('Not found', { status: 404 });

  const code = url.searchParams.get('code') ?? '';
  const state = url.searchParams.get('state') ?? '';
  const expected = cookies.get(STATE_COOKIE)?.value ?? '';
  cookies.delete(STATE_COOKIE, { path: stateCookieOpts.path });

  if (!code || !state || !expected || state !== expected) return back('state');

  const email = await oauthFinish(code);
  if (!email) return back('denied');

  cookies.set(COOKIE, issueSession(email), cookieOpts);
  return back();
};
