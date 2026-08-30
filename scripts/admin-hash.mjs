/*
  XH-6 — turn an admin password into the ADMIN_PASSWORD_HASH env value.

    node scripts/admin-hash.mjs 'the password you want'

  Put the printed line in ~/unified-services/.env as
  XHAKT_ADMIN_PASSWORD_HASH=... then `docker compose -f
  docker-compose.x-hakt-site.yml up -d` to pick it up. The plaintext password is
  never stored anywhere.
*/
import { scryptSync, randomBytes } from 'node:crypto';

const pw = process.argv[2];
if (!pw || pw.length < 10) {
  console.error('usage: node scripts/admin-hash.mjs <password>   (10+ chars)');
  process.exit(1);
}
const salt = randomBytes(16);
const hash = scryptSync(pw, salt, 64);
console.log(`scrypt$${salt.toString('hex')}$${hash.toString('hex')}`);
