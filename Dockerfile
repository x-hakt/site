# syntax=docker/dockerfile:1
#
# XH-6: the site runs as the Astro node server (server.mjs supervisor), not
# static nginx, so the /admin editor can be a live SSR route.
#
# In production the repo is bind-mounted at /app (see
# ~/unified-services/docker-compose.x-hakt-site.yml) so the working tree is the
# source of truth for edits, git, and the built output. node_modules is the one
# thing NOT taken from the host: this image builds its own (musl/alpine) copy
# and an anonymous volume keeps it in front of the bind mount.
#
#   docker compose -f docker-compose.x-hakt-site.yml up -d --build

FROM node:22-alpine
RUN apk add --no-cache git openssh-client tini

WORKDIR /app
COPY package.json package-lock.json ./
# The container runs as uid 1000 (node) in production. `astro build` — which the
# /admin save path runs in-container — has vite write a dep-optimise cache under
# node_modules/.vite, so node_modules must be owned by the runtime user, not root.
RUN npm ci && chown -R node:node /app

ENV HOST=0.0.0.0 PORT=4321 NODE_ENV=production
EXPOSE 4321
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4321/ >/dev/null 2>&1 || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.mjs"]
