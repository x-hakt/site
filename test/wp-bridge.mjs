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

  // PLN-25: rich long-form content survives and renders
  const rich = '<p>Why the <em>fleet</em> needed a bell, and <code>{x}</code> &lt;now&gt;.</p>' +
    '<ol><li>first</li><li>second</li></ol>' +
    '<div data-html-block=""><figure><svg viewBox="0 0 100 40" role="img" aria-label="Two boxes" style="color:red" onload="x()"><rect x="1" y="1" width="40" height="30" fill="#26cb96"></rect><text x="5" y="20">{a} b</text><script>alert(1)</script></svg><figcaption>Two boxes, "one" line</figcaption></figure></div>' +
    '<div data-youtube-video=""><iframe src="https://www.youtube-nocookie.com/embed/abc123" allowfullscreen="true"></iframe></div>' +
    '<iframe src="https://evil.example/x"></iframe>' +
    '<table><thead><tr><th>Host</th><th>Disk</th></tr></thead><tbody><tr><td>main</td><td>44%</td></tr></tbody></table>';
  r = await post('/notes', { title: 'Bridge test: rich', content: rich, slug: 'bridge-test-rich', status: 'publish' });
  assert.equal(r.status, 201, logs);
  const richRaw = await readFile(path.join(notes, 'bridge-test-rich.mdx'), 'utf8');
  assert.match(richRaw, /import Figure from '\.\.\/\.\.\/components\/Figure\.astro';/);
  assert.match(richRaw, /<Figure caption="Two boxes, &quot;one&quot; line">\n<svg[^>]*viewBox="0 0 100 40"/);
  assert.doesNotMatch(richRaw, /onload|<script|style="color|evil\.example/);
  assert.match(richRaw, /<text x="5" y="20">&#123;a&#125; b<\/text>/, 'braces in SVG text escaped for MDX');
  assert.match(richRaw, /<rect[^>]*\/>/, 'SVG elements self-closed');
  assert.match(richRaw, /<iframe src="https:\/\/www\.youtube-nocookie\.com\/embed\/abc123"/);
  assert.match(richRaw, /1\. first\n2\. second/);
  assert.match(richRaw, /\*fleet\*/);
  assert.match(richRaw, /\| Host \| Disk \|\n\| --- \| --- \|\n\| main \| 44% \|/);
  const richPage = await (await fetch(base + '/notes/bridge-test-rich/')).text();
  assert.match(richPage, /<svg[^>]*viewBox="0 0 100 40"/, 'the figure renders on the real page');
  assert.match(richPage, /Two boxes, &quot;one&quot; line|Two boxes, "one" line/);
  assert.match(richPage, /youtube-nocookie\.com\/embed\/abc123/);
  assert.match(richPage, /<table>/);

  // glossary hovers: known key, new key with its own definition, new key without one
  r = await post('/notes', { title: 'Bridge test: terms', status: 'publish', content:
    '<p>Over <span data-term="ssh">SSH</span>, with a <span data-term="lifeboat-drill" data-term-def="Restoring a backup somewhere harmless to prove it really opens.">lifeboat drill</span> and a <span data-term="no-such-word">mystery</span>.</p>' });
  assert.equal(r.status, 201, logs);
  const termRaw = await readFile(path.join(notes, 'bridge-test-terms.mdx'), 'utf8');
  assert.match(termRaw, /import Term from '\.\.\/\.\.\/components\/Term\.astro';/);
  assert.match(termRaw, /<Term k="ssh">SSH<\/Term>/);
  assert.match(termRaw, /<Term k="lifeboat-drill" def="Restoring a backup somewhere harmless to prove it really opens\.">lifeboat drill<\/Term>/);
  // a key already in the glossary never carries an inline definition (the glossary wins)
  assert.doesNotMatch(termRaw, /<Term k="ssh" def=/);
  assert.match(termRaw, /and a mystery\./, 'unknown key without a definition stays plain text');
  const termPage = await (await fetch(base + '/notes/bridge-test-terms/')).text();
  assert.match(termPage, /class="term"[^>]*>SSH</);
  assert.match(termPage, /Restoring a backup somewhere harmless/);

  // PLN-25: the site preview renders a draft with the real page and writes nothing
  const before = (await readdir(path.join(root, 'drafts'))).length;
  r = await post('/preview', { title: 'Preview: a bell', content: rich });
  assert.equal(r.status, 200, logs);
  const { url } = await r.json();
  assert.match(url, /\/bridge-preview\/[\w-]{20,}$/);
  const previewUrl = base + new URL(url).pathname;
  const pv = await fetch(previewUrl);
  assert.equal(pv.status, 200);
  assert.equal(pv.headers.get('x-robots-tag'), 'noindex, nofollow');
  const pvHtml = await pv.text();
  assert.match(pvHtml, /Preview: a bell/);
  assert.match(pvHtml, /<svg[^>]*viewBox="0 0 100 40"/);
  assert.equal((await readdir(path.join(root, 'drafts'))).length, before, 'preview writes nothing');
  assert.equal((await fetch(base + '/bridge-preview/not-a-real-token-at-all-xx')).status, 404);
  assert.equal((await fetch(base + '/wp-json/wp/v2/preview', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })).status, 401);
  assert.equal((await post('/preview', { title: 'x', content: '<p>x</p>' })).status, 400, 'same validation as creating');

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
