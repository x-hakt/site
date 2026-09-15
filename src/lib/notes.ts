import { readFile, readdir, mkdir, rename, writeFile, unlink } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import path from 'node:path';
import yaml from 'js-yaml';
import { noteSchema, type NoteData } from './note-schema';

export const CONTENT_DIR = path.resolve(process.env.CONTENT_DIR || 'src/content/notes');
export const DRAFT_DIR = path.resolve(process.env.DRAFT_DIR || path.join(CONTENT_DIR, '../drafts'));
export const validSlug = (slug: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 80;
export const revision = (raw: string | null) => createHash('sha256').update(raw ?? '').digest('hex');
export interface Note { id: string; data: NoteData; body: string; raw: string }
export function parseNote(id: string, raw: string): Note {
  raw = raw.replace(/\r\n/g, '\n');
  const match = raw.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  if (!match) throw new Error('Start the note with YAML frontmatter between --- lines.');
  return { id, raw, data: noteSchema.parse(yaml.load(match[1])), body: raw.slice(match[0].length) };
}
export function withStatus(raw: string, draft: boolean): string {
  const note = parseNote('note', raw);
  return '---\n' + yaml.dump({ ...note.data, draft }, { lineWidth: -1 }) + '---\n' + note.body;
}
async function fileFor(dir: string, slug: string): Promise<string> {
  if (!validSlug(slug)) throw new Error('Bad slug.');
  for (const ext of ['.mdx', '.md']) {
    const file = path.join(dir, slug + ext);
    try { await readFile(file); return file; } catch (e: any) { if (e.code !== 'ENOENT') throw e; }
  }
  return path.join(dir, slug + '.mdx');
}
async function readFrom(dir: string, slug: string): Promise<string | null> {
  try { return await readFile(await fileFor(dir, slug), 'utf8'); }
  catch (e: any) { if (e.code === 'ENOENT') return null; throw e; }
}
export const readPublishedSource = (slug: string) => readFrom(CONTENT_DIR, slug);
export const readDraftSource = (slug: string) => readFrom(DRAFT_DIR, slug);
export async function readWorkingSource(slug: string): Promise<string | null> {
  return await readDraftSource(slug) ?? await readPublishedSource(slug);
}
async function slugs(dir: string): Promise<string[]> {
  try { return (await readdir(dir)).filter(f => /\.mdx?$/.test(f)).map(f => f.replace(/\.mdx?$/, '')).filter(validSlug); }
  catch (e: any) { if (e.code === 'ENOENT') return []; throw e; }
}
export async function publishedNotes(): Promise<Note[]> {
  const notes: Note[] = [];
  for (const slug of await slugs(CONTENT_DIR)) {
    const raw = await readPublishedSource(slug);
    if (raw === null) continue;
    // Drafts with incomplete metadata must not take public pages down.
    const fm = raw.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---/);
    try {
      if (fm && (yaml.load(fm[1]) as any)?.draft === true) continue;
      const note = parseNote(slug, raw);
      if (!note.data.draft) notes.push(note);
    } catch (e) { console.error('[notes] Skipping invalid note', slug); }
  }
  return notes.sort((a,b) => b.data.date.valueOf() - a.data.date.valueOf() || a.id.localeCompare(b.id));
}
export async function editorNotes() {
  const ids = new Set([...await slugs(CONTENT_DIR), ...await slugs(DRAFT_DIR)]);
  return Promise.all([...ids].map(async slug => {
    const raw = (await readWorkingSource(slug))!;
    const publicRaw = await readPublishedSource(slug);
    let title = slug, date = '', draft = true, live = false, problem = '';
    try { const n = parseNote(slug, raw); title = n.data.title; date = n.data.date.toISOString().slice(0,10); draft = n.data.draft; }
    catch (e) { problem = 'Needs frontmatter repair'; }
    try { live = publicRaw !== null && !parseNote(slug, publicRaw).data.draft; } catch {}
    return { slug, title, date, draft, live, problem };
  }));
}
export async function atomicWrite(file: string, raw: string) {
  await mkdir(path.dirname(file), { recursive: true });
  const temp = file + '.' + randomUUID() + '.tmp';
  try { await writeFile(temp, raw, 'utf8'); await rename(temp, file); }
  finally { await unlink(temp).catch(() => {}); }
}
// Serialize edits, including Git operations; stale forms fail before writing.
let queue: Promise<unknown> = Promise.resolve();
export function serialize<T>(work: () => Promise<T>): Promise<T> {
  const next = queue.then(work, work);
  queue = next.catch(() => {});
  return next;
}
export async function saveDraft(slug: string, raw: string) {
  const file = await fileFor(DRAFT_DIR, slug);
  await atomicWrite(file, withStatus(raw, true));
  return file;
}
export async function publishNote(slug: string, raw: string) {
  const file = await fileFor(CONTENT_DIR, slug);
  await atomicWrite(file, withStatus(raw, false));
  const draft = await fileFor(DRAFT_DIR, slug);
  await unlink(draft).catch((e) => { if (e.code !== 'ENOENT') throw e; });
  return [file, draft];
}
