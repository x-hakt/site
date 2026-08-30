/*
  XH-6 — the /admin editor's server-only helpers: auth, a stateless signed
  session cookie, a crude in-memory rate limiter, and the note file I/O.

  Only ever imported from `prerender = false` routes under src/pages/admin/.
  Nothing here runs at build time.
*/
import { createHmac, timingSafeEqual, scryptSync, randomBytes } from 'node:crypto';
import { readFile, writeFile, readdir, access } from 'node:fs/promises';
import { constants as FS } from 'node:fs';
import path from 'node:path';

const PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH ?? '';
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET ?? '';
const CONTENT_DIR = process.env.CONTENT_DIR
  ? path.resolve(process.env.CONTENT_DIR)
  : path.resolve(process.cwd(), 'src/content/notes');

/** the editor is live only when both secrets are configured */
export function adminEnabled(): boolean {
  return PASSWORD_HASH.length > 0 && SESSION_SECRET.length > 0;
}

export const COOKIE = 'xh_admin';
const SESSION_TTL_S = 7 * 24 * 60 * 60;

// ---- password ------------------------------------------------------------

/** format: scrypt$<saltHex>$<hashHex> (generate with scripts/admin-hash.mjs) */
export function verifyPassword(plain: string): boolean {
  const [scheme, saltHex, hashHex] = PASSWORD_HASH.split('$');
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  let got: Buffer;
  try {
    got = scryptSync(plain, Buffer.from(saltHex, 'hex'), expected.length);
  } catch {
    return false;
  }
  return got.length === expected.length && timingSafeEqual(got, expected);
}

// ---- session cookie (stateless, HMAC-signed) -----------------------------

function sign(msg: string): string {
  return createHmac('sha256', SESSION_SECRET).update(msg).digest('base64url');
}

export function issueSession(): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_S;
  const payload = `v1.${exp}`;
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

// ---- rate limit (per-IP, in-memory; resets on restart) -------------------

const WINDOW_MS = 5 * 60 * 1000;
const MAX_TRIES = 8;
const attempts = new Map<string, number[]>();

export function rateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (attempts.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  attempts.set(ip, hits);
  return hits.length >= MAX_TRIES;
}

export function recordAttempt(ip: string): void {
  const hits = attempts.get(ip) ?? [];
  hits.push(Date.now());
  attempts.set(ip, hits);
}

export function clearAttempts(ip: string): void {
  attempts.delete(ip);
}

// ---- same-origin guard (CSRF) ------------------------------------------
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

// ---- note file I/O ------------------------------------------------------

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validSlug(slug: string): boolean {
  return SLUG_RE.test(slug) && slug.length <= 80;
}

function notePath(slug: string): string {
  const p = path.resolve(CONTENT_DIR, `${slug}.mdx`);
  // never escape the content dir
  if (path.dirname(p) !== CONTENT_DIR) throw new Error('bad slug');
  return p;
}

export interface NoteFile {
  slug: string;
  title: string;
  date: string;
  sea: string;
  draft: boolean;
}

const FM_TITLE = /^title:\s*(.+)$/m;
const FM_DATE = /^date:\s*(.+)$/m;
const FM_SEA = /^sea:\s*(.+)$/m;
const FM_DRAFT = /^draft:\s*true\s*$/m;

export async function listNotes(): Promise<NoteFile[]> {
  const files = (await readdir(CONTENT_DIR)).filter((f) => f.endsWith('.mdx') || f.endsWith('.md'));
  const out: NoteFile[] = [];
  for (const f of files) {
    const raw = await readFile(path.join(CONTENT_DIR, f), 'utf8');
    const fm = raw.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
    out.push({
      slug: f.replace(/\.mdx?$/, ''),
      title: (fm.match(FM_TITLE)?.[1] ?? f).replace(/^["']|["']$/g, '').trim(),
      date: (fm.match(FM_DATE)?.[1] ?? '').trim(),
      sea: (fm.match(FM_SEA)?.[1] ?? '').replace(/^["']|["']$/g, '').trim(),
      draft: FM_DRAFT.test(fm),
    });
  }
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

export async function readNote(slug: string): Promise<string> {
  return readFile(notePath(slug), 'utf8');
}

export async function noteExists(slug: string): Promise<boolean> {
  try {
    await access(notePath(slug), FS.F_OK);
    return true;
  } catch {
    return false;
  }
}

/** structural check only — the real gate is `astro build` succeeding after the write */
export function frontmatterProblem(content: string): string | null {
  const m = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return 'No frontmatter block (--- ... ---) at the top.';
  const fm = m[1];
  for (const key of ['title', 'summary', 'date', 'sea']) {
    if (!new RegExp(`^${key}:\\s*\\S`, 'm').test(fm)) return `Frontmatter is missing "${key}".`;
  }
  const date = fm.match(FM_DATE)?.[1]?.trim() ?? '';
  if (!/^\d{4}-\d{2}-\d{2}/.test(date.replace(/^["']|["']$/g, ''))) return `"date" must look like 2026-08-30 (got ${date || 'nothing'}).`;
  return null;
}

export async function writeNote(slug: string, content: string): Promise<void> {
  await writeFile(notePath(slug), content.replace(/\r\n/g, '\n'), 'utf8');
}

export function newNoteTemplate(slug: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const title = slug.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());
  return `---
title: ${title}
summary: One line. What this documents and why it matters.
date: ${today}
sea: The Mesh
waters: []
cargo: []
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

// ---- rebuild handshake with server.mjs ---------------------------------
//
// save.ts writes rebuild.request then exits the Astro server with code 75.
// server.mjs (the supervisor) rebuilds, commits + pushes on success or
// restores `prev` on failure, writes rebuild.result, and respawns.

export const STATE_DIR = process.env.ADMIN_STATE_DIR
  ? path.resolve(process.env.ADMIN_STATE_DIR)
  : path.resolve(process.cwd(), '.admin-state');

export interface RebuildRequest {
  slug: string;
  isNew: boolean;
  prev: string | null;
  commitMsg: string;
  at: string;
}

export interface RebuildResult {
  ok: boolean;
  slug: string;
  error?: string;
  at: string;
}

export async function requestRebuild(req: RebuildRequest): Promise<void> {
  await writeFile(path.join(STATE_DIR, 'rebuild.request'), JSON.stringify(req), 'utf8').catch(async () => {
    // state dir may not exist yet in dev
    const { mkdir } = await import('node:fs/promises');
    await mkdir(STATE_DIR, { recursive: true });
    await writeFile(path.join(STATE_DIR, 'rebuild.request'), JSON.stringify(req), 'utf8');
  });
}

export async function lastResult(): Promise<RebuildResult | null> {
  try {
    return JSON.parse(await readFile(path.join(STATE_DIR, 'rebuild.result'), 'utf8'));
  } catch {
    return null;
  }
}

export function newSalt(): string {
  return randomBytes(16).toString('hex');
}
