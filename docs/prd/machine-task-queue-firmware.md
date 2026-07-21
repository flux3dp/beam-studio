# PRD (Firmware): Machine Task Queue — minimal contract

| | |
|---|---|
| **Status** | Draft |
| **Author** | Product (AI PM agent) |
| **Created** | 2026-07-01 |
| **Target** | FLUX machine **firmware** — storage-capable models (Ador `ado1`, Beambox II `fbb2`, beamo II `fbm2`, HEXA `fhexa1`, HEXA RF `fhx2rf`, Promark `fpm1`) |
| **Owner area** | Machine firmware — task execution & storage |
| **Companion PRD** | [Work Manager (software)](work-manager.md) — the Beam Studio side that consumes this contract (§7.6) |
| **Scope note** | This document specifies the **firmware contract only**. It is deliberately **additive and minimal**; the software ships and works **without** it (app-side-only queue) and lights up the machine-backed behavior when a machine advertises support. |

---

## 1. Summary

Add a **minimal, persistent, id-addressed task queue** to machine firmware so Beam Studio's Work Manager can offer a robust *machine-backed* queue: queued tasks **survive the controlling PC disconnecting or closing**, can be **started from the machine**, and report **exact status** back to any PC that reconnects.

The contract is intentionally small: a **persistent list + run-one-at-a-time + a bounded run history**, all keyed by a **client-supplied task id** the firmware stores and echoes but never interprets. No scheduler intelligence, no rich panel UI, no cloud. It is **purely additive** and **version-advertised** — old firmware keeps working unchanged, and Beam Studio detects support and falls back gracefully (Work Manager PRD §7.6.4).

## 2. Background & why this is needed

- Today firmware either runs an uploaded FCode from RAM (`go`) or runs a stored file (`goFromFile`), and clones a run task into a Recents store that **renames** it (`recent-1.fc`, `recent-2.fc`, …). After a disconnect a controlling PC therefore **cannot tell whether a specific queued task ran** — names and layers repeat across sends, and the id is lost on rename. (Full analysis: Work Manager PRD §7.6.)
- **Software iterates fast; firmware ships slowly and users may not upgrade** even when a release is reliable. So this contract must be *optional*: the software runs on old firmware unchanged, and only uses this when present.
- The single missing primitive is **task identity the firmware preserves, plus status readable by that identity**. Everything else the software already does.

## 3. Goals & non-goals

### Goals
- **G1.** Persist an ordered **queue** of tasks keyed by a **client-supplied id**, across power cycles.
- **G2.** Run **one task at a time**; expose the current task **by id** with progress.
- **G3.** Keep a **bounded, persistent run history** keyed by id (result + timing).
- **G4.** Allow the queue to be started **(a)** by the controlling software and **(b)** from the machine itself (a minimal "start next").
- **G5.** **Advertise capability** via firmware version / feature flag; remain backward compatible.

### Non-goals (keep firmware minimal)
- Scheduling intelligence, priorities, or inter-task dependencies.
- **Auto-advance** between jobs (optional, later phase; default is manual start).
- A rich on-panel queue-management screen (reorder / thumbnails / per-item detail) — later phase (F2).
- Any **host / user / multi-tenant** concept — the software encodes the host in the id (Work Manager PRD §7.6.3); firmware treats the id as opaque.
- Cloud, remote access, or notifications.
- Any change to the existing single-run (`go`) path.

## 4. Design principles

1. **Client-supplied opaque ids** — firmware stores and echoes them; never parses, never derives paths from them.
2. **Consume-on-run + log-by-id** — the one load-bearing behavior (see §7). When a task runs, it leaves the queue and lands in history *under the same id*.
3. **Additive & capability-gated** — new opcodes only; old clients unaffected; support advertised by version.
4. **Bounded & explicit** — hard caps on queue size/bytes/history; every limit returns a clear error, never a silent drop.
5. **Durable & deterministic** — persist across reboot/power-loss with a defined recovery.

## 5. On-device data model

**Queue entry**

| Field | Req | Type | Notes |
|---|---|---|---|
| `id` | ✓ | string (≤ `ID_MAX`, e.g. 64) | Client-supplied, opaque, unique. |
| `name` | ✓ | string | Display label for the panel. |
| `fcode` | ✓ | blob | The task payload (uploaded with the entry). |
| `est_time` | – | int (s) | Estimated duration, for display. |
| `thumb` | – | small image | Optional preview (see O4). |
| `enqueued_at` | ✓ | epoch | Set by firmware. |
| `order` | ✓ | int | Run order; mutable via `queue.reorder`. |

**History entry** (persistent **ring buffer**, size `HISTORY_MAX`, e.g. 50)

| Field | Req | Type | Notes |
|---|---|---|---|
| `id` | ✓ | string | Same id the task was queued with. |
| `name` | ✓ | string | |
| `result` | ✓ | enum | `done` \| `failed` \| `aborted` \| `canceled`. |
| `started_at` / `ended_at` | ✓ | epoch | |
| `error_code` | – | string/int | On `failed`. |

**Current**: `{ id | null, progress 0..1 }` — progress is already in the periodic report; add the id.

**Caps** (per-model constants): `QUEUE_MAX` (e.g. 50 entries), `QUEUE_BYTES_MAX` (device-dependent), `HISTORY_MAX` (e.g. 50), `ID_MAX`.

## 6. Interface (operations + report)

Extend the existing control channel with new opcodes (names illustrative). FCode upload reuses today's upload framing, bound to the entry's `id`.

| Op | Request → Response | Errors |
|---|---|---|
| `queue.push` | `{ id, name, est_time?, thumb? }` + fcode → `ok` | `ERR_FULL` (queue/bytes cap), `ERR_ID` (bad id). **Idempotent on `id`** (replace payload/meta; never duplicate). |
| `queue.list` | → `{ current:{id,progress}\|null, items:[{id,name,order,est_time,enqueued_at}], history:[{id,name,result,started_at,ended_at,error_code?}], rev }` | — |
| `queue.remove` | `{ id }` → `ok` | `ERR_RUNNING` (is current), `ERR_NOT_FOUND` |
| `queue.reorder` | `{ ids:[…] }` → `ok` | unknown ids ignored |
| `queue.start` | `{ id? }` → `ok` (starts given, else head) | `ERR_BUSY` (already running), `ERR_NOT_FOUND` |
| `queue.fetch` *(optional, O3)* | `{ id }` → fcode | `ERR_NOT_FOUND` |
| `queue.setMode` *(optional, deferred)* | `{ auto_advance:bool }` → `ok` | default `false` |

**Report / streaming additions:** `current_task_id`, and a **monotonic `rev`** bumped on any queue/history/current mutation. `rev` lets a client poll cheaply — it only re-`list`s when `rev` changes.

## 7. Behavior / state machine

- **Enqueue** — `push` → entry stored `queued`, appended to `order`; `rev++`.
- **Start (manual)** — app *or* panel calls `queue.start`; if **idle**, firmware moves the task **queue → current** and runs it on the existing execution path; if busy → `ERR_BUSY`.
- **Completion** — on finish / failure / abort: append a **history** entry `{id, result, timing}`, **remove the task from the queue**, set `current=null`, `rev++`. *(This is consume-on-run + log-by-id — the behavior that makes the software's reconciliation exact.)*
- **Cancel queued** (not running) — `remove`.
- **Power loss mid-run** — on next boot, if a task was `current` and did not complete → append history `{result: aborted, error_code: power_loss}` (see O2), clear `current`; the **queue persists**. Deterministic recovery.
- **Idempotent push** — `push` with an existing `id` replaces its payload/meta; never creates a duplicate.
- **Concurrency** — app and panel may both call `start`; firmware **serializes** (one wins, the other gets `ERR_BUSY`).
- **Storage full** — `push` → `ERR_FULL`; the client keeps the task in its own app-side queue and surfaces the condition.
- **History overflow** — ring buffer evicts the oldest entry.

**Minimal panel affordance (F1, required but minimal):** the panel shows **"Queue: N"** and a **Start next** action that runs the head task. That single control delivers the offline "run from the machine while the PC is closed" payoff. A full queue-management screen (reorder, per-item progress, thumbnails) is **F2 / out of scope** here.

## 8. Versioning & compatibility (the load-bearing compat story)

- **Advertise support** in device info / report — a firmware version bump **and** a capability flag, e.g. `caps: ["task_queue_v1"]`.
- **Old firmware** simply lacks the opcodes and the flag; Beam Studio detects absence (via `VersionChecker` / `caps`) and uses **app-side-only** behavior (Work Manager PRD §7.6.4). New opcodes are additive, so old clients never call them.
- **All four combinations work:** old sw / old fw, new sw / old fw (Tier 1), old sw / new fw (ignores the queue), new sw / new fw (Tier 2). No lockstep upgrade is ever required.
- The contract itself is **versioned** (`task_queue_v1`). Later additions (`setMode`/auto-advance, `fetch`, richer panel) bump the minor version without breaking `v1` clients.

## 9. Reliability, limits & security

- Persist queue + history to non-volatile storage; survive reboot and power loss (§7).
- Enforce `QUEUE_MAX` / `QUEUE_BYTES_MAX` / `HISTORY_MAX`; return explicit errors, never silent truncation.
- Treat `id` as **opaque**: cap length, sanitize for storage, and **never** interpret it as a filesystem path or command.
- No new network surface beyond the existing, already-authenticated control channel.

## 10. Acceptance criteria

1. `push` N tasks → `queue.list` shows N `queued`, `rev` incremented per push.
2. `queue.start` → `current_task_id` set, progress reported; task no longer in `items`.
3. On completion → task appears in `history` **by its id** with correct `result`/timing and is gone from `items`.
4. **Disconnect during or after a run, then reconnect** → `list` + `history` reflect true status **by id** (the offline case).
5. Two tasks with **identical name/payload but different ids** are tracked independently end-to-end.
6. **Power-cycle mid-run** → deterministic recovery per §7; queue intact.
7. `queue.push` when full → `ERR_FULL`; `remove` of the running task → `ERR_RUNNING`; duplicate `push` is idempotent.
8. Panel **Start next** runs the head task and updates `current`/`rev`.
9. A machine **without** the capability flag is never sent queue opcodes by an up-to-date client.

## 11. Rollout

- **Phase F1 (this PRD):** `task_queue_v1` — data model, ops, report fields, consume-on-run history, minimal panel **Start next**. Ships on capable models.
- **Phase F2:** `queue.setMode` (auto-advance) with an on-device **bed-cleared confirmation**; a full panel queue screen (reorder, thumbnails, per-item progress); optional `queue.fetch`.

The software ships **Tier 1 independently**; **Tier 2** lights up per-machine as F1 firmware reaches the field. Because users upgrade firmware slowly, expect a long period where both tiers are live across a customer's fleet — the software handles this per-machine by version.

## 12. Interface summary (mirrors Work Manager PRD §7.6.1)

`queue.push(id, name, est_time?, thumb?)+fcode` · `queue.list → {current, items, history, rev}` · `queue.remove(id)` · `queue.reorder(ids)` · `queue.start(id?)` · *(opt)* `queue.fetch(id)` · *(opt/deferred)* `queue.setMode(auto_advance)` · report adds `current_task_id` + `rev`.

## 13. Open questions

- **O1.** `QUEUE_MAX` / `QUEUE_BYTES_MAX` / `HISTORY_MAX` per model (storage-dependent).
- **O2.** Power-loss mid-run: record as `aborted` or a distinct `unknown`? *(Recommendation: `aborted` + `error_code: power_loss` — the software can present it plainly.)*
- **O3.** Include `queue.fetch` in F1 (lets a second PC rehydrate its view of another PC's queued task) or defer to F2? *(Recommendation: defer — the software can display foreign items from `queue.list` without the payload.)*
- **O4.** Store a `thumb` on-device in F1 (nice panel preview, costs storage) or defer? *(Recommendation: optional/off in F1.)*
- **O5.** Does the minimal panel **Start next** belong in F1? *(Recommendation: yes — it is the offline-run payoff and is intentionally tiny.)*
