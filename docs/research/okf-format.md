# OKF v0.2: fit for repository docs and site entries

## Scope and authority

This note records what the upstream `GoogleCloudPlatform/knowledge-catalog`
repository prescribes for OKF at commit
[`fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f`](https://github.com/GoogleCloudPlatform/knowledge-catalog/tree/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf).
It then assesses fit against this repository at commit `7fb6456` and against
Astro's current Content Layer documentation, retrieved on 2026-08-18. It does
not choose a house format; that decision belongs to issue #8.

The upstream `SPEC.md` calls itself self-contained and identifies the format as
version 0.2. The adjacent reference agent and viewer are proof-of-concept
producer/consumer implementations rather than additional normative layers.
([SPEC.md, introduction](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/SPEC.md#L1-L19),
[README.md, lines 22–25](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/README.md#L22-L25))

Normative words below (`MUST`, `SHOULD`, `MAY`, `REQUIRED`) retain the
upstream wording. Where the specification gives only an example or semantic
description rather than a YAML schema, this note says so.

## Findings at a glance

- OKF v0.2 is a directory-tree format for UTF-8 `.md` files with YAML
  frontmatter and standard Markdown bodies. A non-reserved concept document
  needs only a non-empty `type`; the format recommends a small metadata set,
  permits arbitrary extensions, and defines optional provenance, trust,
  lifecycle, and attested-computation families.
- Its progressive-disclosure indexes, ordinary Markdown links, structural
  bodies, descriptions, sources, and lifecycle metadata fit agent-facing
  knowledge docs well as conventions. Treating the whole repository as one
  strictly conformant bundle fits poorly: current root discovery files would
  need concept frontmatter, and OKF's reserved `index.md`/`log.md` semantics do
  not match every repository or product use of those names.
- Astro imposes no universal blog-post field names. It validates the Zod schema
  this project will define, so OKF keys can be admitted deliberately. The
  concrete seams are `.mdx` versus OKF's `.md`/standard-Markdown boundary,
  open-ended OKF extensions versus a declared collection schema, OKF concept
  IDs versus Astro's generated/custom IDs, and a possible `draft` boolean
  versus OKF's `status` lifecycle vocabulary.
- No site collection or frontmatter schema exists in this repository yet, and
  issue #1 explicitly leaves it unspecified. Entry-level conflicts below are
  therefore constraints for the later decision, not defects in current code.

## Bundle and document structure

- A **knowledge bundle** is a self-contained hierarchical directory tree and
  the unit of distribution. A **concept** is one Markdown document. Its
  **concept ID** is the document's bundle-relative path with the `.md` suffix
  removed. ([terminology](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/SPEC.md#L71-L84))
- Producers choose the domain-specific directory hierarchy. A bundle may have
  concept documents at its root and at arbitrary nested levels. It may be
  distributed as a Git repository (recommended), an archive, or a
  subdirectory of a larger repository.
  ([bundle structure](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/SPEC.md#L109-L132))
- `index.md` and `log.md` are reserved at every directory level and MUST NOT
  be used as concept documents. Every other `.md` file is a concept document.
  ([reserved filenames](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/SPEC.md#L134-L149))
- Every concept is UTF-8 Markdown beginning with a YAML mapping delimited by
  `---` lines, followed by a free-form Markdown body.
  ([concept documents](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/SPEC.md#L153-L172))
- The specification defines no general filename or directory slug grammar
  beyond the `.md` suffix, the two reserved names, and the concept-ID rule.
  The reference agent separately restricts each concept-ID segment to
  `[A-Za-z0-9_][A-Za-z0-9_.-]*`; that is an implementation restriction, not a
  stated OKF conformance rule.
  ([SPEC.md, lines 71–84 and 134–144](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/SPEC.md#L71-L84),
  [reference-agent `paths.py`](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/src/reference_agent/bundle/paths.py#L6-L33))

The illustrative tree is:

```text
path/to/bundle/
  index.md              # optional directory listing
  log.md                # optional update history
  <concept>.md
  <subdirectory>/
    index.md
    <concept>.md
    <subdirectory>/
      ...
```

## Concept frontmatter

### Base keys

| Key | YAML shape stated or implied upstream | Requiredness and meaning |
| --- | --- | --- |
| `type` | Short, non-empty string | The only always-required key. Values are producer-defined; examples include `Metric`, `Reference`, and `Attested Computation`. Consumers MUST tolerate unknown values. |
| `title` | String | Recommended display name. A consumer may derive it from the filename when absent. |
| `description` | String containing one sentence | Recommended summary, used for indexes, snippets, and previews. |
| `resource` | String containing a canonical URI or accepted path form | Recommended when the concept describes an underlying asset; it may be absent for abstract concepts. |
| `tags` | YAML list of short strings | Recommended cross-cutting categorization. OKF defines no separate tag-index file. |

These shapes and requirements come directly from the base-frontmatter section.
Unknown producer-defined keys are allowed; consumers SHOULD preserve them on
round trip and MUST NOT reject them.
([frontmatter](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/SPEC.md#L161-L207))

### Provenance keys

The whole provenance family is optional.

| Key | YAML shape stated or implied upstream | Requiredness and meaning |
| --- | --- | --- |
| `sources` | List of source-entry mappings | Optional list of materials from which the concept derives. |
| `sources[].resource` | String | REQUIRED inside each source entry. It may be an absolute URL, bundle-relative path, relative path, or even a non-followable population/scope descriptor. |
| `sources[].id` | String | Optional stable attribution key; SHOULD be present when the body cites the source. |
| `sources[].title` | String | Optional human-readable label. |
| `sources[].author` | Actor string | Optional credibility signal identifying the source producer. |
| `sources[].usage_count` | Count represented by a YAML scalar; no numeric YAML type is formally declared | Optional liveness/adoption signal, interpreted in the accompanying usage window. |
| `sources[].last_modified` | `YYYY-MM-DD` date | Optional source-recency signal. |
| `usage_window` | Mapping `{from: YYYY-MM-DD, to: YYYY-MM-DD}` | Optional sibling of `sources`, framing all usage counts. An individual source may carry its own mapping to override it. |

The specification deliberately records source signals rather than a
credibility score. Per-claim attribution uses Markdown footnotes whose label
equals `sources[].id`; the footnote label, not its prose, is the join key.
([provenance fields and semantics](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/SPEC.md#L277-L361))

### Trust and lifecycle keys

These families are also optional.

| Key | YAML shape stated or implied upstream | Requiredness and meaning |
| --- | --- | --- |
| `generated` | Mapping | Optional record of how the current content was produced. |
| `generated.by` | Actor string | REQUIRED when `generated` is present. |
| `generated.at` | ISO 8601 datetime | Records the last meaningful content change. It is described but not separately marked REQUIRED. |
| `verified` | List of `{by, at}` mappings, or one bare `{by, at}` mapping | Optional verification history. Consumers MUST normalize a bare mapping to a one-element list. Each described event has an actor `by` and ISO 8601 datetime `at`. |
| `status` | One of `draft`, `stable`, `deprecated` | Optional; absence means `stable`. |
| `stale_after` | Absolute `YYYY-MM-DD` date | Optional; the concept is stale when `today >= stale_after`. |

`generated` says who or what wrote the current content; `verified` says who
or what checked it. A consumer derives trust as unverified (no `verified`),
machine-confirmed (only non-human actors), or human-reviewed (at least one
`human:` actor). These tiers are advisory, not access control.
([trust fields](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/SPEC.md#L363-L407),
[lifecycle fields](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/SPEC.md#L409-L430))

Identity-bearing fields use these actor strings:

- `<producer>/<version>` for an agent or tool;
- `human:<id>` for a person; and
- `process:<id>` for an automated process.

Producers MUST use `human:` for hand-authored or human-confirmed content,
because trust classification keys off that prefix.
([actor convention](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/SPEC.md#L486-L498))

### Attested Computation keys

An attested computation is a standalone concept with
`type: Attested Computation`, linked from concepts that consume it. In
addition to the optional provenance, trust, and lifecycle families, upstream
describes these keys:

| Key | YAML shape stated or implied upstream | Requiredness and meaning |
| --- | --- | --- |
| `runtime` | String such as `bigquery`, `postgres`, `dbt`, `python`, or `Looker` | Explicitly REQUIRED for this concept type. It determines execution and parameter-binding semantics. |
| `parameters` | List of mappings shaped `{name, type, required}` | Typed, named values an agent may fill. The example makes `required` a boolean, but the spec does not define a type vocabulary or separately state inner-key requiredness. |
| `computation` | Path string | Explicitly optional. When present, names the computation file; when absent, the body's `# Computation` code block supplies it. |
| `executor` | Mapping with `resource` and `receipt` | Describes run instructions/code and a list of receipt field names. The section does not explicitly mark the mapping or its inner keys required or optional. |
| `attester` | Mapping with `resource` | Describes deterministic, non-LLM receipt-checking code. Its requiredness is not explicitly stated. |

The computation is either one inline fenced code block under
`# Computation`, or the file named by `computation`, not both. Agents may
supply only declared parameter values and MUST NOT author or edit the
sanctioned computation.
([contract fields](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/SPEC.md#L581-L605),
[inline/file rules](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/SPEC.md#L642-L667))

### Bundle version key

A bundle MAY declare `okf_version: "0.2"` in YAML frontmatter on the
bundle-root `index.md`. That is the only `index.md` on which frontmatter is
permitted. Consumers that do not understand the version SHOULD attempt
best-effort consumption.
([versioning](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/SPEC.md#L763-L777))

## Body, linking, and content conventions

- The body is standard Markdown. There are no required sections. Producers
  SHOULD prefer structural Markdown. `# Schema`, `# Examples`, and
  `# Computation` have conventional meanings and SHOULD be used when
  applicable.
  ([body conventions](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/SPEC.md#L209-L225))
- Relationships are ordinary Markdown links plus explanatory prose; the graph
  edge itself is directed but untyped. Broken links MUST be tolerated.
  ([link semantics](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/SPEC.md#L436-L463))
- Supported link forms are `/path/from/bundle/root.md` and normal paths
  relative to the current document. The specification recommends the leading
  slash form. Path-valued frontmatter fields additionally accept absolute
  URLs. `sources[].resource` may instead be a scope descriptor.
  ([links and path-valued fields](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/SPEC.md#L436-L474))
- A `references/` subdirectory conventionally mirrors external materials,
  executor instructions, or code as concepts. The name is a convention, not
  a requirement. Lineage is expressed by links and source resources rather
  than a separate lineage field.
  ([`references/` convention](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/SPEC.md#L476-L482),
  [lineage](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/SPEC.md#L340-L345))
- In v0.2, `generated.at` supersedes legacy `timestamp`, and `sources`
  supersedes a body `# Citations` list. Consumers may fall back to those v0.1
  forms when reading older documents.
  ([v0.2 breaking changes](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/SPEC.md#L793-L808))

## Reserved documents

### `index.md`

An `index.md` may appear in any directory for progressive disclosure. Except
for the optional root `okf_version` frontmatter, it contains no frontmatter.
Its body has one or more heading-grouped sections whose entries have the form:

```markdown
# Section / Group Heading

* [Title](relative-url) - short description
```

Entries SHOULD carry the linked concept's frontmatter description. Producers
may generate indexes; consumers may synthesize a missing one.
([index files](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/SPEC.md#L502-L526))

### `log.md`

A `log.md` may appear at any level. It is a flat, newest-first list grouped by
ISO `YYYY-MM-DD` headings. Entries are prose. A leading bold action word such
as `**Update**` is conventional, not required.
([log files](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/SPEC.md#L530-L549))

## Conformance boundary

The explicit v0.2 conformance test is deliberately small:

1. every non-reserved `.md` file has parseable YAML frontmatter;
2. every such mapping has a non-empty `type`; and
3. any present `index.md` and `log.md` follows its reserved structure.

Consumers MUST NOT reject a bundle for missing optional metadata, unknown
types or keys, broken links, or missing indexes. Trust, lifecycle, provenance,
and computation families SHOULD follow their respective sections when
present.
([conformance](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/SPEC.md#L733-L759))

## Upstream templates and examples

Upstream provides examples, but no standalone generic OKF authoring-template
file:

- `SPEC.md` contains a minimal frontmatter skeleton, resource-bound and
  abstract concept examples, a full Attested Computation contract, and an
  income-statement worked example.
  ([base skeleton and concept examples](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/SPEC.md#L161-L273),
  [attested example](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/SPEC.md#L607-L640),
  [worked example](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/SPEC.md#L831-L1003))
- Four checked-in bundles demonstrate concrete layouts: GA4, Stack Overflow,
  Bitcoin, and Acme Retail. The Acme bundle demonstrates v0.2 trust,
  lifecycle, policy, skill, attester, metric, and computation documents.
  ([bundle directory](https://github.com/GoogleCloudPlatform/knowledge-catalog/tree/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/bundles),
  [Acme computation example](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/bundles/acme_retail/computations/revenue-ytd.md))
- The reference-agent prompt is a producer-specific recipe for BigQuery
  output: short prose, `# Schema`, then `# Common query patterns`. It is
  narrower than generic OKF, whose body has no required sections.
  ([reference-agent body recipe](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/src/reference_agent/prompts/reference_instruction.md#L45-L59))

## Ambiguities and internal inconsistencies upstream

These points are limitations or tensions within the upstream materials, not
local-repository findings:

1. **`type`-only conformance versus computation-specific requiredness.** The
   base section says a document carrying only `type` is fully conformant, and
   the conformance section makes non-empty `type` the only concept-frontmatter
   test while saying computation families merely SHOULD follow their section.
   Section 10 nevertheless marks `runtime` REQUIRED for
   `type: Attested Computation`. It is therefore unclear whether omitting
   `runtime` is formally non-conformant or only violates the computation
   contract convention.
   ([base rule](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/SPEC.md#L175-L188),
   [runtime rule](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/SPEC.md#L581-L595),
   [conformance rule](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/SPEC.md#L733-L750))
2. **Two contrary link recommendations.** The format spec recommends
   leading-slash bundle-relative links. The repository's v0.2 producer prompt
   requires file-relative links and explicitly forbids leading slashes because
   they break GitHub rendering. Both are valid under the format, but a producer
   following the prompt will not follow the spec's preferred form.
   ([format link recommendation](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/SPEC.md#L436-L453),
   [producer link rule](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/src/reference_agent/prompts/reference_instruction.md#L75-L96))
3. **Different `tags` and `sources` strictness in the producer prompt.** The
   spec says `tags` is a YAML list and source `id`/`title` are optional. The
   producer prompt permits a comma-separated `tags` value and describes every
   source as having `resource`, stable `id`, and `title`. That prompt is a
   stricter/different producer convention, not the generic field contract.
   ([format fields](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/SPEC.md#L190-L200),
   [format source entries](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/SPEC.md#L300-L310),
   [producer fields](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/src/reference_agent/prompts/reference_instruction.md#L21-L43),
   [producer source entries](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/src/reference_agent/prompts/reference_instruction.md#L61-L68))
4. **The inline-computation example is not fenced.** Section 10.3 requires a
   single fenced code block under `# Computation`, but the immediately
   preceding normative example renders the SQL as an indented Markdown code
   block. The checked-in Acme example does use a fenced `sql` block.
   ([spec example](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/SPEC.md#L607-L647),
   [checked-in example](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/bundles/acme_retail/computations/revenue-ytd.md#L30-L49))
5. **Nested field schemas are incomplete.** The spec does not fully declare
   YAML scalar types, allowed vocabularies, or presence rules for parameter
   entries, `executor`, `receipt`, and `attester`; it also describes
   `generated.at` without marking it required. This is consistent with the
   format's stated minimalism, but consumers cannot infer a complete validation
   schema from v0.2.
   ([trust fields](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/SPEC.md#L363-L396),
   [computation fields](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/SPEC.md#L581-L605))
6. **Reserved-log frontmatter is unspecified.** The index section explicitly
   governs frontmatter, but the log section neither permits nor forbids it.
   The checked-in Acme `log.md` begins with `type: Log` frontmatter even though
   `log.md` is reserved and not a concept document. Its validity therefore
   rests on an omission in the log rules rather than an explicit allowance.
   ([reserved-name rule](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/SPEC.md#L134-L144),
   [log rule](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/SPEC.md#L530-L549),
   [Acme log](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/bundles/acme_retail/log.md#L1-L10))
7. **Subdirectory index targets vary.** The spec's illustrative index links a
   subdirectory as `subdir/`; the reference generator and checked bundles link
   directly to `subdir/index.md`. No rule selects one form.
   ([spec index example](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/SPEC.md#L502-L526),
   [generator](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/src/reference_agent/bundle/index.py#L67-L90),
   [checked root index](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/bundles/acme_retail/index.md#L1-L8))

## Fit for this repository's knowledge docs

### Current repository shape

This repository is still in its planning phase. [`CLAUDE.md`](../../CLAUDE.md)
is a discovery map that points agents to `README.md`, `CONTEXT.md`,
`docs/adr/`, and three agent guides. `CONTEXT.md` and `docs/adr/` do not exist
yet; the domain guide explicitly says to proceed silently when they are absent.
Specs currently live in GitHub issues, while issue #10 calls for the eventual
v1 spec to be committed in the decided document format.
([`CLAUDE.md`](../../CLAUDE.md),
[`docs/agents/domain.md`](../agents/domain.md),
[`docs/agents/issue-tracker.md`](../agents/issue-tracker.md),
[issue #1](https://github.com/ayvbrg/ayvbrg.log/issues/1),
[issue #10](https://github.com/ayvbrg/ayvbrg.log/issues/10))

That distinction matters: the assessment can compare intended document roles,
but it cannot validate a nonexistent `CONTEXT.md`, ADR template, spec template,
or site collection.

### Artifact-by-artifact fit

| Repository artifact | What fits | Where strict OKF creates friction |
| --- | --- | --- |
| `CLAUDE.md` discovery map | Its short links and progressive disclosure serve the same navigational goal as an OKF `index.md`. | It is not named `index.md`. If the repository root were declared an OKF bundle, `CLAUDE.md` would instead be an ordinary concept and would require YAML frontmatter plus `type`. Renaming it would lose the tool-discovery filename. The OKF index body shape is also narrower than the current map, which contains behavior and working agreements. |
| `CONTEXT.md` | A domain context is an abstract concept OKF can represent. `type`, `title`, `description`, structured headings, sources, and links all apply cleanly. | One glossary may contain many domain concepts, while OKF defines a concept as one document. OKF does not say whether to split or aggregate them, so document granularity remains a local choice. As an ordinary `.md` file in a conformant bundle it would require frontmatter. |
| Specs and research notes | These are strong concept-shaped documents: a descriptive `type`, title, summary, source provenance, lifecycle, and links are useful to both agents and humans. Producer-defined fields can carry spec-specific data. | OKF deliberately supplies no spec/research body template, approval workflow, or complete validation schema. Its actor and timestamp conventions add upkeep if provenance/trust fields are adopted. |
| ADRs | One decision per file maps naturally to one concept. `type`, title, description, sources, links, and `generated`/`verified` can complement an ADR. | OKF `status` means only `draft`, `stable`, or `deprecated`; an ADR normally needs decision states such as proposed, accepted, rejected, or superseded. Reusing `status` for both meanings would be inaccurate. A separate ADR field or body convention would still be needed. |
| `docs/agents/*.md` operating guides | Structural Markdown and links already match. A type/summary can make guides searchable, and `stale_after` can flag rules that genuinely need periodic review. | These are instructions rather than catalog concepts, and OKF does not define precedence or instruction semantics. Marking every edit with `generated`/`verified` would be process overhead unless a consumer uses those signals. |

### Bundle-scope consequence

Selective use of OKF conventions has low structural cost. Strictly declaring
the repository root as an OKF bundle has a much larger consequence: every
non-reserved `.md` under it—including `README.md`, `AGENTS.md`, `CLAUDE.md`,
and the agent guides—would need parseable frontmatter and a non-empty `type`.
That is required by OKF conformance even if the later rules ticket only wants
the conventions for a subset of knowledge docs.

Declaring only a subdirectory such as `docs/` as a bundle would narrow that
effect, but `CONTEXT.md` and `CLAUDE.md` live outside it. Borrowing individual
OKF conventions without claiming bundle conformance avoids the scope problem.
These are fit observations, not a recommendation among those choices.

Two upstream conventions need special care in a GitHub-maintained repository:

- The spec recommends leading-slash bundle-relative links, but GitHub resolves
  them as repository-host absolute paths rather than bundle paths. Upstream's
  own producer prompt therefore requires file-relative links. The current
  repository already uses relative links, which render in GitHub.
- `index.md` and `log.md` are reserved at every OKF bundle level. Here **log**
  is also the product's name for the writing section and `/log/<slug>` route.
  A directory named `log/` is harmless, but a knowledge or entry file named
  `log.md` would mean an update-history document to OKF rather than a concept.

## Fit for Astro Markdown/MDX entries

### What Astro actually imposes

Astro's current Content Layer API defines collections in
`src/content.config.ts`. A build-time collection has a required loader and an
optional—but recommended—Zod schema. With a schema, Astro validates entry data,
provides types, and requires each frontmatter/data property to be represented
by a Zod datatype. The built-in `glob()` loader supports both `.md` and `.mdx`,
and generates a URL-friendly entry `id` from the filename; a frontmatter
`slug` can override that generated ID.
([Astro content collections](https://docs.astro.build/en/guides/content-collections/#defining-build-time-content-collections),
[collection schemas](https://docs.astro.build/en/guides/content-collections/#defining-the-collection-schema),
[`glob()` IDs](https://docs.astro.build/en/guides/content-collections/#defining-custom-ids))

Astro's MDX integration supports YAML frontmatter and can load local `.mdx`
files through a collection glob. Thus Astro does **not** impose a fixed
`title`/`date`/`tags`/`draft` schema and does not reserve an OKF-style `type`
key in entry frontmatter. Those names and their requiredness will be this
project's schema decision.
([Astro MDX collections](https://docs.astro.build/en/guides/integrations-guide/mdx/#using-local-mdx-with-content-collections))

The current repository contains no `src/content.config.*`, `.md`, or `.mdx`
site entry files. Issue #1 lists `title`, `date`, `tags`, and `draft` only as an
unresolved possible schema, so there is no present schema against which OKF
can literally fail.

### Exact compatibility and conflict points

| Concern | OKF v0.2 | Astro/content-entry side | Result |
| --- | --- | --- | --- |
| Frontmatter syntax | YAML frontmatter is mandatory for concepts. | Markdown and MDX accept YAML frontmatter. | Directly compatible. |
| `type` | Non-empty string; the only universally required concept key. | No universal entry field named `type`; a project schema may define one. | An OKF-shaped entry schema must add and type it. It is not an Astro reserved-key collision. |
| `title`, `description`, `tags` | Recommended but optional; tags are a list of short strings. | The project may make these required and may restrict tags to its domain vocabulary (`devlog`, `experiment`, `random`). | A stricter producer schema remains OKF-compatible. The local tag enum is narrower, not contradictory. |
| Publication date | OKF standardizes `generated.at`, which is the last meaningful content change, not publication time. It defines no publication-date field. | A log entry needs a publication date for sorting, URLs/RSS, and display; Astro examples often use `pubDate`, while issue #1 currently says `date`. | `date`/`pubDate` must remain a producer extension. It must not be inferred from `generated.at`, because the meanings differ. |
| Draft/lifecycle | `status` is `draft`, `stable`, or `deprecated`; absence means stable. | Astro has no built-in draft key, but this project is considering a `draft` boolean and would implement filtering itself. | If both are adopted, `draft: true` plus `status: stable` can contradict and creates two sources of truth. One lifecycle model or an explicit mapping is required by the later rules/schema decision. |
| Identity and route slug | Concept ID is the exact bundle-relative `.md` path without the suffix. No override field is defined. | `glob()` derives a slugified `id` from the filename, and frontmatter `slug` may override it. Routes are intended as `/log/<slug>`. | Defaults are related but not identical: Astro may normalize the filename, and a custom `slug` can diverge completely from the OKF concept ID. Cross-links and route identity must choose which identity is canonical. |
| File/body format | A concept is a `.md` file whose body is standard Markdown. | The intended collection may include `.mdx`; MDX can contain imports, exports, JSX, and expressions in addition to Markdown. | Plain `.md` entries can be conformant. `.mdx` entries can borrow the metadata conventions but are outside the literal `.md`/standard-Markdown conformance definition. |
| Schema openness | Producers may add arbitrary fields; OKF consumers must tolerate unknown keys and should preserve them. | Once configured, the collection's Zod schema defines the accepted/typed entry shape and every entry property must be represented. | Every adopted OKF family (`sources`, `verified`, `status`, and so on) must be modeled in the Astro schema. Adding an OKF extension can require a schema edit before the site can consume it. This is open-world versus declared-schema tension, not a YAML conflict. |
| Reserved filenames | `index.md` and `log.md` cannot be concepts. | The glob loader treats matching filenames as entries and generates IDs from them unless the pattern excludes them. | A strict shared format must exclude or separately handle those names; otherwise the same file has reserved-document semantics in OKF and entry semantics in Astro. |
| Extra site metadata | Unrecognized producer fields are expressly allowed. | SEO images, updated dates, canonical URLs, or other later site fields can be declared by the project schema. | No format conflict, provided the Astro schema declares them. |

### Fit boundary

OKF conventions can sensibly extend to site-entry frontmatter because both
sides use YAML and OKF allows producer extensions. Literal OKF conformance is
narrower: it would require `.md`, `type`, file-path identity, and reserved-name
handling, while a useful site schema additionally needs publication metadata
and must validate every admitted field. MDX entries can be "OKF-shaped" but
are not concept documents as v0.2 defines them.

The later decision ticket therefore has concrete choices to reconcile, but no
technical requirement to maintain separate metadata blocks. One Astro schema
can contain both the useful OKF keys and site-only keys; whether it should is a
policy decision outside this report.

## Primary sources examined

- [`okf/SPEC.md`](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/SPEC.md)
- [`okf/README.md`](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/README.md)
- [`okf/src/reference_agent/bundle/document.py`](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/src/reference_agent/bundle/document.py)
- [`okf/src/reference_agent/bundle/paths.py`](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/src/reference_agent/bundle/paths.py)
- [`okf/src/reference_agent/bundle/index.py`](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/src/reference_agent/bundle/index.py)
- [`okf/src/reference_agent/prompts/reference_instruction.md`](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/src/reference_agent/prompts/reference_instruction.md)
- [`okf/tests/test_document.py`](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/tests/test_document.py)
- [`okf/tests/test_index.py`](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/tests/test_index.py)
- Checked examples under [`okf/bundles/`](https://github.com/GoogleCloudPlatform/knowledge-catalog/tree/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/bundles), especially [`acme_retail`](https://github.com/GoogleCloudPlatform/knowledge-catalog/tree/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/bundles/acme_retail) and [`ga4`](https://github.com/GoogleCloudPlatform/knowledge-catalog/tree/fe3268a70e8ca5110a43a8f1dfdf6d1a458cf79f/okf/bundles/ga4).
- [Astro content collections](https://docs.astro.build/en/guides/content-collections/)
- [Astro MDX integration](https://docs.astro.build/en/guides/integrations-guide/mdx/)
- This repository's [`CLAUDE.md`](../../CLAUDE.md),
  [`docs/agents/domain.md`](../agents/domain.md), and
  [`docs/agents/issue-tracker.md`](../agents/issue-tracker.md)
- GitHub issues [#1](https://github.com/ayvbrg/ayvbrg.log/issues/1),
  [#8](https://github.com/ayvbrg/ayvbrg.log/issues/8), and
  [#10](https://github.com/ayvbrg/ayvbrg.log/issues/10)
