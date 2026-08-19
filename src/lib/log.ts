import { getCollection } from "astro:content";

function utcCalendarDateKey(date: Date): string {
  // Use UTC calendar dates so eligibility is timezone-independent.
  // e.g. 2026-08-19 in any TZ means "the date portion of date in UTC".
  return date.toISOString().slice(0, 10);
}

export async function publicEntries() {
  const entries = await getCollection("log");

  const todayUtcKey = utcCalendarDateKey(new Date());

  const publicOnes = entries
    .filter((entry) => entry.data.draft !== true)
    .filter((entry) => utcCalendarDateKey(entry.data.pubDate) <= todayUtcKey);

  // Newest first by pubDate. For equal pubDate, sort by slug for determinism.
  publicOnes.sort((a, b) => {
    const aKey = utcCalendarDateKey(a.data.pubDate);
    const bKey = utcCalendarDateKey(b.data.pubDate);

    if (aKey !== bKey) return bKey.localeCompare(aKey); // descending
    return a.id.localeCompare(b.id); // ascending slug
  });

  return publicOnes;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function utcDateKey(date: Date): string {
  return utcCalendarDateKey(date);
}

export function formatUtcDate(date: Date): string {
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function chipClass(tag: string): string {
  if (tag === "devlog") return "chip dev";
  if (tag === "experiment") return "chip exp";
  return "chip rnd";
}

const TAG_ORDER = ["devlog", "experiment", "random"];

export function tagGroups(entries: Awaited<ReturnType<typeof publicEntries>>) {
  const tags = [...new Set(entries.flatMap((e) => e.data.tags))];
  tags.sort((a, b) => {
    const ia = TAG_ORDER.indexOf(a);
    const ib = TAG_ORDER.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
  return tags.map((tag) => ({
    tag,
    entries: entries.filter((e) => e.data.tags.includes(tag)),
  }));
}

