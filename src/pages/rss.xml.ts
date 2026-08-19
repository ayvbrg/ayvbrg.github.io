import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { publicEntries } from "../lib/log";

export async function GET(context: APIContext) {
  const entries = await publicEntries();
  const items = entries.slice(0, 20);
  const site = (context.site ?? new URL(context.url.origin)).toString();

  return rss({
    title: "ayvbrg.log",
    description:
      "Ayushman Buragohain's log of dev work, experiments, side quests, and occasional thoughts.",
    site,
    xmlns: { atom: "http://www.w3.org/2005/Atom" },
    customData: `<language>en</language><atom:link href="${site}rss.xml" rel="self" type="application/rss+xml"/>`,
    trailingSlash: true,
    items: items.map((entry) => ({
      title: entry.data.title,
      link: `/log/${entry.id}/`,
      pubDate: entry.data.pubDate,
      description: entry.data.summary,
      categories: [...entry.data.tags],
    })),
  });
}
