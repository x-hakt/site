/* Site-wide metadata. Single source of truth for titles, nav, the byline, and the feed. */
export const site = {
  name: 'x-hakt',
  domain: 'x-hakt.com',
  url: 'https://x-hakt.com',
  // style guide s.01 — the tagline, lower-case, dry. XH-13: a captain's log kept ashore.
  tagline: 'a landlocked captain’s log',
  // not shown on the page; only <meta description>, OG, and the feed. Keep it
  // substantive for search: say what the site actually is.
  description:
    'How one small self-hosted server fleet is actually run. Long-form, illustrated notes on Docker, SSH hardening, backups, a Nebula mesh, Postgres, Astro and the tooling around them, written by the person doing it.',
  // 1200x630 social card in /public
  ogImage: '/og-default.png',
  ogImageAlt: 'x-hakt.com — a landlocked captain’s log',
  // The site is pseudonymous. The author is "x" (XH-3); every entry signs off "-x".
  author: 'x',
  byline: 'x',
  signoff: '-x',
  // the wordmark already goes home, so no "notes" item here
  nav: [
    { label: 'map', href: '/map' },
    { label: 'tools', href: '/tools' },
    { label: 'about', href: '/about' },
    { label: 'feed', href: '/rss.xml' },
  ],
} as const;

export type Site = typeof site;
