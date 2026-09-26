// PLN-12: the WordPress-shaped bridge, against the built server with throwaway content and a
// throwaway git remote. Exercises exactly the calls Postiz's WordPress connector makes.
//   npm run build && node test/wp-bridge.mjs
import assert from 'node:assert/strict';
import { mkdtemp, cp, readFile, readdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { setTimeout as delay } from 'node:timers/promises';

const exec = promisify(execFile);
const root = await mkdtemp(path.join(tmpdir(), 'pln12-'));
const notes = path.join(root, 'notes');
await cp('src/content/notes', notes, { recursive: true });
const git = (...args) => exec('git', args, { cwd: root });
await git('init', '-b', 'main');
await git('config', 'user.name', 'Bridge test');
await git('config', 'user.email', 'test@example.com');
await git('init', '--bare', path.join(root, 'remote.git'));
await git('remote', 'add', 'origin', path.join(root, 'remote.git'));
await git('add', 'notes');
await git('commit', '-m', 'Initial notes');

const port = Number(process.env.TEST_PORT || 44327);
const base = 'http://127.0.0.1:' + port;
let logs = '';
const server = spawn(process.execPath, [path.resolve('dist/server/entry.mjs')], {
  cwd: root,
  env: { ...process.env, HOST: '127.0.0.1', PORT: String(port), CONTENT_DIR: notes, DRAFT_DIR: path.join(root, 'drafts'),
    MEDIA_DIR: path.join(root, 'media'), CONTENT_GIT: 'on', WP_BRIDGE_USER: 'planner', WP_BRIDGE_PASSWORD: 'test pass word 123' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
server.stdout.on('data', (b) => (logs += b));
server.stderr.on('data', (b) => (logs += b));
const auth = (user = 'planner', pass = 'test pass word 123') => ({ authorization: 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64') });
const wp = (route, init = {}) => fetch(base + '/wp-json/wp/v2' + route, { ...init, headers: { ...auth(), ...(init.headers ?? {}) } });
const post = (route, body) => wp(route, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

try {
  for (let i = 0; i < 100; i++) { try { await fetch(base + '/'); break; } catch { await delay(100); } }

  // connection + listings
  let r = await wp('/users/me');
  assert.equal(r.status, 200);
  assert.equal((await r.json()).name, 'x-hakt');
  assert.equal((await fetch(base + '/wp-json/wp/v2/users/me')).status, 401, 'no credentials');
  assert.equal((await fetch(base + '/wp-json/wp/v2/users/me', { headers: auth('planner', 'wrong') })).status, 401);
  const types = await (await wp('/types')).json();
  assert.deepEqual(Object.keys(types), ['notes']);
  assert.equal(types.notes.rest_base, 'notes');
  const cats = await (await wp('/categories?per_page=100')).json();
  assert.deepEqual(cats.map((c) => c.name), ['standards', 'control', 'infrastructure', 'workstation']);
  const tagList = await (await wp('/tags?per_page=100')).json();
  assert.ok(tagList.length > 0 && tagList.every((t) => Number.isInteger(t.id)), 'tags are the tech already on notes');

  // media
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  r = await wp('/media', { method: 'POST', headers: { 'content-type': 'image/png', 'content-disposition': 'attachment; filename="Hero Shot!.png"' }, body: png });
  assert.equal(r.status, 201);
  const media = await r.json();
  assert.match(media.id, /^\d{4}-\d{2}\/[a-f0-9]{8}-hero-shot\.png$/);
  const served = await fetch(base + '/media/' + media.id);
  assert.equal(served.status, 200);
  assert.equal(served.headers.get('content-type'), 'image/png');
  assert.deepEqual(Buffer.from(await served.arrayBuffer()), png);
  assert.equal((await wp('/media', { method: 'POST', headers: { 'content-type': 'text/html' }, body: '<script>' })).status, 415);
  assert.equal((await fetch(base + '/media/..%2F..%2Fetc%2Fpasswd')).status, 404);

  // a draft
  const html = '<h1>Why</h1><p>The ship {needed} a <strong>bosun</strong> &lt;now&gt; — see <a href="https://x-hakt.com/crew">the port</a>.</p><ul><li>one</li><li>two<ul><li>nested</li></ul></li></ul><pre><code class="language-bash">echo "{x}"</code></pre><p>Second para.</p>';
  const infra = cats.find((c) => c.name === 'infrastructure').id;
  r = await post('/notes', { title: 'Bridge test: a draft', content: html, slug: 'bridge-test-a-draft', status: 'draft', categories: [infra], tags: [tagList[0].id], featured_media: media.id });
  assert.equal(r.status, 201, logs);
  const draft = await r.json();
  assert.equal(draft.status, 'draft');
  assert.match(draft.link, /\/admin\/preview\/bridge-test-a-draft$/);
  const draftRaw = await readFile(path.join(root, 'drafts', 'bridge-test-a-draft.mdx'), 'utf8');
  assert.match(draftRaw, /^---\ntitle: 'Bridge test: a draft'\n/);
  assert.match(draftRaw, /draft: true/);
  assert.match(draftRaw, /tracks:\n  - infrastructure/);
  assert.match(draftRaw, new RegExp(`tech:\\n  - ${tagList[0].name}`));
  assert.match(draftRaw, new RegExp(`hero:\\n  src: /media/${media.id.replace('/', '\\/')}`));
  assert.match(draftRaw, /summary: The ship \{needed\} a bosun <now>/, 'summary is plain text');
  assert.match(draftRaw, /## Why/);
  assert.match(draftRaw, /The ship \\\{needed\\\} a \*\*bosun\*\* \\<now\\>/, 'MDX-sensitive characters escaped');
  assert.match(draftRaw, /\[the port\]\(https:\/\/x-hakt\.com\/crew\)/);
  assert.match(draftRaw, /- one\n- two\n   - nested/);
  assert.match(draftRaw, /```bash\necho "\{x\}"\n```/);
  assert.equal(existsSync(path.join(notes, 'bridge-test-a-draft.mdx')), false, 'a draft is not public');
  assert.equal((await fetch(base + '/notes/bridge-test-a-draft/')).status, 404);

  // a published note, and create-only slugs
  r = await post('/notes', { title: 'Bridge test: live', content: '<p>Out of the harbour.</p>', slug: 'bridge-test-a-draft', status: 'publish' });
  assert.equal(r.status, 201, logs);
  const live = await r.json();
  assert.equal(live.slug, 'bridge-test-a-draft-2', 'an existing slug is never overwritten');
  assert.match(live.link, /\/notes\/bridge-test-a-draft-2\/$/);
  const page = await fetch(base + '/notes/bridge-test-a-draft-2/');
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Out of the harbour\./);
  assert.match(await readFile(path.join(notes, 'bridge-test-a-draft-2.mdx'), 'utf8'), /tracks:\n  - infrastructure/, 'default track when none sent');

  // refusals
  assert.equal((await post('/posts', { title: 'Nope', content: '<p>x</p>' })).status, 404);
  assert.equal((await post('/notes', { title: 'x', content: '<p>x</p>' })).status, 400);
  assert.equal((await post('/notes', { title: 'No body', content: '' })).status, 400);
  assert.equal((await post('/notes', { title: 'Bad hero', content: '<p>x</p>', featured_media: '../../etc/passwd' })).status, 400);
  assert.equal((await wp('/notes/bridge-test-a-draft-2', { method: 'DELETE' })).status >= 400, true, 'no delete');

  // git: each write committed and pushed
  const { stdout } = await exec('git', ['--git-dir', path.join(root, 'remote.git'), 'log', '--format=%s', 'main']);
  assert.match(stdout, /bridge: publish bridge-test-a-draft-2/);
  assert.match(stdout, /bridge: draft bridge-test-a-draft/);
  assert.match(stdout, /bridge: media /);

  // throttling: 10 bad logins from one address, then 429 even with good credentials
  const from = { 'x-forwarded-for': 'spoofed, 203.0.113.9' };
  for (let i = 0; i < 10; i++) await fetch(base + '/wp-json/wp/v2/users/me', { headers: { ...auth('planner', 'bad'), ...from } });
  assert.equal((await fetch(base + '/wp-json/wp/v2/users/me', { headers: { ...auth(), ...from } })).status, 429);
  assert.equal((await fetch(base + '/wp-json/wp/v2/users/me', { headers: { ...auth(), 'x-forwarded-for': '203.0.113.10' } })).status, 200, 'other addresses unaffected');

  console.log('wp-bridge: all checks passed');
} finally {
  server.kill();
  await rm(root, { recursive: true, force: true });
}

// off unless configured
{
  const off = spawn(process.execPath, [path.resolve('dist/server/entry.mjs')], { env: { ...process.env, HOST: '127.0.0.1', PORT: String(port + 1), CONTENT_GIT: 'off', WP_BRIDGE_USER: '', WP_BRIDGE_PASSWORD: '' }, stdio: 'ignore' });
  try {
    let status = 0;
    for (let i = 0; i < 100 && !status; i++) { try { status = (await fetch(`http://127.0.0.1:${port + 1}/wp-json/wp/v2/users/me`, { headers: auth() })).status; } catch { await delay(100); } }
    assert.equal(status, 404, 'no credentials configured: the bridge does not exist');
    console.log('wp-bridge: off when unconfigured');
  } finally { off.kill(); }
}
