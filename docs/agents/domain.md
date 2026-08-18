# Domain Docs

How the engineering skills should consume this repo's domain documentation
when exploring the codebase.

## Before exploring, read these

- **`CONTEXT.md`** at the repository root.
- **`docs/adr/`**—read ADRs that touch the area you are about to work in.

If either source does not exist, proceed silently. Do not flag its absence or
suggest creating it upfront. The `/domain-modeling` skill, reached through
`/grill-with-docs` and `/improve-codebase-architecture`, creates domain
documentation lazily when terms or decisions are actually resolved.

## File structure

This is a single-context repository:

```text
/
├── CONTEXT.md
└── docs/
    └── adr/
        ├── 0001-example-decision.md
        └── 0002-another-decision.md
```

## Use the glossary's vocabulary

When your output names a domain concept—in an issue title, refactor proposal,
hypothesis, or test name—use the term as defined in `CONTEXT.md`. Do not drift
to synonyms the glossary explicitly avoids.

If the concept you need is not in the glossary yet, treat that as a signal:
either you are inventing language the project does not use and should
reconsider it, or there is a real gap to note for `/domain-modeling`.

## Flag ADR conflicts

If your output contradicts an existing ADR, surface the conflict explicitly
instead of silently overriding it:

> _Contradicts ADR-0007 (event-sourced orders)—but worth reopening because…_
