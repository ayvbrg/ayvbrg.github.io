# Stack validation: Astro + MDX + plain CSS

_Researched 2026-08-18 for [issue #2](https://github.com/ayvbrg/ayvbrg.log/issues/2). This is a recommendation for the later stack decision, not that decision itself._

## Recommendation

Provisionally choose **Astro + the official MDX integration + plain CSS + Pagefind**. Build a static multi-page site, add no UI framework, and ship JavaScript only for search and (if wanted) a persistent theme override. Keep ordinary entries in Markdown; use MDX only when an entry genuinely needs an embedded component.

This combination best matches the whole requirement set rather than winning every row individually:

- Astro components render to HTML with no client runtime, and framework components are not hydrated unless a `client:*` directive is added ([Astro components](https://docs.astro.build/en/basics/astro-components/), [client directives](https://docs.astro.build/en/reference/directives-reference/#client-directives)).
- A local content collection can load dropped `*.md` and `*.mdx` files with a glob and validate their front matter; Astro's official tutorial shows `tags` as a validated string array ([content loader](https://docs.astro.build/en/reference/content-loader-reference/#glob-loader), [collection schema](https://docs.astro.build/en/tutorials/add-content-collections/)).
- MDX is a first-party integration rather than custom plumbing ([`@astrojs/mdx`](https://docs.astro.build/en/guides/integrations-guide/mdx/)).
- Astro has an official RSS helper for static feeds ([RSS recipe](https://docs.astro.build/en/recipes/rss/)).
- Astro 7 explicitly added coding-agent detection, a backgroundable development server, and structured JSON logs, a concrete advantage for a repo maintained mostly by agents ([Astro 7 release](https://astro.build/blog/astro-7/)).

Do **not** lock this in until a small implementation proves the content model, one tag route, RSS, and production Pagefind output. If real entries do not need MDX, re-evaluate Hugo: it covers Markdown, tags, and RSS with less application-side machinery. If the project values unopinionated JavaScript configuration more than typed content, Eleventy remains a credible alternative.

## Requirements fit

| Requirement | Astro | Eleventy | Hugo |
| --- | --- | --- | --- |
| Near-zero shipped JS | Zero JS from `.astro` components by default; hydrate only explicit islands ([docs](https://docs.astro.build/en/basics/astro-components/)). | Explicitly advertises zero client-side JS by default ([official site](https://www.11ty.dev/)). | Builds a static `public/` tree; production assets are those the project/templates include ([basic usage](https://gohugo.io/getting-started/usage/)). |
| Drop-in content | `glob()` loads Markdown and MDX from a directory; schema validation catches malformed front matter ([loader](https://docs.astro.build/en/reference/content-loader-reference/#glob-loader)). | Markdown is a native input format; MDX exists in v3, but the documented setup registers a custom extension and adds MDX plus a server renderer/runtime ([Markdown](https://www.11ty.dev/docs/languages/markdown/), [MDX](https://www.11ty.dev/docs/languages/mdx/)). | Files under `content/` map naturally to output URLs and Markdown is the default format ([organization](https://gohugo.io/content-management/organization/), [formats](https://gohugo.io/content-management/formats/)); no native MDX/JSX component model. |
| Tags | A short static route over validated `tags`; official tutorial demonstrates generated tag pages ([tag pages](https://docs.astro.build/en/tutorial/5-astro-api/2/)). | Front-matter tags create collections, though `tags` also carries Eleventy's collection-membership semantics ([collections](https://www.11ty.dev/docs/collections/)). | Built-in taxonomies create the tag index and per-tag pages ([taxonomies](https://gohugo.io/content-management/taxonomies/)). |
| RSS | Official package and endpoint; collection metadata maps to feed items ([RSS](https://docs.astro.build/en/recipes/rss/)). | Official plugin supports RSS, Atom, and JSON feeds ([RSS plugin](https://www.11ty.dev/docs/plugins/rss/)). | RSS is built in for home, section, taxonomy, and term pages ([RSS templates](https://gohugo.io/templates/rss/)). |
| Plain CSS, theme, motion | Plain global or component-scoped CSS is built in ([styling](https://docs.astro.build/en/guides/styling/)). | Generator-neutral: copy authored CSS and emit normal HTML. | Asset pipeline/static directories handle authored CSS ([directory structure](https://gohugo.io/getting-started/directory-structure/)). |
| Agent maintenance | Typed/validated content plus Astro 7's agent-aware dev-server behavior reduce ambiguous failures ([Astro 7](https://astro.build/blog/astro-7/)). | Small conceptual core, but its many template/configuration choices and custom MDX setup leave more repo-local convention for agents to infer. | Small production toolchain and built-in blog primitives; Go templates and the lack of a front-matter schema put more correctness in conventions and build checks. |
| `mise` | Pin Node and expose build/check/dev tasks. | Same Node workflow. | Pin the Hugo binary; Pagefind can be its downloaded binary or npm wrapper. `mise` supports project tool pins and project tasks ([dev tools](https://mise.jdx.dev/dev-tools/), [tasks](https://mise.jdx.dev/tasks/)). |

Plain CSS is not a compromise here. `color-scheme` and `prefers-color-scheme` can follow the operating-system light/dark preference without JavaScript ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/color-scheme)). A user-controlled, persistent override needs only a small inline script. Subtle animations should remain CSS and be disabled under `prefers-reduced-motion` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion)). Native cross-document view transitions can be progressive enhancement without Astro's client router; Astro documents that the native mode adds no page-load JavaScript ([Astro view transitions](https://docs.astro.build/en/guides/view-transitions/#differences-between-browser-native-view-transitions-and-astros-clientrouter)).

## Search: Pagefind and peers

### Default: Pagefind

Pagefind is the best match because it runs after any static generator, indexes the final HTML, writes a static bundle, and requires no server component ([getting started](https://pagefind.app/docs/)). Its index is split into chunks; the project reports a typical search payload near 100 kB and under 300 kB for a 10,000-page site, including the library ([Pagefind overview](https://pagefind.app/)). It can capture tags as filters directly from rendered HTML attributes ([filtering](https://pagefind.app/docs/filtering/)).

Use it on a dedicated `/search/` page or load its API only when the search UI is opened. Normal content pages can then remain zero-JS; search, necessarily, runs client code. The cost is one post-build command and generated assets. Pagefind is not present during a normal generator dev-server run until an index has been built, so the production-like search check should be `build -> pagefind -> serve`, not a generator-specific integration ([running Pagefind](https://pagefind.app/docs/running-pagefind/)). That generator-agnostic seam also keeps an Astro-to-Eleventy-or-Hugo migration cheap.

### Alternatives

- **Fuse.js** is the strongest tiny-corpus option. It is dependency-free, offers fuzzy matching, and its full build is about 8.6 kB gzip ([official docs](https://www.fusejs.io/)). The project must still generate and download the searchable documents, build/load the index, and own the UI. Prefer it only for title/summary/tag search over a demonstrably small log; its total payload grows with the corpus.
- **MiniSearch** is a capable in-memory full-text alternative with prefix, fuzzy, ranking, filtering, and serialized-index support ([official docs](https://lucaong.github.io/minisearch/)). It likewise requires custom corpus generation, index loading, and UI code. It becomes attractive only if Pagefind's post-build step is unacceptable and the full index remains small enough to load into browser memory.
- **Lunr** is mature but not the best new dependency in 2026. Its own guide warns that browser-side index building can block and recommends prebuilding and serving a serialized index ([prebuilding guide](https://lunrjs.com/guides/index_prebuilding.html)); its source repository has seen no push since 2024-07-31 ([commits](https://github.com/olivernn/lunr.js/commits/master/)). It offers more glue and less payload discipline than Pagefind.
- **Stork** has a sound CLI-index-plus-WASM architecture but is not a prudent new pick: its last stable release was 2023-01-12 and its repository last moved in 2023 ([releases](https://github.com/jameslittle230/stork/releases), [commits](https://github.com/jameslittle230/stork/commits/master/)).

## Serious alternatives

### Eleventy

Eleventy is the closest alternative if “plain web platform” simplicity matters more than Astro's content model. It ships no client JavaScript by default, accepts Markdown directly, uses tags to form collections, and has an official RSS plugin ([official site](https://www.11ty.dev/), [collections](https://www.11ty.dev/docs/collections/), [RSS](https://www.11ty.dev/docs/plugins/rss/)). It is flexible about directory layout and template languages, which is pleasant for a human-owned small site.

For this repository, that flexibility is also the main tradeoff: agents need the repo to choose and document a single template language, data cascade, tag convention, and asset-copy pattern. More importantly, Eleventy's documented MDX support requires explicit extension registration and dependencies for MDX evaluation plus static rendering; it is not as drop-in as Astro's official integration ([Eleventy MDX](https://www.11ty.dev/docs/languages/mdx/)). Choose Eleventy if MDX is rare or removable and the team prefers a looser JavaScript SSG over typed content collections.

### Hugo

Hugo is the strongest alternative if MDX is not actually required. A Markdown file under `content/` maps directly to a page; taxonomies generate tag indexes and term pages; RSS is generated by default for multiple page kinds ([content organization](https://gohugo.io/content-management/organization/), [taxonomies](https://gohugo.io/content-management/taxonomies/), [RSS](https://gohugo.io/templates/rss/)). Its single compiled tool and fast static builds are excellent long-term properties, and Pagefind consumes Hugo's output exactly as it consumes Astro's.

The tradeoff is authoring and agent familiarity, not capability or health. Hugo supports Markdown, HTML, Org, AsciiDoc, Pandoc, and reStructuredText, but not MDX ([content formats](https://gohugo.io/content-management/formats/)); reusable rich content therefore moves to Hugo shortcodes/templates. The Go template system is powerful but more specialized than HTML-like `.astro` plus JavaScript/TypeScript. Choose Hugo if entries remain Markdown-first and eliminating Node framework churn outweighs MDX and typed front-matter validation.

## Ecosystem health in 2026

All three generators and Pagefind are actively maintained; none should be rejected for ecosystem health.

- **Astro:** Astro 7 shipped 2026-06-22, followed by 7.1 on 2026-07-16 and 7.2.3 on 2026-08-18 ([Astro 7](https://astro.build/blog/astro-7/), [7.1](https://astro.build/blog/astro-710/), [7.2.3 release](https://github.com/withastro/astro/releases/tag/astro%407.2.3)). This is the strongest current activity and agent-tooling signal, with the corresponding risk of faster upgrade churn.
- **Eleventy:** stable 3.1.6 shipped 2026-06-02 and 4.0 prereleases were active in July 2026 ([versions](https://www.11ty.dev/docs/versions/), [3.1.6 release](https://github.com/11ty/eleventy/releases/tag/v3.1.6)). Its main branch was active on 2026-08-17 ([commits](https://github.com/11ty/eleventy/commits/main/)). Stable v3 is a reasonable conservative target while v4 settles.
- **Hugo:** 0.165.0 shipped 2026-08-12 after a long series of 2026 releases, and the main repository remained active on 2026-08-18 ([0.165.0](https://github.com/gohugoio/hugo/releases/tag/v0.165.0), [releases](https://github.com/gohugoio/hugo/releases), [commits](https://github.com/gohugoio/hugo/commits/master/)).
- **Pagefind:** 1.5.2 shipped 2026-04-12 and development continued in August 2026 ([release](https://github.com/Pagefind/pagefind/releases/tag/v1.5.2), [commits](https://github.com/Pagefind/pagefind/commits/main/)).

## Boundaries for the eventual decision

Before locking the stack, a minimal slice should prove these exact seams:

1. Drop one `.md` and one `.mdx` entry into the content directory and fail the build on invalid required front matter.
2. Generate the entry, chronological log, tag index, and one tag detail page without client JavaScript.
3. Generate RSS and decide whether summaries are sufficient. Astro's official recipe notes that full-content handling is more complicated for MDX because the shown Markdown rendering paths do not process MDX components ([RSS caveat](https://docs.astro.build/en/recipes/rss/#including-full-post-content)).
4. Run Pagefind after the production build, search body text, and filter by tag.
5. Verify system light/dark mode, an optional persisted override, reduced motion, and the JavaScript payload on a normal entry page.
6. Put only tool versions and the small `dev`, `check`, and production-like `build` tasks in `mise.toml`; do not add a framework integration solely to wrap the Pagefind CLI.

If that slice is straightforward, Astro is the leading recommendation. If MDX or schema validation supplies no real value in the slice, Hugo deserves the final comparison before lock-in; Eleventy remains the middle path for a JavaScript-native but less opinionated repository.
