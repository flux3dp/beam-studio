---
name: inner-engraving
description: Inner engraving (內雕) on Promark UV — the 3D canvas mode, the dual SVG-projection + stlStore representation of 3D objects, STL/extrusion/photo import (plus the dev photo→point-cloud), 3D transforms and undo, layer-level engraving params (`data-stl-*` on the layer `<g>`), .beam blocks 6/7, and the Swiftray stlObjects/pointCloudObjects payload. Use when working on components/beambox/InnerEngraving/, svgedit/stl/, operations/import/importStl/, stores/stlStore.ts, helpers/addOn/innerEngraving.ts, the inner engraving ConfigPanel blocks or MaterialTestGeneratorPanel/InnerEngraving/, or any code path that must behave differently for `data-stl` projections.
---

# Inner Engraving (3D sub-surface engraving)

## Purpose

A document mode for Promark UV (`fpm1` + `LaserType.UV`, 70 mm field) that replaces the 2D SVG
canvas with a react-three-fiber scene. Users import meshes (STL), extrude 2D artwork, or place
photos inside a transparent workpiece; Swiftray slices them and compensates for refraction.

The core design choice: **every 3D object is two things that share one id** — an SVG projection
element in a normal layer (so layers, selection, undo, clipboard, .beam and export reuse the 2D
machinery unchanged) and a runtime object in `useStlStore` holding the geometry and 3D transform.
Most bugs in this feature are the two halves drifting apart.

## File Locations

All paths under `packages/core/src/web/` unless noted.

- `helpers/addOn/innerEngraving.ts` — capability + toggle (`checkInnerEngraving`, `getInnerEngraving`,
  `isInnerEngravingActive`, `useInnerEngravingActive`, `PROMARK_UV_INFO`,
  `INNER_ENGRAVING_DISABLED_MENU_ITEMS`, `isInnerEngravingFile`)
- `helpers/exclusiveModes.ts` — `inner-engraving` is one of the exclusive document modes (with
  rotary, pass-through, auto-feeder, curve-engraving); highest priority in `getActiveExclusiveMode`
- `app/actions/canvas/innerEngravingMode.ts` — `switchInnerEngravingMode` (new-document switch)
- `app/svgedit/operations/import/innerEngravingGate.ts` — `ensureModeForImport`,
  `resolveInnerEngravingForFile`
- `app/stores/stlStore.ts` — `StlObject`, `StlTransform`, `useStlStore`
- `app/svgedit/stl/` — attribute constants, DOM↔store sync, sources, clipboard, extrusion,
  photo plane, point cloud (BSPC), downgrade, engraving params
- `app/svgedit/operations/import/importStl/` — STL file import, `create3dObject`, path/text/element
  extrusion, pre-check (file size / triangle count)
- `app/svgedit/operations/import/importPhotoPlane.ts`
- `app/components/beambox/InnerEngraving/` — canvas, meshes, gizmo, view/zoom, `viewStore.ts`,
  `utils/` (projection, transform, coordinates, selection, material, engravable, thumbnail)
- `app/components/beambox/RightPanel/DimensionPanel/DimensionPanelStl.tsx`,
  `RightPanel/ActionsPanelStl.tsx`, `RightPanel/OptionsBlocks/ThreeDOptions.tsx`,
  `RightPanel/OptionsBlocks/useThreeDSourceOptions.ts`
- `app/components/dialogs/InnerEngravingSettings.tsx` + `DocumentSettings/InnerEngravingBlock.tsx` —
  material (shape/size/position/refractive index), safety margin. Shape is `box` unless `isUvDev()`,
  which also offers cylinder / sphere; read it through `getMaterialShape` (`InnerEngraving/utils/material.ts`)
- `app/constants/innerEngraving.ts` — material defaults and limits;
  `app/constants/promark-constants.ts` — `UV_INNER_ENGRAVING_WORKAREA = 70`
- Export: `app/actions/beambox/export/getStlObjects.ts`, `getPointCloudObjects.ts`,
  `export/GoButton/checkInnerEngravingObjects.ts`, `export-funcs-swiftray.ts`,
  `helpers/api/swiftray-client.ts`, `helpers/api/svg-laser-parser.ts`
- Persistence: `helpers/beam-file-helper.ts`, `app/svgedit/operations/import/importBvg.ts`,
  `app/svgedit/svgcanvas.ts` (`data-inner-engraving` on `#svgcontent`)
- Layer params / UI: `helpers/layer/layer-config-helper.ts` (`innerEngravingConfigKeys`,
  `innerEngravingDefaults`), `app/svgedit/stl/engravingParams.ts`,
  `RightPanel/ConfigPanel/{EngravingModeBlock,SolidBlock,getInnerEngravingBlocks,PowerBlock,usePromarkLimit}`,
  `helpers/layer/uvPowerFrequency.ts`; presets in `app/constants/presets.ts` (`k9_crystal_*`)
- 3D material test: `app/components/dialogs/MaterialTestGeneratorPanel/InnerEngraving/` (`index.tsx`,
  `generate.ts`, `layout.ts`, `ForceTransformForm.tsx`), table in `MaterialTestGeneratorPanel/TableSetting.ts`
- Framing: `helpers/device/framing.ts`

## Mode: capability, toggle, switching

- **Active = capability AND toggle.** `checkInnerEngraving` requires `checkFpm1UV()`, the add-on info
  flag, `promarkInfo.laserType === UV`, workarea `fpm1`, and `customized-dimension.fpm1` of exactly
  70×70. `getInnerEngraving` adds the documentStore flag `inner-engraving`. Never read
  `useDocumentStore` `'inner-engraving'` directly to decide behaviour — call
  `isInnerEngravingActive()` / `useInnerEngravingActive()` so a UV document opened on another
  machine stays 2D.
- `checkFpm1UV()` (`helpers/checkFeature.ts`) is `!isWeb() && (enableAllMachines || isDev())`,
  so the mode is desktop-only.
- `enableInnerEngraving` writes the 70 mm customized dimension + flag and (unless
  `applyRuntime: false`) calls `setPromarkInfo(PROMARK_UV_INFO)`.
- **Switching 2D↔3D is a new-document operation.** `switchInnerEngravingMode(enabled, { promarkInfo,
  workarea })` calls `svgEditor.clearScene()` (save prompt; cancelling cancels the switch and the
  caller's follow-up), then enable/disable, then `changeWorkarea` *after* the dimension is stored.
  `svgCanvas.clear()` calls `useStlStore.getState().clear()`. Callers: DocumentSettings save and
  `ensureModeForImport`.
- **Import gating**: `svg-editor.ts` `MODE_GATED_TYPES` — `stl` needs 3D; `dxf/pdf/ai` need 2D;
  each mismatch asks to switch via `ensureModeForImport`. Bitmaps and SVG are not gated:
  `importBitmap` routes to `importPhotoPlane`, and an SVG file to `importSvgFileAsStl`, when active.
- **File flag**: `getSvgString` sets `data-inner-engraving="true"` on `#svgcontent`. `importBvg`
  reads it by regex from the raw string and calls `resolveInnerEngravingForFile` (asks only when a
  workarea change is needed). If declined/unavailable, `downgradeInnerEngravingElements` strips every
  `data-stl*` attribute so the rects open as ordinary 2D shapes. The .beam header metadata (beside
  `contents` / `version`) also carries `innerEngraving: true` when the file has any 3D object — mesh,
  photo plane or point cloud — not merely when the mode is on; `readBeamFileInfo` reads it by regex
  for file-browser thumbnails.

### What the mode disables

- Menu items in `INNER_ENGRAVING_DISABLED_MENU_ITEMS` (anti-aliasing, auto align, offset, decompose
  path / disassemble use, image tools, flat exports incl. BVG/SVG/PNG/JPG/UV print, 2D material tests
  and the acrylic focus probe, curve engraving, tutorials) — applied by `beambox-global-interaction.ts`
  `onInnerEngravingChange` via a documentStore subscription. Leaving the mode enables them again and
  then calls `menu.checkCurveEngraving()` (`helpers/menubar/AbstractMenu.ts`), so curve engraving's own
  conditions win; the web top-bar menu (`TopBar/useMenuData.ts`) reads the same state from
  `menuItemStatusStore`.
- Auto align: `svgedit/autoAlign/index.ts` `isEnabled()` returns false when active.
- Curve engraving: mutually exclusive mode; `curveEngravingModeController.checkSupport` →
  `canStartCurveEngraving()`.
- `writeDataLayer(..., 'repeat', ...)` forces `1` when active (`helpers/layer/layer-config-helper.ts`);
  `ConfigPanel` hides `DpiBlock`, `FillIntervalBlock` and `RepeatBlock` (speed / dotting time follow
  `getInnerEngravingBlocks`, see below); `SvgEditor` hides `Ruler` and `DpiInfo`.
- **Single selection**: `SelectionManager.setSelectedElements` / `addToSelection` /
  `tempGroupSelectedElements` keep only the last element — no multi-select or temp groups.
- Path Preview is available (it draws the dots from the job's gcode, see the `path-preview`
  skill). The Generators drawer and left-panel button are
  hidden except under `isUvDev()` (`DrawingToolButtonGroup.tsx` `supportedIn3D`; `SvgEditor.tsx`
  also requires a non-mobile layout for the drawer), where `getGenerators({ isInnerEngraving: true })` lists only the 3D material test.

## Dual representation

| Side | Where | Holds |
|---|---|---|
| Projection | `<rect data-stl="1">` (mesh; `data-stl-kind="point-cloud"` for a standalone point cloud, which only uv-dev-built files contain) or `<image data-stl-photo>` (photo) in a layer | XY AABB of the transformed object, `data-stl-matrix`, `data-stl-transform`; its own `fill` has no effect |
| Runtime | `useStlStore.objects[id]` | `geometry` (three.js, mm, never mutated), `buffer` (original STL bytes), `pointCloudBuffer` (BSPC), `textureUrl`, `transform`, `initialTransform`, `kind?: 'mesh' \| 'photo' \| 'point-cloud'` |

- **Data flows one way: store → rect.** `updateProjectionRect(elem, geometry, matrix, transforms?)`
  (`InnerEngraving/utils/projection.ts`) writes x/y/width/height, `data-stl-matrix`, and (when
  given) `data-stl-transform`. Never write the rect's geometry from 2D code; change the transform and
  re-project. `DimensionPanelStl` exists because the 2D DimensionPanel would edit the derived rect.
- **Coordinates**: scene unit = 0.1 mm (`MM_TO_SCENE = constant.dpmm`), X right, **Y toward the
  back**, Z up, origin = near-left corner at focus height. SVG Y is flipped; the flip happens once in
  `toSvgMatrix` inside `projection.ts`. `data-stl-matrix` is column-major, canvas space, already
  includes mm→scene — downstream code must not convert again.
- `StlTransform` is stored **decomposed** (`position` = centre in scene units, Euler XYZ `rotation`,
  positive `scale` relative to mm size, separate `flip`), never re-derived from a matrix;
  `utils/transform.ts` `getMatrix` composes it.
- **The rect is the object's existence.** `getStlSources` / `getPointCloudSources` (`stl/sources.ts`)
  iterate DOM markers, not the store, so deleted/undone objects never ship.
- `isStlProjection` / `isPhotoPlaneProjection` / `is3dProjection` (`stl/getters.ts`) — use these
  anywhere code dispatches on `tagName`; a projection *is* a `<rect>`/`<image>`.
  `selectedElementStore` reports `nodeType: 'stl'`.
- **Sync** (`stl/sync.ts`): anything that inserts/removes projections (import, .beam load, delete,
  paste/duplicate/array, layer delete/clone) must call `syncStlObjectsWithDom(objects)` both when it
  acts **and** in its command's `onAfter`, so undo/redo add/remove meshes with rects.
  `collectStlObjects` walks into layer groups; `createClonedStlObjects` re-keys in-place copies
  (shares geometry/buffers). Clipboard: `stl/clipboard.ts` (`createPastedStlObject`,
  `syncStlTransformsFromRects`, `moveStlObjectsByCanvasDelta` for arrow keys in `svg-editor.ts`).
- Selection: `selectStlObject(id)` (`utils/selection.ts`) sets `stlStore.selectedId` *and* svgedit
  selection *and* the layer. Don't call `setSelectedId` directly from click handlers.
- Mesh colour/visibility/lock come from the projection's owning layer (`useObjectLayerState` /
  `getObjectLayerState` in `utils/useLayerColor.ts`, subscribed to `useLayerStore`), so any layer
  store update re-renders the meshes. Layer ops that change the DOM without one must publish it:
  `setLayerVisibility` calls `layerManager.resync()` in the mode (`mergeLayers` already ends with
  `identifyLayers`, and undo/redo resync centrally).

### `data-*` attributes (`app/svgedit/stl/constants.ts`)

`STL_ATTR` (`data-stl`, `-kind`, `-matrix`, `-source`, `-transform`), `PHOTO_3D_ATTR`
(`data-stl-photo`, `-photo-width`, `-photo-height`), `POINT_CLOUD_ATTR.marker`
(`data-stl-point-cloud`, value = BSPC version). **Every new one must be added to
`packages/core/public/js/lib/svgeditor/sanitize.js`** under the right tag (`rect` list for meshes,
`image` list for photos), or it vanishes on reopen.

### Engraving parameters live on the layer

How objects are engraved is a **layer** parameter, not an object one (`innerEngravingConfigKeys`
in `helpers/layer/layer-config-helper.ts`), because dot / line decides which laser parameters fit:

| Key | Layer attribute | Meaning |
|---|---|---|
| `stlMode` | `data-stl-mode` | `dot` (default) / `line` |
| `stlPointSpacing` | `data-stl-point-spacing` | mm, blue-noise dot distance; also a photo's dot pitch (not DPI) |
| `stlLayerSpacing` | `data-stl-layer-spacing` | mm, line Z step and Thick Contour inward-shell step |
| `stlMinLayerSpacing` | `data-stl-min-layer-spacing` | mm, > 0 = adaptive line slicing |
| `stlSolid` | `data-stl-solid` | dot mode only, shown as **Thick Contour** (`inner_engraving_settings.thick_contour`): also dot up to 2 inward shells (Swiftray `max_shell_count` 3); the stored key keeps the old name |

- Swiftray reads them off the layer `<g>` (`createGNode` → `Layer::stl*`) and copies them onto each
  object when it is collected (`ToolpathExporter::resolveStlPlacement`); nothing is read off the
  rect. The defaults are the measured K9 values and match `kDefaultStl*` in `toolpath-exporter.cpp`.
- Photos and point clouds are always dotted; meshes follow the mode. There is no line + fill mode.
- Written only while inner engraving is on: `getConfigKeys`, `getDefaultConfig` and the layer
  readers (`getLayerConfig` / `getLayersConfig` / `cloneLayerConfig`) leave them out otherwise, so
  2D layers never carry `data-stl-*`.
- UI: `EngravingModeBlock`, `SolidBlock` and the point / layer spacing `NumberBlock`s in
  `ConfigPanel`; adaptive spacing in `AdvancedSettingModal`. `getInnerEngravingBlocks` decides what
  shows (a layer holding a photo, `layerStore.hasStlPhoto`, always shows the dot parameters). Speed
  shows only in line mode, dotting time with the dot parameters. (Q pulse width in `DevBlock` is a general
  Promark UV dev field under `isDev()`, not an inner-engraving one.)
- With the mode on, `getDefaultConfig` applies `innerEngravingDefaults` (110 kHz, dotting 150 µs,
  speed 180, dot mode, default spacings, not solid).
- UV power is a stand-in for frequency (`helpers/layer/uvPowerFrequency.ts`, measured 40–200 kHz
  table; `UV_FREQUENCY_LIMIT` / `UV_POWER_LIMIT`): `PowerBlock` displays the power derived from
  `frequency` and writes both, so the frequency is the value Swiftray uses. Limits come from
  `usePromarkLimit`; the slider starts at `Math.ceil(min)` (16 %) in whole steps, while the input
  still accepts the decimal minimum (~15.6 %).
- Presets: an inner engraving document uses its own preset model `fpm1_inner_engraving`
  (`getPresetModel`), with `k9_crystal_contour_dot` / `k9_crystal_contour_line` / `k9_crystal_solid_dot`.
  Switching the mode keeps every other value; applying the other preset is how to change them.
  `applyPreset` leaves non-forced keys a preset omits untouched, so each preset sets every option of
  its mode: contour dot sets `stlSolid: false`, contour line sets `stlMinLayerSpacing: 0`.
- UV power and frequency on a layer are kept in step by `writeUvPowerFrequency`
  (`layer-config-helper.ts`): the **power wins** when there is one (clamped to 15.6–100 %, the
  frequency derived from it), so `postPresetChange` (source / machine / preset change) and a custom
  preset that carries both never turn a layer brought over from another source into 100 %; only the
  frequency-only default UV presets go the other way. `syncUvLayerFrequency` applies the same rule
  when the source becomes UV (document settings, or `registerPromarkInfoListener` on machine
  selection).
- 3D material test (`MaterialTestGeneratorPanel/InnerEngraving/`, generator drawer under `isUvDev()`):
  `TableSetting.ts` `getInnerEngravingTableSetting` is the only table with a `dottingTime` axis, plus
  `pointSpacing`; it has no repeat, fill interval or UV heat axes. Blocks go on `stlMode: 'dot'` layers,
  the labels on a layer set to `stlMode: 'line'`. `generate.ts` nests `create3dObject` commands.
  `generateSvgInfo({ withStaticParams })` attaches the table's fixed params (`Detail.default`) to each
  block only when true — the 3D table and the 2D UV table pass it; otherwise blocks keep the layer
  defaults (see the FIXME in `generateSvgInfo.ts`).
- `getStlEngravingParams(elem)` (`stl/engravingParams.ts`) reads them off the object's layer.

## Import paths

- **STL file** → `importStl(file)`: `preCheck.tsx` (size/triangle warnings, binary detected by size
  arithmetic, not the `solid` header), STLLoader, `getInitialTransform` (centred on the engravable
  box; offers — never forces — scale-down), `create3dObject` (rect + store + `BatchCommand` with
  `onAfter = syncStlObjectsWithDom`), `selectStlObject`. `create3dObject` is synchronous and returns
  the command for callers to record (material-test generator nests it).
- **2D → extrusion** (`stl/extrusionSource.ts`): `createExtrusionSource` serializes the editable
  SVG into `data-stl-source`; `buildExtrusion` runs three's `SVGLoader` → flatten → `ExtrudeGeometry`
  → `STLExporter` so the result is a real STL buffer. Curves are flattened by chord tolerance:
  `FLATTEN_TOLERANCE_MM = 1 / 80 / 2` (half a pixel at 2000 DPI), divided by `source.scale` into
  source units; segment count per curve comes from `getSegmentCount`. Entry points:
  `importPathAsStl` / `importSvgElementAsStl` (Element panel + Noun Project, `importElement.tsx`),
  `importTextAsStl` (outlines text via `outlineText`; replaces the `<text>` and merges into the
  previous undo step with `undoManager.appendCommandToLast`), `insertDefaultTextAsStl` (left-panel
  text tools); it is placed at the engravable box centre (incl. Z) when the box is valid, else the
  work-area centre at half the material height. Editing the retained source later goes through
  `setExtrusionSource` (an `ExtrusionSourceCommand`): text edits from `useThreeDSourceOptions` pass
  `mergeWithPreviousHistory` and fold into the last step via `appendCommandToLast`; rounded-corner /
  polygon-sides edits make their own step. `extrusionSourceEvents` emits `'changed'`.
- **SVG file** → `importSvgFileAsStl` (`importStl/importSvgFile.ts`): fluxghost divides it as a
  single layer (`uploadAndDivideSvg(..., 'nolayer')`), `parseSvg` sizes it like the 2D import (its
  defs symbol is read and removed), and `unitePathData` (paper.js, `applyMatrix: true`) unites every
  path into **one** 1mm extrusion — one object, because only one can be selected at a time; joined
  without union if paper.js fails. No retained source. An embedded bitmap becomes its own photo plane
  (`initializePhotoPlane(elem, { position, scale })`) placed relative to the artwork via
  `bitmapOffset`; the pair keeps its real size and is centred on the engravable box, and when it
  does not fit, shrinking it together is offered with the STL prompt (`askToScaleDown`, asked with
  the progress closed). One `Import SVG` batch.
- **Photo** → `importPhotoPlane`: `readBitmapFile` + `initializePhotoPlane` (zero-thickness plane,
  `kind: 'photo'`, at the engravable box centre incl. Z and shrunk to fit it when the box is valid,
  else the work-area centre at half the material height). Optional (`isUvDev()`) test point cloud:
  `generatePhotoPointCloud` (`stl/photoPointCloudGenerator.ts`, grayscale → XYZ, 256 Z levels) →
  `applyPhotoPointCloud` (`PhotoPointCloudCommand`, keeps the image as source, adds
  `data-stl-point-cloud`). BSPC format: `stl/pointCloud.ts` (`'BSPC'`, version, XYZ float32 LE, no colour).
- There is no direct point-cloud file import (`create3dObject` / `insertStlGeometry` only build
  meshes). Standalone point clouds exist only in .beam files from uv-dev builds: block 7 plus a
  `data-stl` rect of `data-stl-kind="point-cloud"`, rebuilt by `readPointCloudSource`.

## Rendering (`components/beambox/InnerEngraving/`)

- `SvgEditor.tsx` hides the SVG workarea (`styles.hidden`) and mounts `InnerEngravingCanvas`
  (r3f `Canvas`, OrbitControls, `GizmoHelper`, `MaterialShape`, `SceneGrid`, `SceneRuler`).
- `StlMesh.tsx`: anchor group (position/rotation/scale) + inner mesh (flip + centre shift);
  `<points>` for point clouds. drei `TransformControls`: mid-drag only re-projects the rect
  (no transform attr, no history); `handleDragEnd` commits once via `setTransform`, and only when the
  drag actually moved the object (`hasDragged` ref), so a click on the gizmo adds no undo step.
- `viewStore.ts`: transform mode, projection (perspective/orthographic), view presets, zoom.
  `CanvasControls.tsx` (`ObjectControls`, `ViewControls`) are mounted by `SvgEditor/CanvasControl.tsx`.
- Camera preview on the 3D canvas: `useCameraPreviewStore.backgroundUrl` (set by
  `preview-mode-background-drawer.ts`) is a textured floor plane; `PreviewInteractionPlane` maps
  clicks/drags through `toCameraPreviewPoint` to `previewModeController.preview/previewRegion`.
- `.beam` thumbnails come from `utils/thumbnail.ts` `renderInnerEngravingThumbnail`.

## Transforms & history

- `setTransform(object, transform, { addToHistory = true, parentCmd })` (`utils/transform.ts`):
  store write + re-project + `StlTransformCommand` (pushed to `parentCmd` or `undoManager`). The
  command's `elements()` returns the rect; `restore` no-ops if the object is already gone.
- Everything outside the gizmo moves objects through `setTransform` (`DimensionPanelStl`,
  `ActionsPanelStl` → `fitObjectTo` / `moveObjectCenterTo`, clipboard corrections). A bare
  `stlStore.setTransform` leaves the rect — and framing, export, .beam — stale.
- `undoManager.appendCommandToLast(cmd, text, expectedElement?)` folds an async follow-up into the
  latest step, falling back to a new step if the pointer moved or the last step does not involve
  `expectedElement`.

## Persistence (.beam)

- Block 6 `stlSource` (id → original STL bytes) and block 7 `pointCloudSource` (id → BSPC), both
  appended after the standard blocks; the header keeps block 5's zero-length slot. Header block list
  is computed from what exists.
- Read: meshes need a matching projection with a parseable `data-stl-transform`, otherwise
  skipped with a console warning. Photos rebuild from the SVG via `readPhotoPlaneObjects`. One
  `syncStlObjectsWithDom` in `postReadBeam` (also the load command's `onAfter`).
- `importBvg` calls `useStlStore.getState().clear()` after replacing `svgcontent`. Known limit
  (commented there): undoing a file load restores rects but not their meshes.
- `.bvg` cannot carry meshes, hence `EXPORT_BVG` is disabled in the mode.

## Export / backend (Swiftray only)

- `handleExportAlerts`: `checkInnerEngravingObjects` (AABB-based warnings over every
  `[data-stl], [data-stl-photo]` in visible layers, so photo planes are checked too), focus reminder,
  `swiftrayClient.checkVersion('SWIFTRAY_SUPPORT_STL')` when a `data-stl` exists and
  `'SWIFTRAY_SUPPORT_POINT_CLOUD'` when a `data-stl-photo` exists (`helpers/version-checker.ts`,
  both 1.5.0).
- `export-funcs-swiftray.ts`: the task flow collects `pointCloudObjects = await getPointCloudObjects()`
  (from the store, keyed by `data-stl-point-cloud` projections) **before**
  `preparePhotoPlaneElementsForExport()` (`stl/photoPlane.ts`; temporarily adds `data-stl="1"` +
  `data-stl-kind="photo"` to plain photos and swaps photo point-cloud images for typed placeholder
  rects), then passes it to `generateUploadFile(thumbnail, url, { pointCloudObjects })`, which adds
  `stlObjects = await getStlObjects()` (framing opts out with `withStlObjects: false`). Both are
  base64 (`toBase64` via FileReader; Swiftray decodes frames as UTF-8) keyed by projection id.
- `swiftray-client.ts` `loadSVG` lifts `stlObjects` / `pointCloudObjects` out of `file` to the top
  level of params; logs `failedStlObjects` / `failedPointCloudObjects`.
- `svg-laser-parser.ts` `getExportOpt`: when active sets `refractive_index`, `material_height`,
  `material_min_z/max_z` (Swiftray applies an axial refraction model, depth / n)
  and the Promark controller config `INNER_ENGRAVING_CONTROLLER_CONFIG` (`inner_engraving: 1`,
  `is_uv_light: 1`, jump delays 1000us, laser on/off delays 150us). `inner_engraving: 1` is what
  switches Swiftray to its inner engraving time model (`;CONFIG INNER_ENGRAVING=1`); 2D jobs,
  UV included, keep the pre-inner-engraving estimate, so never send it outside this gate. Under `isUvDev()` on fpm1 + UV (inner engraving or
  not), numeric localStorage keys (`laser_on_delay`, `laser_off_delay`, `marking_delay`,
  `corner_delay`, `jump_speed`, `jump_delay_min/max`, `is_uv_light`, `machine_z_bucket`, the last
  floored at `MIN_MACHINE_Z_BUCKET_MM = 0.001`) override them. Separately, `isUvDev()` +
  `localStorage.first_pulse_killer_enabled === 'true'` sends `first_pulse_killer_enabled` (any model).
- Framing in the mode offers `Material` and `Framing` types (`helpers/device/framing.ts`); the
  `Material` outline uses `getMaterialShape`, so it is a rectangle unless uvDev keeps a round shape.

## Dev gates (`helpers/is-dev.ts`)

- UV / inner engraving availability itself is `checkFpm1UV()`, gated on the shared `isDev()` (or `enableAllMachines`).
- `isUvDev()` = `localStorage.uvDev === 'true'`: test point cloud in `ThreeDOptions`; the Generators
  drawer/button in 3D (3D material-test generator); cylinder / sphere materials (offered in
  `InnerEngravingSettings`, and `getMaterialShape` in `InnerEngraving/utils/material.ts` reads a stored
  round shape as `box` otherwise — material geometry, settings dialog and framing all go through it);
  UV heat-test params (`fillInterleave`, `fillDwellTime`, `fillDwellAdaptive`) in
  `AdvancedSettingModal` and as 2D UV material-test axes; Swiftray dev config overrides and
  `first_pulse_killer_enabled` in `svg-laser-parser.ts`.

## Invariants & gotchas

- Gate on `isInnerEngravingActive()`, not on the raw document flag or the presence of STL rects.
- Never edit a projection's x/y/width/height directly; never mutate `geometry`.
- Any new code path that adds/removes/copies projections must sync the store (act + `onAfter`).
- `stlStore.remove`/`clear` dispose geometry; shared geometry (paste/clone) is re-uploaded by three.js.
- Scene↔SVG Y flip happens only in `projection.ts`; `sceneToSvgY`/`sceneToSvgYMm` for one-off reads.
- New `data-stl*` attributes → `sanitize.js` whitelist, `downgrade.ts` already strips by prefix.

## Testing

- Specs are colocated: `svgedit/stl/*.spec.ts`, `operations/import/importStl/*.spec.ts`,
  `innerEngravingGate.spec.ts`, `helpers/addOn/*.spec.ts`, `helpers/exclusiveModes.spec.ts`,
  `InnerEngraving/utils/*.spec.ts`, `DimensionPanelStl.spec.tsx`, `ThreeDOptions.spec.tsx`,
  `beam-file-helper.spec.ts`, `checkInnerEngravingObjects.spec.ts`, `CanvasControls.spec.tsx`,
  ConfigPanel block specs (`EngravingModeBlock`, `SolidBlock`, `DottingTimeBlock`, `PowerBlock`,
  `DevBlock`, `AdvancedSettingModal`, `getInnerEngravingBlocks`), `layer-config-helper.spec.ts`,
  `uvPowerFrequency.spec.ts`, `deleteLayer.spec.ts`, `layerManager.spec.ts`,
  `innerEngravingMode.spec.ts`, `MaterialTestGeneratorPanel/{TableSetting,generateSvgInfo}.spec.ts`.
- Toggle the mode with an inline mock:
  `jest.mock('@core/helpers/addOn/innerEngraving', () => ({ isInnerEngravingActive: () => mockIsInnerEngravingActive() }))`.
- `useStlStore` is real (zustand mock auto-resets); seed with `useStlStore.getState().set(obj)` or
  `setState`.
- three's `examples/jsm` modules (`STLLoader`, `SVGLoader`, `STLExporter`) are mocked inline in the
  specs that reach them; workarea is commonly `jest.mock('@core/app/svgedit/workarea', () => ({ height, width }))`.
- `SelectionManager.spec.ts` mocks `'../autoAlign'`: autoAlign imports `../selection`, which imports
  SelectionManager — a circular import — and also pulls in `helpers/addOn/innerEngraving`.
- Central mocks: `__mocks__/@core/helpers/is-dev.ts` (`isDev` and `isUvDev` → true, so
  `getMaterialShape` keeps round shapes in specs), `__mocks__/@core/helpers/checkFeature.ts`
  (`checkFpm1UV` → true), and `__mocks__/@core/app/stores/documentStore.ts` (`inner-engraving: false`
  + material defaults). The documentStore mock's `customized-dimension.fpm1` is 150×150, so even the
  real `isInnerEngravingActive()` is false under it; a spec wanting the real helper true must also
  seed a 70×70 `fpm1` dimension, the UV promark info and the add-on flag — hence the inline
  `isInnerEngravingActive` mock above.
