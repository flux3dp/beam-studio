# Cypress on GitHub Actions

The `e2e` workflow builds the web app once and runs its specs across five Windows
runners. It does not record to Cypress Cloud. No new dependency or record key is
needed. PR updates cancel the previous run for the same PR; manually dispatched
runs are grouped separately by ref.

## Spec assignment

From `apps/web`, run `node scripts/cy-shard.mjs 1 5` with Node 24 to inspect shard 1.
The script discovers the same file extensions as `cypress.config.ts`, sorts paths,
and distributes them round-robin. Each file belongs to exactly one shard. The
matrix size supplies the total automatically; changing it does not require editing
the script. Empty shards fail before Cypress starts, preventing an accidental full
suite run. Keep the discovery glob in sync if Cypress's spec pattern changes.

This balances file counts, not durations. A slow spec may determine the total run
time; use the first CI runs to decide whether duration-based assignment is needed.
Retries, browser selection, CI environment and test assertions remain unchanged.

## Inspecting failures

Open the workflow run in GitHub Actions:

- Each job summary lists its assigned specs.
- `e2e-results-<shard>-attempt-<attempt>` contains `specs.json`, per-spec JUnit XML
  and any screenshots. Reports use `[hash]` filenames to avoid overwriting earlier
  specs. These artifacts are retained for 7 days, including on failed jobs.
- Videos are disabled by default. Enable `debug_artifacts` when manually dispatching
  the workflow, or add the `e2e-debug` label to a PR before its next run. Debug runs
  record and upload `e2e-videos-<shard>-attempt-<attempt>` for 3 days, including
  successful runs (useful for investigating flaky tests).
- Adding or removing a label does not itself trigger this workflow. Push a commit
  after changing the label to start a fresh PR run; re-running an old run uses its
  original event payload. Alternatively, manually dispatch with `debug_artifacts`.
- The shared `web-dist` build artifact is still retained for 1 day.
- Cypress output remains available in job logs. The Cypress step still fails the
  job on a test failure; artifact upload does not mask the exit status.

To reproduce a failure locally, start the web app and run from `apps/web`:

```sh
pnpm exec cypress run --config-file cypress.config.ci.ts --record false --spec cypress/e2e/<area>/<file>.spec.ts
```

There is no Cloud Replay or historical flake dashboard for these runs. GitHub
runner usage and artifact storage still count against the GitHub account's quotas.

## First CI validation

1. Dispatch `e2e` on the branch containing this change, or update its PR.
2. Confirm all five jobs receive nonempty, disjoint manifests and their union
   matches the complete spec list. All tests must finish with recording disabled.
3. Inspect JUnit artifacts and job logs. Confirm a failing run preserves screenshots
   and reports a failed check (use a temporary failing assertion on a disposable
   branch if no test fails naturally). Without a debug flag, no videos should be
   recorded or uploaded. Repeat with `debug_artifacts` enabled, and with a fresh PR
   run bearing `e2e-debug`: both should record and upload videos even on success.
   Reports/screenshots expire after 7 days, videos after 3 days.
4. Push twice to a test PR while its run is active; confirm the older run is cancelled.
5. Compare total runner time and the slowest shard with the previous workflow.

## Production post-deployment tests

`web.ready-for-deployment.yml` still triggers only on `web-*` tags. Its deployment
job is unchanged. After deployment succeeds, three `macos-latest` runners use the
same shard script, with Node 24 and pnpm, from `apps/web`. They run against the
existing `http://studio.flux3dp.com` base URL in `cypress.config.prod.ts`; no local
web server is started. The production config's environment, spec pattern, viewport,
plugin hooks and retry behavior are unchanged. JUnit reporting is enabled there.

Cloud recording and orchestration are disabled for this job too. The production
artifacts use a `production-e2e-` prefix. Reports and screenshots are retained for
7 days. Videos are disabled unless the repository Actions variable
`E2E_DEBUG_ARTIFACTS` is set to `true`; debug videos are uploaded even on successful
runs and retained for 3 days. Reset that variable after debugging. The PR/manual
workflow continues to use its own input/label controls.

Do not create a release tag just to test this configuration: that runs the existing
production deployment. On the next intended release, verify three nonempty,
disjoint manifests, JUnit output, `record: false`, and the artifact retention dates.
Local validation of this migration does not exercise the deployment job or the
production website. The deployment job still uses its original Node 16/Yarn and
external core checkout; compatibility of those legacy steps is a separate concern.

After both workflows have been verified, check for any other clients recording to
Cloud before downgrading/cancelling the subscription. Older tagged revisions and
reruns of old workflows can still use their previous Cloud configuration.
