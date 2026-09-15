/*
  XH-6 — the /admin editor's server-only helpers: Google OAuth sign-in, a
  stateless signed session cookie, and the new-note template.

  Only ever imported from `prerender = false` routes under src/pages/admin/.
  Nothing here runs at build time.
*/
import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? '';
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET ?? '';
const ALLOWED_EMAIL = (process.env.ADMIN_ALLOWED_EMAIL ?? 'topher.burchell@gmail.com').toLowerCase();
const SITE_URL = (process.env.SITE_URL ?? 'https://x-hakt.com').replace(/\/$/, '');
/** the editor is live only when Google OAuth and the session secret are set */
export function adminEnabled(): boolean {
  return CLIENT_ID.length > 0 && CLIENT_SECRET.length > 0 && SESSION_SECRET.length > 0;
}

export const COOKIE = 'xh_admin';
export const STATE_COOKIE = 'xh_admin_state';
const SESSION_TTL_S = 7 * 24 * 60 * 60;
const REDIRECT_URI = `${SITE_URL}/admin/callback`;

// ---- session cookie (stateless, HMAC-signed) -----------------------------

function sign(msg: string): string {
  return createHmac('sha256', SESSION_SECRET).update(msg).digest('base64url');
}

export function issueSession(email: string): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_S;
  const payload = `v1.${exp}.${Buffer.from(email).toString('base64url')}`;
  return `${payload}.${sign(payload)}`;
}

export function sessionValid(token: string | undefined): boolean {
  if (!token) return false;
  const i = token.lastIndexOf('.');
  if (i < 0) return false;
  const payload = token.slice(0, i);
  const mac = token.slice(i + 1);
  const good = sign(payload);
  if (mac.length !== good.length || !timingSafeEqual(Buffer.from(mac), Buffer.from(good))) return false;
  const exp = Number(payload.split('.')[1]);
  return Number.isFinite(exp) && exp > Math.floor(Date.now() / 1000);
}

export const cookieOpts = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax' as const,
  path: '/admin',
  maxAge: SESSION_TTL_S,
};

export const stateCookieOpts = { ...cookieOpts, maxAge: 600 };

// ---- Google OAuth (authorization code flow) -----------------------------

/** the URL to bounce the browser to, plus the state to stash in a cookie */
export function oauthStart(): { url: string; state: string } {
  const state = randomBytes(16).toString('hex');
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', CLIENT_ID);
  url.searchParams.set('redirect_uri', REDIRECT_URI);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email');
  url.searchParams.set('state', state);
  url.searchParams.set('prompt', 'select_account');
  return { url: url.toString(), state };
}

function decodeJwtPayload(jwt: string): Record<string, unknown> {
  const part = jwt.split('.')[1] ?? '';
  return JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));
}

/**
 * Exchange the code at Google's token endpoint (server-to-server, over TLS,
 * authenticated with the client secret) and return the signed-in email if it
 * is verified and on the allowlist, else null.
 */
export async function oauthFinish(code: string): Promise<string | null> {
  let idToken: string;
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { id_token?: string };
    if (!json.id_token) return null;
    idToken = json.id_token;
  } catch {
    return null;
  }

  let claims: Record<string, unknown>;
  try {
    claims = decodeJwtPayload(idToken);
  } catch {
    return null;
  }

  const iss = String(claims.iss ?? '');
  const aud = String(claims.aud ?? '');
  const exp = Number(claims.exp ?? 0);
  const email = String(claims.email ?? '').toLowerCase();
  const emailVerified = claims.email_verified === true || claims.email_verified === 'true';

  if (iss !== 'https://accounts.google.com' && iss !== 'accounts.google.com') return null;
  if (aud !== CLIENT_ID) return null;
  if (!(exp > Math.floor(Date.now() / 1000))) return null;
  if (!emailVerified || email !== ALLOWED_EMAIL) return null;

  return email;
}

// ---- same-origin guard (CSRF, for the save POST) ----------------------
//
// The session cookie is SameSite=Lax so it is not sent on a cross-site POST;
// this is the belt to that suspenders. Accept a request only if its Origin (or
// failing that, Referer) host matches the host it was sent to. A request with
// neither header is not a browser form post and is let through.

export function sameOrigin(request: Request): boolean {
  const target = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
  const src = request.headers.get('origin') || request.headers.get('referer') || '';
  if (!src) return true;
  try {
    return new URL(src).host === target;
  } catch {
    return false;
  }
}

export function newNoteTemplate(slug: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const title = slug.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());
  return `---
title: ${title}
summary: One line. What the reader gets from spending time on this.
date: ${today}
tracks: [infrastructure]
tech: []
draft: true
---

import Figure from '../../components/Figure.astro';

Opening sentence.

## The one diagram

<Figure wide caption="...">
  <svg viewBox="0 0 320 170" role="img" aria-label="...">
  </svg>
</Figure>

## The prose around it

...

## What is verified vs assumed

...
`;
}
