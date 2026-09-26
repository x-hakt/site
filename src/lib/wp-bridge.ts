/*
  PLN-12 — a WordPress-shaped doorway so the content planner (Postiz, planner.x-hakt.com) can
  hand x-hakt a note. Postiz's WordPress connector only speaks the WP REST API, so these
  routes answer the handful of calls it makes:

    GET  /wp-json/wp/v2/users/me      connection check
    GET  /wp-json/wp/v2/types         one post type: notes
    GET  /wp-json/wp/v2/categories    the note tracks
    GET  /wp-json/wp/v2/tags          the tech tags already used on notes
    POST /wp-json/wp/v2/media         a hero image (raw body)
    POST /wp-json/wp/v2/notes         the note: status publish -> live, anything else -> draft

  Create-only: nothing here edits, overwrites or deletes a note. A clashing slug gets -2, -3.
  Notes are written through the same functions and git sync as /admin. Off (404) unless
  WP_BRIDGE_USER and WP_BRIDGE_PASSWORD are set; Basic auth with those, compared in constant
  time, with failed attempts throttled per address.
*/
import { createHash, timingSafeEqual } from 'node:crypto';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fromHtml } from 'hast-util-from-html';
import { CONTENT_DIR, DRAFT_DIR, validSlug } from './notes';

type Node = { type: string; tagName?: string; value?: string; properties?: Record<string, unknown>; children?: Node[] };

export const TRACKS = ['standards', 'control', 'infrastructure', 'workstation'] as const;
export const MEDIA_DIR = path.resolve(process.env.MEDIA_DIR || path.join(CONTENT_DIR, '../media'));
const SITE_URL = (process.env.SITE_URL ?? 'https://x-hakt.com').replace(/\/$/, '');

// ---- auth ----------------------------------------------------------------------------------

export function bridgeEnabled(): boolean {
  return Boolean(process.env.WP_BRIDGE_USER && process.env.WP_BRIDGE_PASSWORD);
}

const failures = new Map<string, number[]>();
const WINDOW_MS = 15 * 60_000;
const MAX_FAILURES = 10;

const same = (a: string, b: string) => {
  const x = createHash('sha256').update(a).digest();
  const y = createHash('sha256').update(b).digest();
  return timingSafeEqual(x, y);
};

/** The caller's address for throttling. Traefik appends the real peer as the LAST
 *  X-Forwarded-For hop; earlier hops are client-supplied and can't be trusted. */
export function addressOf(request: Request, clientAddress: string): string {
  const hops = (request.headers.get('x-forwarded-for') ?? '').split(',').map((h) => h.trim()).filter(Boolean);
  return hops.at(-1) || clientAddress || 'unknown';
}

/** null when the request may proceed, else the Response to send. */
export function guard(request: Request, clientAddress: string): Response | null {
  if (!bridgeEnabled()) return json({ code: 'rest_no_route', message: 'Not found' }, 404);
  const now = Date.now();
  const recent = (failures.get(clientAddress) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_FAILURES) return json({ code: 'too_many_attempts', message: 'Too many failed logins. Try later.' }, 429);
  const header = request.headers.get('authorization') ?? '';
  const m = /^Basic\s+(.+)$/i.exec(header);
  let ok = false;
  if (m) {
    const decoded = Buffer.from(m[1], 'base64').toString('utf8');
    const i = decoded.indexOf(':');
    if (i > 0) {
      // evaluate both so timing doesn't reveal which half was wrong
      const userOk = same(decoded.slice(0, i), process.env.WP_BRIDGE_USER!);
      const passOk = same(decoded.slice(i + 1), process.env.WP_BRIDGE_PASSWORD!);
      ok = userOk && passOk;
    }
  }
  if (ok) {
    failures.delete(clientAddress);
    return null;
  }
  recent.push(now);
  failures.set(clientAddress, recent);
  return json({ code: 'rest_not_logged_in', message: 'Invalid username or application password.' }, 401);
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'private, no-store', 'x-robots-tag': 'noindex' },
  });
}

// ---- stable numeric ids (WordPress clients expect numbers for terms) ----------------------

export const termId = (name: string) => parseInt(createHash('sha256').update(name).digest('hex').slice(0, 7), 16);

export const categories = () => TRACKS.map((name, i) => ({ id: i + 1, name, slug: name, count: 0 }));

/** tech values used on any note or draft, as WordPress tags */
export async function tags() {
  const names = new Set<string>();
  for (const dir of [CONTENT_DIR, DRAFT_DIR]) {
    let files: string[] = [];
    try { files = (await readdir(dir)).filter((f) => /\.mdx?$/.test(f)); } catch { continue; }
    for (const f of files) {
      const raw = await readFile(path.join(dir, f), 'utf8');
      const m = /^tech:\s*\[([^\]]*)\]/m.exec(raw);
      if (m) for (const t of m[1].split(',')) { const v = t.trim().replace(/^['"]|['"]$/g, ''); if (v) names.add(v); }
    }
  }
  return [...names].sort().map((name) => ({ id: termId(name), name, slug: name, count: 0 }));
}

// ---- HTML (Postiz's editor) -> MDX ---------------------------------------------------------

// MDX treats { } < > as code/JSX; escape them in prose. Markdown specials only where they'd bite.
const escapeText = (s: string) => s.replace(/\\/g, '\\\\').replace(/([{}<>*_`[\]])/g, '\\$1');

function inline(nodes: Node[] = []): string {
  return nodes.map((n) => {
    if (n.type === 'text') return escapeText(String(n.value ?? '').replace(/\s+/g, ' '));
    if (n.type !== 'element') return '';
    const inner = () => inline(n.children);
    switch (n.tagName) {
      case 'strong': case 'b': { const t = inner().trim(); return t ? `**${t}**` : ''; }
      case 'em': case 'i': { const t = inner().trim(); return t ? `*${t}*` : ''; }
      case 's': case 'del': case 'strike': { const t = inner().trim(); return t ? `~~${t}~~` : ''; }
      case 'code': return '`' + String(textOf(n)).replace(/`/g, "'") + '`';
      case 'br': return '\\\n';
      case 'a': {
        const href = String(n.properties?.href ?? '');
        const t = inner().trim() || href;
        return /^(https?:|mailto:|\/|#)/.test(href) ? `[${t}](${href.replace(/\)/g, '%29')})` : t;
      }
      case 'img': return image(n);
      default: return inner();
    }
  }).join('');
}

const textOf = (n: Node): string => (n.type === 'text' ? String(n.value ?? '') : (n.children ?? []).map(textOf).join(''));

function image(n: Node): string {
  const src = String(n.properties?.src ?? '');
  if (!/^(https?:|\/)/.test(src)) return '';
  const alt = escapeText(String(n.properties?.alt ?? '')).replace(/\n/g, ' ');
  return `![${alt}](${src.replace(/\)/g, '%29')})`;
}

function blocks(nodes: Node[] = [], depth = 0): string[] {
  const out: string[] = [];
  let loose: Node[] = [];
  const flush = () => { const t = inline(loose).trim(); if (t) out.push(t); loose = []; };
  for (const n of nodes) {
    if (n.type === 'text' || (n.type === 'element' && !BLOCK.has(n.tagName!))) { loose.push(n); continue; }
    if (n.type !== 'element') continue;
    flush();
    const tag = n.tagName!;
    if (/^h[1-6]$/.test(tag)) {
      // the note title is the page's h1; body headings start at ##
      const level = Math.min(6, Math.max(2, Number(tag[1]) + (tag === 'h1' ? 1 : 0)));
      const t = inline(n.children).trim();
      if (t) out.push('#'.repeat(level) + ' ' + t);
    } else if (tag === 'p') {
      const t = inline(n.children).trim();
      if (t) out.push(t);
    } else if (tag === 'ul' || tag === 'ol') {
      out.push(list(n, depth));
    } else if (tag === 'blockquote') {
      const inner = blocks(n.children, depth).join('\n\n');
      if (inner) out.push(inner.split('\n').map((l) => (l ? '> ' + l : '>')).join('\n'));
    } else if (tag === 'pre') {
      const code = textOf(n).replace(/\n$/, '');
      const lang = String((n.children?.[0]?.properties?.className as string[] | undefined)?.find((c) => c.startsWith('language-'))?.slice(9) ?? '');
      const fence = code.includes('```') ? '~~~~' : '```';
      out.push(fence + lang + '\n' + code + '\n' + fence);
    } else if (tag === 'hr') {
      out.push('---');
    } else if (tag === 'figure' || tag === 'div' || tag === 'section' || tag === 'article') {
      out.push(...blocks(n.children, depth));
    } else if (tag === 'table') {
      const t = textOf(n).replace(/\s+/g, ' ').trim();
      if (t) out.push(escapeText(t));
    }
  }
  flush();
  return out;
}

function list(n: Node, depth: number): string {
  const ordered = n.tagName === 'ol';
  const items = (n.children ?? []).filter((c) => c.type === 'element' && c.tagName === 'li');
  const pad = '   '.repeat(depth);
  return items.map((li, i) => {
    const nested = (li.children ?? []).filter((c) => c.type === 'element' && (c.tagName === 'ul' || c.tagName === 'ol'));
    const rest = (li.children ?? []).filter((c) => !nested.includes(c));
    const text = blocks(rest, depth).join(' ').trim();
    const marker = ordered ? `${i + 1}.` : '-';
    const sub = nested.map((l) => '\n' + list(l, depth + 1)).join('');
    return `${pad}${marker} ${text}${sub}`;
  }).join('\n');
}

const BLOCK = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'blockquote', 'pre', 'hr', 'figure', 'div', 'section', 'article', 'table']);

export function htmlToMdx(html: string): string {
  const tree = fromHtml(html, { fragment: true }) as unknown as Node;
  return blocks(tree.children).join('\n\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

/** the first paragraph's plain text, for the summary (Postiz sends no excerpt) */
export function firstParagraph(html: string): string {
  const tree = fromHtml(html, { fragment: true }) as unknown as Node;
  const find = (nodes: Node[] = []): Node | undefined => {
    for (const n of nodes) {
      if (n.type === 'element' && n.tagName === 'p' && textOf(n).trim()) return n;
      const deeper = find(n.children);
      if (deeper) return deeper;
    }
  };
  const p = find(tree.children);
  const text = (p ? textOf(p) : textOf(tree)).replace(/\s+/g, ' ').trim();
  return text.length > 300 ? text.slice(0, 299).replace(/\s+\S*$/, '') + '…' : text;
}

// ---- slugs and media -------------------------------------------------------------------------

export function slugify(s: string): string {
  return s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 72).replace(/-+$/, '') || 'note';
}

const exists = async (file: string) => { try { await stat(file); return true; } catch { return false; } };

/** a slug no note or draft uses yet (create-only: never overwrite) */
export async function freeSlug(wanted: string): Promise<string> {
  const base = validSlug(wanted) ? wanted : slugify(wanted);
  for (let n = 1; n < 100; n++) {
    const slug = n === 1 ? base : `${base}-${n}`;
    const taken = await Promise.all([CONTENT_DIR, DRAFT_DIR].flatMap((d) => ['.mdx', '.md'].map((e) => exists(path.join(d, slug + e)))));
    if (!taken.some(Boolean)) return slug;
  }
  throw new Error('No free slug');
}

export const IMAGE_TYPES: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' };
export const MAX_MEDIA_BYTES = 10 * 1024 * 1024;

/** media ids are their path under MEDIA_DIR, e.g. "2026-09/3f2a9c1b-hero.webp" */
export const validMediaId = (id: string) => /^\d{4}-\d{2}\/[a-f0-9]{8}-[a-z0-9-]{1,60}\.(png|jpg|webp|gif)$/.test(id);
export const mediaUrl = (id: string) => `/media/${id}`;
export const siteUrl = (p: string) => SITE_URL + p;
