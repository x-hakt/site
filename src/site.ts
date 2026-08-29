/* Site-wide metadata. Single source of truth for titles, nav, and the feed. */
export const site = {
  name: 'x-hakt',
  domain: 'x-hakt.com',
  url: 'https://x-hakt.com',
  // style guide s.01 — the tagline, lower-case, dry
  tagline: 'notes from the workbench',
  description:
    'How one small mesh of servers is actually wired, written down. Long-form technical notes, one diagram carrying each idea.',
  author: 'Topher Burchell',
  // pirate/hacker handle — placeholder until XH-3 fixes it
  handle: 'quartermaster',
  nav: [
    { label: 'notes', href: '/' },
    { label: 'about', href: '/about' },
    { label: 'feed', href: '/rss.xml' },
  ],
} as const;

export type Site = typeof site;
