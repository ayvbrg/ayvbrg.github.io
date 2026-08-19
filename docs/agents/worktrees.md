# Worktree isolation

Run every repository task in an isolated Git worktree. This covers
implementation, reviews, investigations, tests, and rebases.

The product clone (this repository on `main`) is a worktree anchor. Fetch refs
and manage worktrees from it. Keep task-branch checkouts, edits, installs,
tests, and commits in the task worktree.

`.workspaces/` is the only allowed parent for task worktrees. Never create a
top-level `.worktrees/` directory inside the clone.

## Layout

This clone is a Git repository. Task worktrees live **beside** the clone, not
inside it:

```text
<parent>/yvbrg.log                         # base clone, stays on main
<parent>/.workspaces/<task-slug>/yvbrg.log # integration worktree
<parent>/.workspaces/<task-slug>/issue-<n>/ # optional parallel issue worktree
```

From the clone:

```bash
git fetch origin
git worktree add \
  ../.workspaces/<task-slug>/yvbrg.log \
  -b sess/<task-slug> origin/main
```

For a parallel issue on the same session, branch from the integration HEAD:

```bash
git worktree add \
  ../.workspaces/<task-slug>/issue-<n> \
  -b sess/<task-slug>-issue-<n> sess/<task-slug>
```

Issue branches stay local. Do not push them. Merge them into the integration
branch from the integration worktree.

## Reuse

Reuse a worktree only when it belongs to the same task and target ref. Never
repurpose a worktree owned by another task or agent. If ownership is unclear,
leave it intact and create a separate worktree.

## Finish

1. Run verification from the task worktree.
2. Commit and push requested changes from that worktree.
3. Keep the worktree while the task or pull request still needs follow-up.
4. Before removal, confirm the worktree is clean and valuable changes are
   pushed.
5. Remove the worktree through Git, then remove the task directory only when
   it is empty.

Retain local and remote branches unless asked to delete them.
