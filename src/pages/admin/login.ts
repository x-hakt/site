export const prerender = false;

import type { APIRoute } from 'astro';
import {
  COOKIE,
  adminEnabled,
  verifyPassword,
  issueSession,
  cookieOpts,
  rateLimited,
  recordAttempt,
  clearAttempts,
  sameOrigin,
} from '../../lib/admin';

function clientIp(request: Request, fallback: string | undefined): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || fallback || 'unknown';
}

const seeOther = (loc: string) => new Response(null, { status: 303, headers: { location: loc } });

export const POST: APIRoute = async ({ request, cookies, clientAddress }) => {
  if (!adminEnabled()) return new Response('Not found', { status: 404 });
  if (!sameOrigin(request)) return new Response('cross-site request', { status: 403 });

  const ip = clientIp(request, clientAddress);
  if (rateLimited(ip)) return seeOther('/admin?e=locked');

  const form = await request.formData();
  const password = String(form.get('password') ?? '');

  recordAttempt(ip);
  if (!verifyPassword(password)) return seeOther('/admin?e=bad');

  clearAttempts(ip);
  cookies.set(COOKIE, issueSession(), cookieOpts);
  return seeOther('/admin');
};

export const GET: APIRoute = () => seeOther('/admin');
