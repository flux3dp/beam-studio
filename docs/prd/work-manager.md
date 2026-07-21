# PRD: Work Manager (task history, monitoring & queue)

| | |
|---|---|
| **Status** | Draft |
| **Author** | Product (AI PM agent) |
| **Created** | 2026-06-30 |
| **Target product** | Beam Studio (desktop Electron + web) |
| **Owner area** | TopBar Go flow, Monitor, device connection, multi-tab |
| **Scope** | **Software (Beam Studio) only.** Compatible with **old and new firmware** — it reads the firmware version/capability and adapts (Tier 1 app-side on old firmware; Tier 2 machine-backed where the queue contract exists). |
| **Companion PRD** | [Machine Task Queue — firmware contract](machine-task-queue-firmware.md) (the minimal firmware side this consumes; owned by the firmware team) |
| **Related code** | `packages/core/src/web/app/components/beambox/TopBar/GoButton.tsx`, `packages/core/src/web/app/actions/beambox/export/GoButton/handleExportClick.ts`, `packages/core/src/web/app/actions/beambox/export-funcs.ts`, `packages/core/src/web/app/contexts/MonitorContext.tsx`, `packages/core/src/web/app/components/monitor/Monitor.tsx`, `packages/core/src/web/helpers/check-device-status.ts`, `packages/core/src/web/helpers/device/framing.ts`, `packages/core/src/web/app/constants/ipcEvents.ts` |

---

## 1. Summary

Today Beam Studio is **fire-and-forget**: the user presses **Go**, the design is converted to FCode, the [Monitor](../../packages/core/src/web/app/components/monitor/Monitor.tsx) dialog opens, the job runs, and when the Monitor is closed **all record of that job is gone**. There is no history of what was sent, no way to re-run an identical job without re-opening and re-processing the design, no way to line up several jobs to run back-to-back, and no record when a machine drops connection mid-run.

This PRD introduces a **Work Manager**: a persistent, cross-tab record of every task sent from Beam Studio, with live status monitoring (running / completed / aborted / **disconnected**), a **queue** of tasks lined up for a machine, and per-task metadata (name, target machine, required vs. elapsed time, editable tags). A finished task can be **re-sent** with one click and **framed** without re-opening the design, because each stored task carries its **compiled FCode + embedded framing data + thumbnail + metadata**. The Work Manager is a single dialog with **Queued / In Progress / Finished** tabs (the Queued tab is hidden until the user actually queues something, so existing users see no new clutter), and a condensed **Tasks** tab is added to the per-machine Monitor.

This is primarily a **new-surface + data-model + state-synchronization** change. The conversion pipeline ([`uploadFcode`](../../packages/core/src/web/app/actions/beambox/export-funcs.ts)), the device connection layer ([`DeviceMaster`](../../packages/core/src/web/helpers/device-master.ts)), the status model ([`DeviceConstants.status`](../../packages/core/src/web/app/constants/device-constants.ts)) and framing ([`FramingTaskManager`](../../packages/core/src/web/helpers/device/framing.ts)) are **reused as-is**; the queue runs **app-side** and the store is **synchronized across all open tabs/windows**.

**Two-tier queue, one binary, firmware-version-aware.** Beam Studio ships and updates faster than firmware, and users may sit on old firmware for a long time even when a new release is reliable — so this software must run correctly on **both**. It reads the machine's firmware version/capability and picks per machine:
- **Tier 1 — app-side queue (any firmware, incl. today's):** the queue lives in Beam Studio; works everywhere; a tab must stay open to advance; no run-from-panel.
- **Tier 2 — machine-backed queue (firmware with the queue contract):** the machine holds the queue keyed by task id and reports status, so queued tasks **survive Beam Studio being closed**, run from the machine panel, and reconcile **exactly** across disconnects and identical repeat sends.

The Tier-2 firmware is a **minimal, separate** deliverable — see the companion [Machine Task Queue firmware PRD](machine-task-queue-firmware.md). This document is the **software side**; it never hard-depends on the contract and degrades to Tier 1 automatically (§7.6). *(An earlier plan to fake a machine queue with storage folders was dropped — the firmware renames/clones Recents, so task identity and status aren't recoverable from storage; §7.6.)*

Competitive note: **no laser competitor ships a real queue or job history.** LightBurn is explicitly single-job ("LightBurn currently doesn't have a queue system"); xTool Creative Space is likewise fire-and-forget. The mature queue/history/farm patterns all come from 3D-printing tooling (Bambu Studio/Bambuddy, Prusa Connect, OctoPrint Continuous Print). This is a genuine differentiator built on battle-tested patterns. See §2.4.

---

## 2. Background & current state

### 2.1 How sending a task works today

1. **Go button** — [`GoButton.tsx`](../../packages/core/src/web/app/components/beambox/TopBar/GoButton.tsx) (top-right of TopBar) calls `handleExportClick`. It is throttled (2000 ms) and disabled when no machine is discovered or not in Draw mode.
2. **Orchestration** — [`handleExportClick.ts`](../../packages/core/src/web/app/actions/beambox/export/GoButton/handleExportClick.ts) runs prerequisite checks then `checkDeviceStatus()` then `exportTask()`.
3. **Busy-machine prompt** — [`check-device-status.ts`](../../packages/core/src/web/helpers/check-device-status.ts). When the selected device is `RUNNING`/`PAUSED`/`PAUSED_FROM_*`/`PAUSING_FROM_*` and `allowPause` is false, it pops a **YES/NO** alert (`message.device_is_used` → *"The machine is busy, do you want to abort current task?"*). YES → `DeviceMaster.stop()` then polls `getReport()` until `ABORTED`/`IDLE` (lines 115–138). There is **only** abort-or-cancel today — no queue option.
4. **Convert + upload** — [`export-funcs.ts`](../../packages/core/src/web/app/actions/beambox/export-funcs.ts) `uploadFcode(device, autoStart?)` runs `convertEngine` → `{ fileTimeCost, metadata, taskCodeBlob, thumbnail, thumbnailBlobURL }`, selects the device, and calls `openTaskInDeviceMonitor(device, { blob, metadata, taskTime, thumbnailUrl }, { autoStart, … })` (lines 642–693).
5. **Monitor** — [`MonitorContext.tsx`](../../packages/core/src/web/app/contexts/MonitorContext.tsx) holds the in-flight task as a **`PreviewTask`** — already exactly the payload we want to persist:
   ```ts
   export interface PreviewTask {
     fcodeBlob: Blob; fileName: string; metadata: TaskMetaData;
     taskImageURL: string; taskTime: number; vtTaskTime?: number;
   }
   ```
   [`Monitor.tsx`](../../packages/core/src/web/app/components/monitor/Monitor.tsx) is a `DraggableModal` with antd `Tabs`: **Task**, **File** (machine storage), **Camera**. `MonitorTask.tsx` shows the thumbnail, progress bar, elapsed/remaining time and the **Framing / Hull / Area Check** controls; `MonitorControl.tsx` shows Play/Pause/Stop/Resume; status text comes from `MonitorStatus.getDisplayStatus(report.st_label)`.

> **Precedent worth noting:** Promark already keeps a per-machine sent-task cache — `promarkTaskCache[device.serial] = { fcodeBlob, fileName, metadata, taskImageURL, taskTime, vtTaskTime }` ([`export-funcs.ts`](../../packages/core/src/web/app/actions/beambox/export-funcs.ts) lines 679–686). The Work Manager generalizes this one-off cache into a first-class, persisted, multi-machine store.

### 2.2 Device status model (reused)

[`device-constants.ts`](../../packages/core/src/web/app/constants/device-constants.ts) defines `status` (IDLE=0, INIT=1, STARTING=4, RUNNING=16, PAUSED=32, `PAUSED_FROM_*`/`PAUSING_FROM_*`, COMPLETED=64, ABORTED=128, ALARM=256, FATAL=512, TOOLHEAD_CHANGE=1024, RECONNECTING=516, plus negative `TASK_*` maintenance states) and a `statusColor` map (64→green, 128/256/512→red, 32/36/38/48/50→orange, 16/4/6/18→blue, 0→grey). Live status is read by polling `DeviceMaster.getReport()` → `IReport { st_id, st_label, prog, error[] }`. **The Work Manager maps these existing codes onto its own task lifecycle (§6.2); it does not invent new device states.**

### 2.3 Persistence, preferences & multi-tab today

- **Preferences** — [`beambox-preference.ts`](../../packages/core/src/web/app/actions/beambox/beambox-preference.ts) (`read`/`write`, `DEFAULT_PREFERENCE`), typed in [`Preference.d.ts`](../../packages/core/src/web/interfaces/Preference.d.ts), reactive via [`globalPreferenceStore.ts`](../../packages/core/src/web/app/stores/globalPreferenceStore.ts) (Zustand). Writing a global preference broadcasts `TabEvents.GlobalPreferenceChanged` to other tabs.
- **Multi-tab** — Beam Studio (Electron) is multi-tab/multi-window. [`tabController.ts`](../../packages/core/src/web/app/actions/tabController.ts) + [`ipcEvents.ts`](../../packages/core/src/web/app/constants/ipcEvents.ts) `TabEvents` (`GetAllTabs`, `TabFocused`, `StorageValueChanged`, `UpdateDevices`, `GlobalPreferenceChanged`, …) provide the cross-tab event bus via `communicator`. **Device discovery is already shared across tabs; per-document state is not.** There is **no shared notion of "tasks in flight"** today — each tab opens its own Monitor for the job it sent.
- **No task history exists.** Nothing is written to disk about a completed job. `Recent files` (`TabEvents.UpdateRecentFiles`) tracks opened *design* files, not *sent tasks*.

### 2.4 Competitive reference (job/queue management)

| Product | Real queue? | Job history? | Notable patterns |
|---|---|---|---|
| **LightBurn** | **No** (stated by staff) | No | Two frame buttons (box + rubber-band/hull); long-standing community requests for *job queue* and *"Job Logs"* (timing, for costing). |
| **xTool XCS** | No | No | Per-element "Output on/off" composes what a job runs; multi-device is a switcher, not a queue. |
| **Glowforge** | No | "Past Prints" (paywalled) | Most-requested feature is **"Repeat Last Print"** offline, identical positioning, for batch selling. |
| **Bambu / Bambuddy** | **Yes** | Yes | Rich status lifecycle (Queued/Sending/Printing/Completed/Failed/Cancelled/Waiting/Staged); **color-bordered** history cards; responsive 1/2/3-col grid; **bed-clear confirmation gates next job**; per-device cards + timeline. |
| **Prusa Connect** | **Yes** (per printer) | Yes | Per-printer queue + history; timeline of finish times; dashboard = one row per printer; "ready for next job" gate. |
| **OctoPrint Continuous Print** | **Yes** | Yes | Queue of files with copy counts; clears bed between jobs; composite multi-file jobs; failure recovery. |

**Patterns we adopt:** real status lifecycle (not 3 states); Queue → In Progress → Finished split; color-coded status; persist FCode + framing so **re-run skips reprocessing** (the top unmet need across LightBurn + Glowforge); manual "release next / bed-cleared" gate; editable tags; sortable table; per-machine view. **Anti-patterns we avoid:** cloud-only/round-trip-to-repeat (lasers are offline/workshop), paywalled history, a single overcrowded table, only-3-statuses, overstating ETA precision (laser time estimates are unreliable — Snapmaker/Luban users distrust them, so we label estimates as estimates and treat the live elapsed timer as truth).

### 2.5 Why change

1. **No memory of work** — users can't see what they sent, when, to which machine, or whether it finished. Pros selling product can't do costing/audit (the explicit LightBurn "Job Logs" gap).
2. **No identical re-run** — repeating a job means re-opening the file and re-processing (slow; the most-requested feature in the category).
3. **No back-to-back jobs** — running 5 nameplates means babysitting the machine and pressing Go five times; busy-machine handling is abort-or-cancel only.
4. **No disconnect record** — if Wi-Fi drops mid-run, the Monitor just errors and the job vanishes from the UI with no durable "we don't know how this ended" record.
5. **Multi-tab blindness** — a job sent from tab A is invisible in tab B, even though both target the same machine.

---

## 3. Goals & non-goals

### 3.1 Goals

- **G1.** Persist every task sent from Beam Studio as a durable **Work Item** (FCode blob + framing data + thumbnail + metadata + status history), surviving Monitor close and app restart.
- **G2.** A **Work Manager** dialog with **Queued / In Progress / Finished** tabs built on antd `Table` (sortable by time / name / tags / machine / status), with elegant column merging so rows aren't overcrowded.
- **G3.** Live status monitoring across the full lifecycle — Queued, Sending, Running, Paused, Completed, **Aborted**, **Failed**, **Disconnected** — driven by the existing device report, mapped from `DeviceConstants.status`.
- **G4.** An app-side **queue** per machine: line up tasks, reorder them, and (manual advance) release the next one when the machine is idle, with an unobtrusive "machine idle — send next?" prompt so queued work isn't forgotten.
- **G5.** **One-click Re-send** of any finished task (no re-processing — reuses the stored FCode), defaulting to the same machine.
- **G6.** **Frame a stored task** (queued or finished) without re-opening the design, using embedded framing data via `FramingTaskManager`.
- **G7.** **Editable tags** per task (e.g. `customer-A`, `walnut`, `batch-12`) for organization, filtering and costing.
- **G8.** Add a condensed **Tasks** tab to the per-machine [Monitor](../../packages/core/src/web/app/components/monitor/Monitor.tsx) showing only that machine's queued + recent tasks, and a **queue-later** option to the Monitor **Start** control.
- **G9.** Add a **queue option** to the busy-machine prompt and a **dropdown next to Go** so a task can be queued instead of sent immediately.
- **G10.** **Synchronize** the work store across all open tabs/windows so every tab sees the same queue, in-progress and history.
- **G11.** **Local retention** of task files, default **30**, user-configurable **0–1000** in Preferences, with manual delete.
- **G12.** For **storage-capable machines**, mirror the queue into managed **`Queue/`** and **`Recents/`** folders in the machine's built-in storage so queued tasks survive Beam Studio being closed/disconnected and can be run/recalled from the machine panel — using existing file APIs (minimum firmware change).

### 3.2 Non-goals

- **Building the firmware queue itself, and the on-panel queue UI.** The **machine-backed queue (Tier 2)** depends on a small firmware **queue contract** whose interface this PRD specifies (§7.6.1); the firmware *implementation* and any on-panel Queue screen are owned by a **separate firmware PRD**. This PRD's own deliverable ships as **Tier 1 (app-side, no firmware)**; Tier 2 is a fast-follow that lights up once the contract lands. Auto-advance and on-device bed-clear prompts are deferred (§7.6.5).
- **Fully automatic unattended advance.** Decided: advance is **manual** (user releases each job) for laser safety; auto-advance is **out of scope** for v1 (deferred — §7.4).
- **Cloud sync of history across devices/accounts.** v1 history is local only (deferred to a later phase).
- **Cross-model re-send.** FCode is machine/work-area specific; re-sending to a *different model* is blocked with guidance (re-open the source design) — we store FCode, not the editable `.beam` source (§6.1, §13).
- **Print-farm scale dashboard / Gantt timeline.** Per-machine views only in v1; a fleet timeline is a later enhancement.
- **Changing the conversion pipeline, status polling, or framing engine.** Reused as-is.
- **Multi-user attribution** (who started a job). Single local user assumed.

---

## 4. Users & use cases

- **Hobbyist / new user:** sends one job at a time. Should see **no new UI** until they opt in — the Queued tab and queue affordances stay hidden until they first queue something. They benefit passively from history ("did that finish?") and one-click re-send.
- **Maker / small seller (batch production):** cuts 20 identical coasters. Queues the same job ×N (or re-sends from history after each material swap), frames each before starting, tags the batch `coasters / batch-12` for later costing. This is the LightBurn/Glowforge gap we close.
- **Multi-machine shop:** runs a beamo II and a HEXA. Wants to line up jobs per machine and glance at "what's running / what finished / what failed" across both, from any tab.
- **Power user with many tabs:** designs in tab A, sent a long engrave; opens tab B to work on the next file; wants the running job and its progress visible in tab B too, and to queue the next file to the same machine without interrupting the run.
- **Pro fabricator (Promark/fiber):** re-runs marking jobs repeatedly; already relies on the Promark task cache today — gets a real, persisted, taggable history.

---

## 5. Experience overview

### 5.1 Opening the Work Manager

A new entry point opens the Work Manager dialog (a `DraggableModal`, consistent with Monitor):
- **TopBar:** a small **Work Manager** icon button (badge shows count of *active* = queued + running tasks across all machines).
- **Top menu:** `File ▸ Work Manager…` (and a keyboard shortcut).

The dialog is **machine-agnostic** (shows all machines) but offers a **machine filter** dropdown. It opens to **In Progress** by default (or **Finished** if nothing is active).

### 5.2 Work Manager layout — tabs + table

```
┌─ Work Manager ───────────────────────────────────────────────────────────┐
│  [ In Progress (1) ] [ Queued (3) ] [ Finished ]     Machine: [ All ▾ ]  ⚙ │
├───────────────────────────────────────────────────────────────────────────┤
│  ▦  Task                    Machine        Status          Time      Tags  │
│ ─────────────────────────────────────────────────────────────────────────│
│  🖼  Coaster_walnut.beam     beamo II ●    �(=====   ) 62%   04:12 / 06:45  │
│      #batch-12                            Running        elapsed / required │
│                                                          [⏸][⏹][▣ Frame]   │
│  🖼  Nameplate_03            HEXA ●        ◐ Sending…     —    / 02:10       │
│      #customer-A  + add tag                                                 │
└───────────────────────────────────────────────────────────────────────────┘
```

**Column-merging strategy (avoids overcrowding — the user's explicit concern):**
- **Task** cell stacks **thumbnail + name** (top line; a **rename pencil** appears after the name on row hover, R8g), the **layer signature** (a strip of canvas-colored dots + count, e.g. `●●● 3 layers`, §6.5), and **tags** (inline-editable chips, **hidden by default**). Layers and tags visibility is controlled by the **Show fields** gear in the actions-column header (R8e). Repeated sends of the same file collapse under an **expandable parent row** (`Coaster_walnut · 4 runs`) whose children are the individual runs, each told apart by its signature/thumbnail/time/timestamp.
- **Machine** cell stacks machine **name** + a colored **connection dot** (● connected / ○ disconnected) — reusing device color semantics.
- **Status** cell is a single **badge**, and for *running* rows the same cell hosts an inline **progress bar with % and the row's contextual controls** (Pause/Stop/Frame). Queued rows show a drag handle + position; finished rows show the result badge with a **colored left border** on the row (green/red/grey/amber — borrowed from Bambuddy).
- **Time** cell merges **elapsed / required** as `MM:SS / MM:SS` (required from `metadata.time_cost` / `taskTime`; elapsed from the live timer or final duration). A relative timestamp ("2h ago") shows on the Finished tab instead of elapsed-during-run.

All columns are **sortable** (antd `Table` `sorter`) and the table is filterable by tag and machine. Default sort: In Progress / Queued by position/start time; Finished by most-recent first.

#### 5.2.1 Queued tab (hidden until non-empty)

Only rendered when ≥1 queued task exists (**G4 / the user's "don't show queue to existing users" requirement**). Adds **reorder** (drag handle), **Send now** (release this job — manual advance), **Move to top**, **Remove from queue**, and **Frame**. A banner at the top when the target machine is idle: *"beamo II is idle — send the next queued job?"* with a **Send next** button (manual; nothing auto-starts — §7.4).

#### 5.2.2 In Progress tab

Live rows for Sending / Running / Paused tasks (one per actively-monitored machine; multiple if multiple machines run at once). Inline controls mirror `MonitorControl` (Pause/Resume/Stop). A row links to **Open Monitor** for the full camera/file view. If the owning connection drops, the row flips to **Disconnected** (§7.5) and stays here briefly before moving to Finished.

#### 5.2.3 Finished tab

Terminal tasks: **Completed / Aborted / Failed / Disconnected**, color-bordered. Row actions: **Re-send** (primary), **Frame**, **Edit tags**, **Save FCode…**, **Delete**, **Details** (expand to show metadata: machine, start time, elapsed, required, error text for Failed, time/material for costing). Honors the retention cap (§8); a footer shows `27 / 30 stored · oldest auto-removed`.

### 5.3 Sending paths → where a task enters the system

**A. Go button (TopBar).**
- **Machine idle:** Go behaves exactly as today (convert → Monitor → run). The task is **recorded** as a Work Item automatically (transparent to existing users).
- **Machine busy:** the `message.device_is_used` prompt gains a **third action**. Instead of YES/NO it becomes **Abort & start now / Add to queue / Cancel** (§8 R-Go). "Add to queue" converts the design now (so the FCode is captured at design-time state) and enqueues it without sending.
- **Go split-button:** a caret next to Go opens **▾ Add to queue** / **▾ Frame** so a user can deliberately queue (or just frame) without sending, even when the machine is idle.

**B. Monitor Start control.** In the Monitor's PREVIEW mode, the **Start** button becomes a **split button**: primary **Start** (unchanged), dropdown **Queue for later**. Choosing Queue enqueues the previewed task and **closes the Monitor** (the user's requested behavior) — they continue working while the job waits.

**C. Re-send (Work Manager / Monitor Tasks tab).** Re-send pushes a stored task's FCode straight back through the send path (no reprocessing), defaulting to its original machine.

### 5.4 Monitor — new "Tasks" tab (per machine)

The [Monitor](../../packages/core/src/web/app/components/monitor/Monitor.tsx) `Tabs` gains a **Tasks** tab beside Task / File / Camera. It is a **filtered, condensed Work Manager** scoped to *this machine*: a compact list of that machine's **Queued** then **recent Finished** tasks, each with Re-send / Frame / Remove. This is where a user managing one machine lives; the standalone Work Manager is the cross-machine view. (Both read the same store — §7.)

### 5.5 Empty & first-run states

- **No tasks ever sent:** Work Manager shows a friendly empty state explaining history + queue; Queued tab absent.
- **No queue:** Queued tab absent (not just empty) — zero new surface area for users who never queue.
- **Retention = 0:** history disabled; Finished tab shows "History is off — set a limit in Preferences to keep finished tasks." Queue + live monitoring still work (queue items are not subject to the finished-history cap; §8).

---

## 6. Data model

### 6.1 WorkItem (new entity)

Generalizes today's `PreviewTask` / `promarkTaskCache` into a persisted record.

| Field | Required | Type | Notes |
|---|---|---|---|
| `id` | ✓ | string | Locally generated stable id, **unique per send** (a re-send gets a new `id`, R13). Used as the **task id** in the firmware queue contract (Tier 2), so status reconciles exactly by id — offline-safe and immune to identical repeat sends (§7.6). Carries a host-tag prefix for multi-host (§7.6.3). |
| `name` | ✓ | string | Editable display name. Defaults to the source file name (`PreviewTask.fileName`) or "Untitled". The `.beam` extension is **stripped for display** everywhere (D10). |
| `hostId` | ✓ | string | `[A-Z0-9]{4}` of the install that created the task; used to namespace machine-side mirror files and isolate multi-host writes (§7.6.4). |
| `sourceKey` | ✓ | string | Stable identity of the source design (normalized file path, else file name) used to **group repeated sends** of the same `.beam` (§6.5). |
| `layers` | ✓ | `{ name, color, module? }[]` | The **enabled layers** that this task actually processed, captured at send time — the basis of the layer-signature dots (§6.5). Empty array if unknown (older tasks). |
| `tags` | – | string[] | User-editable chips; searchable/filterable. |
| `machine` | ✓ | `{ uuid, serial, name, model }` | Target machine (from `IDeviceInfo`). FCode is bound to this model. |
| `status` | ✓ | enum | Lifecycle state (§6.2). |
| `statusHistory` | ✓ | `{ status, at }[]` | Append-only transitions for audit/costing and disconnect reconstruction. |
| `createdAt` | ✓ | number | When the task was created/sent/queued. |
| `startedAt` | – | number | When it began Running on the machine. |
| `endedAt` | – | number | When it reached a terminal state. |
| `requiredTime` | ✓ | number (s) | Estimated duration — `metadata.time_cost` / `PreviewTask.taskTime`. Labeled an **estimate** in UI. |
| `elapsedTime` | – | number (s) | Final actual duration (terminal) or live-derived during run. |
| `lastProgress` | – | number (0–1) | Last `report.prog` seen (for resuming the In-Progress display / disconnect snapshot). |
| `fcodeBlob` | ✓ | Blob (on disk) | **Compiled FCode** — enables identical re-send with no reprocessing. Stored as a file (§8). |
| `framing` | – | blob/paths | Embedded framing data (bbox + hull paths / framing gcode) so the task can be **framed without the design**. Derived at capture time (§6.3). |
| `thumbnailUrl` | ✓ | image | `PreviewTask.taskImageURL` / `thumbnailBlobURL`. |
| `metadata` | ✓ | `TaskMetaData` | From [`ITask.ts`](../../packages/core/src/web/interfaces/ITask.ts): `time_cost`, `traval_dist`, bbox `min/max_x/y/z`, `version`, `SOFTWARE`, `AUTHOR`, `CREATED_AT`, … |
| `vtTaskTime` | – | number | Variable-text total-time estimate, when applicable (carried through today). |
| `error` | – | `{ code, label }` | Populated for **Failed** from `report.error[]` / `st_label`. |
| `queue` | – | `{ position }` | Present while `status=Queued`; ordering within the machine's queue. |
| `ownerTabId` | – | string | Tab currently authoritative for live monitoring of this item (§7.3). Transient, not persisted to disk. |
| `origin` | ✓ | enum | `go` \| `monitor` \| `resend` \| `queue` — how it entered (analytics). |

> **Reuse:** `fcodeBlob`, `metadata`, `thumbnailUrl`, `requiredTime`, `vtTaskTime` map 1:1 onto the existing `PreviewTask` fields, so capturing a WorkItem at send time is a thin wrapper around the payload already passed to `openTaskInDeviceMonitor`.

### 6.2 Status lifecycle (mapped from `DeviceConstants.status`)

```
                ┌───────── Re-send / Send now ─────────┐
                ▼                                       │
  (created) → Queued ──release──► Sending ──► Running ⇄ Paused
                │                    │            │
                │                    │            ├─► Completed   (st_id COMPLETED 64 · green)
                │                    │            ├─► Aborted     (st_id ABORTED 128 / user stop · red)
                │                    │            ├─► Failed      (st_id ALARM 256 / FATAL 512 · red, + error)
                └──remove──► (deleted)            └─► Disconnected (connection lost mid-run · grey, §7.5)
```

| WorkItem status | Source signal | Badge color (reuses `statusColor`) |
|---|---|---|
| **Queued** | App-side; not yet sent | grey/neutral |
| **Sending** | Upload in progress (pre-`Running` report) | blue |
| **Running** | `st_id` ∈ {STARTING 4, RUNNING 16, RESUME_TO_* } | blue |
| **Paused** | `st_id` ∈ {PAUSED 32, PAUSED_FROM_* 36/48, PAUSING_FROM_* 38/50} | orange |
| **Completed** | `st_id` COMPLETED (64) | green |
| **Aborted** | `st_id` ABORTED (128) or user `stop()` | red |
| **Failed** | `st_id` ALARM (256) / FATAL (512), `error[]` set | red |
| **Disconnected** | Owning connection lost while Running/Paused (§7.5) | grey |

Queued/Sending/Running/Paused are the **In Progress + Queued** tabs; Completed/Aborted/Failed/Disconnected are **Finished**.

### 6.3 Framing data capture

Framing today ([`framing.ts`](../../packages/core/src/web/helpers/device/framing.ts) `FramingTaskManager`, `FramingType` Framing/Hull/AreaCheck/…) is computed from the **live canvas geometry** at frame time. To frame a stored task with no design open, we **capture framing inputs at send time** and store them on the WorkItem: the task **bounding box** (already in `metadata.min/max_x/y` ⇒ Area Check + box Framing) and the **convex-hull path** (Hull). Framing a stored task replays these through `FramingTaskManager` against the target machine. (Rotary/contour framing variants that need full path data are out of v1 stored-framing scope — see §13.)

### 6.4 Storage & retention preference

New global preference (added to `GlobalPreference` in [`Preference.d.ts`](../../packages/core/src/web/interfaces/Preference.d.ts), `DEFAULT_PREFERENCE` in [`beambox-preference.ts`](../../packages/core/src/web/app/actions/beambox/beambox-preference.ts), and [`globalPreferenceStore.ts`](../../packages/core/src/web/app/stores/globalPreferenceStore.ts)):

| Key | Default | Range | Notes |
|---|---|---|---|
| `work_manager_max_files` | **30** | **0–1000** | Max **finished** tasks whose FCode is retained on the **local disk**. `0` = keep no finished history (FCode discarded on terminal; the row may still show as a lightweight log entry or be omitted — D-retention). Exceeding the cap auto-evicts the **oldest finished** task's files first. **Queued tasks are never auto-evicted** (a queued job must keep its FCode to run). |
| `work_manager_sync_to_machine` | **on** (capable machines) | bool | Use the **machine-backed queue** (Tier 2) when the machine's firmware supports the queue contract (§7.6). No-op on machines without it (they use the app-side queue). |
| `work_manager_host_id` | auto `[A-Z0-9]{4}` | — | Stable per-install tag **prefixed onto each task `id`** to isolate this host from other PCs sharing the same machine (§7.6.3). Generated once; regenerated only on a detected collision. Shown read-only in Preferences. |
| `work_manager_fields` | see R8e | — | Per-view field/column visibility for the Work Manager tables. **Common** fields (Machine, Layers, Tags) are a single shared setting across the three tabs; **tab-specific** columns are stored per tab. Default all-on except **Tags off**. Set via the Show fields gear (R8e–R8f); synced across tabs/windows. |

FCode blobs are stored as files in app userData (e.g. `userData/work-manager/<id>.fc`), the WorkItem index in storage (electron-store / `storage`). Eviction deletes the blob + framing files and trims the index. Under Tier 2 (§7.6) the machine keeps its **own** copy of queued/finished tasks via the firmware queue contract (bounded by device storage); Beam Studio's local retention (above) is independent of it.

### 6.5 Disambiguating repeated sends (layer signature + grouping)

In production the same `.beam` is sent many times with **different layers enabled** (cut pass, engrave pass, a per-color batch). Asking the user to name each send is unintuitive, and listing all layers is too heavy. We disambiguate with two automatic, zero-input mechanisms (decided this round):

**Layer signature (`layers`).** At send time, capture the **enabled layers** that the task actually processes — each layer's **name + color** (and module where relevant), read from the canvas layer state (Layer panel; `data-color` and layer name on the SVG layer; see `layer-config-helper`). The row renders this as a compact **strip of canvas-colored dots + a count** (e.g. `●●● 3 layers`), so two sends of the same file with different enabled layers show **visibly different signatures** with no typing. The full layer names appear on hover / in the expanded detail. Dots are capped (e.g. 6) with a `+N` overflow so a 20-layer file stays compact. The signature is the **primary differentiator**; the thumbnail (already rendered from only the enabled layers) and the estimated time are **supporting** signals on the same row.

**Grouping repeated sends (`sourceKey`).** Sends that share a `sourceKey` (same source design) **collapse under one parent row** — `Coaster_walnut · 4 runs` — showing the most-recent run's status + a roll-up (e.g. `3 ✓ · 1 ✗`). Expanding lists the individual runs, each differentiated by its **layer signature + thumbnail + time + timestamp**. This keeps long histories readable and turns "tell apart 8 near-identical rows" into "compare a few siblings in one group." Grouping applies within each tab (Queued / In Progress / Finished). A single (un-repeated) send shows as a normal top-level row (no parent wrapper).

> Not adopted (this round): auto-generated name suffixes and an explicit "what changed vs. last send" diff line — the signature + grouping cover the need without adding name noise or a reference-send dependency. (Either can be revisited; logged in §14.)

---

## 7. Queue & execution model (app-side, manual advance, multi-tab)

### 7.1 Where the queue lives

**Decided (app-side, with an optional machine-side mirror):** FLUX firmware has no multi-job queue, so Beam Studio holds the queue and the user releases jobs into the single-job send path.
- **Machines without built-in storage** (beamo, Beambox classic): the queue lives only in Beam Studio, so **at least one Beam Studio tab must stay open for the queue to be actionable** (closing all windows pauses the queue; it resumes — still as pending items — on next launch).
- **Storage-capable machines with the firmware queue contract** (Tier 2, §7.6): the queue is **held by the machine** (keyed by task id), so queued tasks **survive Beam Studio being closed**, run from the machine panel, and reconcile exactly on reconnect. This removes the "app must stay open" limitation for these machines. Where the contract is absent (older firmware), the machine falls back to app-side-only (Tier 1).

The machine-backed queue depends on a small firmware queue contract (§7.6.1); the WorkItem schema is designed so that contract backs the Queued tab without changing it.

### 7.2 Advance = manual (v1)

The queue is a **holding list**, not an auto-runner. When the target machine is idle and the queue is non-empty, the Work Manager / Monitor Tasks tab surfaces a **non-blocking prompt/banner**: *"\<machine\> is idle — send next queued job?"* with **Send next**. Nothing sends without that click (laser-safety: the bed may hold cut parts or no fresh sheet). "Send next" runs the standard `checkDeviceStatus` → `uploadFcode` path using the **stored FCode** (no reprocessing). Auto-advance is explicitly deferred (§7.4).

### 7.3 Multi-tab synchronization

The work store is **shared across all tabs/windows** (G10):
- **Source of truth:** a persisted store in the main process (electron-store / `storage`), the WorkItem **index** + on-disk FCode blobs. Renderers read via a Zustand store hydrated from it.
- **Propagation:** writes broadcast over the existing `communicator` bus using a new `TabEvents.WorkManagerChanged` event (sibling to `StorageValueChanged`/`UpdateDevices` in [`ipcEvents.ts`](../../packages/core/src/web/app/constants/ipcEvents.ts)); every tab updates its store on receipt. Web build (single context) degrades to an in-memory + `BroadcastChannel` equivalent.
- **Monitor ownership:** a Running task is monitored by **one** authoritative tab — `ownerTabId`, the tab that sent/released it. That tab polls `getReport()` and writes status/progress to the shared store; other tabs render from the store (read-only live view). If the owner tab **closes** while the task is Running, ownership is **handed off**: another open tab targeting the same machine adopts it (re-`select`s the device and resumes polling). If no tab can adopt and the connection is lost, the task goes **Disconnected** (§7.5). This avoids two tabs issuing conflicting control commands to the same machine.

### 7.4 Deferred: auto-advance

A future option (per-queue toggle) to auto-send the next job when the machine reports idle, gated behind a **bed-cleared confirmation that survives app restart** (Bambuddy/Prusa pattern). Out of v1 by decision (manual advance chosen for safety).

### 7.5 Disconnect handling

If the owning connection drops while a task is Running/Paused (Wi-Fi loss, machine power-off, `RECONNECTING` exhausted): the in-flight task transitions to **Disconnected** — a distinct terminal state (not Aborted, since we genuinely don't know the outcome), tagged grey, with the **last known progress** (`lastProgress`) and time shown. The machine row shows a disconnected dot. If the same machine later reconnects and reports COMPLETED/IDLE for that job, the item may be **reconciled** to Completed (best-effort); otherwise it stays Disconnected. This is the durable record today's flow lacks (§2.5).

### 7.6 Machine-side queue mirror (storage-capable machines)

**Why the storage-folder approach is abandoned.** An earlier design mirrored the queue into a `Queue/` folder and reconciled by a task id embedded in the filename, using the machine's native Recents as run-evidence. This does **not** work on real hardware: the firmware's Recents **renames** run tasks to `recent-1.fc`, `recent-2.fc`, … — discarding our id — and it **clones** rather than consumes the source file, so neither *"did it run?"* nor *"which instance ran?"* is answerable from storage. Bending the current firmware into a reliable sync isn't worth the fragility. Instead we split the feature into two tiers, and make the robust machine-backed behavior depend on a **small, well-scoped firmware queue contract**.

**Two tiers:**
- **Tier 1 — app-side queue (no firmware change; ships now).** The queue lives only in Beam Studio (§7.1–7.5): full queue UX, but a tab must stay open to advance, no run-from-panel, no offline survival. Works on **every** machine.
- **Tier 2 — machine-backed queue (needs the firmware contract below).** The machine persists the queue **keyed by task id** and reports status, so queued tasks survive app-close, run from the panel, and reconcile **exactly** — including offline runs and identical repeat sends. Gated on the contract + a model/firmware capability check.

The firmware *implementation* is owned by a **separate firmware PRD**; this section specifies the **interface Beam Studio consumes** and recommends its minimal shape.

#### 7.6.1 The minimal firmware queue contract (summary — see firmware PRD)

> The **authoritative** specification lives in the companion [Machine Task Queue firmware PRD](machine-task-queue-firmware.md). This is the summary of what Beam Studio consumes.

The firmware owns three pieces of persistent state, all addressed by a **client-supplied task id**, so identity never depends on a filename the firmware might rename:

- **Queue** — ordered list; each entry `{ id, name, fcode (stored), est_time, thumb?, enqueued_at }`.
- **History** — bounded ring buffer (e.g. last 50) of finished tasks `{ id, result: done|failed|aborted|canceled, started_at, ended_at, error? }`, persistent across power cycles.
- **Current** — the id running now (or null) + progress (already in the device report).

Operations (added to the control protocol; names illustrative):

| Op | Purpose |
|---|---|
| `queue.push { id, name, est_time, thumb? } + fcode` | Enqueue a task (reuses existing upload mechanics; stored under `id`). Idempotent on `id`. |
| `queue.list` | → `{ current, items:[{id,name,status,order,est_time}], history:[…], rev }`. One call = full reconciliation state. |
| `queue.remove { id }` | Remove a queued (not running) task. |
| `queue.reorder { ids:[…] }` | Set run order. |
| `queue.start { id? }` | Start the given (or head) task now — called by the app **and** by the panel's "start next". |
| `queue.fetch { id }` *(optional)* | Return the stored fcode so another PC can rehydrate its view. |
| `queue.setMode { auto_advance }` *(optional; default off)* | Firmware auto-starts the next task on idle. Deferred; v1 = manual start. |

Report/streaming additions: **`current_task_id`** in the periodic report, and a monotonic **`rev`** (or history cursor) so the app cheaply detects "something changed → re-`list`."

**The one load-bearing behavior — consume on run, log by id:** when a task starts, firmware moves it queue→current; on finish it appends to **history under the same id** and removes it from the queue. No rename, no clone-and-forget, no orphan. That single change is what makes everything else exact — and it's much less firmware than trying to make the folder/Recents hack reliable.

Storage: firmware enforces a max queue length / total bytes and returns a clear error on `push` when full.

#### 7.6.2 Division of labor & reconciliation (now trivial)

- **Beam Studio:** composes tasks, assigns ids (id embeds a host tag, §7.6.3); calls `push`/`reorder`/`remove`/`start`; renders queue + history from `queue.list`; mirrors into its own Work Manager store; drives the manual-advance UX.
- **Firmware:** persists queue + history keyed by id, runs one at a time, reports `current_task_id` + `rev`, consumes-on-run.

Reconciliation becomes **trivial and exact**: on (re)connect or a `rev` bump, call `queue.list` and map ids → WorkItems. A task queued and then run while Beam Studio was **offline** appears in `history` by its id; **identical repeat sends** have distinct ids; ordering is authoritative. The entire **Unverified**/guesswork problem of the folder approach disappears — status comes straight from the machine.

#### 7.6.3 Multi-host with the contract (simpler than the folder scheme)

Because the shared queue now lives in firmware, the fragile per-host filename/manifest scheme is **retired**. Each install still keeps a stable **host tag** (`work_manager_host_id`, `[A-Z0-9]{4}`) embedded as a prefix in each task `id` (`<host>-<uuid>`). Firmware needs **no** host concept — it just stores and serves the list. Beam Studio uses the prefix only for presentation and policy: its own items are editable; others render read-only as "queued on \<HOST\> (another device)"; "send next"/remove act only on the local host's ids. The machine serializes runs; every connected host reads the same `queue.list` and agrees.

#### 7.6.4 Fallback when the contract is absent

Capability is detected by model + firmware version (`VersionChecker`). If a machine lacks the queue contract (older firmware, or a model that never gets it), Beam Studio silently falls back to **Tier 1 (app-side-only)** for that machine: full queue UX in the app, but no run-from-panel, no offline survival, and the "keep a tab open to advance" note (§7.1). No feature is blocked; only the machine-backed guarantees are withheld. Gated by `work_manager_sync_to_machine` (§6.4).

#### 7.6.5 Deferred (later firmware phases → firmware-UI PRD)

Auto-advance (`queue.setMode`) with an on-device **bed-cleared confirmation**; a richer **Queue screen on the panel** (reorder, per-item progress, thumbnails). All build on the same contract and are out of this PRD's scope.

---

## 8. Local storage & retention

- **R-Store-1.** Each sent/queued task persists its FCode blob + framing data + thumbnail + metadata to app userData; the index persists in the shared store.
- **R-Store-2.** `work_manager_max_files` (default 30, range 0–1000) caps **finished** tasks; oldest-finished files auto-evict when exceeded. Queued tasks are exempt.
- **R-Store-3.** Users can **delete** any finished task (removes its files) and **Save FCode…** (export the blob) before deleting.
- **R-Store-4.** Setting the cap **below** the current count immediately evicts the oldest finished tasks down to the cap (with a confirm if it would drop > N items).
- **R-Store-5.** Storage footprint is surfaced (count `n/max`, optional total MB) so users understand the cost of large caps.

---

## 9. Detailed requirements

### 9.1 Capture & persistence

- **R1.** Every task sent via Go, Monitor Start, or Re-send is recorded as a **WorkItem** (§6.1) at send time, reusing the `openTaskInDeviceMonitor` payload.
- **R2.** A WorkItem persists FCode + framing + thumbnail + metadata to disk and the index to the shared store; both survive Monitor close and app restart.
- **R3.** Status transitions are recorded in `statusHistory` with timestamps; `startedAt`/`endedAt`/`elapsedTime` are captured from the live report.

### 9.2 Work Manager dialog

- **R4.** Provide a Work Manager `DraggableModal` with **In Progress / Queued / Finished** tabs; **Queued is absent unless ≥1 queued task exists**.
- **R5.** Use antd `Table` with sortable columns (Task, Machine, Status, Time, Tags) and the **column-merging** layout in §5.2; filter by machine and tag.
- **R6.** In Progress rows show live progress + Pause/Resume/Stop (mirroring `MonitorControl`) + Frame + Open Monitor; Finished rows show result badge with colored left border + Re-send/Frame/Edit-tags/Save-FCode/Delete/Details.
- **R7.** Tags are inline-editable chips (add/remove) on any row; changes propagate to all tabs (§R20). **Tags are hidden by default** (§R8e) now that the layer signature carries the primary per-send identity — three stacked lines (name + signature + tags) is too dense; users opt tags back in via Show fields.
- **R8.** A machine filter dropdown scopes the view; an active-count badge on the launcher reflects queued+running across all machines.
- **R8b.** **Hide the file extension in task names.** Every task row/label strips a trailing source extension (`.beam`) for display — it's always the same and adds no information (show `Coaster_walnut`, not `Coaster_walnut.beam`); the on-disk `.fc`/`.beam` is never shown. The full name is still used internally and is restored if exported. Editing a name edits the extension-less display name.
- **R8c.** **Layer signature.** Each row shows the enabled layers as a compact strip of **canvas-colored dots + count** (`●●● 3 layers`), captured per-send (`layers`, §6.5); full layer names on hover/expand; dots capped with `+N` overflow. This is the primary way to tell apart repeated sends of the same file with different layers enabled — no naming required.
- **R8d.** **Group repeated sends.** Sends sharing a `sourceKey` collapse under one **expandable parent row** (`<name> · N runs`) with a status roll-up; expanding shows each run differentiated by signature + thumbnail + time + timestamp. Applies within each tab; single sends render as normal rows.
- **R8e.** **Show fields control.** The **header of the actions column** holds a settings (gear) icon button; clicking opens a dropdown of checkboxes to toggle field/column visibility for the active tab. The dropdown contents are tab-specific:
  - **In Progress:** Machine, Status, Elapsed/est. time (columns) + Layers, Tags (visibility inside the Task cell).
  - **Queued:** Machine, Est. time (columns) + Layers, Tags.
  - **Finished:** Machine (column) + Layers, Tags. (Result and Finished-time columns are always shown.)

  Defaults: **all on except Tags (off)**; the Task-name row is always shown. Persisted in `work_manager_fields` (§6.4).
- **R8f.** **Common fields sync across the three tabs.** Fields present in every tab — **Machine, Layers, Tags** — are a **single shared setting**: toggling one in any tab updates the others (and persists). Tab-specific columns (In Progress's Status & Elapsed/est.; Queued's Est. time) are stored per tab. Because these are preferences, they also propagate across Electron tabs/windows via the existing `GlobalPreferenceChanged` path.
- **R8g.** **Inline rename on hover.** Hovering a task row reveals a small **edit (pencil) icon after the name**; clicking turns the name into an inline text field to rename the task (writes the extension-less `name`; the `.beam`/`.fc` on disk is unaffected). Available on individual task rows (including group children); a group **parent** row is a derived label and is not directly renamed.

### 9.3 Queue

- **R9.** Tasks can be queued from: the busy-machine prompt ("Add to queue"), the Go split-button, and the Monitor Start dropdown ("Queue for later"). Queuing from Monitor **closes the Monitor**.
- **R10.** Queued tasks are reorderable (drag), support Move-to-top, Send-now (manual release), Remove, and Frame.
- **R11.** When the target machine is idle and its queue is non-empty, show a non-blocking "send next?" prompt; **never auto-send** (v1).
- **R12.** "Send next" / "Send now" run the standard `checkDeviceStatus`→`uploadFcode` path using the **stored FCode** (no reprocessing); on success the item becomes Sending→Running and leaves the queue.

### 9.4 Go & Monitor integration

- **R-Go.** Replace the busy-machine YES/NO ([`check-device-status.ts`](../../packages/core/src/web/helpers/check-device-status.ts) lines 121–135) with **Abort & start now / Add to queue / Cancel**. "Add to queue" converts now and enqueues (no send). Idle behavior of Go is unchanged except the task is now recorded.
- **R-Go-2.** Add a caret/split-button beside Go ([`GoButton.tsx`](../../packages/core/src/web/app/components/beambox/TopBar/GoButton.tsx)) with **Add to queue** and **Frame** actions.
- **R-Mon-1.** Monitor Start becomes a split button: **Start** (unchanged) + **Queue for later** (enqueues, closes Monitor).
- **R-Mon-2.** Add a **Tasks** tab to the Monitor `Tabs` ([`Monitor.tsx`](../../packages/core/src/web/app/components/monitor/Monitor.tsx)) showing this machine's queued + recent finished tasks with Re-send/Frame/Remove.

### 9.5 Re-send & framing

- **R13.** Re-send pushes a finished task's stored FCode back through the send path with **no reprocessing**, defaulting to the original machine; it creates a **new** WorkItem (`origin=resend`) linked to the source.
- **R14.** Re-send to a **different model** is blocked with guidance ("Open the original design to send to a different machine") because FCode is model-bound (§13).
- **R15.** Frame-a-stored-task replays embedded framing data through `FramingTaskManager` against the connected target machine; offer **Box** and **Hull** like LightBurn (Rotary/contour deferred).

### 9.6 Status & disconnect

- **R16.** Map `DeviceConstants.status` to the WorkItem lifecycle exactly per §6.2; do not introduce new device states.
- **R17.** On connection loss during Running/Paused, set **Disconnected** with last-known progress/time; attempt best-effort reconciliation on reconnect (§7.5).

### 9.7 Multi-tab

- **R18.** The work store (queue + in-progress + finished) is shared and consistent across all tabs/windows via `TabEvents.WorkManagerChanged` over `communicator`.
- **R19.** Exactly one tab (`ownerTabId`) monitors a given Running task and issues control commands; other tabs render read-only live status from the store.
- **R20.** Ownership hands off if the owner tab closes; if no tab can adopt, the task goes Disconnected.

### 9.8 Preferences

- **R21.** Add `work_manager_max_files` (default 30, min 0, max 1000) to Preferences with an integer input clamped to range, wired through `beambox-preference` + `globalPreferenceStore`, broadcast cross-tab.
- **R22.** Reducing the cap evicts oldest finished tasks to fit (with confirm if dropping many); `0` disables finished history (D-retention).
- **R23p.** Add `work_manager_sync_to_machine` (default on) to Preferences — enables the **machine-backed queue** where the firmware supports it (Tier 2), else no-op.

### 9.9 Machine-backed queue (Tier 2 — firmware queue contract)

- **R26.** Detect the firmware queue contract by model + firmware version / capability flag (`VersionChecker`; the firmware advertises `caps: ["task_queue_v1"]`). Where present and `work_manager_sync_to_machine` is on, use the **machine-backed queue**; otherwise fall back to the **app-side-only** queue (Tier 1) with no loss of app-side function (§7.6.4).
- **R26a. (Compatibility invariant.)** Beam Studio **must run fully on today's firmware** and never hard-depend on the contract. Support is decided **per machine** at connect time and re-evaluated on firmware upgrade, so a customer's mixed fleet (some upgraded, some not) works simultaneously. All four sw/fw combinations are supported (firmware PRD §8); a missing/older capability silently selects Tier 1, never an error.
- **R27.** Consume the contract (§7.6.1): `queue.push` (with the WorkItem `id` as task id), `queue.list`, `queue.remove`, `queue.reorder`, `queue.start`; read `current_task_id` + `rev` from the report. Beam Studio's queue actions map 1:1 to these ops.
- **R28.** Queued tasks **survive app-close** and are runnable from the machine panel; finished tasks are recorded in the firmware **history** and surfaced in Beam Studio's Finished tab (Re-send still uses the local FCode copy).
- **R29.** **Reconcile from `queue.list` by task id** on (re)connect or `rev` change: statuses (queued / running / done / failed / aborted / canceled) come straight from the machine — exact across **offline runs** and **identical repeat sends**, no guessing. App-only items (queued while offline) are pushed.
- **R30.** Firmware behavior required: **consume-on-run + append to history under the same id** (no rename/clone-and-forget); persistent, bounded history; `push` errors clearly when storage is full. These are the contract's load-bearing guarantees (§7.6.1).
- **R31b.** Multi-host: the WorkItem `id` carries a `[A-Z0-9]{4}` host-tag prefix; Beam Studio edits/removes only its own-prefixed ids and shows others read-only as "queued on another device" (§7.6.3). Firmware needs no host concept.
- **R31.** The machine-side mirror is **best-effort and non-blocking**: a storage/upload failure (full disk, busy device, older firmware) degrades gracefully to the app-side queue with a subtle notice; it never blocks sending or queuing.
- **R32.** **Multi-host isolation (§7.6.3):** prefix each task `id` with a stable per-install `work_manager_host_id` (`[A-Z0-9]{4}`); a host **only edits/removes ids matching its own tag**; others are read-only and shown as "queued on another device"; regenerate the tag on a detected collision. Firmware needs no host concept.
- **R33.** "Send next" auto-selects only from the **local host's** queue; Beam Studio never sends or deletes another host's file. The machine still serializes runs; all connected hosts reconcile from the device report.

---

## 10. Migration & compatibility

- **R23.** First run with the feature: empty store; no migration needed. Existing `Recent files` is unrelated and untouched.
- **R24.** Fold the existing **Promark `promarkTaskCache`** into the new store so Promark's per-machine cached task becomes a normal WorkItem (removing the bespoke cache).
- **R25.** WorkItem schema versioned; on-disk blobs keyed by `id` so a schema bump can migrate the index without rewriting blobs. Designed so a **firmware-side queue** could later back the Queued tab without UI change.
- **R25a.** Under Tier 2, Beam Studio only removes/edits queue entries whose task `id` carries **its own** host tag (§7.6.3); it never touches another host's entries. `queue.push` is idempotent on `id`, so a retried upload never duplicates a task.

---

## 11. UX / visual notes

- **antd-first:** `DraggableModal`, `Tabs`, `Table` (with `sorter`, `rowSelection` optional, expandable rows for Details), `Tag` (editable per the antd editable-tags pattern), `Progress`, `Badge`, `Dropdown`/`Dropdown.Button` (split buttons), `Popconfirm` (delete/evict). Match the existing dialog conventions (e.g. [`LayerColorConfig.tsx`](../../packages/core/src/web/app/components/dialogs/LayerColorConfig.tsx) for editable antd `Table`).
- **Status color reuse:** map badges to `DeviceConstants.statusColor` so the Work Manager and Monitor agree visually.
- **Performance:** virtualize the Finished table for large caps (up to 1000); lazy-load thumbnails; keep FCode blobs on disk, not in the renderer store.
- **Honest time:** label `requiredTime` as an estimate; the live **elapsed** timer + progress bar are the source of truth (laser ETAs are unreliable).
- **Localization:** new strings under a `work_manager` key in [`en.ts`](../../packages/core/src/web/app/lang/en.ts); reuse existing `monitor.*` (`start`, `pause`, `resume`, `stop`, `taskTab`, `left`, `hour/minute/second`) and `framing.*` (`framing`, `area_check`, `contour`) labels; the busy prompt extends `message.device_is_used`.
- **Accessibility:** table keyboard-navigable; status conveyed by text + icon, not color alone; tags reachable by keyboard.
- **No new clutter for non-adopters:** launcher badge only when active; Queued tab only when used; queue affordances appear contextually (busy prompt, split buttons).

---

## 12. Success metrics

- **Adoption:** % of active machines/users who open the Work Manager; # of tasks re-sent from history (proves the killer feature).
- **Queue usage:** % of sends that go through the queue; avg queue depth; "send next" prompt acceptance rate.
- **Re-run efficiency:** time from "want to repeat" to "running" via Re-send vs. re-opening the design (target: large reduction).
- **Reliability:** rate of Disconnected outcomes captured (previously invisible); reconciliation success rate.
- **Retention behavior:** distribution of `work_manager_max_files` settings; eviction frequency.
- **Support:** reduction in "did my job finish / can I repeat the last job" tickets.

## 13. Edge cases & risks

- **App closed = queue paused.** No firmware queue ⇒ queued jobs don't run while Beam Studio is closed. Communicate clearly; resume pending on launch.
- **Cross-model re-send.** FCode is model/work-area-bound; re-send to a different model is blocked with guidance (we store FCode, not editable source). A later option could store the `.beam` source for true cross-model repeat.
- **FCode/firmware drift.** A stored FCode may be invalid if firmware changes incompatibly; Re-send should surface a version mismatch (reuse the `VersionChecker` path in `exportTask`).
- **Disconnect ambiguity.** We can't always know if a job finished; Disconnected is deliberately distinct from Completed/Aborted. Reconciliation is best-effort.
- **Two tabs, one machine.** Ownership election (R19/R20) prevents conflicting control commands; verify against the real connection model (does the backend allow two `select`s to one device?). Engineering to confirm.
- **Storage growth.** 1000 FCode blobs can be large; surface footprint, evict oldest, keep blobs out of the renderer store.
- **Framing without design.** Box/Hull from stored bbox/hull is supported; Rotary/Contour framing need richer path data — deferred; hide those options for stored-task framing in v1.
- **Variable-text tasks.** Carry `vtTaskTime` and the VT info already threaded through `uploadFcode`; re-send replays the exact FCode (VT already rendered), which is correct for an identical repeat.
- **Layer signature unavailable.** Older tasks or edge imports may lack captured `layers` → fall back to thumbnail + time as the differentiators and show no dot strip (don't fabricate one). A **re-send** copies the source task's signature (it runs the same FCode, so the same enabled layers).
- **Same file, identical layers, sent twice.** Signatures match (correctly) — siblings are then told apart by timestamp/time within the group; this is expected, not a bug.
- **Grouping key collisions.** Two unrelated files with the same name but different paths should not group — prefer full normalized path for `sourceKey`; fall back to name only when no path exists (web build), accepting occasional over-grouping.
- **Retention = 0 + a queued job.** Queue exempt from the finished cap; only finished-history is disabled.
- **Promark special states** (`RECONNECTING`): treat as transient, not immediate Disconnected, before timing out.
- **Machine-mirror drift.** User runs/deletes a `Queue/` file from the panel while Beam Studio is closed → reconcile on reconnect (§7.6.3); never assume the app queue is authoritative for items the panel already consumed.
- **Machine storage full / old firmware.** Upload to `Queue/`/`Recents/` may fail (`NOT_EXIST`, full disk, no folder-create). Mirror is best-effort (R31): degrade to app-side queue with a subtle notice; don't block.
- **Why not the storage folder.** Native Recents **renames** run tasks to `recent-N.fc` (losing our id) and **clones** instead of consuming, so run status isn't readable from storage — hence the Tier-2 firmware contract instead of a folder hack (§7.6, D14→D15). *(No `move()` API is involved either way.)*
- **Ran while offline (Tier 2).** Resolved exactly: the run is in the firmware **history** keyed by task id; `queue.list` on reconnect returns its status. Identical repeat sends have distinct ids, so the right instance is credited. No **Unverified** guesswork.
- **Contract absent / older firmware.** Falls back to **Tier 1** (app-side-only): the machine can't hold or run the queue, so "keep a tab open to advance" applies and there's no run-from-panel. Detected by model + firmware version; communicated per-machine.
- **Non-storage machines.** beamo/Beambox classic are Tier 1 only — never imply machine-backed behavior exists everywhere.
- **Multiple PCs, one machine (Tier 2).** The queue lives in firmware; the WorkItem `id`'s host-tag prefix lets each host edit only its own items and see others read-only. The machine serializes runs and every host reads the same `queue.list`, so there's no cross-host clobbering and no filename/manifest races (§7.6.3).
- **Host-tag collision.** ~1-in-1.68M; detected when a host sees own-prefixed ids it didn't create → regenerate the tag. No data loss (it never mutates unrecognized ids).
- **Machine queue storage full.** `queue.push` returns a clear error; Beam Studio keeps the task in its app-side queue and surfaces "machine queue full — free space or run some" rather than failing the send.

## 14. Resolved decisions / open questions

**Resolved (this round):**
- **D1.** Queue is **app-side**; app must stay open to advance; schema future-proofed for a firmware queue. *(was O-engine)*
- **D2.** Advance is **manual** (release each job) with a non-blocking idle prompt; **auto-advance deferred**. *(was O-advance)*
- **D3.** Persist **full FCode + framing + metadata** per task → identical Re-send with no reprocessing; framing without the design. *(was O-storage)*
- **D4.** Retention preference `work_manager_max_files` default **30**, range **0–1000**, evicts oldest **finished**; queued exempt. *(given)*
- **D5.** Three tabs **In Progress / Queued / Finished**; **Queued hidden until used**. *(given)*
- **D6.** **Disconnected** is a distinct terminal state (≠ Aborted). *(given)*
- **D7.** Busy-machine prompt becomes **Abort & start now / Add to queue / Cancel**; Go gets a queue/frame split-button; Monitor Start gets **Queue for later** (closes Monitor); Monitor gains a **Tasks** tab. *(given)*
- **D8.** *(superseded by D15.)* Machine-side queue is delivered in **two tiers**: app-side-only (Tier 1, no firmware) ships now; a machine-backed queue (Tier 2) depends on a firmware queue contract.
- **D9.** **Multi-host concurrency** uses a stable per-install **host tag** (`[A-Z0-9]{4}`) prefixed onto each task `id`; a host edits/removes only its own-prefixed ids and shows others read-only. Under Tier 2 the shared queue lives in firmware (no filename/manifest scheme needed); firmware needs no host concept. *(refines the user's "4-char ID" idea; was the multi-PC conflict risk)*
- **D10.** Task names **display without the `.beam` extension** everywhere (always-identical, no information); full name kept internally. *(this round)*
- **D11.** Repeated sends of the same file are disambiguated by an **auto layer-signature** (canvas-colored dots + count, full names on hover) and **grouped under expandable parent rows** (`<name> · N runs`). No mandatory naming. Auto-name suffixes and a "diff vs. last send" line were considered and **not adopted** this round (revisitable). *(was the repeat-send disambiguation question)*
- **D12.** A **Show fields** gear in the actions-column header toggles per-tab column/field visibility (R8e). **Tags default off** (layer signature now carries per-send identity); layers default on. **Common fields (Machine/Layers/Tags) sync across the three tabs**; tab-specific columns are per tab; all persisted in `work_manager_fields`. *(this round)*
- **D13.** Tasks are **renamed inline** via a pencil icon revealed on row hover (R8g); group parent rows are derived and not directly renamed. *(this round)*
- **D14.** *(superseded by D15.)* The storage-folder mirror (embed id in `Queue/` filename; reconcile against native Recents) is **abandoned** — real firmware **renames** Recents to `recent-N.fc`, destroying the id, and **clones** instead of consuming, so run status can't be read from storage.
- **D15.** The robust machine-backed queue is delivered as **Tier 2** on a **minimal firmware queue contract** (§7.6.1): firmware persists queue + history + current, all keyed by a **client-supplied task id** (= WorkItem `id`, host-tag-prefixed), with **consume-on-run + log-by-id** as the load-bearing behavior; Beam Studio reconciles exactly from `queue.list`. **Tier 1 (app-side-only)** ships now with no firmware and is the fallback when the contract is absent. *(resolves "current firmware can't support reliable sync — do a small firmware queue instead")*
- **D16.** **Two PRDs.** This is the **software** PRD; the firmware queue is a **separate, minimal** PRD ([machine-task-queue-firmware.md](machine-task-queue-firmware.md)). The software is **firmware-version-aware and compatible with both old and new firmware** — support is decided **per machine** and re-evaluated on upgrade, so mixed fleets work (software ships fast; firmware lags). The software never hard-depends on the contract (R26a). *(this round)*

**Open (need a decision):**
- **O1 (retention=0 semantics).** When `max=0`, do we keep a **lightweight log row** (name/machine/status/time, no FCode, no re-send) or show **nothing** in Finished? *Recommendation: keep the lightweight log row so history/costing still works without disk cost; re-send simply disabled.*
- **O2 (queue scope across machines).** Is the queue strictly **per-machine**, or is there also an "any available machine" pool for identical multi-machine shops? *Recommendation: per-machine in v1; pool deferred.*
- **O3 (resend target).** On Re-send, do we auto-`select` and send immediately, or open the Monitor in PREVIEW first for a final confirm? *Recommendation: open Monitor PREVIEW (consistent with normal send; lets the user Frame first).*
- **O4 (history privacy).** Should thumbnails/FCode for finished tasks be excluded when a design is "confidential"? *Likely no for v1; flag for later.*
- **O5 (obsolete → D15).** The storage-root / `Queue/` folder question is moot — Tier 2 stores the queue via the firmware contract, not a browsable folder.
- **O6 (obsolete → D15).** Reorder is a `queue.reorder` call; no file rename/`move()` involved.
- **O7 (default for sync).** Is `work_manager_sync_to_machine` **on by default** where the firmware contract exists, or opt-in? *Recommendation: on by default (it's the resilience win), with a clear Preferences toggle.*
- **O8 (firmware contract scope).** Which ops make the firmware v1: is `queue.fetch` (rehydrate from machine) and `queue.setMode` (auto-advance) in or deferred? *Recommendation: v1 = push/list/remove/reorder/start + `current_task_id`/`rev`; defer fetch + auto-advance. Owned by the firmware PRD.*

**Deferred to implementation / backend:**
- Exact on-disk layout & store keys; the `communicator`/IPC contract for `WorkManagerChanged`; the connection model for multi-tab ownership/hand-off; web-build equivalent of the shared store; FCode version-compat checks on Re-send.

## 15. Appendix: key references

- Go button & send flow: `packages/core/src/web/app/components/beambox/TopBar/GoButton.tsx`, `packages/core/src/web/app/actions/beambox/export/GoButton/handleExportClick.ts`, `…/exportTask.ts`
- Convert + upload + monitor handoff: `packages/core/src/web/app/actions/beambox/export-funcs.ts` (`uploadFcode`, `openTaskInDeviceMonitor`, `promarkTaskCache`)
- Monitor: `packages/core/src/web/app/components/monitor/Monitor.tsx`, `MonitorTask.tsx`, `MonitorControl.tsx`; `packages/core/src/web/app/contexts/MonitorContext.tsx` (`PreviewTask`); `packages/core/src/web/app/constants/monitor-constants.ts` (`Mode`)
- Busy-machine / abort: `packages/core/src/web/helpers/check-device-status.ts`
- Device status & color: `packages/core/src/web/app/constants/device-constants.ts` (`status`, `statusColor`); `packages/core/src/web/interfaces/IDevice.d.ts` (`IReport`); `packages/core/src/web/helpers/monitor-status.ts`; `packages/core/src/web/helpers/device-master.ts`
- Task metadata: `packages/core/src/web/interfaces/ITask.ts` (`TaskMetaData`)
- Framing: `packages/core/src/web/helpers/device/framing.ts` (`FramingTaskManager`, `FramingType`)
- Layer state for the signature (name/color/module of enabled layers): `packages/core/src/web/helpers/layer/layer-config-helper.ts`, Layer panel under `packages/core/src/web/app/components/beambox/RightPanel/LayerPanel/` (`data-color`, layer name on the SVG layer)
- Machine storage file APIs: `packages/core/src/web/helpers/device-master.ts` (`ls`, `fileInfo`, `uploadToDirectory`, `downloadFile`, `deleteFile`, `goFromFile`, `go`); `packages/core/src/web/interfaces/IControlSocket.d.ts`
- Storage browsing UI: `packages/core/src/web/app/components/monitor/MonitorFilelist.tsx`, `FileItem.tsx`; file actions in `packages/core/src/web/app/contexts/MonitorContext.tsx` (`onSelectFile`, upload handler, `Mode.FILE_PREVIEW` → `goFromFile`)
- Storage-capable machine gate: `packages/core/src/web/app/actions/beambox/constant.ts` (`supportUsbModels` = `ado1, fbb2, fbm2, fhexa1, fhx2rf, fpm1`)
- Firmware capability / version detection: `packages/core/src/web/helpers/version-checker.ts` (`VersionChecker`)
- **Companion firmware PRD:** [`docs/prd/machine-task-queue-firmware.md`](machine-task-queue-firmware.md) — the minimal `task_queue_v1` contract this software consumes (Tier 2)
- Preferences: `packages/core/src/web/interfaces/Preference.d.ts`, `packages/core/src/web/app/actions/beambox/beambox-preference.ts`, `packages/core/src/web/app/stores/globalPreferenceStore.ts`, `packages/core/src/web/app/components/settings/modal/SettingsModal.tsx`
- Multi-tab / IPC: `packages/core/src/web/app/actions/tabController.ts`, `packages/core/src/web/app/constants/ipcEvents.ts` (`TabEvents`)
- antd Table / dialog patterns: `packages/core/src/web/app/components/dialogs/LayerColorConfig.tsx`, `packages/core/src/web/app/widgets/DraggableModal.tsx`
- i18n: `packages/core/src/web/app/lang/en.ts` (`monitor` @ ~L1879, `message.device_is_used`, `framing.*`)
- Competitors: LightBurn Job Control https://docs.lightburnsoftware.com/latest/GetStarted/JobControl/ · "no queue" https://forum.lightburnsoftware.com/t/job-queues-multiple-pages-automation/99152 · Job Logs request https://forum.lightburnsoftware.com/t/feature-request-job-logs/156032 · Glowforge "Repeat Last Print" https://community.glowforge.com/t/feature-request-repeat-last-print-fast-offline-compatible/54767 · Bambuddy print queue https://wiki.bambuddy.cool/features/print-queue/ · OctoPrint Continuous Print https://plugins.octoprint.org/plugins/continuousprint/ · Prusa Connect https://blog.prusa3d.com/prusa-connect-a-network-solution-for-remote-control-of-3d-printers_90364/
