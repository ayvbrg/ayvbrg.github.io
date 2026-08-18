# ayvbrg.log v1 spec

The buildable v1 specification for ayvbrg.log, assembled from the resolved
wayfinder decisions ([map](https://github.com/ayvbrg/ayvbrg.log/issues/1)):
design language ([#6](https://github.com/ayvbrg/ayvbrg.log/issues/6)), stack
and hosting portability ([#7](https://github.com/ayvbrg/ayvbrg.log/issues/7)),
site structure ([#9](https://github.com/ayvbrg/ayvbrg.log/issues/9)), and the
RSS contract ([#11](https://github.com/ayvbrg/ayvbrg.log/issues/11)). Domain
vocabulary (Landing, Log, Entry, Tag, FAQ) is defined in `CONTEXT.md` and used
as-is throughout.

## Problem Statement

Ayushman Buragohain has no personal corner of the internet: no place that
introduces who they are, collects their dev logs, experiments, side quests,
and occasional thoughts, and lets technical peers follow new writing. Existing
options are either generic portfolio templates (wrong character), heavyweight
platforms (wrong ownership), or nothing at all.

## Solution

A minimal, fast, fully static personal site — ayvbrg.log — that is both a
landing page and a personal log. Three public pages (Landing, Log, FAQ) plus
Entry pages, shareable Tag views, and a global RSS feed. The visual character
is **Hallownest**: a quiet, Silksong-mood-inspired atmosphere built from
original sparse arches, crest-like linework, and drifting motes — polished and
personal, never a template. Content is authored in the repository as Markdown;
the site is provider-neutral static output that can be hosted anywhere.

## User Stories

1. As a first-time visitor, I want the Landing to state who Ayushman is, their one-line current role, and what the Log is, so that I immediately know whose site I am on and what it offers.
2. As a professional evaluator, I want a selected-work section of three compact externally linked work rows, so that I can judge Ayushman's credible technical work without wading through a résumé.
3. As a recurring reader, I want the Landing to show the three newest Entries with a link to the complete Log, so that I can jump straight to fresh writing.
4. As a visitor, I want an elsewhere section with verified profile links, a public email, and RSS, so that I can reach or follow Ayushman through channels that actually work.
5. As a technical peer, I want the Log index to list all Entries newest first with title, publication date, short summary, and linked Tags, so that I can scan the whole body of work quickly.
6. As a reader, I want a compact search field on the Log that searches titles, summaries, Tags, and Entry text, so that I can find a half-remembered Entry without browsing.
7. As a searcher with no results, I want the no-results state to keep my query and offer the Tag links, so that I have a next step instead of a dead end.
8. As a reader with a specific interest, I want to browse by the `devlog`, `experiment`, and `random` Tags, so that I can follow just the kind of writing I care about.
9. As a reader, I want each Tag to open a shareable page listing that Tag's Entries newest first, so that I can link a filtered view to someone else.
10. As a reader, I want an Entry page showing a back-link to the Log, title, publication date, linked Tags, and the body, so that I can read comfortably with context.
11. As a returning reader, I want an Updated date shown only after a material revision, so that I can tell when an Entry meaningfully changed without noise from trivial edits.
12. As a reader finishing an Entry, I want a small close with an error-report email link, RSS link, and a way back to the Log, so that I can act on what I read.
13. As a developer reading code-heavy Entries, I want highlighted code blocks with a copy affordance where long code scrolls inside the block, so that code is usable and never breaks the page layout.
14. As a curious visitor, I want a personal FAQ answering what Ayushman works on, writes about, is curious about, why the site is named ayvbrg.log, how to follow it, how to report errors, and whether older Entries get revised, so that I get the whole-person picture in one durable page.
15. As an RSS subscriber, I want one global feed of the 20 newest public Entries with plain-text summaries linking to canonical Entry pages, so that I learn of new writing in my reader and read it on the site.
16. As an RSS subscriber, I want stable item identity (GUID equal to the canonical URL, original publication date preserved through revisions), so that revised Entries never reappear as duplicates in my reader.
17. As a reader, I want the site to follow my operating-system light/dark preference by default, so that it looks right without configuration.
18. As a reader with a preference, I want a persistent manual theme toggle with no wrong-theme flash on load, so that my choice sticks across visits.
19. As a motion-sensitive reader, I want `prefers-reduced-motion` to remove motes, reveals, smooth scrolling, and decorative transitions, so that the site is comfortable to use.
20. As a mobile reader, I want every page to work at 390 px with no document-level horizontal overflow, so that reading on a phone is first-class.
21. As any visitor, I want pages to be static HTML with no client UI framework and near-zero JavaScript, so that the site loads fast everywhere.
22. As a reader who mistypes a URL, I want a not-found page in the site's own character, so that a dead link is not a dead end.
23. As the author, I want to write ordinary Entries in Markdown and reach for MDX only when an Entry genuinely needs an embedded component, so that authoring stays low-friction.
24. As the author, I want Entry frontmatter validated at build time so a malformed Entry fails the build, so that broken metadata never reaches readers or the feed.
25. As the author, I want drafts and future-dated Entries excluded from the Log, Tag views, search, and RSS alike, so that nothing publishes early through a side door.
26. As the site owner, I want the production origin supplied only through a build-time `SITE_URL` — with production builds failing clearly when it is absent — so that the site is portable across hosts and never emits a wrong absolute URL.
27. As the site owner, I want no provider-specific functions, middleware, forms, image services, databases, or runtime APIs, so that switching hosts is a deployment change, not a rewrite.
28. As an agent maintainer, I want the toolchain pinned with mise and dependencies locked with npm, so that any session reproduces the same build.
29. As an agent maintainer, I want the production build runnable as a plain npm script on a host without mise, so that CI and static hosts need no special tooling.
30. As a reader, I want the Hallownest atmosphere — original motifs only, no copied game artwork — so that the site feels personal and polished rather than templated or infringing.
31. As a privacy-conscious reader, I want no external font requests, no analytics, and no third-party trackers, so that reading the site costs me nothing.
32. As a search engine, I want canonical links, social metadata, and sitemap entries with absolute URLs derived from `SITE_URL`, so that the site indexes correctly wherever it is hosted.
33. As a keyboard or screen-reader user, I want semantic HTML with a usable focus order and accessible names on controls (theme toggle, search, copy buttons, disclosures), so that the site works without a pointer.

## Implementation Decisions

### Stack and toolchain (from #7)

- **Astro with the official MDX integration.** Ordinary Entries are Markdown; MDX only when an Entry genuinely needs an embedded component. No client UI framework (React/Vue/Svelte) without a later concrete need.
- **Plain CSS**: a small global layer for tokens, reset, and typography, plus locally scoped component styles. No Tailwind, CSS-in-JS, or component library.
- **Pagefind** as a generator-neutral post-build index over the static output. Its browser code loads only on the Log page, where the single search field lives (#9 supersedes #7's earlier separate `/search` page — there is no separate Search page).
- Static output only: ordinary HTML, CSS, JavaScript, and Pagefind assets. The production build runs Astro then Pagefind, and must remain runnable as a plain npm script on a host without mise.
- **mise** pins the Node 24 LTS line (exact patch committed when implementation begins); **npm** with a committed lockfile; Astro, Pagefind, and tools are local project dependencies. Thin mise tasks for `dev`, `check`, `build`, and `preview` delegate to npm scripts.
- Entry frontmatter is validated through Astro's content-collection schema at build time. Minimal fields only — title, publication date, short summary, Tags, optional updated date, optional draft flag. No OKF-derived rules or extra frontmatter policy (#8 cancelled).

### Hosting portability (from #7)

- No hosting provider, registrar, or domain is selected or encoded anywhere in the application. No provider-specific runtime features. A later host-specific deployment manifest may only describe how to build and publish the static output.
- The production origin arrives through build-time `SITE_URL` (local development defaults to the Astro dev origin). Production builds fail clearly when `SITE_URL` is absent. RSS, canonical links, sitemap entries, and social metadata derive absolute URLs from it. One canonical trailing-slash policy is adopted at build time and used consistently, including in feed links.

### Information architecture (from #9)

- Top-level pages: `/` (Landing), `/log` (complete Log index with search and Tag discovery), `/faq`. Supporting routes: `/log/<slug>` per Entry, `/tags/<tag>` per Tag, `/rss.xml`, and a not-found page. No About, Work, Projects, Uses, Now, Contact, Archive, or Search pages.
- Primary navigation: site name (→ Landing), Log, FAQ, theme control. Public links: GitHub `ayvbrg`, the public email, RSS, and the verified LinkedIn profile. Kaggle, Dashverse, and ORCID only where contextually useful; stale or unverified accounts nowhere.
- **Landing structure is fixed; all literal Landing copy and item content are placeholders** to be filled at build time: (1) identity and premise, (2) three selected-work rows, (3) three newest Entries plus Log link, (4) elsewhere links. Candidate work rows exist in #9 but are deliberately not frozen here.
- Log index rows: title, publication date, short summary, linked Tags; newest first. No pagination, sorting controls, nested categories, or faceted filtering.
- Entry page order: back-link, title, publication date, Updated date (material revisions only), Tags, body, small close (error-report email, RSS, back to Log). Summary appears on indexes and metadata, not repeated under the title. No reading time, author bio, share buttons, counters, related content, or previous/next links. A hand-authored table of contents is allowed in long Entries, not mandatory.
- FAQ: the seven first-person questions resolved in #9, with the site-name answer using the corrected `ayvbrg` spelling (a compressed form of Ayushman Buragohain; `.log` is the ongoing record).
- Launch with 3–6 Entries. Fully public and static: no accounts, sessions, private content, comments backend, or CMS.

### Design language: Hallownest (from #6; tokens from the approved prototype)

- Character: quiet Hallownest atmosphere — original arches, crest-like linework, sparse ornaments, drifting motes. No copied game artwork, no large illustrative hero image.
- Tokens (from the prototype — the implementation's CSS custom properties):
  - Dark: background `#0e1419`, surface `#151c22`, elevated `#1c252c`, ink `#e3e7e7`, dim `#9aa4a8`, faint `#829096`, accent `#c46b68`.
  - Light: background `#edf0f1`, surface `#f7f8f7`, elevated `#e3e7e8`, ink `#20272b`, dim `#59666c`, faint `#606d73`, accent `#954746`.
- Typography: native system UI stack for all headings, prose, navigation, metadata, Tags, and controls; system monospace only for actual code. No external font request.
- Motion: restrained 200–600 ms transitions; 350 ms theme change; 600 ms content reveal; very slow sparse motes. Motion is CSS-first and progressive; `prefers-reduced-motion` removes motes, smooth scrolling, reveals, and decorative transitions. No client router merely for transitions.
- Theme: follow the OS preference by default with a small persistent manual override; a minimal inline theme script is acceptable to prevent a wrong-theme flash.
- Content surfaces styled in both modes: inline code, highlighted code block with copy affordance, callout, quote, list, and disclosure. No document-level horizontal overflow at desktop or 390 px; long code scrolls within its block.
- The tab/favicon mark is the minimal local SVG already in the repository.

### RSS contract (from #11)

- One global RSS 2.0 feed at `/rss.xml`, generated on every production build. No Tag-specific feeds.
- Membership exactly mirrors public Log eligibility; drafts and future-dated Entries are excluded. Newest first by original publication date; equal-date ties break by ascending canonical slug so builds are deterministic. The 20 newest eligible Entries; the Log remains the complete archive.
- Summary-only items: plain-text XML-escaped summary, no embedded body, no `content:encoded`, no Markdown or HTML in item content.
- Channel metadata: title `ayvbrg.log`; description `Ayushman Buragohain's log of dev work, experiments, side quests, and occasional thoughts.`; canonical site link and self URL derived from `SITE_URL`; language `en`. No artwork, copyright, editor, or custom extension metadata.
- Item metadata: Entry title, absolute canonical URL, GUID equal to that URL treated as a permalink, original publication date, plain-text summary, each Tag as a category. No author, comments, source, or enclosure fields.
- A material revision keeps URL, GUID, and publication date; the next build updates title/summary/Tags in place and never duplicates or re-dates the item.
- Use the official Astro RSS package at `4.0.19` or newer (XML-injection fix); let the library escape fields; no user-controlled values in raw custom data.

## Testing Decisions

- **One seam: the production build output.** Tests run the full production build (with `SITE_URL` set) and assert over the emitted static files — HTML pages, `/rss.xml`, the sitemap, and Pagefind assets. This is the highest possible seam, matches #7's stated validation boundary, and keeps internals (components, layouts, collection config) free to change.
- Good tests here assert only externally observable output: a page exists at its route, the Log lists Entries in the right order, the feed carries exactly the contracted metadata, a draft Entry appears nowhere. No test reaches into component internals or rendering machinery.
- What the first implementation slice must prove through this seam (from #7): Markdown and MDX content renders; malformed frontmatter fails the build; Tag routes exist and filter correctly; the RSS contract holds (membership, ordering, tie-break, 20-item cap, summary-only items, stable GUIDs); Pagefind output exists and its browser code is referenced only from the Log; theme behavior (default preference, override hook, no-flash script present); the normal-page JavaScript budget (no client framework payload; only the inline theme script on ordinary pages); a production build without `SITE_URL` fails clearly; no external font or third-party requests in emitted HTML; no document-level horizontal overflow styles regress at 390 px (spot-checked in the prototype's manner).
- Fixture content: temporary Entries (draft, future-dated, equal-date pairs, MDX-bearing, long-code) exercise edge cases through the same build; they are removed or excluded from real content.
- Prior art: none — this is the repository's first code. These build-output tests set the pattern.

## Out of Scope

- The deployment itself: choosing a host or registrar, purchasing a domain, DNS, and any deployment manifest. The user supplies the domain later; prior hosting research is background only.
- Comments, newsletter, view counters, analytics, and any speculative infrastructure for them.
- Tag-specific RSS feeds; a separate Search page; pagination, archives, sorting, or faceted filtering.
- OG/social-image generation strategy — basic social metadata derives from `SITE_URL`, but custom preview imagery is deliberately unspecified for v1.
- Client UI frameworks, Astro's client router, external fonts, component libraries, Tailwind, or CSS-in-JS.
- OKF or any separate doc-format rules layer (#8 cancelled).
- Literal Landing copy and the final selected-work rows — structure is specified, content is a build-time editorial decision.

## Further Notes

- The approved design prototype and the favicon live in the repository's assets and are the visual reference for implementation; the prototype's alternate explorations (Abyss, Deepnest, Silk & Ash) are comparison history only.
- Reconciliation notes: #9's Log-page search supersedes #7's earlier `/search` route; the FAQ site-name answer uses the corrected `ayvbrg` spelling from the map, superseding the `yvbrg` text in #9's resolution.
- No ADR accompanies this spec (per #7): the choices are visible and reversible for a small static site. Add one later only if implementation introduces real lock-in.
- The repository is maintained mostly by agents; everything here is structured for agent legibility using the repository's ordinary Markdown conventions — no separate doc-format system.
