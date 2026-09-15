// Content is read at request time. Only code deployments need a build/restart.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
const root = import.meta.dirname;
const entry = path.join(root, 'dist/server/entry.mjs');
if (!existsSync(entry)) {
  const build = spawn('npm', ['run', 'build'], { cwd: root, stdio: 'inherit' });
  const code = await new Promise(resolve => build.on('exit', resolve));
  if (code !== 0) process.exit(Number(code) || 1);
}
const child = spawn(process.execPath, [entry], { cwd: root, stdio: 'inherit', env: process.env });
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => child.kill(signal));
child.on('exit', code => process.exit(code ?? 1));
child.on('error', error => { console.error(error); process.exit(1); });
