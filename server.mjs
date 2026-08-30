/*
  XH-6 supervisor. Runs the Astro node server and owns the rebuild loop.

  Normal life: spawn `node dist/server/entry.mjs`, wait.
  A save (src/pages/admin/save.ts) writes .admin-state/rebuild.request and exits
  the Astro server with code 75. We then:
    - run `astro build`
    - on success: git add + commit + push, write rebuild.result{ok:true}
    - on failure: restore the previous note content (or delete a new file),
      rebuild clean, write rebuild.result{ok:false}
    - respawn the Astro server
  During the rebuild a tiny 503 "rebuilding" server holds the port so Traefik
  gets a clean answer instead of a connection refused.
*/
import { spawn } from 'node:child_process';
import { readFile, writeFile, rm, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';

const ROOT = import.meta.dirname;
const STATE_DIR = process.env.ADMIN_STATE_DIR || path.join(ROOT, '.admin-state');
const CONTENT_DIR = process.env.CONTENT_DIR || path.join(ROOT, 'src/content/notes');
const PORT = Number(process.env.PORT || 4321);
const HOST = process.env.HOST || '0.0.0.0';
const ENTRY = path.join(ROOT, 'dist/server/entry.mjs');

const log = (m) => console.log(`[supervisor] ${m}`);

function run(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    const p = spawn(cmd, args, { cwd: ROOT, stdio: 'inherit', ...opts });
    p.on('exit', (code) => resolve(code ?? 1));
    p.on('error', (e) => {
      console.error(`[supervisor] ${cmd} failed: ${e.message}`);
      resolve(1);
    });
  });
}

const build = async () => {
  log('astro build');
  return (await run('npm', ['run', 'build', '--silent'])) === 0;
};

async function commitAndPush(msg) {
  // Only the notes directory — never sweep up unrelated working-tree changes.
  await run('git', ['add', '--', CONTENT_DIR]);
  if ((await run('git', ['diff', '--cached', '--quiet'])) === 0) {
    log('nothing to commit');
    return;
  }
  if ((await run('git', ['commit', '-m', msg])) !== 0) {
    log('commit failed');
    return;
  }
  if ((await run('git', ['push', 'origin', 'HEAD'])) !== 0) {
    console.error('[supervisor] git push FAILED — the commit is local only');
  }
}

function holdPort() {
  const srv = createServer((_req, res) => {
    res.writeHead(503, { 'content-type': 'text/html; charset=utf-8', 'retry-after': '10' });
    res.end('<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="6">' +
      '<title>rebuilding</title><style>body{background:#07080a;color:#87898d;font:14px ui-monospace,monospace;' +
      'display:grid;place-content:center;min-height:100vh}</style><p>rebuilding the chart. one moment.</p>');
  });
  return new Promise((resolve) => srv.listen(PORT, HOST, () => resolve(srv)));
}

async function handleRebuild() {
  const reqPath = path.join(STATE_DIR, 'rebuild.request');
  let req = null;
  if (existsSync(reqPath)) {
    try {
      req = JSON.parse(await readFile(reqPath, 'utf8'));
    } catch {
      /* ignore */
    }
    await rm(reqPath, { force: true });
  }

  const ok = await build();
  if (!req) return;

  let result;
  if (ok) {
    await commitAndPush(req.commitMsg);
    result = { ok: true, slug: req.slug, at: new Date().toISOString() };
  } else {
    const file = path.join(CONTENT_DIR, `${req.slug}.mdx`);
    if (req.isNew) await rm(file, { force: true });
    else if (req.prev != null) await writeFile(file, req.prev, 'utf8');
    await build();
    result = { ok: false, slug: req.slug, error: 'astro build failed — change reverted', at: new Date().toISOString() };
  }
  await writeFile(path.join(STATE_DIR, 'rebuild.result'), JSON.stringify(result), 'utf8');
}

async function main() {
  await mkdir(STATE_DIR, { recursive: true });
  // GIT_AUTHOR_* / GIT_COMMITTER_* env (set in compose) carry authorship without
  // writing to the bind-mounted repo's own git config.
  await run('git', ['config', '--global', '--add', 'safe.directory', ROOT]);
  await run('git', ['config', '--global', 'user.email', process.env.GIT_AUTHOR_EMAIL || 'x@x-hakt.com']);
  await run('git', ['config', '--global', 'user.name', process.env.GIT_AUTHOR_NAME || 'x']);
  await run('git', ['pull', '--ff-only', '--quiet']);

  if (!existsSync(ENTRY)) await build();

  for (;;) {
    const child = spawn('node', [ENTRY], { cwd: ROOT, stdio: 'inherit', env: { ...process.env, HOST, PORT: String(PORT) } });
    const code = await new Promise((r) => child.on('exit', (c) => r(c ?? 0)));

    if (code !== 75) {
      log(`astro server exited ${code}; stopping`);
      process.exit(code);
    }

    log('rebuild requested');
    const hold = await holdPort();
    try {
      await handleRebuild();
    } finally {
      await new Promise((r) => hold.close(r));
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
