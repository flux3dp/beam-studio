---
name: feature-review
description: Fresh-session review of a big feature branch against its PRD — blast radius, diff-derived acceptance criteria, and callers the PRD never mentions. Use when asked to review a feature branch, a PR with a docs/prd/ spec, or to "find the unsaid cases".
---

# Feature Review Skill

You are the second pair of eyes, not the author. Run this in a session that has no memory of
building the feature. Your job is not to confirm the PRD; it is to find what the code does that
the PRD does not say, and what the code changed that the PRD said must not change.

Do not read the PRD until step 3. Reading it first gives you the author's blind spots.

## 1. Blast radius

```bash
git diff --stat main...HEAD
```

Split the touched files into two piles:

- **Feature-local**: new files, or files under the feature's own folder. Skim only.
- **Shared**: any existing file outside the feature's folder. Read every hunk.

Treat these paths as shared no matter where the feature lives — a hunk here is always read:

- `packages/core/src/web/app/svgedit/` — the canvas engine (transform, history, layer,
  selection, text, path). Only bug fixes and deliberate refactors belong here; a feature that
  reaches in is a finding on its own, ask why it could not stay in its own folder.
- `packages/core/src/web/helpers/api/svg-laser-parser.ts` — task generation. Changes here are
  expected only when the feature changes what gets sent to the machine; anything else is a
  finding. Its command strings are matched by fluxghost, so a rename is a cross-repo break.

For each changed shared function, list its callers (`grep -rn "<name>(" packages apps --include=*.ts --include=*.tsx`).
Output a table: `function — caller file — behaviour the caller depends on — touched by diff? (y/n)`.

## 2. Diff-derived acceptance criteria

From the diff alone, write the acceptance criteria this code implements, in the PRD's own
format: entry point, steps, observable result, edge cases. Include behaviours the diff changed
in shared code even when they look incidental. Do not guess intent; describe what the code does.

## 3. Compare to the PRD

Now open `docs/prd/<feature>.md`. Produce three lists:

- **Unsaid**: diff-derived criteria with no matching PRD acceptance criterion. Each is either
  scope creep or an untested behaviour; say which.
- **Unmet**: PRD acceptance criteria the diff does not implement, or implements differently.
- **Must-not-change gaps**: shared files in your step-1 table that are missing from the PRD's
  "Must not change" section, and listed callers whose expected behaviour the diff breaks.

## 4. Break it

For every Unsaid item and every Must-not-change gap, name the one input or sequence most likely
to expose a bug, and check it: run the relevant spec (`pnpm test <file>`), or trace the call by
hand when no spec exists. Report what you actually ran, not what should be run.

## 5. Report

Findings first, most severe first, each as `file:line — what breaks — how to reproduce`. Then
the three lists from step 3. No summary of the feature, no praise. If nothing survived, say so
in one line and show the step-1 table so the human can see what you covered.
