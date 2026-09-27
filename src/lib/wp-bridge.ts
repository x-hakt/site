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
import { readFile, readdir, stat, access } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import yaml from 'js-yaml';
import path from 'node:path';
import { fromHtml } from 'hast-util-from-html';
import { toHtml } from 'hast-util-to-html';
import { CONTENT_DIR, DRAFT_DIR, validSlug } from './notes';
import { glossary } from '../glossary';

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
      case 'span': return term(n) ?? inner();
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
    } else if (tag === 'figure') {
      out.push(figure(n));
    } else if (tag === 'svg') {
      out.push(figureOf(jsx(n), ''));
    } else if (tag === 'iframe') {
      const e = embed(n);
      if (e) out.push(e);
    } else if (tag === 'div' || tag === 'section' || tag === 'article') {
      out.push(...blocks(n.children, depth));
    } else if (tag === 'table') {
      out.push(table(n));
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

const BLOCK = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'blockquote', 'pre', 'hr', 'figure', 'div', 'section', 'article', 'table', 'svg', 'iframe']);

// ---- PLN-25: rich content (figures with SVG diagrams, images, YouTube, tables) ------------

let usesFigure = false;
let usesTerm = false;

/** <span data-term="ssh" [data-term-def="..."]>SSH</span> -> <Term k="ssh">SSH</Term>. A key that
 *  isn't in the glossary needs its own definition; without one it stays plain text, so a new
 *  word can never break the page. */
function term(n: Node): string | null {
  const key = String(n.properties?.dataTerm ?? '').trim().toLowerCase();
  if (!key) return null;
  if (!/^[a-z0-9-]{1,40}$/.test(key)) return inline(n.children);
  const def = String(n.properties?.dataTermDef ?? '').replace(/\s+/g, ' ').trim().slice(0, 400);
  if (!glossary[key] && !def) return inline(n.children);
  usesTerm = true;
  const text = inline(n.children).trim();
  const defAttr = !glossary[key] && def ? ` def="${attr(def)}"` : '';
  return `<Term k="${key}"${defAttr}>${text}</Term>`;
}
const ACTIVE = /^(on|style$|xmlns:xlink$)/i;

/** A hast subtree as JSX-safe markup: no scripts or foreign content, no inline styles or event
 *  handlers, braces escaped (MDX reads { } as code), void elements self-closed. */
function jsx(n: Node): string {
  const clean = (x: Node): Node | null => {
    if (x.type === 'element') {
      if (['script', 'style', 'foreignObject', 'iframe', 'object', 'embed'].includes(x.tagName!)) return null;
      const props = Object.fromEntries(Object.entries(x.properties ?? {}).filter(([k]) => !ACTIVE.test(k)));
      return { ...x, properties: props, children: (x.children ?? []).map(clean).filter(Boolean) as Node[] };
    }
    if (x.type === 'text') return { ...x, value: String(x.value ?? '') };
    return null;
  };
  const tree = clean(n);
  if (!tree) return '';
  const html = toHtml(tree as any, { closeSelfClosing: true, closeEmptyElements: true, allowDangerousCharacters: false });
  return html.replace(/[{}]/g, (c) => (c === '{' ? '&#123;' : '&#125;'));
}

const attr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/[{}]/g, '');

function figureOf(inner: string, caption: string): string {
  usesFigure = true;
  return `<Figure${caption ? ` caption="${attr(caption)}"` : ''}>\n${inner}\n</Figure>`;
}

function figure(n: Node): string {
  const kids = (n.children ?? []).filter((c) => c.type === 'element');
  const cap = kids.find((c) => c.tagName === 'figcaption');
  const caption = cap ? textOf(cap).replace(/\s+/g, ' ').trim() : '';
  const body = kids.filter((c) => c !== cap).map((c) => (c.tagName === 'img' ? jsx({ ...c, properties: { src: c.properties?.src, alt: c.properties?.alt ?? '' } }) : jsx(c))).join('\n');
  return body ? figureOf(body, caption) : caption ? escapeText(caption) : '';
}

const YOUTUBE = /^https:\/\/(www\.)?(youtube\.com|youtube-nocookie\.com)\/embed\/[\w-]+/i;
function embed(n: Node): string {
  const src = String(n.properties?.src ?? '');
  if (!YOUTUBE.test(src)) return '';
  return `<iframe src="${attr(src)}" width="640" height="360" title="YouTube video" loading="lazy" allowfullscreen style={{maxWidth: '100%', border: 0}}></iframe>`;
}

function table(n: Node): string {
  const rows: Node[] = [];
  const walk = (x: Node) => { for (const c of x.children ?? []) { if (c.type === 'element' && c.tagName === 'tr') rows.push(c); else if (c.type === 'element') walk(c); } };
  walk(n);
  if (!rows.length) return '';
  const cells = (r: Node) => (r.children ?? []).filter((c) => c.type === 'element' && (c.tagName === 'td' || c.tagName === 'th')).map((c) => inline(c.children).trim().replace(/\|/g, '\\|') || ' ');
  const [head, ...body] = rows;
  const h = cells(head);
  const line = (xs: string[]) => `| ${[...xs, ...Array(Math.max(0, h.length - xs.length)).fill(' ')].slice(0, h.length).join(' | ')} |`;
  return [line(h), `| ${h.map(() => '---').join(' | ')} |`, ...body.map((r) => line(cells(r)))].join('\n');
}

export function htmlToMdx(html: string): string {
  usesFigure = false;
  usesTerm = false;
  const tree = fromHtml(html, { fragment: true }) as unknown as Node;
  const body = blocks(tree.children).join('\n\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
  const imports = [
    usesFigure ? "import Figure from '../../components/Figure.astro';" : '',
    usesTerm ? "import Term from '../../components/Term.astro';" : '',
  ].filter(Boolean).join('\n');
  return (imports ? imports + '\n\n' : '') + body;
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


// ---- PLN-25: one note builder for creating AND previewing -----------------------------------

export class BridgeInputError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

const sydneyDate = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney' }).format(new Date());

/** Turn a WordPress-shaped post body into the note's MDX source. Throws BridgeInputError. */
export async function buildNote(body: any): Promise<{ raw: string; title: string; publish: boolean; wantedSlug: string }> {
  const title = typeof body?.title === 'string' ? body.title.trim() : String(body?.title?.raw ?? '').trim();
  const html = typeof body?.content === 'string' ? body.content : String(body?.content?.raw ?? '');
  if (title.length < 2) throw new BridgeInputError(400, 'rest_missing_title', 'A note needs a title.');
  if (!html.trim()) throw new BridgeInputError(400, 'rest_missing_content', 'A note needs content.');
  if (html.length > 1_000_000) throw new BridgeInputError(413, 'rest_too_large', 'Note exceeds the 1 MB limit.');
  const publish = body.status === 'publish';

  const trackIds = Array.isArray(body.categories) ? body.categories.map(Number) : [];
  const tracks = trackIds.map((id: number) => TRACKS[id - 1]).filter(Boolean);
  const known = new Map((await tags()).map((t) => [t.id, t.name]));
  const tech = (Array.isArray(body.tags) ? body.tags.map(Number) : []).map((id: number) => known.get(id)).filter(Boolean);

  let hero: { src: string; alt: string } | undefined;
  if (body.featured_media) {
    const id = String(body.featured_media);
    if (!validMediaId(id)) throw new BridgeInputError(400, 'rest_invalid_featured_media', 'Unknown featured image.');
    try { await access(path.join(MEDIA_DIR, id)); } catch { throw new BridgeInputError(400, 'rest_invalid_featured_media', 'Unknown featured image.'); }
    hero = { src: mediaUrl(id), alt: title };
  }

  const frontmatter = {
    title,
    summary: firstParagraph(html) || title,
    date: sydneyDate(),
    // the schema needs at least one track; the operator can change it in /admin
    tracks: tracks.length ? [...new Set(tracks)] : ['infrastructure'],
    tech: [...new Set(tech)],
    ...(hero ? { hero } : {}),
    draft: !publish,
  };
  const raw = '---\n' + yaml.dump(frontmatter, { lineWidth: -1 }) + '---\n\n' + htmlToMdx(html);
  const wantedSlug = typeof body.slug === 'string' && body.slug ? body.slug : slugify(title);
  return { raw, title, publish, wantedSlug };
}

// Short-lived previews: POST /wp-json/wp/v2/preview stores the built note under an unguessable
// token; /bridge-preview/<token> renders it with the real note page. Memory only, 30 minutes.
const PREVIEW_TTL_MS = 30 * 60_000;
const previews = new Map<string, { raw: string; at: number }>();
export function storePreview(raw: string): string {
  const now = Date.now();
  for (const [k, v] of previews) if (now - v.at > PREVIEW_TTL_MS) previews.delete(k);
  while (previews.size >= 100) previews.delete(previews.keys().next().value!);
  const token = randomBytes(24).toString('base64url');
  previews.set(token, { raw, at: now });
  return token;
}
export function readPreview(token: string): string | null {
  const p = previews.get(token);
  if (!p || Date.now() - p.at > PREVIEW_TTL_MS) return null;
  return p.raw;
}
