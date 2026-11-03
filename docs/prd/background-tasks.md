# PRD: Background machine tasks

| | |
|---|---|
| **Status** | Implemented in 2.7.3 (manager, Promark migration, foreground yield, reselect). Pending: Promark hardware check of B1, B2, B6; B4/B5 get verified once auto full-area preview, the first task that can be busy, lands. |
| **Author** | Product with the software team |
| **Created** | 2026-10-30 |
| **Target product** | Beam Studio desktop (Electron) and web. All models. |
| **Owner area** | Device communication |
| **Related code** | Manager (new): `packages/core/src/web/helpers/device/background/`; First member: `helpers/device/promark/promark-button-handler.ts`; Foreground guard: `helpers/check-device-status.ts`; Modal query: `app/contexts/DialogContext.tsx`, `app/contexts/AlertProgressContext.tsx`, `app/actions/dialog-caller.tsx`; Context sources: `app/components/beambox/TopBar/contexts/TopBarController.tsx`, `app/contexts/CanvasContext.tsx`, `app/stores/canvas/canvasStore.ts`, `app/stores/documentStore.ts`, `app/actions/tabController.ts` (read only); Startup registration: `app/actions/beambox/beambox-init.ts`; Device: `helpers/device-master.ts` |
| **Companion PRD** | `docs/prd/auto-full-area-preview.md` (second member) |

---

## 1. Summary

Some features talk to the selected machine while the user is not asking for anything: today the Promark start-button listener, next the door-triggered auto full-area preview. Each one so far carries its own copy of "should I be running" (selected device, canvas mode, workarea, tab focus), selects the machine itself, and is invisible to the code that guards foreground machine actions.

This PRD adds one small manager, `backgroundTasks`, that every such feature registers with. The manager owns what they share:

1. the context subscriptions and the start/stop decision,
2. the only `deviceMaster.select()` a background task may cause,
3. one task per machine at a time, chosen by an explicit priority,
4. yielding to foreground actions through `checkDeviceStatus`, with a prompt worded by the busy task,
5. a shared pre-flight check before touching the machine (`canTouchMachine`),
6. a list of who is running, for debugging.

Tasks keep their own logic: what they poll, how often, and what they do with the answer.

---

## 2. Background & current state

### 2.1 Inventory of machine pollers

Every `setInterval` in `packages/core/src/web` that talks to a machine (grep, 2026-10-30):

| Poller | Runs when | Kind |
|---|---|---|
| `promark-button-handler.ts:118` `checkButton` every 200 ms | idle, Promark selected | **background** |
| auto full-area preview door poll (companion PRD) | idle, fbm2/fbb2/fhx2rf selected | **background** (planned) |
| `MonitorContext.tsx:362` report | monitor dialog open | foreground |
| `DoorChecker.ts:47` | manual preview capture | foreground |
| `framing.ts:471`, `device-master.ts:775`, `check-device-status.ts:62` | during the user's action | foreground |
| `discover.ts:225-271` | always | network discovery, no control socket |

Foreground pollers start and stop with a user action and are already serialised by `checkDeviceStatus`. Only the background kind needs coordination.

### 2.2 Promark start-button listener

`promark-button-handler.ts:35-208`, a singleton:

- **Requirements** (`:36-41`): `context` (canvas mode Draw or PathPreview, selected device is Promark, `:64-74`), `enabled` (document setting `promark-start-button`, `:76-82`), `tab` (`isWeb() || tabController.isFocused`, `:55`, `:90-96`), `workarea` (document workarea is a Promark model, `:84-88`). All true → `startListening`, else `stopListening` (`:98-108`).
- **Device**: `startListening` selects the device itself if it is not current (`:113-115`).
- **Context feed**: `GoButton.tsx:38-40` mirrors `mode` and `CanvasContext.selectedDevice` into `onContextChanged`.
- **Per tick** (`:143-207`): skips while `status !== 'listening'`, while the material-test-generator dialog or a full-window panel is open; otherwise `deviceMaster.checkButton()` and, on a press, closes framing/monitor and calls the export function.
- **Status** is driven from outside: `handleExportClick.ts:44,66`, `exportTask.ts:131`, `MonitorContext.tsx:1002,1017` set `preparing` / `uploading` / `listening`.
- It deliberately keeps running while the framing modal or the monitor is open and while a job runs (`isRunning`, `:169`), because the physical button controls those.

### 2.3 Shared state the tasks touch

- **Selected device**: `TopBarController.tsx:31` emits `SET_SELECTED_DEVICE` on the `top-bar` emitter; `CanvasContext.tsx:63` stores it. The startup default is not emitted: `TopBar.tsx:62` calls the context setter directly, so a listener on the event alone misses it. Reading `CanvasContext.selectedDevice` from a component (as `GoButton.tsx:38-40` does) sees both.
- **Current device is global**: `deviceMaster.select(device)` switches the one control connection every caller uses. A background task that assumes "the current device is mine" breaks as soon as a foreground action selects another machine; Promark's `checkButton` would then poll the wrong machine.
- **Foreground guard**: `check-device-status.ts:18-35` already handles one in-app session, manual preview: another device → end it silently; same device → Yes/No `device_is_used`. 21 callers (export, every machine-menu action, framing, calibration dialogs, curve measurer, Print and Cut, path preview, `preview-mode-controller.ts:85`).
- **Modals**: `DialogContext.tsx:21-46` (`dialogComponents`, `CHECK_ID_EXIST`), `AlertProgressContext.tsx:112-116` (`alertProgressStack`). No "is anything open" query exists.
- **Tab focus**: `tabController.ts:24` hardcodes `isFocused = isWeb()`, so on web every tab counts as focused forever; Electron emits `TabFocused` / `TabBlurred` (`:28-37`). Changing what web emits is not free: `beambox-global-interaction.ts:17` re-attaches the menu on every focus, `Tabs.tsx:35` and `TabRecentFiles.tsx:86` refetch, `ai-extension.ts:60` re-registers, `dockable/utils.ts:339` skips layout saves when unfocused, `fileImportHelper.ts:107` acts on blur.

---

## 3. Goals & non-goals

**Goals**

- G1. A new background feature is one task object plus one `register` call; it never touches `checkDeviceStatus`, `GoButton`, or `deviceMaster.select`.
- G2. A foreground machine action always wins: it either finds every task idle, or stops the busy one after a Yes/No prompt that names it.
- G3. Two background tasks never drive the same machine at once; when they compete, the one with the higher priority runs, and every priority is visible in one table.
- G4. `backgroundTasks.list()` shows which tasks are registered, which are running, on which machine, and which are busy.
- G5. The Promark start button behaves exactly as today after it moves into the manager.

**Non-goals**

- Foreground pollers (monitor, framing, preview door check) stay as they are.
- Network discovery.
- Coordination across computers (each Beam Studio instance manages only its own tasks; the firmware's task exclusivity handles the rest).
- A scheduler for tick timing. Each task keeps its own timer.

---

## 4. Scenarios

- **S1 Promark, unchanged.** Promark selected, Draw mode, start-button setting on, tab focused: pressing the physical button exports as today; with frame-before-start, the first press frames.
- **S2 Foreground action while a task is busy.** Auto preview is capturing on machine A; the user clicks Go for machine A. Prompt worded by the task ("The machine is capturing the work area for auto preview. Stop capturing and continue?"). Yes → the task aborts, then export continues. No → export cancelled.
- **S3 Foreground action on another machine.** A task is busy on machine A; the user starts an action on machine B. The task aborts without a prompt (same rule as manual preview today), then the action continues.
- **S4 Foreground action while tasks are idle.** No prompt; `checkDeviceStatus` behaves exactly as today.
- **S5 Foreground switched the current device.** The monitor of machine B was opened; when it closes and nothing else holds the machine, the manager selects machine A again for the running task.
- **S6 Context change.** Selected device, canvas mode, workarea, or tab focus changes: each task is started or stopped accordingly, within one event.
- **S7 Two tasks want the same machine (future).** The higher-priority task runs; the other is stopped (aborted if busy) and stays stopped until the machine is free of the higher one. A console warning names both.
- **S8 Debug.** In devtools, `backgroundTasks.list()` returns one row per task.

---

## 5. Acceptance criteria

| # | Operate | Expected | Edge cases |
|---|---|---|---|
| B1 | Promark selected, document Promark workarea, start-button setting on, Draw mode. Press the physical button. | Export starts as today. | Frame-before-start on: first press frames, holding to the run threshold exports. PathPreview mode: still listens. Material-test-generator open: ignored. |
| B2 | As B1, switch the canvas to a non-Draw/PathPreview mode, or select a non-Promark machine, or switch the document workarea, or turn the setting off. | Button presses ignored (listener stopped). Switching back resumes without restarting. | Electron: focus another tab → stopped; back → resumes. |
| B3 | Web build: hide the browser tab with a task running. | Task stops; showing the tab resumes it. | Promark on web: accepted change from today (it never paused on web). Menus, recent files, layout saving: unchanged (`tabController` untouched). |
| B4 | With a busy task (auto preview capturing), trigger each `checkDeviceStatus` entry point on the same machine: Go, Framing, a machine-menu action, a calibration dialog. | Yes/No prompt with the task's text. Yes → task aborted, action proceeds. No → action cancelled, task continues. | Busy on another machine → no prompt, task aborted, action proceeds. |
| B5 | No task busy; same entry points as B4. | No new prompt; existing `device_is_used` / kick / abort prompts unchanged. | Manual preview active → existing preview prompt first, as today. |
| B6 | Task running on A; open the monitor of B (select B), close it. | Within ~5 s of the last modal closing, the manager reselects A and the task resumes. | While the monitor is open, the task skips its ticks (no command reaches B). |
| B7 | Devtools: `backgroundTasks.list()`. | Rows `{ id, priority, running, device, busy }` for every registered task, highest priority first. | — |

---

## 6. Must not change

- `helpers/device/promark/promark-button-handler.ts` (becomes a task; requirements, device selection, and GoButton feed move to the manager)
  - `handleExportClick.ts:44,66` `setStatus('preparing')` / `handleTaskFinish()` — same effect.
  - `exportTask.ts:131` `setStatus('uploading')` — same effect.
  - `MonitorContext.tsx:1002,1017` `setStatus('listening')` — same effect.
  - Physical-button behaviour in B1/B2 — identical, including frame-first counting and the 200 ms interval.
- `app/actions/beambox/beambox-init.ts` (constructor calls `registerPromarkButtonHandler()`)
  - Every other startup registration — unchanged, same order.
- `app/components/beambox/TopBar/GoButton.tsx` (the effect now calls `backgroundTasks.setDevice(selectedDevice)` instead of `promarkButtonHandler.onContextChanged(mode, selectedDevice)`; mode comes from the store)
  - Go click, F2 shortcut, `setExportFn` — unchanged.
  - `GoButton.spec.tsx` — mocks the manager and expects `setDevice(selectedDevice)`.
- `helpers/check-device-status.ts` (one block after the manual-preview block, delegating to the manager)
  - All 21 callers — with no busy task, identical behaviour, including `device_is_used`, kick, abort, quit and `device_busy`.
  - `preview-mode-controller.ts:85` — manual preview start now also stops a busy task on the same machine (after a prompt); intended.
- `app/contexts/DialogContext.tsx`, `app/contexts/AlertProgressContext.tsx`, `app/actions/dialog-caller.tsx` (new any-open query)
  - `dialogCaller.isIdExist`, `alertCaller.checkIdExist`, `progressCaller.checkIdExist` — unchanged.
- `helpers/device-master.ts` (`select(device, { silent })`, default `false`; silent skips the "connecting" progress, the connection-error alert and the password dialog)
  - Every foreground caller (`checkDeviceStatus`, `getControl` → `reconnect`, `get-device`, framing, calibration, firmware update, …) — no option passed, same progress, alerts and password dialog.
- `app/actions/tabController.ts` — **not modified**; the manager reads `isFocused` and subscribes to `onFocused` / `onBlurred` like the Promark listener does today. Web visibility is handled inside the manager (§7.5), so `beambox-global-interaction`, `Tabs`, `TabRecentFiles`, `ai-extension`, dockable layout saving and `fileImportHelper` see no change.

---

## 7. Design

### 7.1 Files

```
helpers/device/background/
  index.ts            // the `backgroundTasks` singleton
  types.ts            // BackgroundTask, BackgroundContext, BACKGROUND_TASK_PRIORITY
  canTouchMachine.ts  // shared pre-flight check
```

### 7.2 Task contract

```ts
interface BackgroundContext {
  device: IDeviceInfo | null; // selected in the top bar
  mode: CanvasMode;
  tabFocused: boolean;
  workarea: WorkAreaModel;    // document workarea
}

interface BackgroundTask {
  id: BackgroundTaskId;                           // key of BACKGROUND_TASK_PRIORITY
  models: ReadonlySet<WorkAreaModel>;             // machines it can run on
  isEnabled: (ctx: BackgroundContext) => boolean; // task-only rules: canvas modes, workarea rule, preferences
  start: (device: IDeviceInfo) => void;           // begin polling; the device is already selected
  stop: () => void;                               // stop polling; if busy, abort without waiting
  isBusy: () => boolean;                          // doing something a foreground action must not overlap
  abort: () => Promise<void>;                     // stop busy work and leave the machine clean
  busyMessage?: () => string;                     // prompt text; required when isBusy can be true
}
```

A task that is never busy (Promark) returns `false` from `isBusy` and makes `abort` a no-op.

**Registration**: each task module exports `register<Task>()`, which makes the task's own store subscriptions and calls `backgroundTasks.register(task)`; the `BeamboxInit` constructor (`app/actions/beambox/beambox-init.ts`) calls it once, next to the other startup registrations. Importing a task module has no side effects, so the startup list lives in one file and no import order can start or drop a task.

**Priority** lives in one table, not on the task, so the whole ordering is reviewed in one place and a new task cannot be added without choosing its rank:

```ts
// types.ts — higher wins when two tasks want the same machine
export const BACKGROUND_TASK_PRIORITY = {
  'promark-button': 20,          // the user pressed a physical button
  'auto-full-area-preview': 10,  // convenience; may always yield
} as const;
export type BackgroundTaskId = keyof typeof BACKGROUND_TASK_PRIORITY;
```

Values are spaced by 10 so a new task can slot between two existing ones without renumbering. Equal priorities are not allowed (unit test).

### 7.3 Manager

```ts
backgroundTasks.register(task): void
backgroundTasks.refresh(): void               // a task's own setting changed
backgroundTasks.yieldTo(device): Promise<boolean>  // called by checkDeviceStatus
backgroundTasks.isCurrent(task): boolean      // current device is the task's device
backgroundTasks.list(): Array<{ id; priority; running; device; busy }>  // highest priority first
```

**Context**: `device` is fed by `GoButton`'s effect on `CanvasContext.selectedDevice` (`backgroundTasks.setDevice`), which also sees the startup default that never goes through `SET_SELECTED_DEVICE` (§2.3). The manager subscribes itself to `useCanvasStore` `mode`, `useDocumentStore` `workarea`, and tab focus (§7.5).

The subscriptions are made on first use (first `register`, `setDevice` or `refresh`), not at import: `check-device-status.ts` imports the manager, and reading `tabController` or the stores while an import cycle is still loading would see `undefined`.

**Evaluation** on every context change and `refresh()`:

```
for task in priority order (highest first):
  want = ctx.device && ctx.tabFocused && task.models.has(ctx.device.model) && task.isEnabled(ctx)
  if want and a higher-priority task already wants ctx.device → want = false; console.warn once
  if want and not running → select(ctx.device) if not current; task.start(ctx.device)
  if !want and running   → task.stop()
```

**Two meanings of "selected".** The *target* machine of every task is the one the user selected in the top bar (`ctx.device`, from `SET_SELECTED_DEVICE`). `deviceMaster.select()` only decides which machine the shared control connection currently talks to; foreground flows call it for other machines (the monitor of B opened from the menu) without changing the top bar. Tasks follow the top bar, never `deviceMaster`'s current device.

**Device ownership**: only the manager calls `deviceMaster.select` for a task. Before each tick a task calls `backgroundTasks.isCurrent(this)` and skips the tick when false. When a running task's device is not current, or is current but has no control socket (`currentControlMode === null`: never connected after a reload, dropped, or kicked), the manager selects it once every `RESELECT_MS = 5000` as long as no modal is open, manual preview is off, the other machine is not in a sub-task (`!deviceMaster.currentControlMode`) — that is, when no foreground action can be using it — and the top-bar machine is in `deviceMaster.getAvailableDevices()`. Every manager select (this one and `startTask`'s) passes `{ silent: true }`: the user did not ask for it, so a failure must not show the "connecting" progress, #891/#892 or the password dialog — without it an unreachable machine popped an alert every 5 s. The online check skips pointless attempts. A failed select is retried on the same schedule. Tasks never reconnect themselves: with no socket they skip their tick (a command would go through `getControl()` → `reconnect()`, which is not silent) and wait for this.

**Foreground yield**: `checkDeviceStatus` adds, right after the manual-preview block:

```ts
if (!(await backgroundTasks.yieldTo(device))) return false;
```

`yieldTo(device)`: for each busy task — on another device: `await task.abort()`; on the same device: Yes/No prompt with `task.busyMessage()`, Yes → `await task.abort()`, No → return `false`. No busy task → `true` immediately. Tasks that are merely polling keep polling; the foreground action's own dialog or sub-task then holds them off through `canTouchMachine`.

### 7.4 `canTouchMachine(task)`

The shared pre-flight check a task runs before it starts busy work (it is not a tick gate; Promark's button poll does not use it):

```ts
!hasAnyModal() &&
!previewModeController.isPreviewMode && !previewModeController.isStarting &&
deviceMaster.currentControlMode === '' &&   // sub-task, or null = no socket: wait for the manager's silent reconnect
backgroundTasks.isCurrent(task) &&
(await deviceMaster.getReport()).st_id === DeviceConstants.status.IDLE
```

When it returns false it logs the first failing check (`[backgroundTasks] <task> cannot touch machine: modal=true`, `controlMode=no socket`, `st_id=…`), so a skipped run can be explained from the console on a test machine.

`hasAnyModal()`: `DialogContext.tsx` answers a new `CHECK_ANY_DIALOG` event with `dialogComponents.length > 0`; `AlertProgressContext.tsx` answers `CHECK_ANY_ALERT_PROGRESS` with `alertProgressStack.length > 0`; `dialogCaller.hasAnyModal()` ORs both. Same emitter pattern as `CHECK_ID_EXIST` (`DialogContext.tsx:31-33,46`).

### 7.5 Tab focus

`ctx.tabFocused` is `tabController.isFocused` on Electron (updated through `onFocused` / `onBlurred`) and `document.visibilityState === 'visible'` on web (updated through the manager's own `visibilitychange` listener). `tabController` itself is not changed: making it emit focus events on web would also re-attach menus and refetch recent files on every tab switch (§2.3). The Promark listener's `isWeb() ||` special case goes away; on web it now pauses in a hidden tab.

### 7.6 Promark migration

| Today (`promark-button-handler.ts`) | After |
|---|---|
| `requirements.context`: mode Draw/PathPreview + Promark device | `models = promarkModels`; `isEnabled`: `mode ∈ {Draw, PathPreview}` |
| `requirements.workarea` | `isEnabled`: `promarkModels.has(ctx.workarea)` |
| `requirements.enabled` | `isEnabled`: `useDocumentStore.getState()['promark-start-button']`; its subscription calls `backgroundTasks.refresh()` |
| `shouldFrameFirst` + `frame-before-start` subscription | read `useDocumentStore.getState()['frame-before-start']` at the press |
| `requirements.tab` | manager (`ctx.tabFocused`) |
| `startListening` select | manager |
| `onContextChanged(mode, device)` via `GoButton.tsx:38-40` | GoButton's effect calls `backgroundTasks.setDevice(device)`; mode from the store |
| `checkButton` tick | unchanged, plus `if (!backgroundTasks.isCurrent(this)) return;` |
| `setStatus`, `handleTaskFinish`, `setExportFn` | unchanged public API |
| — | `isBusy = () => false`, `abort = async () => {}`, priority 20 |
| registered as a side effect of the first import | `registerPromarkButtonHandler()` (subscription + `register`), called once from `BeamboxInit`; importing the module has no side effects |

The file stays in `helpers/device/promark/`; only its wiring changes. Every task registers this way (§7.2).

---

## 8. Data contracts

None persisted. The task contract in §7.2 is the only interface.

---

## 9. Rollout (PR plan)

One PR, merged before the auto-preview PR, in reviewable chunks:

1. `background/` manager, types, `list()`; Promark migrated; GoButton effect feeds the manager. Behaviour-neutral.
2. `hasAnyModal()`, `canTouchMachine`.
3. `checkDeviceStatus` → `yieldTo`. No member is ever busy yet, so behaviour-neutral until auto preview lands.
4. `background-tasks` skill (contract, rules, how to add a task).

---

## 10. Open decisions

1. ~~Own PRD or a section of the auto-preview PRD~~ → own PRD (2026-10-30).
2. ~~Migrate Promark now~~ → yes, with `isBusy = false`; a second member proves the contract (2026-10-30).
3. ~~Two tasks on the same machine~~ → explicit priority in one table, `BACKGROUND_TASK_PRIORITY` (§7.2); the loser is stopped, aborted if busy (2026-10-30). Registration order rejected: it depends on import order.
4. ~~Reselecting after a foreground action switched `deviceMaster`'s current device to another machine~~ → the manager `deviceMaster.select`s the top-bar machine again every 5 s once quiet, and tasks resume (2026-10-30, §7.3). The top-bar selection is the target; a foreground flow on another machine is temporary. "Never reselect" rejected: tasks would stay paused until an unrelated action happened to select the top-bar machine. Losing the socket of the same machine (kick, network drop, or never connected after a reload) is covered by the same timer with a silent select (2026-11-03; `getControl()`'s reconnect was not silent and a task polling through it popped #892 every few seconds); a foreground sub-task on the same machine is waited out by the `currentControlMode` tick check and `canTouchMachine`.
5. ~~Separate PR or first chunks of the auto-preview PR~~ → separate prerequisite PR, merged before auto preview (2026-10-30, §9).

---

## 11. Risks & follow-ups

- **R1 Promark regression.** The listener controls job start on Promark; a wiring mistake stops the physical button. Mitigation: chunk 1 is behaviour-neutral and covered by B1/B2; a Promark machine test before merge.
- **R2 Reselect fights the user.** If the "quiet" check misses a foreground flow that switched machines without a modal or sub-task, the manager could switch back under it. Mitigation: 5 s interval, and every foreground machine action goes through `checkDeviceStatus` first; list any exception found in §6.
- **R3 Web tab focus change.** Background tasks on web, Promark included, pause in hidden tabs from now on. Accepted; nothing outside the manager changes.
- **F1 Tick helper.** If a third task appears with the same `setInterval` + skip-while-pending + `isCurrent` boilerplate, add `backgroundTasks.every(task, ms, fn)`.
- **F2 Read-only tasks in parallel.** Today every task is treated as exclusive: one per machine, decided by priority. That is right for tasks that hold resources, but a future read-only poller (usage counters for maintenance reminders, temperature or water-cooling monitoring, firmware notices) would needlessly push out, or be pushed out by, auto preview. When the first such task appears: add `exclusive?: boolean` (default `true`) to the task contract; only exclusive tasks take part in the `claimedBy` priority claim in `refresh()`, read-only ones run alongside; `yieldTo` needs no change (a read-only task's `isBusy` is always `false`); add a spec with one exclusive and one read-only task on the same machine. Control-socket commands from parallel tasks are already serialised by `addTask`. **Rule of thumb**: a task is exclusive if it enters raw mode, moves the head, changes camera settings, or starts an action on the machine (Promark counts: its button starts an export); otherwise it is read-only. Not built now: no read-only task exists to verify it, and all-exclusive is the safe default (worst case one task waits, never two collide).

---

## 12. Test plan

Hardware-free (Jest, `unit-test` skill):

- `background/index.spec.ts`: start/stop for each context field; `models` filter; `isEnabled` false stops; priority exclusivity (higher wins, loser stopped or aborted, warning); no two equal priorities in `BACKGROUND_TASK_PRIORITY`; `refresh()` re-evaluates; `yieldTo` with no busy task, busy on same device (Yes/No), busy on another device; reselect only when quiet, at most every 5 s, always `silent`; silent reconnect of the top-bar machine when its socket is gone; `list()` rows.
- `canTouchMachine.spec.ts`: each condition false → false.
- `promark-button-handler.spec.ts` (new): isEnabled mapping from §7.6; tick skipped when not current; existing press/frame-first counting unchanged.
- `check-device-status.spec.ts`: `yieldTo` false → returns false before the status switch; true → existing flow.
- `GoButton.spec.tsx`: mocks the manager, expects `setDevice(selectedDevice)`.
- Web focus in `background/index.spec.ts`: `visibilitychange` to hidden stops tasks, back to visible restarts them; Electron path uses `tabController` events.

Hardware (pending a machine; map to §5): Promark B1, B2, B6. B4/B5 with the auto-preview companion on fbm2.
