import assert from 'node:assert/strict';
import { mkdtemp, cp, rm, readFile, writeFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHmac, createHash } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';

const root = await mkdtemp(path.join(tmpdir(), 'xh25-'));
const notes = path.join(root, 'notes');
await cp('src/content/notes', notes, { recursive: true });
const exec = promisify(execFile);
const git = (...args) => exec('git', args, { cwd: root });
await git('init', '-b', 'main');
await git('config', 'user.name', 'Pipeline test');
await git('config', 'user.email', 'test@example.com');
await git('init', '--bare', path.join(root, 'remote.git'));
await git('remote', 'add', 'origin', path.join(root, 'remote.git'));
await git('add', 'notes');
await git('commit', '-m', 'Initial notes');
await writeFile(path.join(root,'unrelated.txt'),'Unrelated staged work');
await git('add','unrelated.txt');
const port = Number(process.env.TEST_PORT || 44326);
const base = 'http://127.0.0.1:' + port;
const secret = 'isolated-content-test';
const payload = 'v1.' + (Math.floor(Date.now()/1000)+3600) + '.' + Buffer.from('test@example.com').toString('base64url');
const cookie = 'xh_admin=' + payload + '.' + createHmac('sha256',secret).update(payload).digest('base64url');
const hash = raw => createHash('sha256').update(raw ?? '').digest('hex');
let logs = '';
const server = spawn(process.execPath, [path.resolve('dist/server/entry.mjs')], {
  cwd: root,
  env: { ...process.env, HOST:'127.0.0.1', PORT:String(port), CONTENT_DIR:notes,
    DRAFT_DIR:path.join(root,'drafts'), GOOGLE_CLIENT_ID:'test', GOOGLE_CLIENT_SECRET:'test',
    ADMIN_SESSION_SECRET:secret, CONTENT_GIT:'on' },
  stdio:['ignore','pipe','pipe'],
});
server.stdout.on('data',b=>logs+=b);
server.stderr.on('data',b=>logs+=b);
const get = (route, authed=false) => fetch(base+route, { headers:authed ? { cookie } : {}, redirect:'manual' });
const fixture = (title,body='A private thought.') => `---
title: "${title}"
summary: "Draft workflow test"
date: 2026-09-15
tracks: [infrastructure]
tech: [pipeline-test]
draft: true
---

import Figure from '../../components/Figure.astro';
import Term from '../../components/Term.astro';

# A diagram

${body}

<Figure caption="Test diagram" wide><svg viewBox="0 0 100 100" role="img" aria-label="Test diagram"><rect width="10" height="10" /></svg></Figure>

<Term k="ssh">SSH</Term>

| One | Two |
| --- | --- |
| A | B |
`;
async function save(slug, content, revision, action='draft', extra={}) {
  const form = new FormData();
  for (const [key,value] of Object.entries({slug,content,revision,action})) form.set(key,value);
  const r = await fetch(base+'/admin/save', { method:'POST', headers:{ cookie, origin:base, ...extra },body:form });
  return { status:r.status, body:await r.json() };
}
const surfaces = ['/', '/page/2', '/map', '/search.json', '/rss.xml', '/sitemap.xml'];
async function invisible(marker) {
  for (const route of surfaces) assert.ok(!(await (await get(route)).text()).includes(marker), marker+' leaked into '+route);
}
try {
  for (let i=0;i<100;i++) {
    try { if ((await get('/')).ok) break; } catch {}
    if (i===99) throw new Error('Server did not start: '+logs);
    await delay(100);
  }
  for (const f of await readdir(notes)) {
    const response = await get('/notes/'+f.replace(/\.mdx?$/,''));
    assert.equal(response.status,200,f);
    const html = await response.text();
    assert.ok(!html.includes('[object Object]'),f);
    assert.ok(html.includes('figure__frame'),f+' diagram missing');
  }
  console.log('PASS: all existing notes render with diagrams');
  const a = fixture('Unpublished alpha marker'), b=fixture('Unpublished beta marker');
  // A new file appears after the server starts, without rebuilding.
  await writeFile(path.join(notes,'test-alpha.mdx'),a);
  await writeFile(path.join(notes,'test-beta.mdx'),b);
  assert.equal((await get('/admin/preview/test-alpha')).status,302);
  assert.equal((await get('/notes/test-alpha')).status,404);
  const index = await (await get('/admin',true)).text();
  assert.ok(index.includes('Unpublished alpha marker') && index.includes('Unpublished beta marker'));
  const preview = await get('/admin/preview/test-alpha',true);
  assert.equal(preview.status,200);
  assert.equal(preview.headers.get('cache-control'),'private, no-store');
  assert.equal(preview.headers.get('x-robots-tag'),'noindex, nofollow');
  const html = await preview.text();
  assert.ok(html.includes('figure__frame') && html.includes('term__pop') && html.includes('<table>'));
  await invisible('Unpublished alpha marker');
  console.log('PASS: multiple on-disk drafts, styled preview, authentication and public exclusion');
  let result = await save('test-alpha',a.replace('A private thought.','Changed privately.'),hash(a));
  assert.equal(result.status,200,JSON.stringify(result.body));
  const draft = result.body;
  assert.equal((await get('/notes/test-alpha')).status,404);
  assert.equal((await save('test-alpha',a,hash(a))).status,409);
  assert.equal((await save('test-alpha',draft.content,draft.revision,'draft',{origin:'https://other.example'})).status,403);
  const [publish, reads] = await Promise.all([
    save('test-alpha',draft.content,draft.revision,'publish'),
    Promise.all(Array.from({length:20},()=>get('/notes/a-key-with-one-job'))),
  ]);
  assert.ok(reads.every(r=>r.status===200),'Public service interrupted during publish');
  assert.equal(publish.status,200,JSON.stringify(publish.body));
  assert.equal((await get('/notes/test-alpha')).status,200);
  for (const route of ['/', '/map', '/search.json', '/rss.xml', '/sitemap.xml', '/tech/pipeline-test']) {
    assert.ok((await (await get(route)).text()).includes(route==='/sitemap.xml'?'test-alpha':'Unpublished alpha marker'),route);
  }
  const publicBefore = await (await get('/notes/test-alpha')).text();
  result = await save('test-alpha',publish.body.content.replace('Changed privately.','PRIVATE REVISION MARKER'),publish.body.revision);
  assert.equal(result.status,200);
  const publicAfter = await (await get('/notes/test-alpha')).text();
  assert.equal(publicAfter,publicBefore,'Saving a revision changed the live note');
  assert.ok((await (await get('/admin/preview/test-alpha',true)).text()).includes('PRIVATE REVISION MARKER'));
  await invisible('PRIVATE REVISION MARKER');
  console.log('PASS: explicit publish updates every public surface; private revisions preserve live content; stale edit and CSRF guards');
  const broken = fixture('Broken draft','<UnknownComponent />');
  const savedBroken = await save('test-broken',broken,hash(null));
  assert.equal(savedBroken.status,200);
  assert.equal((await get('/admin/preview/test-broken',true)).status,422);
  const failedPublish = await save('test-broken',savedBroken.body.content,savedBroken.body.revision,'publish');
  assert.equal(failedPublish.status,422);
  assert.equal((await get('/notes/test-broken')).status,404);
  assert.ok((await readFile(path.join(root,'drafts/test-broken.mdx'),'utf8')).includes('UnknownComponent'));
  assert.equal((await get('/page/999')).status,404);
  assert.equal((await get('/tech/does-not-exist')).status,404);
  console.log('PASS: broken preview/publication preserves draft and public site; invalid routes return 404');
  const raced = await Promise.all([
    save('test-race',fixture('Race one'),hash(null)),
    save('test-race',fixture('Race two'),hash(null)),
  ]);
  assert.deepEqual(raced.map(r=>r.status).sort(),[200,409]);
  assert.equal((await git('diff','--cached','--name-only')).stdout.trim(),'unrelated.txt');
  assert.equal((await git('ls-tree','--name-only','HEAD','unrelated.txt')).stdout.trim(),'');
  const remoteHead = (await git('ls-remote','origin','refs/heads/main')).stdout.split('\t')[0];
  assert.equal(remoteHead,(await git('rev-parse','HEAD')).stdout.trim());
  await git('remote','set-url','origin',path.join(root,'missing-remote.git'));
  const localOnly = await save('test-offline',fixture('Offline draft'),hash(null));
  assert.equal(localOnly.status,200);
  assert.ok(localOnly.body.warning.includes('Git sync failed'));
  assert.ok((await readFile(path.join(root,'drafts/test-offline.mdx'),'utf8')).includes('Offline draft'));
  console.log('PASS: concurrent saves, uninterrupted public reads, scoped Git commits/push and remote-failure recovery');
} catch(e) {
  console.error(logs);
  throw e;
} finally {
  server.kill('SIGTERM');
  await new Promise(resolve=>server.on('exit',resolve));
  await rm(root,{recursive:true,force:true});
}
