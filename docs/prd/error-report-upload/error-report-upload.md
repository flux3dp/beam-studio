# PRD: Error Report Upload (inline consent on error popups)

| | |
|---|---|
| **Status** | Draft — scoped 2026-10-06; open decisions §11 |
| **Author** | Product (zh-tw source PRD v1.1) + engineering scoping |
| **Created** | 2026-10-06 |
| **Revised** | 2026-10-08 (full error-site sweep in §7.4, D4 settled; D1–D5 on 2026-10-06, see §11) |
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

- **S1 Ask (default), user ticks, presses Retry/Confirm/Cancel** → alert closes as before; upload runs in the background; a neutral toast "Thanks! Diagnostic data sent." on success. First success ever → one-time prompt "Always send automatically?" with [Always] / [Ask each time].
- **S2 Ask, user leaves unticked** → nothing uploaded, no toast, no prompt.
- **S3 Always** → no checkbox; upload starts when the alert opens; one line of small grey text at the bottom "Diagnostic data sent automatically".
- **S4 Never** → alert identical to today.
- **S5 Daily limit reached** → checkbox hidden (Ask) or no upload and no status line (Always); a local "skipped (daily limit)" entry is appended to the generic logger.
- **S6 Connection-category error** → bundle contains the bug report only; the device log part is skipped, not failed. Two sub-cases: `#802` backend alert has no device at all (files under `no-device/{installation_id}/`); `popConnectionError` (`device-master.ts:580`) fires after a failed `select`, so `deviceInfo` with serial and firmware version is known from discovery even though no control socket exists (files under `{serial}/`).
- **S7 Export/import failure** (`#806`/`#809`) → the scene SVG / imported file is included as a third file, replacing today's `uploadToS3` Yes/No alert with the same consent row.
- **S8 Upload fails 3 times** → silent; no error alert (the user already has an error to deal with). Logged to generic logger.
- **S9 Same error repeats** (user presses Retry five times on the same connection failure, or the same LAN problem recurs tomorrow) → only the first occurrence uploads; later ones are counted locally and the checkbox is hidden while the fingerprint cools down (§7.7). The next upload for that fingerprint carries `occurrences_since_last`, so frequency is not lost.

## 5. Acceptance criteria

| # | How to operate | Done when | Edge cases |
|---|---|---|---|
| A1 | Settings → Privacy. | A select "Error report upload" with Always / Ask each time / Never exists; default Ask; survives restart. | Value persisted under storage key `error-report-upload` as `'always' \| 'ask' \| 'never'`. |
| A2 | Set Ask. Trigger a device `HARDWARE_ERROR` on the Monitor, or power-cycle the machine mid-connect to get `popConnectionError` (or any site in §7.4). | Existing alert shows with an unchecked checkbox above the buttons; button labels/order unchanged. | ALARM/FATAL single-button alert gets the same checkbox (PRD §3.7). |
| A3 | Tick, press Cancel. | Upload happens (network tab shows one request to the proxy); toast "Thanks! Diagnostic data sent." | Cancel and Retry behave identically for upload. |
| A4 | First successful upload under Ask. | One-time Always/Ask prompt; choosing Always flips A1's select. | Prompt never shows again (flag `error-report-upload-prompted`). |
| A5 | Set Always. Trigger error. | No checkbox; grey status line at the bottom; request sent without user action. | Status line omitted when the daily limit is hit. |
| A6 | Set Never. | Alert pixel-identical to main. | — |
| A7 | Inspect the uploaded bug_report. | No `recent_files`, `auto-save-config`, `ador-backup-path`; no `/Users/<name>` or `C:\Users\<name>` anywhere (including the fluxghost log section); discover entries carry model, not user-given name. | Manual Help → Bug Report download is unchanged (still contains them). |
| A8 | Trigger 11 whitelisted errors in one local day under Always. | 10 requests sent; 11th shows no status line, generic log has a "skipped (daily limit)" entry; counter resets after local midnight. | Failed attempts do not count. Counter is per serial; connection errors with no device count under serial `none`. |
| A9 | Block the proxy host, trigger error under Always. | 3 attempts, then silence; no new alert. | — |
| A10 | Export with fluxghost returning an error (`#806`). | Same alert text as today, but with the consent checkbox instead of the Yes/No upload question; SVG included in the bundle. | `aws-helper.ts` no longer exists; `uploadToS3` has no callers. |
| A11 | Under Always, trigger the same device error 5 times within an hour, then once the next day. | Exactly 1 request on day 1 (later alerts show no status line); day-2 alert sends 1 request whose `occurrences_since_last` is 4; a third day without change sends nothing (cooldown now 7 days). | A different `error_code`, a new app version, or a new firmware version starts a fresh fingerprint. Under Ask, the checkbox is hidden while cooling down, same as the daily limit. |

## 6. Must not change

Shared files touched outside the feature's own folder, with the callers that must keep behaving:

- `helpers/output-error.ts` — `menuActions.ts:64` `BUG_REPORT` — download still produces the full, un-scrubbed report; `MonitorContext.tsx:548` `handleReport` — same; `websocket.ts:41` — now calls the new upload function, still only after the user accepts.
- `app/components/dialogs/Alert.tsx` — every existing `checkbox:` caller (`retryWithRemoveBackground.ts:25`, `retakeContourPreview.ts:77`, `importSvg/index.tsx:46`, `importDxf.ts:52,120`, `AutoFocusButton/index.tsx:140`, `BasePreviewManager.tsx:279`, `handleExportAlerts.ts:150`) — unchanged callback semantics. Preferred: do not touch `Alert.tsx` at all; if a status-line slot is needed for S3, add it as an optional prop with no default behaviour change.
- `helpers/device-master.ts:580` `popConnectionError` — `select` :410 and `selectDeviceWithSwiftray` :530 — alert id `connection-error`, the `Alert.popById` replace-in-place, the message text and the `{ success: false, error }` return value unchanged; `reconnect()` → `select()` still pops the same alert (the cooldown, not the alert, absorbs retry storms).
- `app/contexts/MonitorContext.tsx:314,495,980`, `helpers/device-master.ts:266`, `helpers/device/get-device.ts:103`, `actions/beambox/export-funcs.ts:778`, `export-funcs-swiftray.ts:106-192`, `helpers/handleAutoConnect.ts:216`, `PrintAndCut/calibration/PrintAndCutCalibration.tsx:150` — wave-1 sites: alert ids, message text, button sets and the surrounding control flow (`onClose()`, `return { success: false }`, `setStatus('listening')`) unchanged; only the config object is wrapped.
- `actions/camera/preview-helper/*`, `components/dialogs/camera/*`, `DiodeCalibration/Component.tsx` — wave-2 sites, same rule; `BasePreviewManager.tsx:273` keeps its own `checkbox` (§7.4 rule).
- `app/contexts/MonitorContext.tsx:598-633` — three error branches keep their button sets (`abort` / `retry+cancel` / `retry+bug report+cancel`) and `errorId` de-dup via `Alert.checkIdExist`.
- `actions/beambox/export-funcs.ts`, `export-funcs-swiftray.ts`, `importSvg/utils/uploadAndDivideSvg.ts` — error message text (`#806 …`, `#809 …`) and the `resolve(null)` / `return null` flow unchanged; only the upload hook is swapped.
- `app/constants/storageConstants.ts`, `interfaces/IStorage.d.ts` — additive keys only.
- `app/components/settings/categories/Privacy.tsx` — `enable-sentry` switch unchanged.
- `interfaces/IOperatingSystem.ts`, `apps/app/src/implementations/os.ts`, `apps/web/src/implementations/os.ts` — additive `machineId` only, self-contained try/catch returning `''`; every existing `os.*` caller (`output-error.ts:39`, network helpers, font helpers) unchanged.
- `app/lang/en.ts`, `zh-tw.ts` (+ all languages before PR) — additive keys only; existing `successfully_uploaded` / `upload_failed` strings stay for any remaining caller.

## 7. Design

### 7.1 Module

New `packages/core/src/web/helpers/error-report/` (own folder, colocated spec):

- `index.ts`
  - `uploadErrorReport({ errorCode, scene? }): Promise<UploadResult>` (`'sent' | 'duplicate' | 'failed' | BlockReason`) — builds the bundle, applies throttle (plus an in-flight set so two popups for one fingerprint make one upload), reads the device log with a 10 s idle bound per file, POSTs with a 3 min timeout and up to 3 attempts, bumps the counter on success; the caller (consent decorator, PR 2) shows the toast and the one-time prompt from the result.
  - `withErrorReportConsent(alert: IAlert, errorCode: string): IAlert` — reads the preference and returns the alert decorated for scenario A/B/C. Pure function over the config object; the popup site does `Alert.popUp(withErrorReportConsent({...}, code))`.
- `scrub.ts` — `scrubReport(text: string): string` (home-path regex) and the storage denylist, used only on the upload path.
- `installationId.ts` — `getInstallationId(): string`. Electron: `os.machineId()`, a new `IOperatingSystem` method **inlined** in `apps/app/src/implementations/os.ts` (decided 2026-10-06, no `node-machine-id` dependency): runs the same per-OS command node-machine-id runs (`ioreg -rd1 -c IOPlatformExpertDevice` / `REG.exe QUERY HKLM\SOFTWARE\Microsoft\Cryptography /v MachineGuid` / `/etc/machine-id`), sha256-hashes it, and returns `''` on any failure (command missing, timeout, parse error) inside its own try/catch. Web returns `''`. Empty result → a `uuid` v4 (already a dependency) stored once in `error-report-install-id`, so the id is always non-empty and the caller never sees an exception.
- `throttle.ts` — daily counter `{ date, counts: Record<serial, number> }` in storage key `error-report-counter` and the per-fingerprint cooldown map (§7.7) in `error-report-cooldown`; one `getBlockReason(serial, fingerprint): 'cooldown' | 'daily-limit' | null` / `getSkipped(fingerprint)` / `recordUpload(serial, fingerprint)` / `recordSkipped(fingerprint)` surface used by both the upload and the consent decorator.

### 7.1.1 Isolation rule

Nothing in `helpers/error-report/` may change the outcome of the error popup it decorates. Concretely: `withErrorReportConsent` wraps every step in try/catch and returns the original `IAlert` untouched on any failure; `uploadErrorReport` is fire-and-forget (`void`), catches everything including `getLogsTexts` and `machineId` failures, and only logs to the generic logger; the checkbox callback is a one-line `void uploadErrorReport(...)`. A broken upload path must leave Retry / Confirm / Cancel behaving exactly as on `main`. This is verified by a unit test that makes every dependency throw and asserts the returned alert config deep-equals the input.

### 7.2 Bundle contents and scrub

- `bug_report.txt` = `getOutput({ includeImages: false, scrub: true })`. `scrub` (new option on `getOutput`) drops storage keys `recent_files`, `auto-save-config`, `ador-backup-path`, replaces discover `name` with `model`, then runs `scrubReport` over the joined string. The regex pass is required even with the denylist, because the home directory also reaches the report outside `storage`: the websocket section records every sent command (`websocket.ts:325`), and font commands carry absolute paths of user-installed fonts (`select_font` / `check_exist` / `upload_to` in `utils-ws.ts:152`, `fontHelper.ts:236,325`), which live under `~/Library/Fonts` on macOS and `%LOCALAPPDATA%\Microsoft\Windows\Fonts` on Windows. The fluxghost log is INFO level by default (`../fluxghost/fluxghost/launcher.py:10`), so its home-path debug line only appears with `--debug`; the regex covers that case too.
- `system_log.txt` = concatenation of `getLogsTexts` results, present only when `deviceMaster.currentDevice?.control` exists.
- `scene.svg` (S7 only) = `svgCanvas.getSvgString()` or the imported file text.
- The consent copy says "no design files or personal data; includes machine serial, a computer identifier and error logs", not "anonymous". The serial is a device identifier FLUX can link to a sale, so the honest word is pseudonymous. The "we will not contact you" promise is unaffected.

### 7.3 Device log on web

`getLogsTexts` works wherever a device control socket exists, so web is not excluded. The fluxghost log file (`window.FLUX.logFile`) is Electron-only and `getOutput` already handles its absence.

### 7.4 Whitelist (every error-popup site, swept 2026-10-08)

Expressed in real codes, not the fictional ones in the source PRD. The sweep covered every `#NNN` string in `lang/en.ts`, every inline `#NNN` in code, and every `DeviceErrorHandler.translate` caller. Wave 1 = machine and connection (PR 3), wave 2 = camera and calibration (PR 3b). Excluded sites are listed so the sweep is auditable.

**Wave 1 — machine and connection**

| Site | Code passed to `withErrorReportConsent` | Serial |
|---|---|---|
| `MonitorContext.tsx:598` ALARM/FATAL | `error.join('_')` e.g. `HARDWARE_ERROR_OVERHEAT`; covers every `#9xx`, `#401`, `#402`, `#905` string, which are looked up by firmware error array | yes |
| `MonitorContext.tsx:608` HARDWARE_ERROR (not USER_OPERATION, not REMOVE_CARTRIDGE) | same | yes |
| `MonitorContext.tsx:625` other device errors | same | yes |
| `MonitorContext.tsx:495` report polling timed out | `#805` | yes |
| `MonitorContext.tsx:980` task failed to start | `#830` + `error.join('_')` | yes |
| `MonitorContext.tsx:314` Promark USB disconnected | `#850` (info-type popup, same decorator) | yes |
| `device-master.ts:580` `popConnectionError` (callers `select` :410, `selectDeviceWithSwiftray` :530) | `CONNECTION_TIMEOUT`, `CONNECTION_DISCONNECTED` (`#891`/`#892`), `CONNECTION_UNKNOWN_DEVICE`, `CONNECTION_UNKNOWN` (default). `NOT_FOUND` excluded: machine left the discovery list, usually powered off. Confirm-only alert (source PRD §3.7). | yes |
| `device-master.ts:266` password accepted but connect failed | `#810` only; `#811` wrong password is excluded | yes |
| `device/get-device.ts:103` fatal while selecting | `#813` | yes |
| `export-funcs.ts:778` open task in Monitor failed | `#807` | yes |
| `export-funcs.ts:257,315,503`, `export-funcs-swiftray.ts:89` task generation failed | `#806` (+ scene.svg) | if connected |
| `export-funcs-swiftray.ts:106-192` Swiftray export errors prefixed `#812` | `#812` (+ scene.svg); verify each branch is an error popup, not a hint, when wiring | if connected |
| `websocket.ts:28` backend connect failed | `#802` | none |
| `handleAutoConnect.ts:216` QR auto-connect failed | `QR_AUTOCONNECT_FAILED` | none |
| `uploadAndDivideSvg.ts:31` import failed | `#809` (+ imported file) | none |
| `PrintAndCut/calibration/PrintAndCutCalibration.tsx:150` device error during scratch task | `PNC_SCRATCH_` + translated error key | yes |

**Wave 2 — camera and calibration** (software-side codes; no firmware table needed, so §11 D4 is settled)

| Site | Code | Note |
|---|---|---|
| `preview-helper/handlePreviewSetupError.tsx:39,55`, `BeamPreviewManager.ts:85,89` | `#803` | preview setup / camera WS |
| `preview-helper/BasePreviewManager.tsx:273` camera WS closed | `#844` | **already has a `checkbox`**; see rule below |
| `helpers/api/camera.ts:130,424,427` throws `#844`/`#845` | surfaced by the callers above; no popup of its own | — |
| `camera/AdorCalibration/utils.ts:122` | `#848` | calibrate / download pictures failed |
| `DiodeCalibration/Component.tsx:251,344`, `CameraCalibration/StepRefocus.tsx:189`, `StepAskReadjust.tsx:56` | `#815` | device error during calibration move / capture |
| `CameraCalibration/StepBeforeAnalyzePicture.tsx:247` | `#816` | analysis failed |

**Rule for alerts that already define `checkbox`** (`BasePreviewManager.tsx:273` today, and the eight callers in §6): `withErrorReportConsent` never replaces an existing `checkbox`. Under Ask it returns the alert untouched; under Always it uploads silently and adds the status line only. One checkbox per alert.

**Message toasts cannot carry consent** (`AbstractMenu.ts:66` `#805` as a `MessageCaller` toast): excluded; the same timeout reaches `popConnectionError` on the next select.

**Excluded, with reason**

- User state or user action, not a defect: `#801` no device, `#804` workarea mismatch, `#808` invalid image path, `#811` wrong password, `#814` / `#820` firmware too old, `#851` / `#852` calibration data missing, `#901` door opened in the Promark dialogs, `USER_OPERATION_*`, `REMOVE_CARTRIDGE`, `ConnectionError.NOT_FOUND`.
- The diagnostic tooling itself: `#817`, `#818`, `#840`–`#843` network test panel; `#819` upload failed.
- Not machine related: `#822` / `#823` app update, `#847` cloud service, `#846` text-to-path parse, `#974` pass-through.
- Dead strings with no caller: `#824`, `#825`, `#827`, `#843`, `#849`.

### 7.5 Backend: flux-id endpoint, storage behind a Django storage alias (R2 first)

Decided §11 D1. The endpoint lives in flux-id so the team can swap the storage provider by configuration, and so the existing throttle and deploy pipeline are reused.

- Endpoint: `POST {FLUXID_HOST}/api/beam-studio/error-report`, multipart, fields `serial`, `installation_id`, `error_code`, `app_version`, `os`, `firmware_version`, `occurrences_since_last`, files `bug_report`, `system_log`, `scene`. Response `{ status: 'ok' }`. Unauthenticated (`csrf_exempt_auth_classes`, like `flux101.py`), no FLUX account required.
- Validation in the view: total body ≤ 20 MB (nginx already caps at 32 MB), `serial` matches `^[A-Za-z0-9-]{1,32}$` or `none`, `error_code` ≤ 64 chars, only the three known file fields, each file's content type ignored and stored as `text/plain` / `image/svg+xml`.
- Storage: a Django 4.2 `STORAGES['error_report']` alias pointing at `storages.backends.s3boto3.S3Boto3Storage` with `endpoint_url = https://<account>.r2.cloudflarestorage.com`, bucket `beam-error-report`, `default_acl = private`. The view only calls `storages['error_report'].save(path, file)`. **Swapping provider = editing that settings entry** (S3, B2, GCS and MinIO are all S3-compatible; Google Drive would need a custom `Storage` subclass behind the same alias). No new abstraction in code; `django-storages` already is one.
- Keys: `{serial}/{ISO ts}_{code}_bug_report.txt`, `_system_log.txt`, `_scene.svg` whenever a device was known; `no-device/{installation_id}/{ISO ts}_{code}_...` for the three sites with no machine at all (`#802`, `#809`, QR auto-connect). No serial verification: a verified/unverified split was considered and dropped (backend.md §10 B3) because too few field machines are in flux-id's serial tables. Serial format is validated loosely (`^[A-Za-z0-9-]{1,32}$`), not pinned to today's 10-char length.
- Server-side dedupe (backstop for a client whose cooldown map was wiped): before saving, list the `{serial}/` or `no-device/{installation_id}/` prefix; if an object with the same `{code}` exists with `ts` inside the last 24 h, answer `{ status: 'duplicate' }` and store nothing. One R2 Class B list call per upload. The client treats `duplicate` as success for throttle and cooldown purposes, without the "sent" toast.
- Spam control and storage bound, five layers (detail in [backend.md §6](backend.md)): Cloudflare WAF rate-limit rule per IP; DRF per-IP throttles `6/hour` and `20/day`, so one IP tops out at 20 × 20 MB = 400 MB/day even with fabricated serials; a **global daily byte budget** (2 GB/day, `429 { status: 'budget' }` when exceeded) bounding the bucket at ≈ 360 GB worst case no matter how many IPs or serials are spoofed; the per-folder cap and 24 h dedupe; the client-side daily limit and fingerprint cooldown (§7.7). A `429` is a failure to the client: no retry (only no-response and 5xx retry), silent, cooldown not advanced.
- Retention: R2 object lifecycle rule, delete after 180 days. No cron code.
- Per-folder cap: kept (§11 D5). Each `{serial}/` and `no-device/{installation_id}/` folder is capped at `ERROR_REPORT_FOLDER_CAP_BYTES` (default 20 MB, a flux-id setting). The view reuses the prefix listing it already does for dedupe, so the cap costs no extra round-trip; algorithm and cost in [backend.md §4](backend.md).
- Metrics: one structured log line per request from the view (`error_report <ok|duplicate|rejected> serial=… code=… bytes=… ms=… reason=…`, Django logging → gunicorn error log) plus the gunicorn access log with request time. flux-id's statsd is dead (no host, no receiver; verified 2026-10-12, [backend.md §7](backend.md)), so §9.2 reads from logs, Cloudflare analytics and Linode graphs.
- Sync vs. async: v1 writes to R2 inside the request (one sync gunicorn worker held for the R2 PUT, ~1–3 s for 10 MB from Linode). Upgrade path if §9 says so: save to local disk and push with a celery task, or hand the client a presigned R2 PUT URL so bytes never pass through Linode. The client contract does not change for the celery path; the presigned path adds one round-trip and is a v2 decision.

### 7.6 Preference and prompt

- `error-report-upload: 'always' | 'ask' | 'never'` (default `'ask'` when unset).
- `error-report-upload-prompted: boolean` — set after the one-time Always/Ask prompt.
- Prompt is an `Alert.popUp` with `buttonLabels: [Always, Ask each time]`, shown after the first successful upload under `ask`.

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

- Storage: `error-report-upload`, `error-report-upload-prompted`, `error-report-install-id` (web / fallback only), `error-report-counter: { date: 'YYYY-MM-DD', counts: Record<serial, number> }`, `error-report-cooldown` (§7.7).
- `IOperatingSystem.machineId(): string` — Electron returns the sha256 of the OS machine GUID (inlined, §7.1), web returns `''`.
- No new dependency; `machineId` is ~25 lines in the existing os implementation using `crypto.createHash` over the output of the per-OS command, started with the async `child_process.exec` at module load (2 s timeout) so the renderer never blocks; `execSync` remains only as the fallback for a report that fires before it returns.
- Upload request: §7.5 multipart, 3 min timeout. Response `{ status: 'ok' }` → sent; `{ status: 'duplicate' }` → counted as sent; no response or 5xx → retry (3 attempts); any 4xx or an unknown 2xx body → failed at once.
- i18n: new namespace `error_report` in `en.ts`/`zh-tw.ts`: `consent`, `consent_detail`, `sent`, `sent_auto`, `ask_always_title`, `always`, `ask_each_time`, `setting_label`, `setting_always/ask/never`.

## 9. Performance

### 9.1 Client

- Report size today can exceed 10 MB when the fluxghost log is large (the legacy `uploadToS3` refused bodies over 10 MB). Keep the 10 MB cap on `bug_report.txt` by truncating the backend section from the top, not by refusing the upload: `getOutput({ maxLength })` measures every other section first and gives the fluxghost log the remaining budget, so the cap is on the whole file. Whole body stays under the view's 20 MB check, nginx's 32 MB and Cloudflare's 100 MB free-plan limit.
- Device log download already shows a stepping progress in the Monitor path; the automatic path runs it silently and skips if the device is busy (`getMode()` not idle).

### 9.2 flux-id impact matrix

The box is a Linode dedicated 4 vCPU / 8 GB / 160 GB running mysql, redis, celery, nginx and 9 sync gunicorn workers. Every upload holds one worker for the R2 PUT, so worker occupancy is the number that matters, not CPU. nginx buffers request bodies before proxying, so slow client links do not hold workers.

Load model: with §7.7 the realistic rate is about one upload per (serial, error) per day. Plan for a pessimistic 300 uploads/day at 5 MB and a burst case of 10 concurrent 10 MB uploads.

| Metric | Source | Baseline (before) | Pessimistic 300/day | Burst 10 × 10 MB | Threshold | Action if exceeded |
|---|---|---|---|---|---|---|
| p95 latency, existing endpoints (`/user/activity/beam-studio`, login) | gunicorn access log request time (enable in PR 6) / Cloudflare analytics | measure | measure | measure | +50 ms over baseline | move R2 PUT to celery |
| gunicorn busy workers (of 9) | `ps` sampling of `gunicorn: worker` processes in state `R` | measure | expect < 1 | expect ≤ 10 queued | ≤ 4 sustained | presigned R2 PUT (bytes bypass Linode) |
| upload `ms=` p50 / p95 | view log line | n/a | measure | measure | p95 ≤ 5 s | check Linode → R2 route, consider celery |
| CPU % (all containers) | Linode graphs | measure | measure | measure | +10 pp | celery |
| RAM, nginx `client_body_temp` and Django temp upload usage | Linode graphs, `df /tmp` | measure | measure | measure | no growth after requests finish | fix cleanup |
| Linode outbound transfer | Linode account transfer pool | measure | ≈ 45 GB/month | n/a | ≤ 10 % of plan pool | presigned PUT |
| R2 storage / 429s from Cloudflare rule | R2 dashboard, Cloudflare security events | 0 | ≈ 270 GB steady at 180 d | n/a | 429s only from abuse | tune rule |

Procedure: record the baseline column for one week before step 6 of §10 ships; replay the burst case with a script posting 10 MB fixtures in parallel against staging; re-read the same columns one week after release. Record measured numbers in this table.

## 10. Rollout (PR plan)

1. `helpers/error-report/` (scrub, throttle, installationId, `uploadErrorReport`) + `getOutput({ scrub, maxLength })` + unit tests. No callers, no strings, no UI.
2. Preference key, Privacy select, i18n (en, zh-tw), and `withErrorReportConsent` in `helpers/error-report/consent.ts` (moved here from PR 1 on 2026-10-12 because it needs the consent strings).
3. Replace `uploadBackendErrorLog` and delete `aws-helper.ts`; wire the §7.4 wave-1 sites through `withErrorReportConsent`.
3b. Wire the §7.4 wave-2 camera sites (same mechanism, separate PR so the camera-preview skill owner can review).
4. One-time Always prompt + toast.
5. Remaining 21 languages; feature-review; bilingual PR.
6. flux-id: companion PRD, `STORAGES['error_report']` alias + R2 bucket + lifecycle rule, DRF view with throttle and structured log lines, gunicorn access log enabled, Cloudflare WAF rule. Baseline week of §9.2 before it ships. Can land in parallel with 1–2; step 3 targets staging until then.

## 11. Open decisions

1. ~~D1 Backend and storage.~~ Decided 2026-10-06: endpoint in flux-id (reuses throttle, deploy; provider swappable via the `STORAGES` alias), storage Cloudflare R2 (account exists, no egress, native lifecycle). S3 rejected; Google Drive rejected for v1 (needs Shared Drive + service account + cron cleanup) but reachable later as a custom storage class behind the same alias. flux-id impact measured per §9.2.
2. ~~D2 Offline queue.~~ Decided 2026-10-06: dropped for v1 (payload up to 10 MB, `storage` is JSON-backed); 3 in-process retries only.
3. ~~D3 Scrub vs. "anonymous" wording.~~ Decided 2026-10-06: scrub per §7.2 and change the copy to "no design files or personal data".
4. ~~D4 Camera/calibration whitelist.~~ Decided 2026-10-08: enumerated from the codebase sweep (§7.4 wave 2); the firmware code table is unnecessary because Monitor errors are passed through generically as `error.join('_')`.
5. ~~D5 Per-serial 20 MB cap.~~ Decided 2026-10-06: **kept**, as a per-folder total (not per file), adjustable via a flux-id setting, applied to `{serial}/` and `no-device/{installation_id}/` alike. Cheap because keys sort oldest-first and the listing is shared with the dedupe check; per-report size is bounded by the 10 MB client truncation. See [backend.md §4](backend.md).

## 12. Risks & follow-ups

- Scrub regex misses a path form (e.g. `/home/<name>` on Linux). Add it; keep the regex list in `scrub.ts` with a test fixture per OS.
- Device log download during an active job could stall the Monitor. Mitigated by the idle check in §9.1.
- The inlined `machineId` reads a stable hardware/OS id, so reports from one computer are linkable across reinstalls. Accepted 2026-10-06 for the no-device case where no serial exists; the hashed default is kept and the consent copy already says reports include machine identifiers.
- Sync R2 PUT inside the request holds a gunicorn worker; a burst of uploads could delay login. §9.2 thresholds trigger the celery or presigned-URL upgrade before it hurts.
- Sentry (`enable-sentry`) already captures JS stack traces; this feature does not replace it. Note the overlap in the Privacy section copy.
- Follow-up: `#812` branches in `export-funcs-swiftray.ts` must be classified one by one when wiring; any that is a hint rather than a failure is excluded there and noted in §7.4.

## 13. Test plan

- Unit: `scrub.spec.ts` (fixtures for macOS, Windows, Linux home paths, a ws-section `> select_font /Users/x/Library/Fonts/a.ttf` line and the fluxghost `--debug` config line; denylist keys removed; manual path untouched), `throttle.spec.ts` (daily limit, reset at local midnight, failures not counted, per-serial; cooldown doubling 1 h → 24 h → 7 d → 30 d, skipped count carried and reset, new fingerprint on version change, pruning), `withErrorReportConsent.spec.ts` (three preferences × checkbox presence, checkbox hidden during cooldown or daily limit, callback fires on every button, **every dependency throwing → input alert returned unchanged**), `installationId.spec.ts` (machineId success → hashed value, machineId `''` or throw → stored UUID, stable across calls).
- Manual: A1–A11 above on a desktop build against a device that can raise `HARDWARE_ERROR`, plus `#806` by killing fluxghost mid-export.
- Regression: existing `checkbox:` alert callers listed in §6 behave as before; Help → Bug Report download still contains `recent_files`.
