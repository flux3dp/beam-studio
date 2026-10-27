# PRD: Layer Laser Frequency

| | |
|---|---|
| **Status** | Draft — not implemented |
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
by firmware. A Japanese distributor reported wavy, uneven depth on beamo II line engraving; raising
the control frequency to 72 kHz made the result close to beamo.

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
- **G1** CO2 laser layers on supported models can set their own laser frequency (20–500 kHz).
- **G2** Tasks with no layer enabling it produce task code identical to today.
- **G3** When firmware cannot run the command, the user is told to update before the task is sent.

**Non-goals**
- **N1** Firmware implementation.
- **N2** Promark `frequency` unchanged.
- **N3** Presets: laser frequency is not part of material presets.

## 4. Scenarios

- **S1** beamo II line engraving shows wavy depth; the user raises the engraving layer's frequency.
- **S2** A file has engraving and cutting layers; only the engraving layer changes frequency.
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
  `M137P158Q72000` before Layer 1, `M137P159` before Layer 2, `M137P159` at job end.
- No layer enabled → no `M137P158` / `M137P159` anywhere (byte-identical to today for the same
  input).

**S3 — firmware check**
- A layer has laser frequency on and device firmware < required version: popup
  `laser_frequency_unavailable`; Confirm opens firmware update, Cancel closes; neither sends.
- Hidden layers do not trigger the check.

**Visibility edge cases**
- Workarea not in §2.1 (e.g. Ador, Beambox, Promark): block not shown; an existing
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
| fluxclient `toolpath.py` layer loop / `xMIN 0004` | all fcode exports — no new commands unless a layer has the attr and the model has `LASER_FREQUENCY` |
| Swiftray `toolpath-exporter-fcode.cpp` `convertLayer` / `convertStack` | all non-Promark fcode exports — same as above |

## 7. Design

### 7.1 Data model (beam-studio)

- New config key `laserFrequency` → `data-laserFrequency`, **kHz integer, `0` = off**. Default
  `baseConfig.laserFrequency = 0`. One attribute, no separate enable flag.
- Supported models and their default: new optional `WorkArea.defaultLaserFrequency` (kHz) on the
  five models in §2.1. Presence = supported (R1), value = initial value when toggled on and the
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

- `version-checker.ts`: `LASER_FREQUENCY: '6.5.3'` (see open decision D1 for beamo / HEXA).
- `handleExportAlerts.ts`: after the PWM check, if any visible layer has
  `data-laserFrequency > 0` and `!vc.meetRequirement('LASER_FREQUENCY')`, show the
  `pwm_unavailable`-style popup with `laser_frequency_unavailable` and return `false`.

### 7.4 Backends (fluxclient and Swiftray, same rule)

- Parse `data-laserFrequency` (kHz, default 0).
- Gate on a new per-model feature flag `LASER_FREQUENCY` (fluxclient `HWFeature`, Swiftray
  `SupportInfo`) for the five models, and on a CO2 laser module (not printing, not 1064 nm). The
  attribute survives model/module switches in the file, so the backend gate is what keeps R1/R2.
- `any_enabled` = any exported, gated layer with value > 0. If false, emit nothing (G2).
- If true: at each layer start (beside laser delay) emit `sync_motion_type2(158, kHz × 1000)` when
  the layer's value > 0, else `M137P159`; in the `xMIN 0004` post-task block emit `M137P159`.
- v1 fcode models (`fbm1`, `fhexa1`) have no script blocks; the commands go inline at the same
  points.

## 8. Data contracts

| Where | Contract |
|---|---|
| Layer `<g>` | `data-laserFrequency="<int kHz>"`, `0` or absent = off |
| Task code | `M137P158Q<Hz>` (Hz = kHz × 1000) per layer when on; `M137P159` per layer when off; `M137P159` at job end; nothing when no layer is on |
| i18n | `beambox.right_panel.laser_panel.laser_frequency`, `laser_frequency_desc`, `laser_frequency_default` (`%s` kHz); `topbar.alerts.laser_frequency_unavailable`; reuses `frequency` |

## 9. Rollout (PR plan)

1. beam-studio PR (data model, UI, export check, i18n, PRD).
2. fluxclient PR, tag 2.10.5; bump the `ref:` pin in `.github/workflows/app.cd.{mac,linux,x64}.yml`.
3. Swiftray PR to `develop`.
4. The UI may land before backends ship; until then the attribute is saved but ignored by
   backends — acceptable because the export check blocks old firmware, not old backends.

## 10. Open decisions

1. **D1** beamo (`fbm1`) and HEXA (`fhexa1`) run the legacy 4.x firmware line
   (`legacyBeamSeriesModelsArray`, `JOB_ORIGIN: '4.3.5'`). A single `>= 6.5.3` check would always
   block them. Need the minimum version for these two, or drop them from this release.
2. **D2** Should Ador (`ado1`) or Beambox (`fbb1b`/`fbb1p`) be included? Not in the product PRD;
   excluded for now.

## 11. Risks & follow-ups

- Web users on a stale local FLUX API get no commands (attribute ignored) — same accepted risk as
  printing padding overrides.
- Old firmware ignoring `M137P158` silently is impossible to detect from task code; the export
  check is the only guard.

## 12. Test plan

| Criterion | Check |
|---|---|
| S1 UI, clamp, undo, multi-value | `LaserFrequencyBlock.spec.tsx`; manual on beamo II workarea |
| S1 persistence | manual save/reopen; sanitize whitelist |
| S1 visibility edges | `AdvancedBlock.spec.tsx` for unsupported model / 1064 / printing |
| S2 task code | fluxclient `tests/toolpath/test_laser_frequency.py` (on/off/none); Swiftray manual convert + fcode inspection |
| S3 firmware check | `handleExportAlerts.spec.ts` (old firmware + enabled → alert, hidden layer → no alert) |
| G2 regression | fluxclient test: no attr → no P158/P159 |
