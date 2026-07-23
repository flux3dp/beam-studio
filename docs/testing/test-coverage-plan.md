# Release-Test Automation: Coverage Analysis & Execution Plan

Source: "Beam Studio Test 2026JUL.xlsx" (331 test cases) cross-referenced against the repo
on branch 2.6.9, 2026-07-04. Row numbers below are the xlsx row numbers.

Companion guides: `.claude/skills/unit-test/SKILL.md` (Jest), `.claude/skills/e2e-test/SKILL.md` (Cypress).

## 1. Current State

| Status per spreadsheet | Cases | Notes |
|---|---:|---|
| Automated (spec named) | 205 | 62% — all Cypress, `apps/web/cypress/e2e/` |
| No automation (blank) | 93 | Concentrated: Camera (10), 3D curve (10), cloud storage (9), top-menu tools (17), Google Fonts (5), machine settings (5) |
| Needs FLUXGhost (local only) | 6 | Skip on CI via `envType === 'github'` |
| Needs physical machine | 12 | Rotary, outline preview, firmware, job control |
| Explicitly skipped (暫不測/不用) | 8 | |
| Other annotations | 7 | |

Infrastructure facts that shape the plan:

- CI (`web.e2e.yml`) runs the **entire** web suite on every PR across 5 parallel Windows
  containers against a static build. No FLUXGhost, no machine, no spec filtering.
- 68 Cypress specs exist; 25+ mature custom commands; md5/crc32 content assertions;
  no visual-regression tooling.
- 412 Jest spec files (~108k lines) exist, but coverage is uneven: helpers/widgets rich;
  `app/stores` (2 of ~15), `app/actions` (~33%), svgedit internals, and most tool-dialog
  *logic* (boxgen geometry, material-test grid, curve-engraving math, autoFit) are untested.
- **apps/app (Electron) has zero automated tests** — multi-tab, native menus, window
  management are human-only today.

### 1.1 Data-integrity problem: phantom specs (fix first)

Six spec files named in the sheet's status column **do not exist and never existed in git
history**. ~20 cases are claimed-automated but have zero coverage:

| Sheet reference | Covers (rows) | Reality |
|---|---|---|
| `qrcode.spec.ts` | 58 (QR error-tolerance levels, invert) | missing |
| `search-font.spec.ts` | 42 (font search) | missing |
| `boxgen.spec.ts` | 212, 214 (boxgen limits, live 3D update) | missing (Jest specs for Boxgen UI exist, but not this E2E) |
| `speed-limit-warning.spec.ts` | 263 (vector 20 mm/s limit) | missing |
| `svg-pdf-ai.spec.ts` | 116, 136, 156–157 (SVG layer-split color) | missing |
| `weld-text&path.spec.ts` | 103 (weld text) | missing |

Either these were planned and never written, or live in someone's unpushed branch. **Action:
confirm with the team, then write them (Session 1 below) or blank out the sheet cells.**

## 2. Tiering: what to automate, by whom, and what to leave alone

### Tier A — Agent-easy (Cypress or Jest, runs in CI, no new infrastructure)

Straight applications of existing patterns. A Sonnet/Opus session with the two skill guides
can do each of these unattended; verify by running the spec locally.

**A1. The six phantom specs** (rows above) — highest priority, they close claimed-coverage gaps.

**A2. New Cypress specs for uncovered UI features** (all machine-free):

| Work item | Rows | Notes |
|---|---|---|
| Google Fonts panel: search, language filter, category, save, cancel | 329–333 | `GoogleFontsPanel.tsx`; `cy.intercept` the fonts API for determinism |
| Boxgen dialog: outer/inner/cover, edge/finger/t-slot switch, import layers+labels | 213–218 | assert store/exported SVG, not 3D pixels |
| Barcode/QR tool: content correctness, scale, export | 219–220 | decode assertion or path checksum |
| Material test generator: rows/cols params, export content | 221 | plus Jest test of `generateSvgInfo.ts` |
| Workarea max sizes per Ador module (430×270/290/300/282) | 181–184 | assert `#svgcontent` dimensions |
| Machine-settings canvas switch: beamo/beambox/hexa/bb2 | 290–294 | same pattern as `document-workarea.spec.ts` |
| Machine-type change → workarea warning popup | 257 | |
| Right-panel dimension/position input: Enter commits value | 77 | |
| Depth-mode option (min power appears for gradient bitmap) | 80 | |
| Offset result correctness for vector/bitmap/text | 91 | path `d` checksums |
| Open recent project; drag-drop .beam import | 15–16 | DataTransfer drop on canvas |
| SVG import laser-module layering popup variants | 155 | |
| Speed slider red style for pure-path layers (limit 20 / BB2 50) | 120 | part of `speed-limit-warning.spec.ts` |
| Power >70% warning, <10% hint | 167–168 | UI-level assertion only |
| UV ink speed cap, white base / two-sided print toggles | 178–180 | UI state assertions |
| Print advanced params, hybrid-laser default+offset, reset behavior | 266–268 | preferences dialog |
| Wheel zoom/pan, space-drag pan | 193–194 | `trigger('wheel', {...})`, keydown space + mousemove |
| Path preview: travel path/invert toggle, canvas zoom in preview | 273–274 | assert toggle state + canvas transform, not pixels |
| Design Market external link | 318 | assert `window.open` target |

**A3. New Jest unit tests for pure logic** (from unit-test.md appendix):
`autoFit.ts` packing • `convertToPath.ts` • `generateSvgInfo.ts` + `TableSetting.ts` •
`helpers/boxgen/*` geometry • `curve-measurer/*` (mesh, >45° red-point rule → row 321's
logic half) • `rotary-axis.ts` + scale factor (row 282 logic) • `googleFontService.ts` •
`cloudFile.ts` (5-file-limit branch → row 310 logic) • `auto-save-helper.ts` (row 252) •
`tabController.ts` with mocked communicator • untested Zustand stores.

Estimated: A1+A2 ≈ 4–6 agent sessions, A3 ≈ 2–3 agent sessions. All CI-runnable.

### Tier B — Agent-buildable but needs human-provided environment

| Work item | Rows | Human prerequisite |
|---|---|---|
| Cloud storage E2E: save, save-as, rename, delete, sort, thumbnail, 6th-file error, old-file open | 309–317 | Staging FLUX ID test account (free tier) + cleanup策略; `CYPRESS_USERNAME/PASSWORD` already plumbed |
| FLUX ID email login, remember-login, AI-credit display | 229–234 (part) | Same test account. **Google OAuth excluded** (bot detection — keep human) |
| FLUXGhost-dependent specs run locally: import module popup, new-file confirm, auto-align, start-here, time calc, cut order | 13, 14, 79, 275, 277, 279 | A designated Mac/PC with FLUXGhost running; ideally a **nightly local run** (`cypress run` with local config) — the sheet already assumes this split |
| Machine-connected smoke: camera preview basic flow, connection <20s, dashboard progress | 200–201, 305 | Same host + a machine on the bench; semi-automated, human eyeballs results |
| Estimated-vs-actual job time | 304, 327 | Machine run; script can log both, human judges tolerance |

Recommendation: stand up **one recurring "local rig" run** (weekly or pre-release) executing
everything skipped on GitHub. The env vars (`backendIP`, `machineName`, `adorName`) already
exist — the missing piece is a documented checklist/launchd job and a results-reporting habit.

### Tier C — Keep human (automation impossible or wrong tool)

- Physical output quality: engraving/cutting results, rotary Y-length accuracy (280–283),
  DPI resolution checks (296–297), camera **calibration precision** (210), autofocus (211, 285)
- Machine motion/safety behavior: outline preview modes + blue light (298–301), job
  stop/pause/resume (302–303), firmware up/downgrade (306), 3D-curve probing, load test,
  Z-descent anti-collision (319–328 — the UI/math halves are Tier A3/B, the motion is human)
- Perception/style: right-panel style audit (76 — sheet itself says E2E can't check styles),
  onboarding tooltip positions on mac+win (228), trackpad pinch gestures (195)
- Google OAuth login (230)

### Tier D — Deliberately NOT worth building now (cost ≫ time saved)

| Idea | Why not |
|---|---|
| Electron E2E harness (Playwright-for-Electron) | Would cover ~5 sheet cases (multi-tab 307–308, native menu, window mgmt). High build+maintenance cost, brittle across Electron majors. Revisit only if desktop-only regressions become frequent. Meanwhile: unit-test `tabManager.ts`/`tabController.ts` logic with mocked IPC (Tier A3). |
| Visual-regression suite (Percy/Chromatic) | Only row 76 + assorted style checks benefit; canvas rendering is the risky surface and it's md5-asserted already. |
| Fake-camera FLUXGhost simulator to automate Camera rows 199–209 | Highest-value hard project (10 cases/release), but Cypress can't intercept WebSockets and injecting a stub PreviewManager means invasive test seams in prod code. Do the cheap tiers first; if camera manual cost still hurts, spike this as its own project (est. 1–2 weeks) before committing. |
| Automating trackpad gestures | Synthetic pinch events don't reproduce OS gesture pipelines; false confidence. |

## 3. Suggested session sequence (for later agent sessions)

1. **Phantom specs** — write `qrcode`, `search-font`, `speed-limit-warning`,
   `weld-text&path`, `svg-pdf-ai`, `boxgen` E2E specs (Tier A1). Update sheet column.
2. **Tool dialogs** — Google Fonts panel, barcode/QR tool, material test generator,
   Boxgen rows 213–218 (Tier A2), + Jest for `generateSvgInfo`/boxgen geometry (A3).
3. **Workarea & settings** — rows 181–184, 257, 290–294, 266–268, 77, 80 (A2).
4. **Canvas interaction & preview** — rows 15–16, 91, 120, 155, 167–168, 178–180,
   193–194, 273–274, 318 (A2).
5. **Pure-logic Jest batch** — autoFit, convertToPath, curve-measurer, rotary-axis,
   cloudFile, auto-save, tabController, stores (A3).
6. **Cloud + login E2E** — after human provides the staging account (B).
7. **Local-rig runbook** — document + schedule the FLUXGhost/machine run (B, mostly human).

Each session: read both skill guides first, run the new specs locally
(`pnpm nx run web:cy:dev` / `pnpm test <file>`), and record the new spec filename against the
sheet rows it covers (keep the spreadsheet the single source of truth).

## 4. Expected outcome

Tiers A+B close ~70 of the 93 blank cases plus the ~20 phantom-covered cases, lifting real
automated coverage from ~56% (205−20 of 331) to ~85%, with the remaining 15% being genuinely
physical/perceptual checks that belong to the human release checklist.
