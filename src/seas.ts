/*
  The named regions notes are filed under (XH-12). A note's `sea` frontmatter is
  a free string; this file only adds a blurb and a sort order for the ones that
  exist. Add or rename freely. A sea with no entry here still shows on /map,
  just without the blurb.
*/
export interface Sea {
  blurb: string;
  order: number;
}

export const seas: Record<string, Sea> = {
  'The Mesh': {
    blurb: 'The overlay network itself, the hosts on it, and how they reach each other.',
    order: 1,
  },
  'Sea of Development': {
    blurb: 'Building, testing, shipping. Repos, containers, deploy paths, the CI that is mostly a shell script.',
    order: 2,
  },
  'Omarchy Ocean': {
    blurb: 'The workstation. Hyprland, the shell, dotfiles, and everything downstream of a fresh install.',
    order: 3,
  },
  'The Isle of 365': {
    blurb: 'Microsoft 365 and the cloud-productivity tenancy: identity, licensing, the bits that resist automation.',
    order: 4,
  },
};

const FALLBACK_ORDER = 99;

export function seaMeta(name: string): Sea {
  return seas[name] ?? { blurb: '', order: FALLBACK_ORDER };
}

/** stable sort key: known order first, then alphabetical */
export function seaSort(a: string, b: string): number {
  const oa = seaMeta(a).order;
  const ob = seaMeta(b).order;
  return oa === ob ? a.localeCompare(b) : oa - ob;
}

/** URL slug for a sea name: "Sea of Development" -> "sea-of-development" */
export function seaSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
