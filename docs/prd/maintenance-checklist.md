# PRD: Digital Maintenance Checklist

| | |
|---|---|
| **Status** | Phase 1 implemented (PR #931) — usage-aware cadence (Phase 2) and cloud/fleet (Phase 3) still pending; see §12 |
| **Author** | Product (AI PM agent) |
| **Created** | 2026-06-30 |
| **Target product** | Beam Studio (desktop + web) |
| **Owner area** | Machine workflows / new "Maintenance" subsystem |
| **Related code** | Schedule data: `packages/core/src/web/app/constants/maintenance/` (`index.ts`, `meta.ts`, `tasks.ts`, `types.ts`); status/records engine: `packages/core/src/web/helpers/maintenance/` (`dueStatus.ts`, `records.ts`, `essentialCounts.ts`, `usageTracker.ts`); dialog UI: `packages/core/src/web/app/components/dialogs/MaintenanceChecklist/`; TopBar badge: `packages/core/src/web/app/components/beambox/TopBar/MaintenanceButton.tsx`; supporting infra: `packages/core/src/web/helpers/hooks/useDeviceList.ts`, `packages/core/src/web/helpers/confetti.ts`, `packages/core/src/web/app/constants/deviceEvents.ts`; i18n: `maintenance` namespace in `packages/core/src/web/app/lang/en.ts` |

---

## 1. Summary

Beam Studio today has **no in-software maintenance support**. Maintenance lives entirely in Help Center articles (e.g. *4-1 Beambox II – Maintenance Checklist*) plus a downloadable PDF grid that the user is expected to **print and tick by hand**. Regular maintenance directly governs cut quality and the lifespan of the laser tube, mirrors, and chiller — yet the current experience is paper, out-of-app, easy to forget, and impossible for the software to remind on.

This PRD specifies a **digital maintenance checklist**: a per-machine popup dialog, opened from a menu/TopBar entry, that lists each maintenance task for the connected machine's model, shows its status (OK / due soon / overdue) computed from when it was last done, and lets the user **mark a task done** (or, for inspection tasks, Pass/Fail) with one click. A **machine dropdown** at the top switches which machine's records are shown. The dialog gives **positive feedback** — a per-task celebratory toast and a machine-level "health" state that congratulates the user when all essential tasks are current.

The change is mostly **new** (no maintenance subsystem exists), but it **reuses** established patterns: model/workarea config (`workArea`, `getWorkarea`), connected-device selection (`get-device.ts`, `SelectMachineButton`), per-device local storage keyed by UUID/serial (`deviceStore.ts`), the central dialog registry (`dialog-caller.tsx`), the toast system (`message-caller.ts`), and `en.ts` i18n.

The single most important design choice: each model's checklist is described by a **declarative schedule config** (a typed data object), not hard-coded UI. This is what makes "different machines need different tables" cheap — adding HEXA's or Ador's table is data, not code — and sets up a future where FLUX **pushes schedule updates remotely** without an app release.

## 2. Background & current state

### 2.1 What exists today

- **Maintenance is documentation-only.** The canonical artifact is the Help Center article *4-1 Beambox II – Maintenance Checklist* and its printable PDF. The PDF is a static grid: **Area × Item × Key Points × Weeks (W1–W12 over 3 months)**, with dashes marking which weeks each item is due. The article explicitly says *"Print the following table for the machine user or maintenance personnel."*
- **HEXA has a separate checklist** (article *4-1 HEXA – Maintenance Checklist*), confirming that **schedules are model-specific** and that any solution must be multi-model from day one.
- **No maintenance/reminder code exists.** A grep of the codebase finds no maintenance feature. The only adjacent things are one-off preference flags such as `should_remind_calibrate_camera` and credit reminders (`ai_bg_removal_reminder`) — i.e. there is no recurring-task or checklist subsystem to extend. This feature pioneers one.
- **An "Example Files" menu stub exists** (`example_files` in `lang/en.ts` / `useMenuData.ts`) — relevant because the maintenance article recommends *"Engraving a sample file once a month (File > Examples > Example Files)"* as itself a maintenance action we can deep-link to.

### 2.2 Reusable building blocks (cite + verify before building)

| Need | Existing code | Notes |
|---|---|---|
| Model identity & per-model config | `packages/core/src/web/app/constants/workarea-constants.ts` — `WorkAreaModel` union (`'fbm1' \| 'fbm2' \| 'fbb1b' \| 'fbb2' \| 'fhexa1' \| 'ado1' \| 'fpm1' \| …`), `workareaConstants`, `getWorkarea(model)`, and the model picker list (`{ label: 'Beambox II', value: 'fbb2' }`). | Beambox II = **`fbb2`**. Maintenance schedules key off `WorkAreaModel`. |
| Connected machine + switching | `packages/core/src/web/helpers/device/get-device.ts` (`getDevice()` → `IDeviceInfo` with `model`, `serial`, `uuid`, `name`); `packages/core/src/web/app/components/beambox/TopBar/SelectMachineButton.tsx`; `packages/core/src/web/helpers/device-master.ts`. | The dialog's machine dropdown can reuse the device list / `DeviceMaster`. |
| Per-machine local storage | `packages/core/src/web/helpers/device/deviceStore.ts` (`deviceStore.get(uuid)` / `set(uuid, data)`); `packages/core/src/web/interfaces/IStorage.d.ts`. | Maintenance records persist **per machine**, keyed by serial (preferred over UUID — see §6.4). |
| Dialog / modal | `packages/core/src/web/app/actions/dialog-caller.tsx`; examples `dialogs/AboutBeamStudio.tsx`, `dialogs/MaterialTestGeneratorPanel/index.tsx`, `boxgen/Boxgen.tsx` (`DraggableModal`). | Reuse the registry + `DraggableModal` pattern. |
| Feedback / toast | `packages/core/src/web/app/actions/message-caller.ts` (`MessageCaller.openMessage({ level: MessageLevel.SUCCESS })`); `progress-caller.ts`; `alert-caller.tsx`. | No confetti lib today — celebratory animation is new (small, self-contained). |
| i18n | `packages/core/src/web/app/lang/en.ts` — domain-scoped nested keys. | Add a top-level `maintenance` namespace. |

### 2.3 Why change

- **Forgotten maintenance shortens hardware life.** Tube, mirrors, and chiller degrade fastest under neglect; the article exists precisely because inactivity causes "accelerated aging." Software that *remembers* directly protects the user's investment and reduces support tickets ("my cuts got weak").
- **Paper doesn't scale or remind.** A printed grid can't tell you what's overdue today, can't follow the machine across operators/computers, and can't link to the how-to.
- **Competitive whitespace.** xTool (XCS) and LightBurn ship **no in-software maintenance log or reminder**. FLUX can own "the laser software that helps you keep the machine healthy." (xTool markets *hardware* designed for easy cleaning, but nothing in *software*.)
- **We already know when the machine runs.** Beam Studio sends jobs and watches them via the monitor — a foundation for *usage-based* cadence ("once an operation") that paper fundamentally cannot do.

## 3. Goals & non-goals

### Goals
- **G1** — Give every connected machine an in-app, per-model maintenance checklist showing each task's status (OK / due soon / overdue) at a glance.
- **G2** — Let the user record maintenance in one click ("Mark as done" / Pass-Fail), with per-machine history, and have status/next-due recompute automatically.
- **G3** — Make adding/altering a model's table **pure data** (a declarative schedule config), so HEXA, Ador, beamo II, Promark, etc. are added without UI work.
- **G4** — Switch the active machine via a dropdown; records are stored and shown **per machine**.
- **G5** — Reward good maintenance: per-task positive feedback and a machine-level "health" celebration when all essential tasks are current.
- **G6** — Surface overdue **essential** maintenance unobtrusively (entry-point badge; optional, dismissible startup reminder) so problems are noticed before cut quality drops.
- **G7** — Bridge to existing help: each task links to its Help Center article / relevant in-app action (e.g. "engrave a sample file").

### Non-goals
- **N1** — Firmware-side maintenance counters or any machine-reported wear telemetry. (We use Beam Studio-side signals only; deferred.)
- **N2** — Cloud sync of maintenance records across devices/accounts. (Phase 1 is local; cloud = Phase 3, see §12.)
- **N3** — Auto-performing maintenance or guiding the physical procedure step-by-step beyond linking to the article. (A guided "maintenance wizard" is a later idea.)
- **N4** — Optical-path **alignment** procedure UI (condition-based, technician-level). We list it as a task; we don't build the alignment tool.
- **N5** — Inventory/spare-parts ordering (e.g. buy a new tube). May deep-link to store later.
- **N6** — Multi-user accounts/roles within a shop. (Phase 1 records an optional free-text "by" note only.)

## 4. Users & use cases

- **Hobbyist / new owner (beamo, Beambox II).** *"I just want to know what to clean and when, without digging through the manual."* Opens the dialog, sees two items in red, clicks each task's guide link, does them, marks done, gets a 🎉.
- **Maker / power user (Beambox II, HEXA).** *"I run acrylic daily — tell me when lubrication and honeycomb cleaning are actually due for my usage."* Sets primary material = Acrylic; cadence tightens automatically.
- **Small fab shop / shared machine (HEXA, Ador).** *"Several people use this machine; I need to see when the chiller water was last changed and who did it."* Reads per-machine history; adds a "by" note.
- **Pro / Promark fiber operator.** *"My machine's maintenance is different from a CO₂ tube."* Gets a Promark-specific schedule (no chiller/tube items) from its own config — proving the data-driven model.
- **FLUX support / content team.** *"When we revise the Beambox II schedule, I don't want to wait for an app release."* Edits the schedule config (Phase 1) or pushes a remote schedule update (Phase 3); all users converge.

## 5. Experience overview

### 5.1 Entry points
- **Menu:** `Machines ▸ <Machine> ▸ Maintenance Checklist…` (per-device action, alongside calibration actions in `menuDeviceActions`), **and/or** `Help ▸ Maintenance Checklist…`.
- **TopBar indicator:** a small wrench/health icon near `SelectMachineButton`; shows a **red dot** when the connected machine has any *overdue essential* task.
- **Startup reminder:** *Not in Phase 1* (deferred to avoid early annoyance — D8). The TopBar badge is the only proactive surface at launch; a tuned, opt-out startup reminder may follow in Phase 2.

### 5.2 Main dialog (default state)

```
┌─ Maintenance Checklist ──────────────────────────────────────────────┐
│  Machine:  [ Beambox II — "Studio-A"  ▼ ]        Health: ●●●●●○  5/6  │
│                                                                       │
│  ★ = essential    ● OK   ● Due soon   ● Overdue                       │
│                                                                       │
│  PANEL ─────────────────────────────────────────────────────────────│
│   ● Maintain Test ★      every 1 month   last: May 28  due: Jun 28  [Mark done]│
│   ● Screen Cleaning      every 2 weeks   last: Jun 20  due: Jul 4   [Mark done]│
│                                                                       │
│  WORKING AREA ──────────────────────────────────────────────────────│
│   ● Lubricating          material: [Acrylic ▼] every 1 wk            │
│                          last: Jun 22   due: Jun 29        [Mark done]│
│   ● Honeycomb Cleaning ★ each operation  last: Jun 29  due: today  [Mark done]│
│   ● Chassis Cleaning ★   each operation  last: Jun 29  due: today  [Mark done]│
│   ● Mirrors & Lens ★     every 1–2 weeks last: Jun 10  ⚠ overdue   [Mark done]│
│       └ "Clean the 4 mirrors and lens; check for oxidation/watermarks." [Guide ↗]│
│   ● Optical Inspection ★ every 1 month   last: Jun 1   due: Jul 1   [Mark done]│
│   ● Door Cover Cleaning  every 2 weeks   last: Jun 18  due: Jul 2   [Mark done]│
│                                                                       │
│  BACK COVER ────────────────────────────────────────────────────────│
│   ● Laser Tube Health    condition       [ Pass ] [ Fail ]   last: Jun 1│
│       └ "If 3 mm acrylic can't cut at 70% power, replace the tube." [Guide ↗]│
│   ● Cooling Water ★      every 3 months  last: Apr 2  due: Jul 2   [Mark done]│
│   ● Ventilation Fan      every 1 month   last: Jun 5   due: Jul 5  [Mark done]│
│                                                                       │
│  [ View history ]                                  [ Print / PDF ]    │
└───────────────────────────────────────────────────────────────────────┘
```

- **Row anatomy:** status dot · task name (★ if essential) · cadence label · last-done · next-due (or ⚠ overdue / "today" / "due soon") · primary action. Expanding a row (or hovering ⓘ) reveals **Key Points** text + **[Guide ↗]** link.
- **Primary action** is contextual: most tasks → **[Mark done]**; inspection tasks (Laser Tube Health) → **[Pass] / [Fail]**; alignment-type condition tasks → **[Mark checked]**.
- **Lubricating** row has an inline **material dropdown** (Wood/Plywood · Acrylic · Leather · Paper) that sets the cadence per the model's mapping; defaults to the machine's **primary material** setting.

### 5.3 Marking done — feedback

- Click **[Mark done]** → row animates to green, last-done = now, due recomputes, and a **success toast** appears: *"Nice — Mirrors & Lens done. Next due Jul 14. ✓"* (`MessageCaller`, `SUCCESS`).
- If this action makes **all essential tasks** green → a brief **machine-health celebration**: header ring fills, and a toast/inline banner: *"Your Beambox II is in great shape — all essential maintenance is up to date! 🎉"*
- **Health meter** in the header = `# essential tasks currently OK / total essential`. Tooltip lists what's outstanding.

### 5.4 States
- **Default / has records** — as above.
- **First run (no records for this machine)** — every task shows "Never done" with a neutral status and a **[Mark done]** / **[I already did this — set last done…]** affordance; a one-line intro explains the feature. Health meter starts empty with an encouraging nudge, not alarm.
- **No machine connected** — dialog still opens; machine dropdown lets the user pick any *known* machine (from history) or a model, so they can review/plan a schedule offline. If neither, show an empty state: *"Connect or select a machine to see its maintenance schedule."*
- **Model has no schedule defined** — fallback message: *"No maintenance checklist is available for this model yet,"* + link to Help Center. (Should not happen for shipping models.)
- **Overdue** — red dot, ⚠ on next-due, entry-point badge. Essential overdue items sort to the top of their area.

### 5.5 Switching machines
The **machine dropdown** lists: connected machine(s) first, then previously-seen machines (from stored records), labeled `<Model> — "<nickname>"`. Selecting one reloads that machine's records and its model's schedule. The dropdown reuses the device list behind `SelectMachineButton` / `DeviceMaster`.

## 6. Data model

### 6.1 Schedule definition (per model — the "easy way to describe the table")

This is **authored data**, shipped with the app (and later remotely overridable). As implemented, maintenance is authored as **one area-grouped task catalog** (`tasks.ts`) whose entries target models; a per-model `MaintenanceSchedule` is synthesized on demand by `getScheduleForModel` (`index.ts`). So there are two shapes: the authoring `MaintenanceTaskDef` and the resolved `MaintenanceTask`.

`MaintenanceTask` (resolved — what the UI consumes)

| Field | Required | Type | Notes |
|---|---|---|---|
| `id` | yes | `string` | Stable key, e.g. `"mirrors"`. Used in stored records — never reuse/rename. |
| `area` | yes | `MaintenanceArea` | `'panel' \| 'working_area' \| 'modules' \| 'optics' \| 'back_cover'`. Drives grouping. |
| `langKey` | yes | `MaintenanceTaskKey` | Single i18n key into the flat `maintenance.tasks.*` dict; each entry is `{ name, keyPoints }`. (Replaces the originally-specced `nameKey`/`keyPointsKey` pair.) |
| `essential` | yes | `boolean` | The ★ ("necessary maintenance") flag. Drives health meter + reminders. |
| `cadence` | yes | `Cadence` | See §6.2. |
| `actionType` | yes | `'done' \| 'passfail' \| 'check'` | Controls the row's primary action. |
| `helpUrl` | no | `string` | Help Center article (locale-aware); injected per model from `meta.ts`. |

`MaintenanceTaskDef` (authoring — in `tasks.ts`) extends the resolved task with model targeting and per-model overrides: `models?` / `excludeModels?` (mutually exclusive), `langKeyByModel?` (per-model text override, e.g. `{ fhx2rf: 'honeycomb_plate' }`), and `helpArticleIds?` (per-model Help Center article id). A logical task whose config differs by model is written as multiple entries sharing one `id` with disjoint model targets. *(`inAppAction`/`dependsOn` from the original spec were not implemented in Phase 1.)*

`MaintenanceSchedule` (resolved, per model)

| Field | Required | Type | Notes |
|---|---|---|---|
| `tasks` | yes | `MaintenanceTask[]` | Resolved for one model. |
| `areaOrder` | yes | `MaintenanceArea[]` | `GLOBAL_AREA_ORDER` filtered to the areas this model uses. |

*(Model→schedule mapping lives on the task defs + `meta.ts`'s `helpArticleByModel` registry, not a `models` field on the schedule. Schedule `version` was not implemented in Phase 1 — see §6.5 note.)*

### 6.2 Cadence (how "due" is computed)

`Cadence` is a tagged union so the same engine handles all interval types:

| Kind | Shape | Example task | "Next due" rule |
|---|---|---|---|
| `time` | `{ kind:'time', every: number, unit:'day'\|'week'\|'month' }` | Screen Cleaning (2 weeks) | `lastDoneAt + every·unit` |
| `time_by_material` | `{ kind:'time_by_material', map: { wood:{2,'week'}, acrylic:{1,'week'}, leather:{2,'week'}, paper:{1,'day'} } }` | Lubricating | Use the entry for the machine's **primary material** (default: strictest). |
| `per_operation` | `{ kind:'per_operation', proxyDays?: number }` | Honeycomb, Chassis Cleaning | Due `proxyDays` (default 1) after the machine is **used since it was last done** — gated by the machine-level `lastUsedAt` (stamped from the `'device'` job-start bus), so an idle machine never goes red. Not due until `lastUsedAt > lastDoneAt`. |
| `condition` | `{ kind:'condition' }` | Laser Tube Health, Optical Alignment | Never auto-"due" on a clock; status driven by last Pass/Fail/check. A Fail → red until re-Passed. |

> **Whichever-comes-first** (CMMS best practice) is supported by letting a task carry **both** a `time` and a usage trigger in Phase 2; Phase 1 ships time + material + per-operation-proxy.

### 6.3 Status derivation

For a task with computed `nextDue`:
- **OK (green)** — `now < nextDue − dueSoonWindow`.
- **Due soon (amber)** — within `dueSoonWindow` of `nextDue`, where `dueSoonWindow = clamp(15% of the interval, min 1 day, max 14 days)` (D11).
- **Overdue (red)** — `now ≥ nextDue`.
- **Never (neutral)** — no record yet.
- **Condition tasks** — green if last result was Pass/checked within a sane window; red if last result was Fail; neutral if never.

### 6.4 Stored record (per machine — local)

Stored under a new storage key (e.g. `maintenance-records`) **keyed by machine serial** (stable across reconnects/UUID changes; falls back to UUID if serial unavailable). Persisted via `deviceStore`/`storage` patterns.

`MachineMaintenanceRecord`

| Field | Required | Type | Notes |
|---|---|---|---|
| `machineKey` | yes | `string` | Serial (preferred) or UUID. |
| `model` | yes | `WorkAreaModel` | Snapshot, so history survives if the machine is offline. |
| `nickname` | no | `string` | For the dropdown label. |
| `primaryMaterial` | no | `MaterialKey` | Drives `time_by_material` cadence. Default: strictest. |
| `lastUsedAt` | no | `ISO string` | Last real job start on the local computer; gates `per_operation` tasks (§6.2). Local-only in Phase 1. |
| `tasks` | yes | `Record<taskId, TaskRecord>` | Per-task state. |

*(`scheduleVersion` from the original spec was not implemented in Phase 1 — reconciliation is id-based and never destructive, so a version stamp wasn't needed; see §6.5.)*

`TaskRecord`

| Field | Required | Type | Notes |
|---|---|---|---|
| `lastDoneAt` | no | `ISO string` | Last completion timestamp. |
| `lastResult` | no | `'pass' \| 'fail' \| 'done' \| 'checked'` | For status + action history. |
| `history` | no | `Array<{at, result, by?}>` | Capped at `HISTORY_CAP` (5) newest-first. Powers "View history." |

### 6.5 Lifecycle rules
- "Mark done" → push `history` entry (capped at `HISTORY_CAP`), set `lastDoneAt=now` and `lastResult`, recompute status.
- Changing **primary material** recomputes the Lubricating row only.
- Schedule changes reconcile by task `id`: the stored `tasks` map is never deleted, so unknown stored ids (e.g. from a future schedule) are preserved, and newly-added tasks simply render as "Never" until first done. *(Implemented without a `scheduleVersion` stamp or a "schedule updated" note — the id-based, non-destructive reconciliation makes both unnecessary in Phase 1.)*
- Records are **never** auto-deleted when a machine goes offline.

## 7. Usage-based cadence (the differentiator) — phased

"Once an operation" / "once an operation day" can't be honestly tracked by a clock. Beam Studio, however, knows when jobs run.

- **Phase 1 (ship):** `per_operation` tasks use a **day proxy** — flagged due if the machine has been used since last done, approximated as `proxyDays` of elapsed time; copy frames it as *"Do after each operation."* No false precision.
- **Phase 2:** Hook the **job lifecycle / monitor** (`DeviceMaster` task events) to increment a per-machine **operation-day counter** when a job completes. `per_operation` tasks then become due once that counter advances past `lastDoneAt`. Optionally accumulate **engraving hours** to enable true "every N hours OR every M weeks, whichever first" for tube/lube.
- **Phase 3:** If firmware later exposes usage counters, replace the proxy with machine-reported values (N1 today).

This is the capability paper and competitors structurally cannot offer.

## 8. Detailed requirements

**Entry & framing**
- **R1** A new `maintenance` i18n namespace in `lang/en.ts` holds all strings (title, areas, task names/key-points, statuses, actions, feedback copy).
- **R2** The dialog is registered in `dialog-caller.tsx` (e.g. `showMaintenanceChecklist(initialMachineKey?)`) and built on the existing `DraggableModal` pattern.
- **R3** Open from **both** `Machines ▸ <Machine> ▸ Maintenance Checklist…` and `Help ▸ Maintenance Checklist…` (D7). When opened via the device menu, preselect that machine; when opened via Help, default to the connected machine (or read/plan mode if none).
- **R4** A TopBar health indicator shows a red dot when the connected machine has ≥1 **overdue essential** task; clicking it opens the dialog for that machine.
- **R5** *(Deferred to Phase 2 — D8.)* A startup reminder is **not** shipped in Phase 1. Overdue essential maintenance is surfaced passively via the TopBar badge (R4) only. When introduced, it must be opt-out (pref `should_remind_maintenance`), fire at most once per session, and be tuned to avoid annoyance.

**Schedule data (model-driven)**
- **R6** Maintenance schedules are declarative configs typed as `MaintenanceSchedule`, located under `packages/core/src/web/app/constants/maintenance/` (one file per schedule or a registry), mapping `WorkAreaModel[] → tasks`.
- **R7** Ship the **Beambox II (`fbb2`)** schedule encoding exactly the article's table (see §Appendix A), with correct `essential` flags (Maintain Test, Honeycomb, Chassis, Mirrors & Lens, Optical Inspection, Cooling Water marked ★) and cadences.
- **R7a** Ship the **HEXA** schedule at launch (D9) to prove multi-model; remaining models land as data later without code changes.
- **R7b** Phase 1 schedules are **FLUX-authored only** (D10) — users cannot add custom tasks or edit cadences. User-defined tasks are a later phase.
- **R8** A model with no schedule shows the graceful fallback (§5.4), never a broken dialog.

**Display & status**
- **R9** Tasks are grouped by `area` in fixed order (Panel → Working Area → Back Cover), essential-overdue first within a group.
- **R10** Each row shows status dot, name (★ if essential), cadence label, last-done, next-due/overdue, and the contextual primary action.
- **R11** Status is computed per §6.3; the legend (OK / Due soon / Overdue / Never) is visible.
- **R12** A header **health meter** shows essential-OK / total-essential and lists outstanding essentials on hover.
- **R13** Each row exposes Key Points text and, when present, a **[Guide ↗]** link (locale-aware Help URL) and/or an in-app action (e.g. open Example Files).

**Recording**
- **R14** **[Mark done]** stamps `now`, appends history, recomputes status — no confirmation dialog (it's cheap and reversible via history/undo).
- **R15** Inspection tasks render **[Pass]/[Fail]**; **Fail** keeps the task red and surfaces the guide; **Pass** greens it.
- **R16** The **Lubricating** row has a material dropdown bound to `primaryMaterial`; changing it updates that row's cadence and persists.
- **R17** **View history** shows the per-task log (date, result, optional note). An optional free-text "by" note may be added when marking done.
- **R18** Records persist per machine (keyed by serial, fallback UUID) and survive offline/reconnect/app restart.

**Feedback**
- **R19** Each successful record shows a success toast naming the task and the new next-due date.
- **R20** When an action transitions the machine to **all essential tasks OK**, show the machine-health celebration (header ring fill + congratulatory banner/toast). Don't repeat it on every subsequent action while already all-green.
- **R21** Feedback copy is encouraging, never gamified to the point of nagging; overdue framing is informative, not alarming.

**Machine switching**
- **R22** A machine dropdown switches the displayed machine; it lists connected machines first, then machines with stored history; selection reloads records + schedule.
- **R23** With no machine connected, the user can still select a known machine or a bare model to review the schedule (read/plan mode).

**Export (parity with the printable PDF)**
- **R24** A **Print / PDF** action renders the current machine's checklist (status + dates) for offline posting near the machine — preserving the existing "print and post" workflow, now pre-filled.

## 9. Migration & compatibility

- **First run:** no `maintenance-records` key → every task is "Never"; nothing to migrate. A **"set last done"** affordance lets conscientious users backfill so they don't all start red.
- **New storage key** `maintenance-records` added to `IStorage.d.ts`; absent key = empty map. No existing keys change.
- **Schedule changes** reconcile by task `id` (§6.5); unknown ids preserved, not destroyed. (No `scheduleVersion` stamp in Phase 1.)
- **Web vs desktop:** identical UI; storage uses the same `storage` abstraction. No machine connection is required to view a schedule.

## 10. UX / visual notes

- Reuse **Ant Design** + `DraggableModal`; status dots use existing semantic colors (green/amber/red) consistent with monitor/device status conventions in `actions/beambox/constant.ts`.
- **Localization:** all task names, key points, cadence labels, and feedback strings via `en.ts`; cadences render through a small formatter ("every 2 weeks", "each operation", "every 3 months"); dates respect the user's locale/units. Help links resolve to the user's language where the article exists, else English.
- **Performance:** schedules are tiny static data; no lazy-load needed. Status is computed on open and on each action.
- **Accessibility:** status conveyed by **icon + text**, not color alone; rows keyboard-navigable; actions are real buttons.
- **Celebration:** lightweight (CSS/inline SVG ring + a small check animation); no heavy confetti dependency. Respect reduced-motion.

## 11. Success metrics

- **Adoption:** % of active machines with ≥1 maintenance record within 30 days of release; weekly dialog opens per active machine.
- **Engagement / behavior change:** median # of essential tasks "OK" per machine over time (target: rises); % machines reaching "all essential OK."
- **Findability:** opens via TopBar badge vs. menu; startup-reminder click-through.
- **Reliability / hardware:** support-ticket volume tagged tube/mirror/chiller/"weak cut" (target: down vs. baseline); reduction in tube-replacement claims attributable to neglect (qualitative w/ support).
- **Data-model validation (G3):** time (in PRs/days) to add a new model's schedule (target: data-only, no UI change).

## 12. Rollout

- **Phase 0 — Foundations:** ✅ **Shipped (PR #931).** `MaintenanceSchedule`/`Cadence` types, status engine, storage key, i18n namespace, `dialog-caller` registration.
- **Phase 1 — Core (this PRD's MVP):** ✅ **Shipped (PR #931).** dialog UI, schedules for **9 models** (Ador, beamo, beamo II, Beambox, Beambox Pro, Beambox II, HEXA, HEXA RF, Promark — FLUX-authored only, exceeding the original Beambox II + HEXA scope), per-machine records, Mark-done/Pass-Fail, material-driven lube cadence, machine dropdown, per-task toasts + health celebration, **both** Machines + Help menu entries **and** the TopBar badge, Print/PDF. **No startup reminder.** `per_operation` uses a usage gate off the `'device'` job-start bus (`lastUsedAt`) rather than a pure elapsed-time proxy.
- **Phase 2 — Usage-aware:** operation-day counter + engraving-hours from job/monitor events; "whichever comes first"; smarter `per_operation`. Introduce the **tuned, opt-out startup reminder** (deferred from Phase 1).
- **Phase 3 — Cloud & fleet:** remote-fetchable schedules (update tables without release, like material presets); optional account-level sync of records across computers; multi-user "by" attribution; possible store deep-links for consumables.

## 13. Edge cases & risks

- **No machine ever connected** → schedule-only read mode (R23); empty state otherwise.
- **Model has no schedule** → graceful fallback (R8); must not ship a model whose owners get a broken dialog.
- **Serial unavailable / UUID churn** → key fallback to UUID; document that records may split if a machine reports inconsistent identity.
- **Clock changes / timezones** → store ISO timestamps; compute in local time; tolerate small negative deltas.
- **`per_operation` false precision (Phase 1)** → copy must not imply auto-tracking ("do after each operation," not "you've run 3 operations"). Mitigated in Phase 2.
- **Over-notification** → single dismissible startup reminder + opt-out pref; no repeated nags; celebration not re-fired while already all-green.
- **Schedule revision drift** → id-based reconciliation (non-destructive); never silently delete history.
- **Material-cadence confusion** → clearly show which material drives the lube interval; default to strictest so we never *under*-warn.
- **Localization gaps** → missing translated help article falls back to English; missing strings fall back per existing i18n behavior.
- **Multi-user disagreement** (shop) → Phase 1 is single shared local record; "by" note is informational only.

## 14. Resolved decisions / open questions

**Decisions**
- **D1** Task-centric model with derived status, **not** a literal W1–W12 grid. (Grid survives only as the Print/PDF export.)
- **D2** Schedules are declarative per-model data; Beambox II encodes the article verbatim.
- **D3** Records are **local, per machine, keyed by serial** in Phase 1; cloud sync deferred (N2/Phase 3).
- **D4** Material-dependent lube cadence is driven by a per-machine **primary material** (default strictest).
- **D5** Positive feedback = per-task toast + machine-level "all essential OK" celebration with a health meter.
- **D6** `per_operation` ships as a day-proxy in Phase 1; real usage signal in Phase 2.
- **D7** Entry points: **both** the Machines menu and the Help menu, **plus** the TopBar overdue badge — all in Phase 1. *(Resolves O1.)*
- **D8** **No startup reminder in Phase 1**, to avoid early annoyance; the passive TopBar badge is the only proactive surface. A tuned, opt-out reminder may follow in Phase 2. *(Resolves O2.)*
- **D9** Second launch model is **HEXA** (its checklist article already exists). *(Resolves O5.)*
- **D10** Phase 1 schedules are **FLUX-authored only**; no user-defined/edited tasks until a later phase. *(Resolves O4.)*

- **D11** **Due-soon window** = `clamp(15% of interval, min 1 day, max 14 days)`. *(Resolves O3.)*
- **D12** "Engrave a sample file monthly" is presented as **advice** (intro/help text), not a tracked task. *(Resolves O6.)*

**Open questions**
- *(none currently — all resolved)*

**Deferred to implementation / backend PRD**
- Storage schema details in `IStorage.d.ts`; remote-schedule fetch/caching format (Phase 3); job/monitor event hookup for operation counting (Phase 2); Print/PDF rendering approach.

## 15. Appendix

### Appendix A — Beambox II (`fbb2`) schedule (from article *4-1*)

| Area | Task (id) | Essential | Cadence | Action | Key points |
|---|---|---|---|---|---|
| Panel | Maintain Test (`maintain_test`) | ★ | every 1 month | done | Check the status display and switches. |
| Panel | Screen Cleaning (`screen_cleaning`) | | every 2 weeks | done | Clean dust and grease on the panel. |
| Working Area | Lubricating (`lubricating`) | | by material — Wood/Plywood 2 wk · Acrylic 1 wk · Leather 2 wk · Paper 1 day | done | Clean Y-axis guiding rods, X-axis linear rail, and focusing mechanism; relubricate. |
| Working Area | Honeycomb Table Cleaning (`honeycomb_cleaning`) | ★ | each operation | done | Remove residue and tar oil from the honeycomb mesh. |
| Working Area | Chassis Cleaning (`chassis_cleaning`) | ★ | each operation | done | Remove residue and tar oil from chassis and bottom cover. |
| Working Area | Mirrors & Lens Cleaning (`mirrors_lens`) | ★ | every 1–2 weeks | done | Clean the 4 mirrors and lens; ensure no oxidation or watermarks. |
| Working Area | Optical Path Inspection (`optical_inspection`) | ★ | every 1 month (also at unboxing & after tube replacement) | done | Inspect optical path; clean grease on door cover. |
| Working Area | Optical Path Alignment (`optical_alignment`) | | condition (when misaligned) | check | Adjust when the optical path is misaligned. |
| Working Area | Door Cover Cleaning (`door_cover`) | | every 2 weeks | done | Remove grease from the door cover. |
| Back Cover | Laser Tube Health Check (`laser_tube_health`) | | condition | passfail | If 3 mm acrylic can't be cut at 70% power, replace the tube. |
| Back Cover | Cooling Water Replacement (`cooling_water`) | ★ | every 3 months | done | Add water to the pump until >80% full, no air bubbles. |
| Back Cover | Ventilation Fan Cleaning (`ventilation_fan`) | | every 1 month | done | Remove dust from the ventilation fan blades. |

*(Not a tracked task — D12.) The article's advice to "engrave a sample file monthly to extend machine/tube life" is shown as intro/help copy in the dialog, optionally with a link to `File ▸ Examples ▸ Example Files`.*

### Appendix B — Key code references
- Models & per-model config: `packages/core/src/web/app/constants/workarea-constants.ts` (`WorkAreaModel`, `workareaConstants`, `getWorkarea`, model picker list; Beambox II = `fbb2`).
- Connected device & switching: `packages/core/src/web/helpers/device/get-device.ts`, `packages/core/src/web/app/components/beambox/TopBar/SelectMachineButton.tsx`, `packages/core/src/web/helpers/device-master.ts`.
- Per-device storage: `packages/core/src/web/helpers/device/deviceStore.ts`, `packages/core/src/web/interfaces/IStorage.d.ts`.
- Dialog registry & examples: `packages/core/src/web/app/actions/dialog-caller.tsx`, `packages/core/src/web/app/components/dialogs/AboutBeamStudio.tsx`, `packages/core/src/web/app/components/dialogs/MaterialTestGeneratorPanel/index.tsx`, `packages/core/src/web/app/components/boxgen/Boxgen.tsx`.
- Feedback: `packages/core/src/web/app/actions/message-caller.ts`, `progress-caller.ts`, `alert-caller.tsx`.
- Status colors / device constants: `packages/core/src/web/app/actions/beambox/constant.ts`.
- Existing reminder pattern to mirror: preference `should_remind_calibrate_camera`.
- i18n source of truth: `packages/core/src/web/app/lang/en.ts`.

### Appendix C — External references
- Going-digital UX: replace bare "Done" with status (Pass/Fail), conditional logic on failure, per-asset schedules, "whichever comes first" recurrence — *fabrico.io* "Best Digital Preventive Maintenance Checklists Software (2026)"; *getmaintainx.com* Preventive Maintenance Guide; *smartspanner.com* Preventive Maintenance Checklist guide.
- Competitive whitespace: xTool XCS / LightBurn ship no in-software maintenance log or reminder (xTool markets hardware-side easy cleaning only) — *support.xtool.com*.
- Source schedule: FLUX Help Center *4-1 Beambox II – Maintenance Checklist* (and *4-1 HEXA – Maintenance Checklist*).
