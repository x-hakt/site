// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

// XH-4: public pages are prerendered static; the Node adapter is here so that
// individual routes (the /admin editor, XH-6) can opt into SSR later with
// `export const prerender = false`. Nothing is server-rendered yet.
export default defineConfig({
  site: 'https://x-hakt.com',
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  integrations: [mdx(), sitemap()],
  vite: {
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
