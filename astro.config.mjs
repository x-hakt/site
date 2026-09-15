// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

// Public content and admin routes opt into SSR; fixed pages remain static.
export default defineConfig({
  site: 'https://x-hakt.com',
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  // Astro's checkOrigin computes the expected origin from proxy headers and was
  // rejecting legitimate same-origin admin form posts. The /admin cookie is
  // SameSite=Lax (not sent on cross-site POST), and login.ts / save.ts do their
  // own Origin/Referer-vs-Host check. That is the CSRF story here.
  security: { checkOrigin: false },
  redirects: {
    // renamed 2026-09-06 (was briefly titled "Evidence, not vibes")
    '/notes/evidence-not-vibes': '/notes/teaching-others-one-morsel-at-a-time',
  },
  integrations: [mdx()],
  vite: {
    ssr: { external: ['astro/container', 'astro/jsx-runtime', '@astrojs/mdx/server.js'] },
    plugins: [tailwindcss()],
  },
  markdown: {
    // house Shiki theme; diagrams (XH-5) carry the real colour, code stays quiet
    shikiConfig: {
      theme: 'github-dark-default',
      wrap: false,
    },
  },
});
