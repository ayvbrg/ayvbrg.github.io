# Review

Adversarial review of a candidate against its GitHub issue. Domain words are
Log, Entry, Tag, Landing, and FAQ as defined in `CONTEXT.md`.

## Stance

Try to refute the claim that the ticket is done. Every finding needs a
failure chain:

```
changed cause → triggering input or state → wrong outcome
```

Agent assertion is not evidence. Emitted static output is. If the chain
breaks, drop the finding.

Return bugs and requirement failures. Over-engineering is its own pass:
delete speculative abstractions, extra dependencies, and flexibility the
spec did not ask for.

## The testing seam

The only verification seam is the production build output. Run the full
production build with `SITE_URL` set and assert over emitted files: HTML
pages, `/rss.xml`, the sitemap, and Pagefind assets. Internals
(components, layouts, collection config) may change; tests must not reach
into them.

The full suite must be green, not only the new ticket's tests. A test that
stays green after deleting the behavior is not a test.

## Site invariants

Check these against emitted output on every review:

- **JS budget.** Ordinary pages ship no client framework payload. The
  inline theme script is the only JavaScript on those pages. Pagefind
  browser code is referenced only from the Log.
- **No third-party requests.** Emitted HTML has no external font, analytics,
  or tracker URLs.
- **Publication leaks.** Drafts and future-dated Entries appear nowhere:
  not the Log, Tag views, search index, RSS, sitemap, or their own URL.
  Eligibility uses a UTC calendar day.
- **RSS contract.** One global RSS 2.0 feed at `/rss.xml`. Membership
  mirrors public Log eligibility. Twenty newest items, newest first,
  equal dates tie-break by ascending slug. Summary-only items. GUID equals
  the canonical URL. Absolute URLs derive from `SITE_URL`.
- **Reduced motion.** `prefers-reduced-motion` removes motes, smooth
  scrolling, reveals, and decorative transitions.
- **390 px.** No document-level horizontal overflow at 390 px. Long code
  scrolls inside its block.
- **Placeholders.** Fixture Entries used for tests do not ship as real content.

## Ticket review

Map every acceptance criterion to a fact in the emitted output. Name the
spec section that governs it. Hunt the invariants above even when the
ticket does not mention them.
