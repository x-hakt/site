/* The workbench. Each tool is one page under /tools/<slug>, listed on /tools.
   Zero-or-minimal-JS, no backend — same shape as the map's spyglass. */
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
    slug: 'voice',
    name: 'voice profile builder',
    tagline: 'answer a deep questionnaire, get a style card any AI can write from.',
    blurb:
      'A long questionnaire about how you actually write — the words you avoid, how you hedge, how you open and sign off — plus a few of your own samples. It assembles a portable VOICE.md and a ready-to-run prompt you paste into Claude, ChatGPT, or a custom style. The page does no network calls; everything stays in your browser.',
    tech: ['astro', 'no-backend'],
    status: 'live',
    updated: '2026-09-01',
  },
];

export const toolBySlug = (slug: string) => tools.find((t) => t.slug === slug);
