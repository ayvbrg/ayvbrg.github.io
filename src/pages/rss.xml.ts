import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { publicEntries } from '../lib/log';

/** The one global feed: the 20 newest public Entries, summary only. */
export async function GET(context: APIContext) {
  const site = context.site!;
  const entries = await publicEntries();
  return rss({
    title: 'ayvbrg.log',
    description:
      "Ayushman Buragohain's log of dev work, experiments, side quests, and occasional thoughts.",
    site,
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
    customData: `<language>en</language><atom:link href="${new URL('rss.xml', site.href.replace(/\/?$/, '/'))}" rel="self" type="application/rss+xml"/>`,
    items: entries.slice(0, 20).map((entry) => ({
      title: entry.data.title,
      link: `/log/${entry.id}/`,
      pubDate: entry.data.date,
      description: entry.data.summary,
      categories: entry.data.tags,
    })),
  });
}
