# GitHub conventions

Shared conventions for comments, replies, reviews, and pull requests.

## Comment attribution

Every agent-authored GitHub comment, reply, and review body ends with the
italicized attribution footer:

```markdown
<actual text>

--- _<model-slug> replying on behalf of @<github-user>_
```

- `<model-slug>` — the acting model's id.
- `<github-user>` — the authenticated login, from `gh api user -q .login`.

## Pull request titles

Use a Conventional Commits title: `type(scope): summary`. Commit subjects
follow the same rules.

- Types: `feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `build`, `ci`,
  `chore`, `revert`, `style`.
- Scope is optional: the dominant module (Log, Landing, RSS). One scope; omit
  it when the change spans the site.
- Summary: imperative, lowercase, no trailing period, whole title ≤ 72
  chars.
- Breaking change: append `!` after the type/scope.
- Pick the type by primary intent. A feature with tests and docs is still
  `feat`.

Explain why the change matters, not the mechanism.

## Pull request descriptions

Open with the problem, grounded in the originating issue, then briefly
explain the solution. Implementation detail comes after, and only what a
reviewer needs.

Link everything the change is tied to: issues it closes or is part of. Use
`Closes #<n>` for tickets this PR completes. Parent work stays `Part of #<n>`
and is not closed by the PR.

When `.github/PULL_REQUEST_TEMPLATE.md` exists, use it and still include the
links above.

End with a blurb naming the model and harness that made the changes.

Open a real PR, not a draft, unless asked for a draft. Update from latest
`main` before opening.

## Issues

Use `gh` as described in [issue-tracker.md](issue-tracker.md). Check off
acceptance-criteria boxes in the issue body when they are met. Close with a
short resolution comment that names the commit and what landed.
