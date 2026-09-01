/* x's locker — small single-purpose tools, one page each under /locker/<slug>.
   Zero-or-minimal-JS, no backend. Same shape as the map's spyglass. */
export interface Tool {
  slug: string;
  name: string;
  /** one line: what it is */
  tagline: string;
  /** a sentence or two: what you get out of it */
  blurb: string;
  tech: string[];
  status: 'live' | 'draft';
  /** ISO date, last meaningful change */
  updated: string;
}

export const tools: Tool[] = [
  {
    slug: 'jib',
    name: 'jib-x',
    tagline: 'work out how you write, so an AI can write like you.',
    blurb:
      '“I like the cut of your jib.” A short questionnaire — mostly taps and sliders, with a few sentences to rewrite — that assembles a portable VOICE.md and a ready-to-run prompt for Claude, ChatGPT, or a custom style. The page does no network calls; everything stays in your browser.',
    tech: ['astro', 'no-backend'],
    status: 'live',
    updated: '2026-09-01',
  },
];

export const toolBySlug = (slug: string) => tools.find((t) => t.slug === slug);
