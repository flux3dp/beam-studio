# PRD: Error Report Upload (inline consent on error popups)

| | |
|---|---|
| **Status** | In review — PR 1 (#1021) merged 2026-10-19; PRs 2–5 combined in #1028 (opened 2026-10-20); flux-id #683 merged 2026-10-19, DevTools integration acceptance passed 2026-10-27 (scope in §13); production error-entry smoke tests remain unverified manually |
| **Author** | Product (zh-tw source PRD v1.1) + engineering scoping |
| **Created** | 2026-10-06 |
| **Revised** | 2026-10-27 (DevTools integration acceptance recorded); 2026-10-20 (status and §10 after #1021 / #683 merged and #1028 opened); 2026-10-14 (§7.4 wired and corrected while building steps 3–5; 2026-10-08 full error-site sweep, D4 settled; D1–D5 on 2026-10-06, see §11) |
| **Tracking** | ClickUp: TBD (attach the zh-tw source PRD v1.1 there; it is intentionally not in this repo) |
| **Translation** | [繁體中文版](error-report-upload.zh-tw.md) — English is the source of truth; regenerate the translation when a section changes |
| **Companion PRD** | [Error Report Upload — flux-id backend](backend.md): endpoint, storage alias, folder cap, dedupe, lifecycle, impact matrix (owned by the flux-id repo) |
| **Target product** | Beam Studio (desktop + web; device log half is desktop-first, see §7.3) |
| **Owner area** | Diagnostics / alerts / privacy settings |
| **Related code** | Report body: `packages/core/src/web/helpers/output-error.ts`; legacy uploads to replace: `packages/core/src/web/helpers/aws-helper.ts`, `output-error.ts` `uploadBackendErrorLog`; alert checkbox: `packages/core/src/web/app/components/dialogs/Alert.tsx:89-101,191-205`, `packages/core/src/web/interfaces/IAlert.d.ts`; error popup sites: `packages/core/src/web/app/contexts/MonitorContext.tsx:598-633`, `packages/core/src/web/helpers/websocket.ts:28-52`, `packages/core/src/web/helpers/device-master.ts:580` `popConnectionError`, `packages/core/src/web/app/actions/beambox/export-funcs.ts:257,315,503`, `export-funcs-swiftray.ts:89`, `packages/core/src/web/app/svgedit/operations/import/importSvg/utils/uploadAndDivideSvg.ts:31`; device log: `packages/core/src/web/helpers/device-master.ts:1067` `getLogsTexts`; preference: `packages/core/src/web/app/constants/storageConstants.ts`, `packages/core/src/web/interfaces/IStorage.d.ts`, `packages/core/src/web/app/components/settings/categories/Privacy.tsx`; machine id seam: `packages/core/src/web/interfaces/IOperatingSystem.ts`, `apps/app/src/implementations/os.ts`, `apps/web/src/implementations/os.ts` |
| **External repos** | flux-id (implements [backend.md](backend.md)); fluxghost (backend log content, read-only dependency) |

---

## 1. Summary

When a whitelisted error popup appears, Beam Studio offers to send a diagnostic bundle (software bug report + device system log) to FLUX, filed by device serial number. Consent is an **inline checkbox inside the existing error alert**, never a second dialog. A three-state preference (Always / Ask each time / Never) controls whether the checkbox shows, uploads silently, or nothing happens. The two existing copy-pasted direct-to-S3 uploads are replaced by this one path.

## 2. Background & current state

- Two uploads exist today, both `PUT` straight from the client to the public bucket `beamstudio-bug-report`:
  - `helpers/aws-helper.ts` `uploadToS3(fileName, body)` sends the scene SVG on export failure (`#806`, `export-funcs.ts` ×3, `export-funcs-swiftray.ts`) and import failure (`#809`, `uploadAndDivideSvg.ts`). Its URL is the literal string `.../svg&bvg/reportName` (the `${}` is missing), so every upload overwrites the same object key.
  - `helpers/output-error.ts` `uploadBackendErrorLog()` sends the bug report when fluxghost fails to connect (`websocket.ts` `popBackendErrorAlert`, error `#802`).
- `output-error.ts` `getOutput()` already builds the software bug report: OS/arch/user-agent, discover device list, fluxghost log file, websocket log, swiftray log, full `storage` dump (rsa key hidden), generic error log, print-and-cut report.
- `MonitorContext.tsx:625` already offers a "Bug Report" button on device errors that downloads `getOutput()` plus `DeviceMaster.getLogsTexts(['playerd.log'|'fluxplayerd.log', 'fluxrobotd.log'])` to a local file. That is the device system log source.
- `IAlert.checkbox` (`Alert.tsx:191-205`) renders a checkbox under the message and, with `alwaysTriggerCheckboxCallbacks` (default `true`), runs its callback on **any** button. This is the PRD's §3.5 behaviour (Cancel still uploads) with no new UI.
- Preferences follow the `enable-sentry` pattern: key in `storageConstants.ts:20` and `IStorage.d.ts:39`, switch in `Privacy.tsx` via `useSettingStore` `getConfig/setConfig` (values are `any`, so a string enum is fine) and `SettingSelect` from `settings/shared`.
- Backend client: `axiosFluxId` (`helpers/api/flux-id/base.ts:50`, host `id.flux3dp.com`). `id.flux3dp.com` is already proxied by Cloudflare (DNS on `art.ns.cloudflare.com`, A records in 104.26.x.x), so a WAF rate-limit rule on the new path needs no new account.
- flux-id (`../flux-id`): Django 4.2.27, DRF 3.16, `django-storages` + `boto3` already in use (`fluxid/common/storage.py`), gunicorn sync workers `2 × cpu + 1` (`nginx/gunicorn.conf.py`), nginx `client_max_body_size 32M` (`nginx/site.conf.template:23`), a `StatsdMiddleWare` in `fluxid/middleware.py` that is dead code (no `STATSD_HOST`, no receiver; verified 2026-10-12). Box: Linode dedicated 4 vCPU / 8 GB / 160 GB shared with mysql, redis, celery and nginx (`compose.deploy.yml`).

## 3. Goals & non-goals

**Goals**
- G1 One upload path, one function, replacing `aws-helper.ts` and `uploadBackendErrorLog`.
- G2 Consent inline in the existing alert; primary buttons unchanged in label and position.
- G3 Three-state preference, default **Ask each time**, always visible in Settings → Privacy.
- G4 Report is scrubbed of personal data before automatic upload (§7.2); wording in the consent row is truthful.
- G5 Per-serial daily throttle (10 successful uploads/day, local time) and up to 3 in-process attempts, retrying only when there was no response or a 5xx.

**Non-goals**
- No offline persistent queue in v1 (§11 D2, decided).
- No change to the manual Help → Bug Report download (`menuActions.ts:64`) or the Monitor "Bug Report" download button; both stay as the un-scrubbed, user-inspectable path.
- 180-day retention, per-serial cap, remote-adjustable throttle: flux-id / R2 concerns, out of this repo (§7.5).
- No new error popups; only decorate existing ones.

## 4. Scenarios

- **S1 Ask (default), user ticks, presses Retry/Confirm/Cancel** → alert closes as before; upload runs in the background; a neutral toast "Thanks! Diagnostic data sent." on success. First success without a scene and with no preference chosen → one-time prompt "Send automatically?" with [Ask each time] / [Always send], Always primary on the right (alert convention).
- **S2 Ask, user leaves unticked** → nothing uploaded, no toast, no prompt.
- **S3 Always (without a scene)** → no checkbox; upload starts when the alert opens; one line of small grey text at the bottom "Diagnostic data sent automatically".
- **S4 Never** → alert identical to today.
- **S5 Daily limit reached** → checkbox hidden (Ask) or no upload and no status line (Always); a local "skipped (daily limit)" entry is appended to the generic logger.
- **S6 Machine connection error** → bundle contains the bug report only. `CONNECTION_*`, `#810`, `#805` and `#850` explicitly pass `includeDeviceLog: false`, even if the machine reconnects before consent. Known serial, firmware and device throttle are retained; device logs are skipped, not failed. Two sub-cases: `#802` backend alert has no device at all (files under `no-device/{installation_id}/`); `popConnectionError` (`device-master.ts:580`) fires after a failed `select`, so `deviceInfo` with serial and firmware version is known from discovery even though no control socket exists (files under `{serial}/`).
- **S7 Export/import failure** (`#806`/`#809`) → reports with `scene` require explicit consent under both Ask and Always, using an unchecked design-file checkbox. Never suppresses both the question and upload. Throttle still applies; ticking sends diagnostics and the scene SVG / imported file together, with `device: null`. Success never offers automatic uploads.
- **S8 Upload fails 3 times** → silent; no error alert (the user already has an error to deal with). Logged to generic logger.
- **S9 Same error repeats** (user presses Retry five times on the same connection failure, or the same LAN problem recurs tomorrow) → only the first occurrence uploads; later ones are counted locally and the checkbox is hidden while the fingerprint cools down (§7.7). The next upload for that fingerprint carries `occurrences_since_last`, so frequency is not lost.

## 5. Acceptance criteria

| # | How to operate | Done when | Edge cases |
|---|---|---|---|
| A1 | Settings → Privacy. | A select "Error report upload" with Always / Ask each time / Never exists; default Ask; survives restart. | Value persisted under storage key `error-report-upload` as `'always' \| 'ask' \| 'never'`. |
| A2 | Set Ask. Trigger a non-hardware device error on the Monitor (e.g. a broken task file), or power-cycle the machine mid-connect to get `popConnectionError` (or any site in §7.4). | Existing alert shows with an unchecked checkbox above the buttons; button labels/order unchanged. | ALARM/FATAL single-button alert gets the same checkbox (PRD §3.7). |
| A3 | Tick, press Cancel. | Upload happens (network tab shows one request to the proxy); toast "Thanks! Diagnostic data sent." | Cancel and Retry behave identically for upload. |
| A4 | First successful upload without a scene under Ask. | One-time Always/Ask prompt; choosing Always flips A1's select. | Prompt never shows again: it writes `'always'` or `'ask'` into `error-report-upload`, and only the unset (`null`) value allows the prompt (§7.6). Dismissing with Escape stores nothing, so it may show after the next upload. |
| A5 | Set Always. Trigger an error without a scene. | No checkbox; grey status line at the bottom; request sent without user action. | Status line omitted when the daily limit is hit. |
| A6 | Set Never. | Alert pixel-identical to main. | — |
| A7 | Inspect the uploaded bug_report. | No `recent_files`, `auto-save-config`, `ador-backup-path`; no `/Users/<name>` or `C:\Users\<name>` anywhere (including the fluxghost log section); discover entries carry model, not user-given name. | Manual Help → Bug Report download is unchanged (still contains them). |
| A8 | Trigger 11 whitelisted errors in one local day under Always. | 10 requests sent; 11th shows no status line, generic log has a "skipped (daily limit)" entry; counter resets after local midnight. | Failed attempts do not count. Counter is per serial; connection errors with no device count under serial `none`. |
| A9 | Block the proxy host, trigger error under Always. | 3 attempts, then silence; no new alert. | — |
| A10 | Export with fluxghost returning an error (`#806`). | Same alert text as today, but with the consent checkbox instead of the Yes/No upload question; SVG included only after design-file consent (A13). | With or without a connected machine, serial is `none`, firmware version is empty, no system log is downloaded, and the no-device throttle applies. `aws-helper.ts` no longer exists; `uploadToS3` has no callers. |
| A11 | Under Always, trigger the same device error 5 times within an hour, then once the next day. | Exactly 1 request on day 1 (later alerts show no status line); day-2 alert sends 1 request whose `occurrences_since_last` is 4; a third day without change sends nothing (cooldown now 7 days). | A different `error_code`, a new app version, or a new firmware version starts a fresh fingerprint. Under Ask, the checkbox is hidden while cooling down, same as the daily limit. |
| A12 | With a connected idle machine, start `DeviceMaster.downloadLog('fluxrobotd.log', undefined, 10000)` and `DeviceMaster.getReport()` concurrently; repeat in reverse order. | Both complete; the second control request is sent only after the first completes. Log progress belongs to the download. | A queued download does not replace the active command's progress listener. A terminal log error releases the queue. An idle timeout closes that control connection and rejects the download and pending tasks with TIMEOUT; no next command is sent on the old socket. No diagnostic HTTP upload is needed for this check. |
| A13 | Under both Ask and Always trigger `#806` and `#809`; dismiss unchecked, then tick and confirm when unblocked. Repeat under Never, cooldown and daily limit. | Both preferences show an unchecked checkbox describing the design file being processed. Unchecked sends nothing; checked sends diagnostics and file together. No automatic status line, no automatic-upload prompt after success, and no preference change. | Never and throttle suppress both the question and upload. Presence of `scene`, not an error-code allowlist, enforces consent. Existing checkboxes remain untouched without bypassing design consent. |
| A14 | Start a log download and queue a status query on an idle machine; simulate 10 seconds without frames, then deliver late transfer, binary metadata, Blob and final `ok`. Reconnect and query status again. | Download and pending tasks reject with TIMEOUT; the old socket closes without sending the queued `play report`. Late frames neither trigger retries nor become status replies. The new connection returns status normally. | Cover both a stalled transfer and a Blob received without final `ok`. New tasks on the retired Control reject immediately; no timers or pending tasks remain. |
| A15 | Connect to A and collect player and robot logs. Switch to connected machine B while the first file is downloading, then let A finish. | Both files come from the original control for A. B receives no `fetch_log` from this collection, and its content never enters the report. | Failed connection acquisition or downloads retain failure notes without falling back to B; TIMEOUT still stops remaining files. Each file remains a separate queued task with progress callbacks. |
| A16 | Trigger `CONNECTION_*`, `#810`, `#805` and `#850`; reconnect the original machine before consenting to upload. | The report retains known serial and firmware, includes `bug_report` but no `system_log`, sends no `fetch_log`, and uses the original device throttle. | Unknown device metadata must not fall back to another current machine. Other errors with the option omitted or true retain log downloads. Changing this option cannot bypass cooldown. |

## 6. Must not change

Shared files touched outside the feature's own folder, with the callers that must keep behaving:

- `app/lang/*.ts`, `interfaces/ILang.ts` — `consent.tsx`: adds design/import consent strings in all 23 languages; ordinary diagnostic checkbox copy remains unchanged.
- `helpers/api/control.ts` `addTask` / `createWs` — all queued DeviceMaster callers: normal behavior is unchanged; after a log timeout, pending/new requests on the retired Control explicitly fail and its transport stops dispatching messages.
- `helpers/api/control.ts` `downloadLog` — `DeviceMaster.downloadLog`: preserves the log Blob and progress; completes only after both the Blob and final `ok`, preventing the next command from consuming the download reply.
- `helpers/device-master.ts` `downloadLog` — `menuDeviceActions.tsx` manual log download: same file and progress callback, now serialized through the control queue.
- `helpers/device-master.ts` `downloadLog` — `getLogsTexts`: each file uses the control queue on one fixed connection; failures retain notes and TIMEOUT stops remaining files without falling back to another machine.
- `helpers/device-master.ts` `getLogsTexts` — `MonitorContext.tsx` manual Bug Report: same downloaded files and progress, retaining the original control after a machine switch.
- `helpers/device-master.ts` `getLogsTexts` — `helpers/error-report/index.ts`: background log collection must not overlap queued control commands or mix in logs from a newly selected machine.

- `helpers/output-error.ts` — `menuActions.ts:64` `BUG_REPORT` — download still produces the full, un-scrubbed report; `MonitorContext.tsx:548` `handleReport` — same; `websocket.ts` — no longer calls any upload function; `uploadBackendErrorLog` is deleted and the `#802` alert's consent checkbox does the upload.
- `app/components/dialogs/Alert.tsx` — every existing `checkbox:` caller (`retryWithRemoveBackground.ts:25`, `retakeContourPreview.ts:77`, `importSvg/index.tsx:46`, `importDxf.ts:52,120`, `AutoFocusButton/index.tsx:140`, `BasePreviewManager.tsx:279`, `handleExportAlerts.ts:150`) — unchanged callback semantics. Touched 2026-10-12: `Alert.tsx` now renders the `children` field that `IAlert` has declared since 2021 but the antd rewrite stopped rendering; the status line for S3 uses it. No wave-1/2 caller passes `children`. The one existing caller that does, `NetworkTestingPanel.tsx:104` (three help hints after a healthy test, silently dropped until now, with their sass still under a dead `.modal-alert` selector), is fixed in a separate small branch that moves the hints to `links` and deletes that sass; it lands before this feature's combined PR.
- `helpers/device-master.ts:580` `popConnectionError` — `select` :410 and `selectDeviceWithSwiftray` :530 — alert id `connection-error`, the `Alert.popById` replace-in-place, the message text and the `{ success: false, error }` return value unchanged; `reconnect()` → `select()` still pops the same alert (the cooldown, not the alert, absorbs retry storms).
- `app/contexts/MonitorContext.tsx:314,495,980`, `helpers/device-master.ts:266`, `actions/beambox/export-funcs.ts:778`, `export-funcs-swiftray.ts:106-192`, `helpers/handleAutoConnect.ts:216` — wave-1 sites: alert ids, message text, button sets and the surrounding control flow (`onClose()`, `return { success: false }`, `setStatus('listening')`) unchanged; only the config object is wrapped.
- `actions/camera/preview-helper/*`, `components/dialogs/camera/*`, `DiodeCalibration/Component.tsx` — wave-2 sites, same rule; `BasePreviewManager.tsx:273` camera-cable warning untouched; `preview-mode-controller.ts:281` `onPreviewFail` still calls `this.end()` after the alert. `BeamPreviewManager.setup` now routes its catch through `handlePreviewSetupError`; the one visible difference is that a non-`Error` throwable (a fluxghost `string[]`) is shown as its JSON instead of an empty string after the `#803` text (accepted 2026-10-14).
- `app/contexts/MonitorContext.tsx:598-633` — three error branches keep their button sets (`abort` / `retry+cancel` / `retry+bug report+cancel`) and `errorId` de-dup via `Alert.checkIdExist`.
- `actions/beambox/export-funcs.ts`, `export-funcs-swiftray.ts`, `importSvg/utils/uploadAndDivideSvg.ts` — error message text (`#806 …`, `#809 …`) and the `resolve(null)` / `return null` flow unchanged; the Yes/No upload question is gone and the scene is passed as a thunk, so `svgCanvas.getSvgString()` (which ungroups temporary selection groups) runs only for an upload that happens, never under Never or on cooldown.
- `app/constants/storageConstants.ts`, `interfaces/IStorage.d.ts` — additive keys only.
- `app/components/settings/categories/Privacy.tsx` — `enable-sentry` switch unchanged.
- `interfaces/IOperatingSystem.ts`, `apps/app/src/implementations/os.ts`, `apps/web/src/implementations/os.ts` — additive `machineId` only, self-contained try/catch returning `''`; every existing `os.*` caller (`output-error.ts:39`, network helpers, font helpers) unchanged.
- `app/lang/*.ts` (all 23) and `interfaces/ILang.ts` — `error_report` namespace added; `beambox.popup.backend_connect_failed_ask_to_upload` renamed to `backend_connect_failed` without the upload question; `export_file_error_ask_for_upload`, `import_file_error_ask_for_upload`, `upload_failed`, `upload_file_too_large` removed with their last callers (`#819` is no longer used). `successfully_uploaded` and `progress.uploading` stay for `Monitor.tsx`.
- `components/settings/shared/hooks/useSettingStore.ts` `getConfig` — the unset-key branch now writes the default to storage only when the key has one in `DEFAULT_CONFIG`; every other key's behaviour is unchanged (they all have defaults). Without this, opening Settings → Privacy wrote `undefined` for `error-report-upload`, which throws on electron-store and stores the string `"undefined"` on web (review finding 2026-10-14). Covered by `useSettingStore.spec.ts`.

## 7. Design

`UploadErrorReportOptions.includeDeviceLog?: boolean` defaults to true. False skips device-log reads and the `system_log` attachment only, preserving device metadata, fingerprint and counters. Machine connection entry points explicitly pass false; camera preview/calibration errors retain their existing log behavior. When `popConnectionError` cannot identify the original device, it passes `device: null` instead of falling back to another current machine.


### 7.1 Module

Device context is explicit: omitting `device` uses the current machine, passing an `IDeviceInfo` uses that machine, and `device: null` means no machine. The `#802`, `#806`, `#809`, and QR auto-connect error sites pass null even while another machine is connected: serial is `none`, firmware version is empty, no device log is downloaded, and throttling uses the no-device fingerprint and counter.

New `packages/core/src/web/helpers/error-report/` (own folder, colocated spec):

- `index.ts`
  - `uploadErrorReport({ errorCode, scene? }): Promise<UploadResult>` (`'sent' | 'duplicate' | 'failed' | BlockReason`) — builds the bundle, applies throttle (plus an in-flight set so two popups for one fingerprint make one upload), reads the device log with a 10 s idle bound per file, POSTs with a 3 min timeout and up to 3 attempts, bumps the counter on success. The toast and the one-time prompt live in `consent.tsx` (`uploadWithFeedback`, Ask path only), not here. `scene` is a thunk resolved inside the upload after the preference and throttle checks (2026-10-14, review findings); its size cap is part of the byte fit in §9.1.
  - `withErrorReportConsent(alert: IAlert, options: UploadErrorReportOptions): IAlert` (`consent.tsx`; revised 2026-10-12 from `errorCode: string` so `#806`/`#809` can pass the scene) — reads the preference and returns a **copy** of the alert decorated for scenario A/B/C, or the input itself when nothing applies. The popup site does `alertCaller.popUp(withErrorReportConsent({...}, { errorCode }))`. The checkbox callback uses the function form, which the Alert runs on any button before that button's own `onClick`; the array form would replace the button's `onClick` instead.
  - `preference.ts` — `getErrorReportPreference()` maps the unset key to `'ask'`; the single place that fallback lives.
- `scrub.ts` — `scrubReport(text: string): string` (home-path regex) and the storage denylist, used only on the upload path.
- `installationId.ts` — `getInstallationId(): string`. Electron: `os.machineId()`, a new `IOperatingSystem` method **inlined** in `apps/app/src/implementations/os.ts` (decided 2026-10-06, no `node-machine-id` dependency): runs the same per-OS command node-machine-id runs (`ioreg -rd1 -c IOPlatformExpertDevice` / `REG.exe QUERY HKLM\SOFTWARE\Microsoft\Cryptography /v MachineGuid` / `/etc/machine-id`), sha256-hashes it, and returns `''` on any failure (command missing, timeout, parse error) inside its own try/catch. Web returns `''`. Empty result → a `uuid` v4 (already a dependency) stored once in `error-report-install-id`, so the id is always non-empty and the caller never sees an exception.
- `throttle.ts` — daily counter `{ date, counts: Record<serial, number> }` in storage key `error-report-counter` and the per-fingerprint cooldown map (§7.7) in `error-report-cooldown`; one `getBlockReason(serial, fingerprint): 'cooldown' | 'daily-limit' | null` / `getSkipped(fingerprint)` / `recordUpload(serial, fingerprint)` / `recordSkipped(fingerprint)` surface used by both the upload and the consent decorator.

### 7.1.1 Isolation rule

Nothing in `helpers/error-report/` may change the outcome of the error popup it decorates. Concretely: `withErrorReportConsent` wraps every step in try/catch and returns the original `IAlert` untouched on any failure; `uploadErrorReport` is fire-and-forget (`void`), catches everything including `getLogsTexts` and `machineId` failures, and only logs to the generic logger; the checkbox callback is a one-line `void uploadErrorReport(...)`. A broken upload path must leave Retry / Confirm / Cancel behaving exactly as on `main`. This is verified by a unit test that makes every dependency throw and asserts the returned alert config deep-equals the input.

Log collection shares the existing control task queue (2026-10-27). `DeviceMaster.getLogsTexts` calls `getControl` once before the loop and shares that connection result (including failure) across all files. Switching machines cannot change the source or reconnect to another machine between files. `downloadLog` and `getLogsTexts` share `downloadLogFromControl`, with each file remaining a separate queued task. `Control.downloadLog` waits for both the Blob and final `ok`: fluxghost sends `ok` after the binary frame in `fetch_log` (`../fluxghost/fluxghost/api/control.py`), so receiving the Blob alone must not release the queue. `DeviceMaster.downloadLog` enqueues both progress-listener setup and the transfer in one task, so it cannot consume or clear another queued command's listeners. Button callbacks still run immediately, but their queued device commands may wait for an active log transfer; this latency is accepted for the shared-queue approach. The 10 s timeout is an idle timeout starting when the download task runs, not a total download or queue-wait limit. A timeout does not mean the backend stopped downloading: retire that Control, close its socket, reject pending tasks and ignore late messages. New tasks on the retired Control also reject immediately; machine commands are not replayed automatically. The close event uses existing DeviceMaster cleanup/reconnection, and later operations use a fresh Control. This does not serialize other legacy methods that bypass `addTask`.

### 7.2 Bundle contents and scrub

- `bug_report.txt` = `getOutput({ includeImages: false, scrub: true })`. `scrub` (new option on `getOutput`) drops storage keys `recent_files`, `auto-save-config`, `ador-backup-path` (user paths), `flux-101` (buckets keyed by FLUX ID email) and `maintenance-records` (machine nickname, task history `by`), replaces discover `name` with `model`, then runs `scrubReport` over the joined string. The regex pass is required even with the denylist, because the home directory also reaches the report outside `storage`: the websocket section records every sent command (`websocket.ts:325`), and font commands carry absolute paths of user-installed fonts (`select_font` / `check_exist` / `upload_to` in `utils-ws.ts:152`, `fontHelper.ts:236,325`), which live under `~/Library/Fonts` on macOS and `%LOCALAPPDATA%\Microsoft\Windows\Fonts` on Windows. The fluxghost log is INFO level by default (`../fluxghost/fluxghost/launcher.py:10`), so its home-path debug line only appears with `--debug`; the regex covers that case too.
- `system_log.txt` = concatenation of `getLogsTexts` results, present only when `deviceMaster.currentDevice?.control` exists.
- `scene.svg` (S7 only) = `svgCanvas.getSvgString()` or the imported file text.
- Ordinary diagnostic consent excludes design attachments. Reports with `scene` use "Send diagnostic data and the design file being processed to FLUX to help investigate this error" (exports and imports share `consent_design_checkbox`). Design-file consent must not promise no design files or personal data: file contents may contain personal data. Serial and computer identifiers allow reports to be linked, so reports must not be called anonymous.

### 7.3 Device log on web

`getLogsTexts` works wherever a device control socket exists, so web is not excluded. The fluxghost log file (`window.FLUX.logFile`) is Electron-only and `getOutput` already handles its absence.

### 7.4 Whitelist (every error-popup site, swept 2026-10-08)

Expressed in real codes, not the fictional ones in the source PRD. The sweep covered every `#NNN` string in `lang/en.ts`, every inline `#NNN` in code, and every `DeviceErrorHandler.translate` caller. Wave 1 = machine and connection (PR 3), wave 2 = camera and calibration (PR 3b). Excluded sites are listed so the sweep is auditable.

**Wave 1 — machine and connection**

| Site | Code passed to `withErrorReportConsent` | Serial |
|---|---|---|
| `MonitorContext.tsx:598` ALARM/FATAL and `:625` other device errors | `error.join('_')`, unless the family is `HARDWARE_ERROR` or `USER_OPERATION` (decided 2026-10-13: firmware already reports a hardware fault as what it is, a diagnostic bundle adds nothing; `#9xx`, `#401`, `#402`, `#905` strings are therefore excluded) | yes |
| ~~`MonitorContext.tsx:608` HARDWARE_ERROR~~ | excluded 2026-10-13, see above | no |
| `MonitorContext.tsx:495` report polling timed out | `#805` | yes |
| `MonitorContext.tsx:980` task failed to start | `#830` + `error.join('_')` | yes |
| `MonitorContext.tsx:314` Promark USB disconnected | `#850` (info-type popup, same decorator) | yes |
| `device-master.ts:580` `popConnectionError` (callers `select` :410, `selectDeviceWithSwiftray` :530) | `CONNECTION_TIMEOUT`, `CONNECTION_DISCONNECTED` (`#891`/`#892`), `CONNECTION_UNKNOWN_DEVICE`, and `CONNECTION_` + the raw fluxghost code for the default branch. `NOT_FOUND` excluded: machine left the discovery list, usually powered off. Confirm-only alert (source PRD §3.7). | yes |
| `device-master.ts:266` password accepted but connect failed | `#810` only; `#811` wrong password is excluded | yes |
| `export-funcs.ts:778` open task in Monitor failed | `#807` | yes |
| `export-funcs.ts:257,315,503`, `export-funcs-swiftray.ts:89` task generation failed | `#806` (+ scene.svg) | none |
| `websocket.ts:28` backend connect failed | `#802` | none |
| `handleAutoConnect.ts:216` QR auto-connect failed | `QR_AUTOCONNECT_FAILED` | none |
| `uploadAndDivideSvg.ts:31` import failed | `#809` (+ imported file) | none |

**Wave 2 — camera and calibration** (software-side codes; no firmware table needed, so §11 D4 is settled)

| Site | Code | Note |
|---|---|---|
| `preview-helper/handlePreviewSetupError.tsx:39,55` (`BeamPreviewManager.ts` now calls it instead of its own copy) | `#803` | preview setup / camera WS |
| `beambox/preview-mode-controller.ts:281` `onPreviewFail` | the message's `#8xx` prefix (`#844` camera closed, `#845` busy) or `PREVIEW_FAILED` | every preview-loop failure surfaces here; corrected 2026-10-13 from `BasePreviewManager.tsx:273`, which is the camera-cable warning (own `checkbox`, hardware state, excluded) |
| `helpers/api/camera.ts:130,424,427` and `BasePreviewManager.tsx:273` throw `#844`/`#845` | surfaced by `onPreviewFail`; no popup of their own | — |
| `camera/AdorCalibration/utils.ts:122` | `#848` | calibrate / download pictures failed |
| `DiodeCalibration/Component.tsx:251,344`, `CameraCalibration/StepRefocus.tsx:189`, `StepAskReadjust.tsx:56` | `#815` | device error during calibration move / capture |
| `CameraCalibration/StepBeforeAnalyzePicture.tsx:247` | `#816` | analysis failed |

**Rule for alerts that already define `checkbox`** (none of the wired sites today; the camera-cable warning at `BasePreviewManager.tsx:273` is excluded, and the eight callers in §6 are not error sites): `withErrorReportConsent` never replaces an existing `checkbox`. Under Ask, or with a scene under Always, it returns the alert untouched without uploading; under Always without a scene it uploads silently and adds the status line only. One checkbox per alert.

**Message toasts cannot carry consent** (`AbstractMenu.ts:66` `#805` as a `MessageCaller` toast): excluded; the same timeout reaches `popConnectionError` on the next select.

**Excluded, with reason**

- Firmware-reported hardware faults, `HARDWARE_ERROR_*` (decided 2026-10-13): the firmware names the fault; a client-side bundle adds nothing.
- User state or user action, not a defect: camera-cable-unstable warning (`BasePreviewManager.tsx:273`, own `checkbox`), `#801` no device, `#804` workarea mismatch, Swiftray `busy` info popup in `export-funcs-swiftray.ts` `popupError`, `#808` invalid image path, `#811` wrong password, `#814` / `#820` firmware too old, `#851` / `#852` calibration data missing, `#901` door opened in the Promark dialogs, `USER_OPERATION_*`, `REMOVE_CARTRIDGE`, `ConnectionError.NOT_FOUND`.
- Print and Cut calibration scratch failure (`PrintAndCutCalibration.tsx:150`, decided 2026-10-13): the errors there are the device's own list, mostly hardware faults and user stops, which the rule above already excludes; not worth a site-specific split.
- Always a second alert for a failure already reported: `#813` in `device/get-device.ts:103` (decided 2026-10-13). Every `select` failure pops `popConnectionError`, `#810`/`#811`, or `#820` first, or follows a user cancel of the password dialog; wiring `#813` too would offer two consent boxes and send two reports with different codes for one failure.
- The diagnostic tooling itself: `#817`, `#818`, `#840`–`#843` network test panel; `#819` upload failed.
- Not machine related: `#822` / `#823` app update, `#847` cloud service, `#846` text-to-path parse, `#974` pass-through.
- Dead strings with no caller: `#824`, `#825`, `#827`, `#843`, `#849`.

### 7.5 Backend: flux-id endpoint, storage behind a Django storage alias (R2 first)

Decided §11 D1. The endpoint lives in flux-id so the team can swap the storage provider by configuration, and so the existing throttle and deploy pipeline are reused.

- Endpoint: `POST {FLUXID_HOST}/api/beam-studio/error-report`, multipart, fields `serial`, `installation_id`, `error_code`, `app_version`, `os`, `firmware_version`, `occurrences_since_last`, files `bug_report`, `system_log`, `scene`. Response `{ status: 'ok' }`. Unauthenticated (`csrf_exempt_auth_classes`, like `flux101.py`), no FLUX account required.
- Validation in the view: total body ≤ 20 MB (nginx already caps at 32 MB), `serial` matches `^[A-Za-z0-9-]{1,32}$` or `none`, `error_code` ≤ 64 chars, only the three known file fields, each file's content type ignored and stored as `text/plain` / `image/svg+xml`.
- Storage: a Django 4.2 `STORAGES['error_report']` alias pointing at `storages.backends.s3boto3.S3Boto3Storage` with `endpoint_url = https://<account>.r2.cloudflarestorage.com`, bucket `flux-id` (`flux-id-test` outside production) under the `error-report/` location prefix, `default_acl = private`. The view only calls `storages['error_report'].save(path, file)`. **Swapping provider = editing that settings entry** (S3, B2, GCS and MinIO are all S3-compatible; Google Drive would need a custom `Storage` subclass behind the same alias). No new abstraction in code; `django-storages` already is one.
- Keys (`{code}` = `error_code` with `#` stripped, so `#806` → `806`): `{serial}/{ISO ts}_{code}_bug_report.txt`, `_system_log.txt`, `_scene.svg` whenever a device was known; `no-device/{installation_id}/{ISO ts}_{code}_...` for errors without a device context (`#802`, `#806`, `#809`, QR auto-connect). No serial verification: a verified/unverified split was considered and dropped (backend.md §10 B3) because too few field machines are in flux-id's serial tables. Serial format is validated loosely (`^[A-Za-z0-9-]{1,32}$`), not pinned to today's 10-char length.
- Server-side dedupe (backstop for a client whose cooldown map was wiped): before saving, list the `{serial}/` or `no-device/{installation_id}/` prefix; if an object with the same `{code}` exists with `ts` inside the last 24 h, answer `{ status: 'duplicate' }` and store nothing. One R2 Class B list call per upload. The client treats `duplicate` as success for throttle and cooldown purposes, without the "sent" toast.
- Spam control and storage bound, five layers (detail in [backend.md §6](backend.md)): Cloudflare WAF rate-limit rule per IP; DRF per-IP throttles `6/hour` and `20/day`, so one IP tops out at 20 × 20 MB = 400 MB/day even with fabricated serials; a **global daily byte budget** (2 GB/day, `429 { status: 'budget' }` when exceeded) bounding the bucket at ≈ 360 GB worst case no matter how many IPs or serials are spoofed; the per-folder cap and 24 h dedupe; the client-side daily limit and fingerprint cooldown (§7.7). A `429` is a failure to the client: no retry (only no-response and 5xx retry), silent, cooldown not advanced.
- Retention: R2 object lifecycle rule, delete after 180 days. No cron code.
- Per-folder cap: kept (§11 D5). Each `{serial}/` and `no-device/{installation_id}/` folder is capped at `ERROR_REPORT_FOLDER_CAP_BYTES` (default 20 MB, a flux-id setting). The view reuses the prefix listing it already does for dedupe, so the cap costs no extra round-trip; algorithm and cost in [backend.md §4](backend.md).
- Metrics: `ErrorReportDailyStat` rows in flux-id, one per UTC day and error code (uploads, duplicates, rejects, budget hits, bytes, summed request time), aggregated for §9.2 and posted as a daily Slack digest from Celery beat; budget exhaustion and storage failures alert the flux-id Slack channel ([backend.md §6–7](backend.md), built 2026-10-15). flux-id's statsd is dead (no host, no receiver; verified 2026-10-12), and logs are not used as a data store. The latency rows of §9.2 still read the gunicorn access log, Cloudflare analytics and Linode graphs.
- Sync vs. async: v1 writes to R2 inside the request (one sync gunicorn worker held for the R2 PUT, ~1–3 s for 10 MB from Linode). Upgrade path if §9 says so: save to local disk and push with a celery task, or hand the client a presigned R2 PUT URL so bytes never pass through Linode. The client contract does not change for the celery path; the presigned path adds one round-trip and is a v2 decision.

### 7.6 Preference and prompt

For any `UploadErrorReportOptions.scene`, `consent.tsx` applies Never and throttle first, then treats Always as Ask. The scene thunk is not evaluated until a checked consent starts the upload. An existing checkbox returns unchanged without uploading. Successful scene uploads show only the thank-you toast and never offer automatic uploads. Automatic uploads and first-success prompts below apply only to reports without a scene.

- `error-report-upload: 'always' | 'ask' | 'never' | null`. `null` (never chosen) behaves as `'ask'` and is the only state in which the one-time prompt may show; `'ask'` means the user chose it, in the prompt or in Settings, so no prompt. Revised 2026-10-12: the separate `error-report-upload-prompted` flag was dropped because the unset value already carries that bit, the same convention `enable-sentry` uses. The key is deliberately **not** in `useSettingStore` `DEFAULT_CONFIG`, whose keys the router writes to storage at startup; that would turn `null` into `'ask'` before any upload.
- Prompt is an `Alert.popUp` after the first successful upload under `null`: caption "Send automatically?", message "Always send diagnostic data automatically when errors occur? You can change this anytime in Preferences > Privacy.", buttons [Ask each time] / [Always send] (Always primary, on the right per the alert convention) writing `'ask'` / `'always'`. Escape stores nothing. The "never chosen" check runs after the upload resolves, so a value picked in Settings during a slow upload is never overwritten; the prompt therefore appears whenever the upload settles, which on the 3-attempt retry path can be minutes after the error (accepted 2026-10-14).
- Toast on success (Ask, including mandatory scene consent): "Thanks! Diagnostic data sent." Neutral wording by product rule: nothing that implies a ticket or a reply.

### 7.7 Repeat suppression (fingerprint cooldown)

Problem: a connection failure yields a report on every Retry, and the same LAN problem yields the same report every day. The daily limit alone still allows 10 near-identical uploads a day.

- `fingerprint = serial | error_code | app_version | firmware_version` (plain join, client-local only; revised 2026-10-12 from sha1: no hashing needed for a local map key, and it is not sent to the server, which already receives the four fields); `firmware_version` is `''` when no device is connected. The installation id is deliberately **not** in it: it is constant on one computer, so it would not change local dedup, and the server needs it in the clear to group and dedupe (§7.5).
- Storage key `error-report-cooldown: Record<fingerprint, { level: number; nextAllowed: number; skipped: number }>` (`level` indexes the window table below; revised 2026-10-12 from `lastSent`).
- First occurrence uploads. While `now < nextAllowed`, `getBlockReason` returns `'cooldown'`: no upload, checkbox hidden (Ask) or no status line (Always), `skipped += 1`.
- On each successful upload the window widens along the table 1 h → 24 h → 7 d → 30 d (cap). The report carries `occurrences_since_last = skipped`, then `skipped` resets, so the server still learns how often the error fired.
- Any of serial, error code, app version or firmware version changing yields a new fingerprint and a fresh window; a user who updates firmware to fix the problem and still fails gets exactly one new report.
- Entries older than 30 days past `nextAllowed` are pruned on write so the map stays small.
- Manual Help → Bug Report and the Monitor download button bypass the cooldown; it only governs the automatic/consent path.

## 8. Data contracts

- Storage: `error-report-upload` (nullable, §7.6), `error-report-install-id` (web / fallback only), `error-report-counter: { date: 'YYYY-MM-DD', counts: Record<serial, number> }`, `error-report-cooldown` (§7.7).
- `IOperatingSystem.machineId(): string` — Electron returns the sha256 of the OS machine GUID (inlined, §7.1), web returns `''`.
- No new dependency; `machineId` is ~25 lines in the existing os implementation using `crypto.createHash` over the output of the per-OS command, started with the async `child_process.exec` at module load (2 s timeout) so the renderer never blocks; `execSync` remains only as the fallback for a report that fires before it returns.
- Upload request: §7.5 multipart, 3 min timeout. Response `{ status: 'ok' }` → sent; `{ status: 'duplicate' }` → counted as sent; no response or 5xx → retry (3 attempts); any 4xx or an unknown 2xx body → failed at once.
- i18n: new namespace `error_report` in `en.ts`/`zh-tw.ts` (as built): `consent_checkbox`, `consent_design_checkbox`, `sent`, `sent_automatically`, `prompt_caption`, `prompt_message`, `setting_label`, `always`, `ask`, `never` (the last three label both the Privacy select and the prompt buttons).

## 9. Performance

### 9.1 Client

- Report size today can exceed 10 MB when the fluxghost log is large (the legacy `uploadToS3` refused bodies over 10 MB). Keep the 10 MB cap on `bug_report.txt` by truncating the backend section from the top, not by refusing the upload: `getOutput({ maxLength })` measures every other section first and gives the fluxghost log the remaining budget, so the cap is on the whole file. `uploadErrorReport` then fits the bundle to the backend limits in bytes (`Blob.size`; a `400 too_large` is final, so the client must fit): `bug_report` is clipped to its newest 10 MB, `scene` is dropped when it exceeds 10 MB or the room left, and `system_log` is clipped to what remains of the 20 MB request (minus 64 KB for the multipart fields) or dropped when nothing remains. Scene wins over the device log because only the export / import errors carry one and there the design is the evidence. Whole body therefore stays under the view's 20 MB check, nginx's 32 MB and Cloudflare's 100 MB free-plan limit.
- Device log download already shows a stepping progress in the Monitor path; the automatic path runs it silently and skips if the device is busy (`getMode()` not idle).

### 9.2 flux-id impact matrix

The box is a Linode dedicated 4 vCPU / 8 GB / 160 GB running mysql, redis, celery, nginx and 9 sync gunicorn workers. Every upload holds one worker for the R2 PUT, so worker occupancy is the number that matters, not CPU. nginx buffers request bodies before proxying, so slow client links do not hold workers.

Load model: with §7.7 the realistic rate is about one upload per (serial, error) per day. Plan for a pessimistic 300 uploads/day at 5 MB and a burst case of 10 concurrent 10 MB uploads.

| Metric | Source | Baseline (before) | Pessimistic 300/day | Burst 10 × 10 MB | Threshold | Action if exceeded |
|---|---|---|---|---|---|---|
| p95 latency, existing endpoints (`/user/activity/beam-studio`, login) | gunicorn access log request time (enable in PR 6) / Cloudflare analytics | measure | measure | measure | +50 ms over baseline | move R2 PUT to celery |
| gunicorn busy workers (of 9) | `ps` sampling of `gunicorn: worker` processes in state `R` | measure | expect < 1 | expect ≤ 10 queued | ≤ 4 sustained | presigned R2 PUT (bytes bypass Linode) |
| upload time, average (`duration_ms / uploads`) and p95 | `ErrorReportDailyStat` aggregate for the average; gunicorn access log for the p95 | n/a | measure | measure | p95 ≤ 5 s | check Linode → R2 route, consider celery |
| CPU % (all containers) | Linode graphs | measure | measure | measure | +10 pp | celery |
| RAM, nginx `client_body_temp` and Django temp upload usage | Linode graphs, `df /tmp` | measure | measure | measure | no growth after requests finish | fix cleanup |
| Linode outbound transfer | Linode account transfer pool | measure | ≈ 45 GB/month | n/a | ≤ 10 % of plan pool | presigned PUT |
| R2 storage / 429s from Cloudflare rule | R2 dashboard, Cloudflare security events | 0 | ≈ 270 GB steady at 180 d | n/a | 429s only from abuse | tune rule |

Procedure: record the baseline column for one week before step 6 of §10 ships; replay the burst case with a script posting 10 MB fixtures in parallel against staging; re-read the same columns one week after release. Record measured numbers in this table.

## 10. Rollout (PR plan)

1. `helpers/error-report/` (scrub, throttle, installationId, `uploadErrorReport`) + `getOutput({ scrub, maxLength })` + unit tests. No callers, no strings, no UI. **PR #1021, merged 2026-10-19** (review fixes 2026-10-14).
2. Preference key, Privacy select, i18n (en, zh-tw), `preference.ts`, `withErrorReportConsent` in `helpers/error-report/consent.tsx` (moved here from PR 1 on 2026-10-12 because it needs the consent strings), and the `children` render in `Alert.tsx` (§6). Built 2026-10-12; carried on `feat/error-report-consent`.
3. Replace `uploadBackendErrorLog` and delete `aws-helper.ts`; wire the §7.4 wave-1 sites through `withErrorReportConsent`. Done 2026-10-13: nine sites; `UploadErrorReportOptions.device` added for sites that fire before `currentDevice` is updated, device log read only when the current socket belongs to that machine.
3b. Wire the §7.4 wave-2 camera sites (same mechanism). Done 2026-10-14 on the same branch; the separate-PR idea was dropped because the diff is six call sites of the same shape. `BeamPreviewManager` now reuses `handlePreviewSetupError`.
4. One-time Always prompt + toast. Done 2026-10-14.
5. Remaining 21 languages (done 2026-10-14, machine-drafted, native review pending; the four orphaned upload strings and `#819` removed); feature-review; bilingual PR for steps 2–5: **#1028**, opened 2026-10-20.
6. flux-id: companion PRD, `STORAGES['error_report']` alias + R2 bucket + lifecycle rule, DRF view with throttle, daily stat rows with Slack digest and alerts, gunicorn access log enabled, Cloudflare WAF rule. Code built 2026-10-15, flux-id PR #683 merged 2026-10-19; buckets, webhook, lifecycle and WAF rule set 2026-10-15; the baseline week of §9.2 is still to read out. Can land in parallel with 1–2; step 3 targets staging until then.

## 11. Open decisions

1. ~~D1 Backend and storage.~~ Decided 2026-10-06: endpoint in flux-id (reuses throttle, deploy; provider swappable via the `STORAGES` alias), storage Cloudflare R2 (account exists, no egress, native lifecycle). S3 rejected; Google Drive rejected for v1 (needs Shared Drive + service account + cron cleanup) but reachable later as a custom storage class behind the same alias. flux-id impact measured per §9.2.
2. ~~D2 Offline queue.~~ Decided 2026-10-06: dropped for v1 (payload up to 10 MB, `storage` is JSON-backed); 3 in-process retries only.
3. ~~D3 Scrub vs. "anonymous" wording.~~ Decided 2026-10-06: scrub per §7.2 and change the copy to "no design files or personal data". Amended 2026-10-19: "no design files" contradicted S7, so the copy names the design for export / import errors (§7.2). Decided 2026-10-27: consent is separated by presence of `scene`; designs require consent each time (Never and throttle take precedence), outside automatic uploads; see S7.
4. ~~D4 Camera/calibration whitelist.~~ Decided 2026-10-08: enumerated from the codebase sweep (§7.4 wave 2); the firmware code table is unnecessary because Monitor errors are passed through generically as `error.join('_')`.
5. ~~D5 Per-serial 20 MB cap.~~ Decided 2026-10-06: **kept**, as a per-folder total (not per file), adjustable via a flux-id setting, applied to `{serial}/` and `no-device/{installation_id}/` alike. Cheap because keys sort oldest-first and the listing is shared with the dedupe check; per-report size is bounded by the 10 MB client truncation. See [backend.md §4](backend.md).

## 12. Risks & follow-ups

- Scrub regex misses a path form (e.g. `/home/<name>` on Linux). Add it; keep the regex list in `scrub.ts` with a test fixture per OS.
- Device log download during an active job could stall the Monitor. Mitigated by the idle check in §9.1.
- The inlined `machineId` reads a stable hardware/OS id, so reports from one computer are linkable across reinstalls. Accepted 2026-10-06 for the no-device case where no serial exists; the hashed default is kept and the consent copy already says reports include machine identifiers.
- Sync R2 PUT inside the request holds a gunicorn worker; a burst of uploads could delay login. §9.2 thresholds trigger the celery or presigned-URL upgrade before it hurts.
- Sentry (`enable-sentry`) already captures JS stack traces; this feature does not replace it. Note the overlap in the Privacy section copy.
- ~~Follow-up: `#812` branches in `export-funcs-swiftray.ts` must be classified one by one when wiring.~~ Classified 2026-10-13: the file has no `#812`; all its errors go through `popupError`, which is silent on `cancel`, an info popup on `busy` (excluded, machine in use) and `#806` otherwise (wired). `#812` exists only as an unused lang string (`message.device_not_found.message`); its caption is an info toast in `get-device.ts`.

## 13. Test plan

Acceptance record (2026-10-27): the tester confirmed consent UI, preferences, throttling, uploaded contents and backend storage paths using a temporary DevTools `popErrorReportTest` hook. All three report variants passed: scene attached with no device context; device serial retained without device logs; device serial retained with device logs. Scene reports used `error-report/no-device/{installation_id}/`; both device variants used `error-report/{serial}/`. This verifies the consent/upload integration, not the real export/import error entry points or extraction of the actual design. The temporary hook was removed after verification; it is not a shipped API.

- `helpers/error-report/index.spec.ts`: false skips logs even after reconnection to an idle machine, retains metadata and device counters/cooldown; omitted/true retains downloads.

- Unit: `scrub.spec.ts` (fixtures for macOS, Windows, Linux home paths, a ws-section `> select_font /Users/x/Library/Fonts/a.ttf` line and the fluxghost `--debug` config line; denylist keys removed; manual path untouched), `throttle.spec.ts` (daily limit, reset at local midnight, failures not counted, per-serial; cooldown doubling 1 h → 24 h → 7 d → 30 d, skipped count carried and reset, new fingerprint on version change, pruning), `consent.spec.tsx` (three preferences × checkbox presence, existing checkbox kept, checkbox hidden during cooldown or daily limit, callback starts the upload, **every dependency throwing → input alert returned unchanged**, scene consent under Ask/Always and no automatic-upload prompt after scene success), `installationId.spec.ts` (machineId success → hashed value, machineId `''` or throw → stored UUID, stable across calls).
- Queue regression: `helpers/device-master.spec.ts` uses the real `Control` queue and command handlers with a fake transport; covers both request orders, waiting for the final `ok` after the Blob, progress-listener ownership, and release after terminal log errors; rejection of queued commands and socket closure on transfer/final-ok timeout; late transfer/binary/Blob/ok frames from the old socket cannot contaminate a new connection; switching machines during collection keeps the original control, and failed connection acquisition cannot fall back to another machine.
- Manual: A1–A16 above on a desktop build against a device that can raise a non-hardware Monitor error, plus `#806` by killing fluxghost mid-export.
- Regression: existing `checkbox:` alert callers listed in §6 behave as before; Help → Bug Report download still contains `recent_files`.
