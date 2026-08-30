/*
  The tracks a note can be filed under (XH-12, revised). A small fixed set: a
  note carries one or more, and the map is grouped by them. `tracks` in a note's
  frontmatter is validated against this list in src/content.config.ts.
*/
export interface Track {
  blurb: string;
  order: number;
}

export const tracks: Record<string, Track> = {
  standards: {
    blurb: 'Holding many things to one bar: checks, conventions, house style, the stuff that drifts the moment nobody is looking.',
    order: 1,
  },
  control: {
    blurb: 'Seeing and steering what runs. Dashboards, monitoring, the one place you look to know the state of everything.',
    order: 2,
  },
  infrastructure: {
    blurb: 'The layer underneath: the overlay network, the hosts on it, the path a change takes from a commit to being live.',
    order: 3,
  },
  workstation: {
    blurb: 'The machine the work happens on. The compositor, the shell, the dotfiles, everything downstream of a fresh install.',
    order: 4,
  },
};

export const TRACK_NAMES = Object.keys(tracks);

const FALLBACK_ORDER = 99;

export function trackMeta(name: string): Track {
  return tracks[name] ?? { blurb: '', order: FALLBACK_ORDER };
}

/** stable sort key: known order first, then alphabetical */
export function trackSort(a: string, b: string): number {
  const oa = trackMeta(a).order;
  const ob = trackMeta(b).order;
  return oa === ob ? a.localeCompare(b) : oa - ob;
}

/** URL slug for a track name (already lower-case single words, but be safe) */
export function trackSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
