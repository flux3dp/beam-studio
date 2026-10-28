# PRD: Layer Laser Frequency

| | |
|---|---|
| **Status** | In review — beam-studio `feat/layer-laser-frequency`, fluxclient PR #70 (2.10.5), Swiftray PR #535 (1.5.0); hardware test on firmware 6.5.3 pending (§12) |
| **Author** | Product + Beam Studio team |
| **Created** | 2026-10-27 |
| **Target product** | Beam Studio 2.7.3, machine firmware 6.5.3 |
| **Owner area** | Layer config panel (Advanced), task code generation (fluxclient / Swiftray), pre-export checks |
| **Related code** | `packages/core/src/web/app/components/beambox/RightPanel/ConfigPanel/AdvancedBlock.tsx`, `packages/core/src/web/helpers/layer/layer-config-helper.ts`, `packages/core/src/web/app/constants/workarea-constants.ts`, `packages/core/src/web/app/actions/beambox/export/GoButton/handleExportAlerts.ts`, `packages/core/src/web/helpers/version-checker.ts`, `packages/core/src/web/app/svgedit/text/paramsLabel.ts`, `packages/core/public/js/lib/svgeditor/sanitize.js` |
| **External repos** | fluxclient (`fluxclient/toolpath/svgeditor_factory.py`, `fluxclient/toolpath/toolpath.py`, `fluxclient/hw_profile/support_info.py`); Swiftray (`src/parser/my_qsvg_handler_qt6.cpp`, `src/parser/mysvg/mysvg-types.h`, `src/layer.{h,cpp}`, `src/toolpath_exporter/toolpath-exporter-fcode.cpp`, `src/toolpath_exporter/toolpath-exporter-constants.h`) |
| **Translation** | [layer-laser-frequency.zh-tw.md](layer-laser-frequency.zh-tw.md) |
| **Playground** | `BeamStudio_LaserFrequency_Prototype.html` (ClickUp, not in repo) |

---

## 1. Summary

Only Promark exposes a frequency setting today; on CO2 machines the laser control frequency is fixed
by firmware. A Japanese distributor reported wavy, uneven depth on beamo II line engraving (vector
paths, run the same way as cutting); raising the control frequency to 72 kHz made the result close to beamo.

This feature adds **Laser Frequency** to the layer Advanced settings: per layer, a switch plus a
20–500 kHz value (slider + input). When any exported layer enables it, the task code carries
firmware commands `M137P158Q<Hz>` (set) / `M137P159` (reset to machine default). Firmware 6.5.3
executes them.

## 2. Background & current state

### 2.1 Machine default control frequency

| Machine | Model ID | Default |
|---|---|---|
| beamo II | `fbm2` | 20 kHz |
| Beambox II | `fbb2` | 20 kHz |
| HEXA RF | `fhx2rf` | 25 kHz |
| beamo | `fbm1` | 72 kHz |
| HEXA | `fhexa1` | 336 kHz |

Only the fcode v2 models `fbm2`, `fbb2`, `fhx2rf` support the commands. beamo and HEXA (fcode v1,
4.x firmware) and Ador (fcode v2) do not — see D1/D2. Their defaults are listed for reference only.

### 2.2 Firmware commands (firmware ≥ 6.5.3)

| Command | Effect |
|---|---|
| `M137P158Q<Hz>` | Set laser control frequency, Hz, 1–1,000,000 |
| `M137P159` | Reset laser control frequency to machine default |

### 2.3 Beam Studio today

- Advanced settings render in `ConfigPanel/AdvancedBlock.tsx` as a Collapse for non-Promark
  models (Lower Focus, Auto Focus, Diode, Texture). `paramsLabel.ts:201` `getAdvancedBlockKeys`
  mirrors which keys the block shows.
- `frequency` / `data-frequency` (kHz) already exists for **Promark** (`layer-config-helper.ts:51`,
  default `27` at :131, Promark limits at :725–740). It must not be reused: ordinary layers can
  carry `data-frequency`, so a reused key would emit commands on every layer.
- Switch + value pattern: `FocusBlock.tsx` (sign-encoded value), `TextureBlock.tsx` (boolean key).
- Firmware-too-old pattern: Depth mode `pwm_unavailable` in `handleExportAlerts.ts:80–96`
  (Confirm → `executeFirmwareUpdate`, both buttons abort the export).
- Version table: `version-checker.ts` `requirement`.
- Convert engines (`export-funcs.ts:571`): fluxclient by default; Swiftray when the `path-engine`
  preference is `swiftray` or the device source is Swiftray. Both must emit the commands.

### 2.4 Backends today

- **fluxclient**: layer attrs parsed in `svgeditor_factory.py:452` `_get_layer_params`
  (`attributes_map`). Per-layer output in `toolpath.py:345` loop; the laser-only branch writes
  laser delay at :725–732 via `proc.sync_motion_type2(153, q=…)`. Job end: `xMIN 0004` block at
  :1089. Writers: `sync_motion_type2(cmd, q)` → `M137P<cmd>Q<q>`, `sync_grbl_motion(cmd)` →
  `M137P<cmd>` (`src/toolpath/_toolpath.pyx:466,488`). Model gating via `HWFeature` sets in
  `hw_profile/support_info.py` (`LASER_DELAY` is the newest).
- **Swiftray**: layer attrs parsed in `my_qsvg_handler_qt6.cpp` `createGNode` (~:2900–2970) into
  `BeamLayerConfig` (`mysvg-types.h`) → `Layer::setParameters` (`layer.cpp:295`). All non-Promark
  FLUX models export through `ToolpathExporterFcode`; layer loop `convertStack()` :359–380,
  `convertLayer()` :471 (laser delay at :622–629), job end `xMIN 0004` at :430. Writer
  `proc.sync_motion_type2(cmd, q = NAN)` omits Q when NaN. Gating via `SupportInfo` /
  `SUPPORT_INFO` (`toolpath-exporter-constants.h:62`).

## 3. Goals & non-goals

**Goals**
- **G1** CO2 laser layers on supported models can set their own laser frequency (20–500 kHz). The
  setting applies to everything the layer outputs — vector paths (line engraving, cutting) and
  fill / bitmap engraving alike.
- **G2** Tasks with no layer enabling it produce task code identical to today.
- **G3** When firmware cannot run the command, the user is told to update before the task is sent.

**Non-goals**
- **N1** Firmware implementation.
- **N2** Promark `frequency` unchanged.
- **N3** Presets: laser frequency is not part of material presets.

## 4. Scenarios

- **S1** beamo II line engraving (vector paths) shows wavy depth; the user raises that layer's
  frequency.
- **S2** A file has several CO2 layers; only some of them change frequency, the rest keep the
  machine default. A layer's setting covers both its vector paths and its fills / images.
- **S3** A machine on older firmware receives a task with laser frequency enabled.

## 5. Acceptance criteria

**S1 — enable on a layer**
- Steps: workarea beamo II, select a laser layer, open Advanced, toggle **Laser Frequency** on.
- Result: value input + slider appear, initial value `20` kHz, caption "Machine default: 20 kHz";
  the layer `<g>` carries `data-laserFrequency="20"`. Toggling off removes the value
  (`data-laserFrequency="0"`); undo/redo restore each step.
- Input `5` → clamped to `20`; input `900` → `500`; decimals round to integers.
- Save, reopen the `.beam` file: the setting survives (sanitize whitelist).
- Multiple selected layers with different values show the panel's existing multi-value state.

**S2 — task code**
- Layer 1 on at 72 kHz, Layer 2 off, export to a firmware-6.5.3 machine (or inspect task code):
  `M137P158Q72000` at Layer 1 start, `M137P159` at Layer 1 cleanup; Layer 2 output is unchanged
  (no M137P158/P159 around it).
- Layer 1 contains both paths and a filled shape / image: the single `M137P158Q72000` precedes all
  of Layer 1's output (vector and raster), with no reset between them.
- A layer with laser frequency off is byte-identical to today, whether or not other layers enable
  it; no layer enabled → the whole task is byte-identical to today.

**S3 — firmware check**
- A layer has laser frequency on and device firmware < required version: popup
  `laser_frequency_unavailable`; Confirm opens firmware update, Cancel closes; neither sends.
- Hidden layers do not trigger the check.
- Target device model unsupported (e.g. a beamo II file with 72 kHz layers exported to Ador): no
  alert, task sent; the backend writes no commands.

**Workarea switch (D4)**
- beamo II layer at 72 kHz → switch workarea to HEXA RF: still 72 kHz, caption "Machine default:
  25 kHz".
- beamo II layer at 72 kHz → switch to Ador: block hidden, attribute kept; switch back to beamo II:
  72 kHz shown again.

**Visibility edge cases**
- Workarea other than `fbm2` / `fbb2` / `fhx2rf` (e.g. beamo, HEXA, Ador, Beambox, Promark): block not shown; an existing
  `data-laserFrequency` on a layer emits nothing.
- Layer module printing or 1064 nm: block not shown; nothing emitted for that layer.
- Curve engraving mode: same as normal (block still shown for laser layers).

## 6. Must not change

| Shared file / function | Caller — expected behaviour |
|---|---|
| `layer-config-helper.ts` `baseConfig`, `ConfigKeyTypeMap` (new key) | `initState`/`getLayerConfig` — other keys unchanged; preset compare (`presetRelatedConfigs`) unchanged since key not added there; `timeRelatedConfigs` unchanged |
| `AdvancedBlock.tsx` | `ConfigPanel.tsx:333,493` — existing blocks and order unchanged; Promark still returns null; printing branch unchanged |
| `paramsLabel.ts` `getAdvancedBlockKeys` | params label — existing keys unchanged, new key only on supported laser layers |
| `workarea-constants.ts` `WorkArea` (new optional field) | all `getWorkarea` callers — unaffected (optional field) |
| `handleExportAlerts.ts` | `handleExportClick.ts:58` — existing alerts and order unchanged; new check only when a visible layer enables the feature |
| `version-checker.ts` `requirement` | all `meetRequirement` callers — new key only |
| `sanitize.js` `g` whitelist | file load — only adds `data-laserFrequency` |
| fluxclient `toolpath.py` layer loop (MAIN block start / cleanup) | all fcode exports — no new commands unless a layer has the attr and the model has `LASER_FREQUENCY` |
| Swiftray `toolpath-exporter-fcode.cpp` `convertLayer` / `convertStack` | all non-Promark fcode exports — same as above |

## 7. Design

### 7.1 Data model (beam-studio)

- New config key `laserFrequency` → `data-laserFrequency`, **kHz integer, `0` = off**. Default
  `baseConfig.laserFrequency = 0`. One attribute, no separate enable flag.
- Supported models and their default: new optional `WorkArea.defaultLaserFrequency` (kHz) on
  `fbm2` (20), `fbb2` (20), `fhx2rf` (25). Presence = supported (R1), value = initial value when toggled on and the
  "Machine default" caption.
- Whitelist `data-laserFrequency` in `sanitize.js` `g` list.
- Not in `presetRelatedConfigs`, not in `timeRelatedConfigs`.

### 7.2 UI

- `ConfigPanel/LaserFrequencyBlock.tsx`: Switch row with tooltip (`laser_frequency_desc`); when
  on, `NumberBlock` (`configKey="laserFrequency"`, min 20, max 500, precision 0, `hasSlider`,
  unit kHz) + caption `laser_frequency_default`. Toggle writes the model default or `0` to all
  selected layers in one `BatchCommand`, like `TextureBlock`.
- `AdvancedBlock`: pushed after `TextureBlock`, inside the non-printing branch, when
  `workareaObject.defaultLaserFrequency` is set and `module.value !== LayerModule.LASER_1064`.
- `paramsLabel.ts` `getAdvancedBlockKeys` gets the same condition.

### 7.3 Export check

- `version-checker.ts`: `LASER_FREQUENCY: '6.5.3'` (all supported models are on the 6.x line).
- `handleExportAlerts.ts`: after the PWM check, if `getWorkarea(device.model).defaultLaserFrequency`
  is set (same model rule as UI and backends, D4) and any visible layer has
  `data-laserFrequency > 0` and `!vc.meetRequirement('LASER_FREQUENCY')`, show the
  `pwm_unavailable`-style popup with `laser_frequency_unavailable` and return `false`.

### 7.4 Backends (fluxclient and Swiftray, same rule)

- Parse `data-laserFrequency` (kHz, default 0).
- Gate on a new feature flag `LASER_FREQUENCY` (fluxclient `HWFeature`, Swiftray `SupportInfo`)
  for `fbm2`, `fbb2`, `fhx2rf` (D5), and on a CO2 laser module (not printing, not 1064 nm). The
  attribute survives model/module switches in the file, so the backend gate is what keeps R1/R2.
- Per layer, self-contained (D3): when the gated layer's value > 0, emit
  `sync_motion_type2(158, kHz × 1000)` at layer start (after `MAIN` starts, before any vector or
  raster output) and `M137P159` at layer cleanup (beside the focus move-back, before
  `end_task_script_block()`). Layers with value 0 emit nothing (G2). No job-end command.
- Same set/restore pairing as existing per-layer state: focus adjust (`184` down / back) and
  acceleration (`151` reset).

## 8. Data contracts

| Where | Contract |
|---|---|
| Layer `<g>` | `data-laserFrequency="<int kHz>"`, `0` or absent = off |
| Task code | For each layer that is on: `M137P158Q<Hz>` (Hz = kHz × 1000) at layer start, `M137P159` at layer cleanup; nothing for layers that are off |
| i18n | `beambox.right_panel.laser_panel.laser_frequency`, `laser_frequency_desc`, `laser_frequency_default` (`%s` kHz); `topbar.alerts.laser_frequency_unavailable`; reuses `frequency` |

## 9. Rollout (PR plan)

1. beam-studio PR (data model, UI, export check, i18n, PRD).
2. fluxclient PR, tag 2.10.5; bump the `ref:` pin in `.github/workflows/app.cd.{mac,linux,x64}.yml`.
3. Swiftray PR to `develop`.
4. The UI may land before backends ship; until then the attribute is saved but ignored by
   backends — acceptable because the export check blocks old firmware, not old backends.

## 10. Open decisions

1. ~~**D1** Minimum firmware for beamo (`fbm1`) and HEXA (`fhexa1`), which run the legacy 4.x
   line.~~ **Decided 2026-10-27:** fcode v1 machines (4.x firmware) do not support the command;
   both are out of scope.
2. ~~**D2** Should Ador (`ado1`) or Beambox (`fbb1b`/`fbb1p`) be included?~~ **Decided
   2026-10-27:** no. Ador is fcode v2 but its firmware does not support the command; Beambox is
   fcode v1. Supported set is `fbm2`, `fbb2`, `fhx2rf`.
3. ~~**D3** Command placement: product PRD R8 writes P158/P159 at every layer start plus P159 at
   job end whenever any layer is on.~~ **Decided 2026-10-27:** P158 at layer start and P159 at
   layer cleanup, only for layers that are on. Off layers stay byte-identical, no task-wide pass,
   no job-end command.
4. ~~**D4** What happens to the value on a workarea switch?~~ **Decided 2026-10-27:** keep it as
   is (absolute kHz, same 20–500 range on all supported models); no reset in
   `postPresetChange()`. Unsupported models ignore it everywhere — UI hides it, backends gate on
   `LASER_FREQUENCY`, and the export check only runs for supported device models, so a kept value
   never blocks an export.
5. ~~**D5** Backend support table: list the three models, or treat `LASER_FREQUENCY` as a firmware
   feature that is on for every model outside a legacy-firmware list?~~ **Decided 2026-10-28:** list
   it per model in `SUPPORT_INFO` (`fbm2`, `fbb2`, `fhx2rf`) like the other flags; the
   firmware-vs-hardware split is deferred (see §11).

## 11. Risks & follow-ups

- Web users on a stale local FLUX API get no commands (attribute ignored) — same accepted risk as
  printing padding overrides.
- Old firmware ignoring `M137P158` silently is impossible to detect from task code; the export
  check is the only guard.
- Follow-up (D5): split backend support tables into hardware features (opt-in per model) and
  firmware features (on for every model outside a closed `LEGACY_FIRMWARE_MODELS` set), so new
  machines get firmware features without per-model entries. Do it in fluxclient and Swiftray together
  when a second firmware feature appears.
- A task aborted mid-layer never reaches the layer's `M137P159`. Firmware must restore the default
  frequency when a task ends or is aborted (confirm with firmware team); the product PRD's job-end
  reset had the same gap.

## 12. Test plan

| Criterion | Check |
|---|---|
| S1 UI, clamp, undo, multi-value | `LaserFrequencyBlock.spec.tsx`; manual on beamo II workarea |
| S1 persistence | manual save/reopen; sanitize whitelist |
| S1 visibility edges | `AdvancedBlock.spec.tsx` for unsupported model / 1064 / printing |
| S2 task code | fluxclient `tests/toolpath/test_laser_frequency.py` (on/off/mixed: off layers unchanged); Swiftray manual convert + fcode inspection |
| S3 firmware check | `handleExportAlerts.spec.ts` (old firmware + enabled → alert, hidden layer → no alert) |
| G2 regression | fluxclient test: no attr → no P158/P159 |
