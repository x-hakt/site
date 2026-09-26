import { mkdir, rename, unlink, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

// PLN-12: binary twin of notes.ts atomicWrite, for uploaded media.
export async function atomicWriteBytes(file: string, bytes: Buffer) {
  await mkdir(path.dirname(file), { recursive: true });
  const temp = file + '.' + randomUUID() + '.tmp';
  try { await writeFile(temp, bytes); await rename(temp, file); }
  finally { await unlink(temp).catch(() => {}); }
}
