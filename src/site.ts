/* Site-wide metadata. Single source of truth for titles, nav, the byline, and the feed. */
export const site = {
  name: 'x-hakt',
  domain: 'x-hakt.com',
  url: 'https://x-hakt.com',
  // style guide s.01 — the tagline, lower-case, dry. XH-13: a captain's log kept ashore.
  tagline: 'a landlocked captain’s log',
  description:
    'How one small mesh of servers is actually wired, written down. Long-form technical notes, one diagram carrying each idea.',
  // The site is pseudonymous. The author is "x" (XH-3); every entry signs off "-x".
  author: 'x',
  byline: 'x',
  signoff: '-x',
  nav: [
    { label: 'notes', href: '/' },
    { label: 'map', href: '/map' },
    { label: 'about', href: '/about' },
    { label: 'feed', href: '/rss.xml' },
  ],
} as const;

export type Site = typeof site;
