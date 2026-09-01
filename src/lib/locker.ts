/* x's locker — things I've made and kept here. Browser tools run in the page;
   packages you install. One page each under /locker/<slug>. */
export interface Tool {
  slug: string;
  name: string;
  /** one line: what it is */
  tagline: string;
  /** a sentence or two: what you get out of it */
  blurb: string;
  /** 'browser' runs in the page; 'package' is installed (the page mirrors its README) */
  kind: 'browser' | 'package';
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
    kind: 'browser',
    tech: ['astro', 'no-backend'],
    status: 'live',
    updated: '2026-09-01',
  },
  {
    slug: 'bosun-x',
    name: 'bosun-x',
    tagline: 'cross-agent handoff and task tracking for projects worked by AI agents.',
    blurb:
      'The bosun keeps the ship and crew in working order. bosun-x does that for a set of projects you build with Claude, Codex, or a mix: a record of what’s actually done, a clean starting point for the next session, and a task board that can’t drift. A CLI and an MCP server over plain files. MIT, on npm and GitHub.',
    kind: 'package',
    tech: ['nodejs', 'mcp', 'cli'],
    status: 'live',
    updated: '2026-09-01',
  },
];

export const toolBySlug = (slug: string) => tools.find((t) => t.slug === slug);
