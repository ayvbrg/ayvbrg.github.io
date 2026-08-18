# yvbrg.log

Use this file as a map, not a manual. It is the table of contents for this
repository's agent-facing knowledge. Repository files define current behavior;
`CONTEXT.md` and `docs/` record domain vocabulary, decisions, and working
agreements. Start here, then read only the sources relevant to your task.

**Keep the map current.** Whenever you add, move, rename, or remove a source of
truth under `docs/`, update the corresponding pointer here in the same change.
A stale map is a broken map.

## Orientation

- [Project overview](README.md) — repository purpose and entry point; read
  before making broad changes
- [Domain vocabulary](CONTEXT.md) — shared terms for the repository; read
  before naming or changing domain concepts
- [Architecture decisions](docs/adr/) — durable technical and product
  decisions; read relevant ADRs before changing established behavior
- [Stack validation research](docs/research/stack-validation.md) — provisional
  comparison of Astro, Eleventy, Hugo, and static client-side search

## Agent skills

### Issue tracker

Issues and specs are tracked in GitHub Issues for `ayvbrg/yvbrg.log`. See
`docs/agents/issue-tracker.md`.

### Triage labels

Triage uses the five default canonical labels. See
`docs/agents/triage-labels.md`.

### Domain docs

This is a single-context repository with domain vocabulary in `CONTEXT.md` and
ADRs in `docs/adr/`. See `docs/agents/domain.md`.
