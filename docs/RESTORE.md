# Restoring x-hakt-site

There is no database and no backup archive. Every note is MDX committed and
pushed to this repo (`x-hakt/site`) on each `/admin` save — the git remote *is*
the backup.

Fleet context: `bosun-x-data/docs/DISASTER-RECOVERY.md` ("x-hakt").

## Restore

```sh
git clone git@github.com:x-hakt/site.git x-hakt-site
cd x-hakt-site
npm ci
npm run build
docker restart x-hakt-site   # the SSR standalone server is bind-mounted
```

Transient state that is **not** backed up and does not need to be: the session
store and `.admin-state`. Losing them means logging into `/admin` again.

If uncommitted working-tree changes ever start to matter, add a periodic
`tar` of the repo as a bosun-x `files` store; not currently worth it.
