import { getCollection } from 'astro:content';

/**
 * Public Entries — no drafts, nothing future-dated — newest first, equal dates
 * broken by ascending slug.
 *
 * Publication dates are calendar days and are compared in UTC, so every build
 * machine emits the same site: an Entry dated today goes live at UTC midnight,
 * not at the build machine's local midnight.
 */
export async function publicEntries() {
  const today = new Date().toISOString().slice(0, 10);
  const entries = await getCollection(
    'log',
    ({ data }) => !data.draft && data.date.toISOString().slice(0, 10) <= today,
  );
  // The slug tie-break is not observable through the build-output seam: the glob
  // loader derives the id from the file path, so load order and ascending-id
  // order always coincide and a stable sort hides the clause. Keep it — the spec
  // mandates it and it is what holds if the loader's order ever changes.
  return entries.sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime() || (a.id < b.id ? -1 : 1),
  );
}
