import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { access } from 'node:fs/promises';
const exec = promisify(execFile);
// Called inside the save queue. Content is durable even if the remote is down.
export async function syncContent(paths: string[], message: string): Promise<string | null> {
  if (process.env.CONTENT_GIT === 'off') return null;
  const relative = paths.map(p => path.relative(process.cwd(), p));
  try {
    const relevant: string[] = [];
    for (const file of relative) {
      try { await access(file); relevant.push(file); }
      catch {
        const { stdout } = await exec('git', ['ls-files', '--', file]);
        if (stdout.trim()) relevant.push(file);
      }
    }
    if (!relevant.length) return null;
    await exec('git', ['add', '--', ...relevant]);
    try { await exec('git', ['diff', '--cached', '--quiet', '--', ...relevant]); }
    catch { await exec('git', ['commit', '--only', '-m', message, '--', ...relevant]); }
    await exec('git', ['push', 'origin', 'HEAD'], { timeout: 15000 });
    return null;
  } catch {
    console.error('[admin] Content saved; Git sync failed.');
    return 'Saved on this server, but Git sync failed. The server copy is safe; retry the push before relying on the remote backup.';
  }
}
