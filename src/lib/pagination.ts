// Shared between the front page (page 1) and /page/[page] (page 2+) so both
// sides agree on how notes are sliced.
export const NOTES_PAGE_SIZE = 10;

export function notePageUrl(page: number): string {
  return page <= 1 ? '/' : `/page/${page}`;
}
