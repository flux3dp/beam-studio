---
name: background-tasks
description: Background machine tasks — the backgroundTasks manager that runs features polling the selected machine while the user is idle (Promark start button, auto full-area preview). Use when adding a background task, debugging one that does not start or polls the wrong machine, or touching checkDeviceStatus's yield, BACKGROUND_TASK_PRIORITY, or canTouchMachine.
---

# Background tasks

Manager: `packages/core/src/web/helpers/device/background/index.ts` (`backgroundTasks` singleton)
Contract + priority table: `helpers/device/background/types.ts`
Pre-flight check: `helpers/device/background/canTouchMachine.ts`
Members: `helpers/device/promark/promark-button-handler.ts` (more as they land)
Design and decision log: `docs/prd/background-tasks.md`

## Model

A **task** polls the machine on its own timer; the **manager** decides when it runs and on which machine.

- **Target machine** = the one selected in the top bar. `GoButton.tsx` feeds it via `backgroundTasks.setDevice(selectedDevice)` from `CanvasContext`. The startup default is set straight into the context (`TopBar.tsx`), never through `SET_SELECTED_DEVICE`, so a listener on that event alone misses it.
- **`deviceMaster.select()`** only points the one shared control connection at a machine. Foreground flows point it elsewhere (monitor of another machine from the menu) without touching the top bar. Tasks follow the top bar; the manager points `deviceMaster` back every 5 s once quiet and the machine is discovered, and reconnects it the same way when its socket is gone (after a reload, a drop or a kick).
- **Context** (`device`, `mode`, `workarea`, `tabFocused`) is subscribed on first use, not at import: `check-device-status.ts` imports the manager, and an import cycle can expose half-loaded modules. Web focus comes from `visibilitychange` inside the manager; `tabController` stays untouched (making it emit on web re-attaches menus and refetches recent files).
- **Exclusive**: one task per machine. Tasks are evaluated highest priority first; the first that wants the machine claims it, the rest are stopped (aborted if busy). Stops happen before starts in one `refresh()`.

## Adding a task

1. Add its id and rank to `BACKGROUND_TASK_PRIORITY` (spaced by 10, no ties). The id type comes from this table, so the rank is chosen up front.
2. Implement `BackgroundTask`: `models`, `isEnabled(ctx)` with only the task's own rules (canvas modes, workarea rule, preferences), `start(device)` / `stop()` for its timer, `isBusy()`, `abort()`, and `busyMessage()` if it can be busy.
3. Export a `register<Task>()` that subscribes to the task's own settings (calling `backgroundTasks.refresh()` on change) and calls `backgroundTasks.register(task)`; call it once from the `BeamboxInit` constructor (`app/actions/beambox/beambox-init.ts`). Importing the task module must have no side effects.
4. In each tick, return early unless `backgroundTasks.isCurrent(this)`; before busy work (raw mode, moving the head, capturing), require `await canTouchMachine(this)`.
5. Done when: the task starts and stops with every context field, a foreground action on the same machine shows its `busyMessage` while busy, and `backgroundTasks.list()` shows it with the right priority.

## Rules

- **Busy** means work a foreground action must not overlap. While busy, `getDevice` and then `checkDeviceStatus` → `yieldTo(device)` ask the user on the same machine (No cancels the action; the prompt closes itself and the action continues if the task finishes first) and abort silently on another machine; `getDevice` goes first because its `endSubTask` would otherwise break a raw-mode capture before the prompt. A task that never blocks (Promark: its button export is itself a foreground action) returns `false`.
- Only the manager calls `deviceMaster.select` for a task.
- `deviceMaster.currentControlMode` is `''` when the socket is usable, a mode name in a sub-task, and `null` with no socket. A task polls only on `''`: with `null`, any command goes through `getControl()` → `reconnect()`, which shows the connecting progress and #891/#892 on failure, every tick. Leave reconnecting to the manager.
- Background code calls `deviceMaster.select(device, { silent: true })` (no progress, no connection-error alert, no password dialog); a plain `select()` is for user actions only.

## Debugging

`backgroundTasks.list()` in devtools: `{ id, priority, running, device, busy }`, highest priority first. A task that should run but does not: check `running` (context or `isEnabled` false, or a higher task claimed the machine — a one-time console warning names both), then `isCurrent` (deviceMaster on another machine, reselect waiting for quiet). `canTouchMachine` logs the first check that failed (`cannot touch machine: controlMode=no socket`, `modal=true`, `st_id=…`).

Read-only tasks running in parallel are a planned extension (`exclusive?: boolean`), PRD §11 F2.
