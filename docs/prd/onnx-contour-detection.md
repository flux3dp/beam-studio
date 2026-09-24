# PRD: ONNX contour detection — Auto Fit v2 & image-contour Auto Align

| | |
|---|---|
| **Status** | Merged: fluxghost #122, Swiftray #530 (1.4.11), beam-studio #1006 (Auto Fit v2). In review: beam-studio `feat/snap-to-object-center` (PRs 1 + 5 + 6 + rotation snap) and Swiftray `feat/segment-stability` (detector filters, §5.2). §10 item 2 pending |
| **Author** | Product (AI PM agent) with Dean |
| **Created** | 2026-09-21 |
| **Target product** | Beam Studio desktop (Electron). Web falls back to the OpenCV engine (no Swiftray). |
| **Owner area** | Camera preview, Auto Fit, Auto Align, Swiftray backend |
| **Playground** | `../mini-sam` — validated MobileSAM "segment everything" C++17 tool (ONNX Runtime, CPU). Golden parity 20/20 vs the Python prototype on a beamo II bed capture. |
| **Related code** | Auto Fit: `packages/core/src/web/app/svgedit/operations/autoFit/`, `components/dialogs/autoFit/`, `helpers/api/utils-ws.ts` (`get_all_similar_contours`); Auto Align: `app/svgedit/autoAlign/` (`index.ts` AutoAlignManager, `imageContourDetection.ts`, `utils/getMatchedDiffFromBBox/`, `utils/getMinAreaRect/`, `utils/objectSnap/`), `svgedit/interaction/mouse/index.ts`, `svgedit/utils/findNearestAndFarthestAlignPoints.ts`; Preview: `app/actions/beambox/preview-mode-background-drawer.ts`, `actions/camera/preview-helper/RegionPreviewMixin.ts`; Swiftray client: `helpers/api/swiftray-client.ts`, `app/constants/swiftray-constants.ts`; Preferences: `interfaces/Preference.d.ts`, `actions/beambox/beambox-preference.ts`, `app/stores/globalPreferenceStore.ts`, `components/settings/categories/Camera.tsx` |
| **External repos** | `../swiftray` (C++17 / Qt 6.7.2 / OpenCV already linked; ws server on 6611), `../fluxghost` (`fluxghost/api/utils.py`, `fluxghost/utils/contour/`) |

---

## 1. Summary

Beam Studio detects objects on the camera preview in exactly one place today: **Auto Fit** sends the composited preview PNG to fluxghost, which runs Canny + HSV-gradient edge detection, groups similar shapes and returns per-shape `{bbox, center, angle, contour}`. The classic-CV stage is the weak link: boundaries depend on lighting, wood grain, glare and the Canny thresholds, so results are unstable across materials.

This PRD replaces the *detection* stage with a **MobileSAM ONNX model** hosted in **Swiftray** (the C++ backend Beam Studio already spawns and talks to on port 6611), and uses that same detector for a **new feature: image-contour Auto Align** — while the camera preview is being taken, Beam Studio detects the physical objects on the bed and adds their bounding boxes (corners, edge midpoints, centre) to the existing Auto Align snap points, so a design can be snapped to the centre or the sides of a real object without any dialog.

Three design choices drive everything else:

1. **One detector, one contract.** A single frontend function `detectContours(blob, opts)` returns the existing `AutoFitContour` shape from either engine. Auto Fit and image-contour align both consume it; grouping/rotation matching for Auto Fit stays in fluxghost (already validated) and is fed the ONNX contours instead of Canny ones.
2. **Engine is a preference with silent fallback.** `contour_detection_engine: 'onnx' | 'opencv'` (default `onnx`). Effective engine = `onnx` only when Swiftray is present and new enough; otherwise OpenCV via fluxghost, no user action needed. A one-time perf warning on weak machines (Windows < 8 GB RAM, Intel Mac) offers the OpenCV switch.
3. **Detect while previewing, per batch.** Each preview tile that lands marks the background dirty; when the batch ends the whole preview canvas is re-detected and the list replaced. The user sees `Detecting contours…` / `Contours detected` toasts and never waits on a dialog.

A prerequisite refactor moves all Auto Align state and helpers out of `svgcanvas.ts` into a standalone `app/svgedit/autoAlign/` module (`svgCanvas.isAutoAlign` and nine sibling methods today).

---

## 2. Background & current state

### 2.1 Auto Fit today

- Entry: `ActionsPanel.tsx` → `autoFit(elem)` (`operations/autoFit/autoFit.ts`). No preference or model gating; runtime guard `preview_first`.
- Image: `previewModeBackgroundDrawer.getCameraCanvasUrl()` — the **composited preview canvas**, fisheye-corrected on the machine, **10 px/mm** (`Constant.dpmm`), e.g. 3000×2100 for a 300×210 mm bed. `isSplicingImg = !isFullWorkareaDrawn`.
- Transport: `/ws/utils` `get_all_similar_contours <bytes> <0|1>`, 1 MB chunk upload, `progress`/`ok`/`error` statuses (`utils-ws.ts:361-414`). `get_similar_contours` is dead code in the frontend.
- fluxghost (`utils/contour/__init__.py:68`): transparent-fill → Canny **and** HSV-Sobel detectors → `find_contours` (dilate/erode, area > 20 000 px²) → `group_similar_contours` (Hu moments, **groups of size 1 are dropped**) → per group `find_rotation_angle` (kd-tree brute force 0–360° at 0.5°) → `[{center, angle(rad), bbox[x,y,w,h], contour}]` per group.
- Consumers: `AutoFitPanel` (picks the median-angle "main" contour per group), `AlignModal` (Konva), `apply.ts` (moves/rotates + clones per sibling contour, one `BatchCommand('AutoFit')`).
- Retry paths: `retryWithRemoveBackground.ts` (cloud bg removal, `skip_auto_fit_bg_removal_warning`), `retakeContourPreview.ts` (re-shoots each contour centre at region resolution; fbb2/fhx2rf/fbm2 only).
- Latent bug: contour coords are image px but consumed as canvas px without dividing by `canvasRatio` (iOS only). Fixed for free by using `getCanvasCrop().ratio` (§5.5).

### 2.2 Auto Align today

All state lives inside the `svgcanvas.ts` closure:

- `alignPoints: {x: IPoint[], y: IPoint[]}` (sorted), `alignEdges`, `WORKAREA_ALIGN_POINTS` (8 workarea points, refreshed on `boundary-updated`).
- `getElemAlignPoints(elem)`: 8 bbox points (3×3 grid minus centre) for unrotated visible elements.
- Public surface on `svgCanvas` (in `ISVGCanvas.ts`): `isAutoAlign`, `toggleAutoAlign`, `collectAlignPoints`, `findMatchedAlignPoints`, `drawAlignLine`, `clearAlignLines`, `addAlignPoint`, `addAlignEdges`, `removeAlignEdges`, `getSelectedElementsAlignPoints`.
- Callers outside svgcanvas: `mouse/index.ts` (11 sites), `mouse/utils/getMatchedDiffFromBBox/index.ts` (5), `pathActions.ts` (4), `SelectionManager.ts` (2 × `collectAlignPoints`), `undoManager.ts` (1), `menuActions.ts` + `apps/app/src/implementations/customMenuActionProvider.ts` (`toggleAutoAlign`).
- Preference `auto_align` (default `true`) in `BeamboxPreference` + `GlobalPreference`; svgcanvas subscribes to the store to mirror it into `isAutoAlign`. Menu checkbox `AUTO_ALIGN` in `useMenuData.ts` / `menu-manager.ts`.
- `collectAlignPoints()` is re-run on every selection change and undo/redo, so **any new point source only has to be read inside it**.

### 2.3 Preview pipeline (what a "batch" is)

- Region preview: `PreviewModeController.previewRegion` → `RegionPreviewMixin.regionPreviewArea` → `BasePreviewManager.previewRegionFromPoints` loops serpentine tile points (canvas px) → per tile `getPhotoAfterMoveTo` → `preprocessImage` (scale camera 5 px/mm → canvas 10 px/mm, feather overlap) → `previewModeBackgroundDrawer.drawImageToCanvas(imgCanvas, cx, cy)`.
- The drawer stamps into one offscreen accumulator canvas (`width × modelHeight × canvasRatio`), `toBlob`s the **whole workarea**, pushes through an RxJS `concatMap` subject, and `drawBlobToBackground` sets `#backgroundImage` and emits **`canvasEventEmitter 'preview-background-updated'` (url only, no rect)** — added for Print and Cut.
- Rect of a tile: `previewModeController.getRegionPreviewTile(x, y)` → `{centerX, centerY, width, height}` canvas px. Crop of the accumulator: `previewModeBackgroundDrawer.getCanvasCrop(x, y, w, h)` → `{blob, ratio, x, y}` (valid before the url updates). Working precedent: `PrintAndCut/utils/align/smartMarkSweep.ts:133-160`.
- Full-area preview: `drawFullWorkarea` → one stamp covering the full bed; fbm2 also sets a mask image.
- Clear: `previewModeBackgroundDrawer.clear()` → `setCameraPreviewState({isClean: true})`. Also `start()` unless `keep-preview-result`, and `updateCanvasSize()` on model change.
- `cameraPreview` store: `isPreviewMode`, `isDrawing`, `isClean`, `previewMode`, … (`app/stores/cameraPreview.ts`).

### 2.4 Swiftray (where the model will live)

- C++17, Qt 6.7.2, **OpenCV already a hard dependency** (`opencv_core imgproc flann`; vcpkg on Windows, Homebrew on macOS). No ONNX today.
- `QWebSocketServer` on **localhost:6611** (hardcoded, `main_application.cpp:49`). Envelope: request `{type:'action', path, data:{action, id, params}}`; reply `{id, result, type:'callback'|'progress'|'chunk'}`; result carries `success` + `error`. Binary frames are just UTF-8 JSON (`processBinaryMessage`), so images travel as base64 inside JSON. Routing by path prefix (`/devices`, `/devices/*`, `/parser`, `/ws/sr/system`), flat if/else on action strings.
- Long jobs run on a worker `QThread` guarded by `canvas_mutex_` (busy → "The backend is currently busy"). Segmentation must **not** share that mutex (a convert must not block detection and vice versa).
- Spawned by Electron `backend-manager.ts:255` (`--daemon`), auto-respawn, orphan sweep; **absent on web and Linux** (`checkSwiftray()` → `hasSwiftray`). Client: `swiftray-client.ts` singleton, version from `getSystemInfo()`, gates via `versionChecker` keys (`SWIFTRAY_SUPPORT_BINARY = '1.3.7'`).
- Distributed as a versioned zip from S3 at Beam Studio CD time (`app.cd.mac.yml:138-160`, `app.cd.x64.yml:112-120`, pin `SWIFTRAY_DAEMON_VERSION: 1.4.11`), landing in `<resources>/backend` via electron-builder `extraResources`. macOS CI builds only x86_64; arm64 is built on a dev machine.

### 2.5 mini-sam (what is proven)

- MobileSAM encoder + decoder ONNX (fp32, **43 MB**), ONNX Runtime C API (**~16 MB** shared lib), CPU. `src/`: `sam.h` (ORT sessions, both encoder export variants), `detect.h` (10×6 prompt grid + Otsu blob candidates → decoder per prompt → area/border filters → IoU + centre NMS → full-res mask, centroid, Moore contour + RDP ε=1.5), `img.h` (stb), `ws.h`/`platform.h` (its own ws server — **not needed** inside Swiftray).
- Output per object: `{id, score, area, center, bbox[x,y,w,h], polygon}` in image px; `center_mm` with `--mm-per-px`.
- Cost: ≈ 0.4 s encode + ≈ 76 decoder calls × ~35 ms ≈ **3.2–3.5 s per full pass on an i9-9900K**. Decoder is fixed to prompt-batch 1 (re-export needed for batching). Session RAM ≈ **560 MB** with fp32 models loaded. CoreML EP and `--letterbox` exist for macOS; Apple Silicon numbers not yet measured (`mac-todo.md`).
- WS session protocol already has the right primitives: upload → cached encoding; `prompt` (point-click segmentation, ~60 ms); `detect` (re-run on cached encoding); `config auto_detect`.

---

## 3. Goals & non-goals

**Goals**
- G1 Auto Fit produces stable object boundaries on wood, acrylic, leather and mixed-colour beds where Canny fails, with no UI change beyond a settings entry.
- G2 While previewing, physical objects become Auto Align targets (centre, corners, edge midpoints) with no extra click; feedback via two toasts.
- G3 Both features work with either engine; the OpenCV engine remains the automatic fallback (web, Linux, old Swiftray, user preference).
- G4 Users can opt out via a single setting; the tooltip names the trade-off.
- G5 Auto Align code leaves `svgcanvas.ts`.

**Non-goals (this PRD)**
- Rotating a design to match a rotated object (angle is stored for it; snapping to rotated edges is v2).
- Click-to-segment Auto Fit ("tap the object") — the Swiftray `prompt` action is specified so it can be added, but no UI here.
- INT8 quantisation, decoder re-export for batching, GPU/DirectML execution providers. Listed under §11 as follow-ups.
- Running ONNX in the browser (onnxruntime-web) for the web app.

---

## 4. Scenarios

1. **Stack of coasters, dark walnut.** User previews the bed (region preview, ~12 tiles). Toast `Detecting contours…` appears after the first tile lands; each detected coaster gets a bbox. User drags a logo; it snaps to a coaster's centre with the magenta align line. Toast `Contours detected` fades.
2. **Auto Fit on leather patch.** User selects a design, presses Auto Fit. Engine = ONNX. Contours come from Swiftray in ~3 s, grouping from fluxghost, the panel opens as today with cleaner outlines.
3. **Intel MacBook Air, first Auto Fit.** Alert: "Smart contour detection may be slow on this computer… [Use classic detection] [Continue]" with "don't show again". Choosing classic flips the preference; Auto Fit runs via fluxghost immediately.
4. **Web app.** `hasSwiftray` is false → OpenCV engine, the setting shows as unavailable (disabled select with a hint).
5. **Preview cleared / machine switched.** Contours and their align points vanish; no stale snapping.

---

## 5. Design

### 5.1 Engine placement: Swiftray, not fluxclient

Swiftray wins on every axis that matters: C++17 already, OpenCV already linked (we drop `stb` and use `cv::Mat`/`QImage`), a ws server and JSON envelope already consumed by `swiftray-client.ts`, a process lifecycle already managed by Electron, and a packaging path (S3 zip → `backend/`). fluxclient would need a pybind/ctypes bridge, a second copy of ORT in the Python bundle, and a Python-side threading story. ONNX is therefore **desktop-only**; web keeps OpenCV.

### 5.2 Swiftray segmentation service

New module `src/segment/` in `../swiftray` — a port of mini-sam's `sam.h` + `detect.h` with `img.h` replaced by OpenCV, plus one Qt worker:

- `SegmentWorker` on its **own `QThread`** (not the canvas worker), single-flight with a one-slot pending queue: a new `detect` while one is running replaces the queued request (the frontend already coalesces, this is the backstop).
- Lazy model load on first request; **unload after 5 min idle** (frees the ~560 MB); `info` reports `loaded`.
- Models live in `<Swiftray.app>/Contents/Resources/models/` (mac) / `swiftray/models/` (win). Path resolved like `--models` in mini-sam.
- ORT: prebuilt release packages on every platform, fetched by `scripts/fetch-onnxruntime.{sh,bat}` into `third_party/onnxruntime/{macos,macos_arm64,windows}` (gitignored) together with the models into `resources/models/`; `cmake/onnxruntime.cmake` fails configure with that instruction if either is missing. **Microsoft stopped shipping macOS x86_64 binaries after ORT 1.23.2**, so Intel Macs pin 1.23.2 while arm64/Windows use 1.30.0 (only the C API is used). The dylib rides in `Contents/Frameworks` via the existing `@executable_path/../Frameworks` rpath; on Windows the DLL joins `THIRD_PARTY_DLLS`.
- Execution provider: CPU everywhere for v1. CoreML is behind a `params.ep` so it can be A/B'd from the settings **Experimental** category once `mac-todo.md` timing is filled in.

Path `/segment`, actions (request `params` / reply `result`):

| action | params | result |
|---|---|---|
| `info` | – | `{available: bool, loaded: bool, version, ep}` — `available=false` if ORT or models are missing (frontend falls back) |
| `detect` | `{image: <base64 PNG/JPEG>, grid?: [gx, gy], maxObjects?: n, minArea?: px}` | `{width, height, timeMs, objects: Object[]}` |
| `prompt` | `{points: [[x,y]…], labels?: [1\|0…]}` on the cached encoding | `{timeMs, object: Object \| null}` |
| `unload` | – | `{ok: true}` |

`Object = {id, score, area, center: [x, y], bbox: [x, y, w, h], angle: number /* rad, from cv::minAreaRect */, polygon: [[x, y]…]}` — all in **input-image px**. `angle` is new vs mini-sam and is computed in Swiftray from the polygon so both engines expose the same field.

Progress: `type:'progress'` messages every ~10 decoder calls (`{done, total}`) reusing the client's `handlers` mechanism; the Auto Fit progress bar already listens to `onProgress`.

Images are base64 in JSON (≈ +33 %); a full 3000×2100 bed PNG is a few MB, a region tile far less. Acceptable; the existing `SWIFTRAY_SUPPORT_BINARY` path already sends >4 KB payloads as binary frames.

Version: Swiftray `1.4.11` (develop's current bump; no separate minor); new `versionChecker` key `SWIFTRAY_SEGMENT = '1.4.11'`.

### 5.3 Frontend engine abstraction, preference, fallback, warning

**New** `packages/core/src/web/helpers/contour/detectContours.ts`:

```ts
export type DetectedContour = AutoFitContour; // {bbox, center, angle, contour}
export type ContourEngine = 'onnx' | 'opencv';

export const getEffectiveContourEngine = async (): Promise<ContourEngine> // pref + hasSwiftray + version + info.available
export const detectContours = (blob: Blob, opts?: { onProgress?, engine?: ContourEngine, signal? }): Promise<DetectedContour[]>
```

- `onnx` → `swiftrayClient.detectContours(blob)` (new method in `swiftray-client.ts`, mirrors `loadSVG`'s base64 handling; reads the blob with `FileReader`/`arrayBuffer` → base64).
- `opencv` → **new fluxghost utils command `get_contours <bytes> <0|1>`** = today's detection stage without grouping (returns the flat `ContourData` list incl. singletons, with `angle` from `cv2.minAreaRect`). Needed because `get_all_similar_contours` drops singletons, which is fatal for align. Add to `docs/api/utils.md` and `tools/ws_smoke.py` in fluxghost.
- Any Swiftray error/timeout → one `console.warn` and **retry once on `opencv`** for that call (not a persistent flip).

**Preferences** (`Preference.d.ts`, `beambox-preference.ts` defaults, `globalPreferenceStore.ts` mirror):

| key | type | default | meaning |
|---|---|---|---|
| `contour_detection_engine` | `'onnx' \| 'opencv'` | `'onnx'` | user choice; effective engine may still be `opencv` |
| `snap_to_object_center` | `boolean` | `true` | image-contour align on/off; independent of `auto_align` (decided 2026-09-23: object snapping works with Auto Align off) |

**Settings UI** — `components/settings/categories/Camera.tsx`: `SettingSwitch` "AI Contour Detection" / "AI 輪廓偵測" writing `'onnx' | 'opencv'` into `contour-engine` (engine names are never shown; rendered only on desktop with Swiftray); `SettingSwitch` "Snap to object center" (`snap_to_object_center`). No new menu item; `AUTO_ALIGN` menu stays the master switch.

~~**Weak-machine warning**~~ — dropped, see §10 item 1. (Original proposal: one-time alert on Windows < 8 GiB or Intel Mac offering the classic engine.)

### 5.4 Auto Fit on ONNX

`autoFit.ts` changes only the detection call:

```
blob → detectContours(blob)            // engine-agnostic
     → utilWS.groupContours(contours, { isSplicingImg })   // NEW fluxghost cmd, returns AutoFitContour[][]
     → showAutoFitPanel(...)            // unchanged
```

- **New fluxghost utils command `group_contours`**: JSON in (`{contours: [[x,y]…][], width, height}`), runs `group_similar_contours` + `find_rotation_angle` exactly as today, JSON out in the current `get_all_similar_contours` shape. ~30 lines in `api/utils.py`, reuses `ContourData`. When engine = `opencv`, `getAllSimilarContours` keeps being called directly (one round trip instead of two).
- `retryWithRemoveBackground.ts` and `retakeContourPreview.ts` call `detectContours` + `groupContours` the same way; the caches in `dataCache.ts` are keyed by url and unaffected.
- ONNX contours are polygons already simplified by RDP (ε=1.5 px); `group_similar_contours` uses Hu moments + area ratio, which are insensitive to that. Validate on `test/bed.jpg` that grouping of the 20 objects matches the OpenCV grouping (§12).

*Why not port grouping to C++:* the rotation matcher is a kd-tree brute force with tuned thresholds and a wrap-around merge; re-implementing it risks drift for zero user-visible gain. Revisit only if the extra fluxghost round trip is measurable (it is milliseconds).

### 5.5 Image-contour Auto Align

**State (decided 2026-09-23: no store).** Nothing renders or subscribes to the detected objects, so they are a plain `contours: ImageContour[]` field on the detector, read by `autoAlign.findObjectCenterSnap` at drag time. `ImageContour = { id; bbox: [x, y, w, h]; center: [x, y]; contour; rect }`, workarea px. `rect` is the minimum-area rect of the polygon (`utils/getMinAreaRect`: long edge as `width`, its direction as `angle`, `rectangularity` = polygon area / rect area), computed in the frontend so both engines are treated alike; the backend `angle` is not used because OpenCV's minAreaRect angle is ambiguous without the rect size.

**Service** — `app/svgedit/autoAlign/imageContourDetection.ts` (`init()` called from svgcanvas right after `autoAlign.init()`):

1. **Trigger.** The existing `canvasEventEmitter 'preview-background-updated'`, emitted by `previewModeBackgroundDrawer.drawBlobToBackground` for every drawn capture (region tile, single shot, full area). The service marks the preview dirty when `snap_to_object_center` is on.
2. **Coalesce per batch (decided 2026-09-22).** A dirty flag is set while a preview batch is in progress; the run starts when the batch ends, i.e. `cameraPreview.isDrawing` flips false (set by `PreviewModeController.prePreview` / `onPreviewSuccess` for full-area, single and region previews alike), and never during live mode (runs when `isLiveMode` flips false). A run drains `dirty` in a loop, so batches landing mid-run are picked up without a second trigger. Per-tile detection was rejected: a region sweep would otherwise queue one ~8 s pass per tile on an Intel Mac.
3. **Run (decided 2026-09-23: full canvas, not incremental).** `crop = previewModeBackgroundDrawer.getCanvasCrop(0, 0, workarea.width, workarea.modelHeight)`; `objects = await detectContours(crop.blob)`; map each back with `x / crop.ratio` (this is also the `canvasRatio` fix from §2.1); drop objects whose bbox spans ≥ 90 % of the workarea in either direction (`MAX_SPAN_RATIO`: the front rail, a sheet of material); replace `contours`. ~~Incremental: re-detect the union of the dirty rect and the stored contours it overlaps, drop those, filter objects cut by the crop border, append.~~ Dropped: the frontend caps inputs at 1280 px and the encoder rescales to 1024 px, so a crop and a full pass take the same ~8 s; the incremental path only added the border filter, victim bookkeeping and seam-straddling objects that appear one tile late. Known cost: a full 600 mm bed lands at scale 0.21, so small parts on large beds get ~5× less detail than a tile crop would; if that shows in testing, raise the ONNX cap for detection rather than reinstate regions.
4. **Clear.** Subscribe to `cameraPreview.isClean === true` and to `model-changed` → `contours = []`. Also clear when `snap_to_object_center` flips to false.
5. **Toasts.** `MessageCaller.openMessage({ key: 'image-contour', level: LOADING, content: lang.auto_align.detecting_contours, duration: 0 })` on the first `detecting` after idle; `SUCCESS` `contours_detected` (duration 2 s) when the queue drains with ≥ 1 contour; silent on zero results; `WARNING` once per preview session on repeated engine errors. `key` reuse means the toasts replace each other rather than stack.

**Align integration (decided 2026-09-22 after trying the point-based version).** Detected objects do **not** feed the general matcher: 9 points and 4 edges per object made snapping feel cluttered. Instead, while dragging in select mode, `autoAlign.findObjectCenterSnap(center)` returns the smallest-bbox object that contains the dragged selection's centre and whose centroid is within `OBJECT_SNAP_SCREEN_PX` = 20 screen px (zoom-aware; smallest first so an engraving centred on a tile wins over the tile); the drag delta is overridden so the selection's centre lands on the object's centroid, and `drawObjectCenterGuides` draws a dashed magenta cross through it (ids prefixed `align_line_` so the usual `clearAlignLines` removes them). For a rectangular object (`rectangularity ≥ RECTANGULAR_MIN` = 0.8) the cross runs along the rect's own axes, sized to the rect, so its rotation is visible; blobs get the axis-aligned bbox cross. Outside every bbox, dragging is unaffected. Snapping is independent of `auto_align`.

**Rotation snap (decided 2026-09-24, rule in §11).** While dragging the rotate grip (not with Shift, which keeps the 45° steps), `autoAlign.getRotationSnap(angle, center)` looks up the smallest rectangular object under the selection's centre and snaps within `ROTATION_SNAP_DEG` = 3° to one of its candidate angles (`utils/objectSnap.getRotationCandidates`: both edge directions every 90°, plus the diagonals every 45° when aspect ≤ 1.1); a dashed guide through the object centre shows the matched direction, sized to the object's extent along it. Nothing rotates on drop.

**Overlay (decided 2026-09-24: debug flag, not shipped).** A `#imageContourOverlay` `<g>` inside `#previewSvg` (non-exported, cleared with the contours) drawing each polygon as a 1 px dashed outline plus a centre dot, plus a `[snap] target …` console line per snapped frame, enabled by `localStorage['dev-image-contour'] = 'true'`. Swap the gate for the preference if a user test asks "why did it snap there?".

### 5.6 Auto Align extraction (prerequisite refactor)

New `app/svgedit/autoAlign/index.ts` exporting a single object, plus `utils/` with the moved `findNearestAndFarthestAlignPoints.ts` and `isLineCoincide.ts`:

```ts
export const autoAlign = {
  isEnabled: () => useGlobalPreferenceStore.getState().auto_align,
  toggle, collectAlignPoints, findMatchedAlignPoints, drawAlignLine, clearAlignLines,
  addAlignPoint, addAlignEdges, removeAlignEdges, getSelectedElementsAlignPoints,
};
```

- Module-level state replaces the closure variables; `boundary-updated` subscription and the `auto_align` store subscription move with it. `drawAlignLine` keeps using `svgedit.utilities`, `workareaManager`, `textEdit.renderText` — all importable outside svgcanvas.
- Every caller in §2.2 switches `svgCanvas.xxx` → `autoAlign.xxx`; `isAutoAlign` reads become `autoAlign.isEnabled()`. Ten entries leave `ISVGCanvas.ts`.
- Zero behaviour change; the existing `mouse` and `pathActions` specs are the regression net. Lands as its **own PR** before any ONNX work so the diff is reviewable (memory: small reviewable chunks).

### 5.7 i18n

`en.ts` / `zh-tw.ts` first, all 23 before PR:
- `settings.ai_contour_detection`, `settings.ai_contour_detection_tooltip` (shipped in PR #1006; the tooltip ends with a "used by" sentence to extend with Auto Align), `settings.snap_to_object_center`
- `auto_align.detecting_contours`, `auto_align.contours_detected`, `auto_align.contour_detection_failed`

---

## 6. Data contracts

**Swiftray `/segment` `detect` reply** (image px):
```json
{"success":true,"width":1280,"height":853,"timeMs":3210,
 "objects":[{"id":1,"score":1.0,"area":11018,"center":[447.1,412.5],"bbox":[389,341,116,144],"angle":0.031,"polygon":[[x,y],...]}]}
```

**Frontend `DetectedContour`** (= `AutoFitContour`, canvas px after the caller maps crop coords back):
```ts
{ bbox: [x, y, w, h]; center: [x, y]; angle: number /* rad */; contour: Array<[number, number]> }
```

**fluxghost `/ws/utils`** (string-matched against `cmd_mapping`; never rename):
- `get_contours <bytes> <isSplicing 0|1>` → `{status:'ok', data: AutoFitContour[]}` (flat, incl. singletons)
- `group_contours <bytes> <isSplicing 0|1>` with a JSON body `{width, height, contours: [[x,y]…][]}` → `{status:'ok', data: AutoFitContour[][]}`

**Preferences**: `contour_detection_engine`, `snap_to_object_center` (§5.3). Both are global (broadcast via `TabEvents.GlobalPreferenceChanged` like `auto_align`).

---

## 7. Performance & memory

| item | number | consequence |
|---|---|---|
| Full pass, x64 desktop CPU | ≈ 3.3 s | Auto Fit is comparable to today's fluxghost round trip; align runs stay behind the preview but catch up |
| Full pass, Intel Mac (i5-1038NG7), Swiftray, 600 mm bed preview | **8.5 s wall / 7.4 s model** after downscaling to 1280 px (was 58 s at the native 6000 px) — measured 2026-09-22 | frontend downscales to `ONNX_MAX_SIDE = 1280` before sending (§5.3); warning (§5.3); coalescing keeps the queue depth at 1 |
| Apple Silicon CPU / CoreML | unmeasured (`mac-todo.md` §4) | fill the timing matrix before choosing default EP on mac |
| Model RAM | ≈ 560 MB loaded | lazy load + 5 min idle unload; this is why < 8 GB machines get the warning |
| Install size | +16 MB ORT, +43 MB models | inside the Swiftray S3 zip; INT8 (~12 MB) is the follow-up if size is challenged |
| Tile crop vs full bed | encoder rescales longest side to 1024; the frontend caps inputs at 1280 px so full-res mask/polygon work and transfer don't scale with bed size | same wall time either way (measured 2026-09-23), which is why §5.5 detects the full canvas; a tile would only buy detail, not speed |

---

## 8. Packaging & distribution

- Swiftray zip gains `models/mobile_sam.{encoder,decoder}.onnx` and the ORT shared lib; `app.cd.mac.yml` / `app.cd.x64.yml` bump `SWIFTRAY_DAEMON_VERSION` to `1.4.11`. mac `codesign --deep` already covers added dylibs; verify notarisation accepts the ORT dylib (it is signed by Microsoft, should be fine).
- macOS arm64 Swiftray is built off-CI today; the ORT arm64 tgz must be present on that machine. Add a CMake check that fails configure if `third_party/onnxruntime/<arch>` is missing rather than silently building without segmentation.
- Licences: MobileSAM Apache-2.0, ORT MIT, both bundle-safe; add to the third-party notices list.
- Backward compatibility: old Beam Studio + new Swiftray — unaffected (new path only). New Beam Studio + old Swiftray — `SWIFTRAY_SEGMENT` version gate → OpenCV engine, no alert.

---

## 9. Rollout — PR plan

Each PR is independently shippable; order matters only for 4 → 5.

| # | repo | PR | size |
|---|---|---|---|
| 1 | beam-studio | Extract Auto Align into `app/svgedit/autoAlign/` (§5.6). Pure refactor. | M |
| 2 | fluxghost | `get_contours` + `group_contours` utils commands, docs, `ws_smoke.py` cases. | S |
| 3 | swiftray | `src/segment/` port of mini-sam, `/segment` path, ORT vendoring per platform, models in bundle, version 1.4.11. | L |
| 4 | beam-studio | `detectContours` abstraction, Swiftray client method, preferences + Camera settings, perf warning, Auto Fit switched to `detectContours` + `groupContours`. | M |
| 5 | beam-studio | `ImageContourDetector` (contours held on the detector, no store), `preview-background-updated` trigger, per-batch coalescing, toasts, align integration, `snap_to_object_center`, rotation snap. One PR with 1 and 6. | M |
| 6 | beam-studio | Debug overlay in `#previewSvg` behind `dev-image-contour`. | S |
| 8 | swiftray | Detector filters (§5.2): stability, multimask candidates with IoU floor and size-aware NMS, largest-component stats, boundary-edge ratio; per-object diagnostics log. | M |
| 7 | beam-studio | CD workflow version bump once 3 is on S3. | XS |

---

## 10. Open decisions (need Dean)

1. ~~Default engine on weak machines / one-time perf warning~~ — **decided 2026-09-22: default `onnx` everywhere, no warning.** Measured on the weakest supported Mac (Intel i5): AI 8.5 s vs OpenCV 10 s after the 1280 px downscale, so the "slower on old computers" premise no longer holds; the settings switch plus its tooltip is the opt-out. Memory (~560 MB loaded) is covered by the 5 min idle unload.
2. **Grouping stays in fluxghost** (`group_contours`) vs. port to C++ — proposal: fluxghost (§5.4 rationale).
3. ~~Overlay of detected bboxes~~ — **decided 2026-09-24: debug flag only** (`dev-image-contour`), see §5.5.
4. ~~Include the object centre as a snap point~~ — **decided 2026-09-22: yes.** The feature is named after it: preference `snap_to_object_center`. ~~Corners and edge midpoints of the detected bbox are added as well~~ — **dropped 2026-09-22**: centre-to-centre only, see §5.5.
5. ~~Model files in the Swiftray zip vs. on-demand download~~ — **decided 2026-09-21: bundled.** Models (43 MB) and ORT ship inside Swiftray; no runtime download.
6. **Which region-preview machines get align-on-preview** — all that draw through `drawBlobToBackground` (region + full-area). Full-area single shot on Ador/Promark/beamo II runs one whole-bed pass (~3 s); fine.

---

## 11. Risks & follow-ups

- **Mask quality on low-contrast objects** (clear acrylic, white paper on white honeycomb) — SAM is markedly better than Canny here but not perfect; the OpenCV fallback and Auto Fit's existing bg-removal retry remain.
- **Latency on Intel Macs** unmeasured — measure before GA; the warning exists for this.
- **Swiftray process RAM** while a convert runs concurrently — separate thread and idle unload; if both peak together on 8 GB machines, add a "skip detection while converting" guard.
- Follow-ups: INT8 models; decoder re-export with dynamic batch (biggest speedup); CoreML/DirectML EPs behind Experimental; click-to-segment Auto Fit using `prompt`; rotation-aware snapping using `angle` (rule below); onnxruntime-web for the web app.
- **Rotation snapping (rule discussed 2026-09-22, shipped 2026-09-24 in §5.5).** An object never has one "correct" angle: its edges repeat every 180° (rectangles) or 90° (squares), so a deliberately 45°-placed square must not pull a design sitting at 0°. As shipped: (1) per object take the frontend min-area rect; it is a rotation candidate only if rectangularity ≥ 0.8 (a tile with a ragged mask scores 0.86, a star 0.47); (2) candidates = long-edge angle + k·90° for every rectangle (the short side is as valid as the long one), plus k·45° when aspect ≤ 1.1; (3) snap only while the user is rotating and within 3° of a candidate, with a guide line; (4) ~~an explicit "align to object" action~~ not built. Never auto-rotate on drop. Known gap: the rule reads the design as an angle only; a tall design lying along an object's long edge gets the short-edge guide. Fix if it bothers: treat the selection's long axis as 0° using the captured bbox.
- **Detector false positives on honeycomb beds (2026-09-23/24, Swiftray `feat/segment-stability`).** SAM proposes lit patches of bed and pockets of bed enclosed by parts as objects. Filters added in `detect.h`, each verified against the golden `bed.jpg` (20/20) and four real beamo previews: stability (area at logit > 1 over area at logit > −1, ≥ 0.85; lit patches 0.7, real parts ≥ 0.9); all four decoder masks kept as candidates with a predicted-IoU floor of 0.88 and NMS that treats a same-centre candidate as a duplicate only when the areas are within 2× (finds an engraving centred on its tile); object stats from the largest connected component only (a stray fragment stretched one bbox to the tile below); boundary-edge ratio ≥ 1.5 (mean gradient in a ±2 px band along the outline, ignoring pixels near other detected masks, over the mean gradient of the interior eroded by 4 px: a real part, even a keyring or a clear acrylic disc filled with bed texture, has an outline; a lit or enclosed patch has a fade, 1.1–1.3). Rejected cues, for the record: score (golden parts go down to 0.944), holes (masks are solid), polygon vertex density (kills gears), interior contrast and FFT periodicity (a keyring's interior is honeycomb). Residual: single glinting cells are small, crisp and pass everything; the frontend's 20 px snap radius bounds their harm.

---

## 12. Test plan

- **Swiftray**: port `test/compare.py` golden (`bed.jpg` → 20/20 objects, centre < 6 px) as a Swiftray CI step against the `/segment` ws path; `angle` sanity on a rotated rectangle fixture.
- **fluxghost**: `ws_smoke.py` cases for `get_contours` and `group_contours` (must end `ALL PASS`); grouping parity: ONNX polygons of `bed.jpg` → same groups as `get_all_similar_contours`.
- **beam-studio unit**: `detectContours` engine selection matrix (pref × hasSwiftray × version × info.available × failure → retry); `imageContourDetection.spec.ts` (batch-end trigger, live-mode hold, drain loop, mapping with `ratio`, span filter, clear on isClean/model-changed/pref off, warn once); `utils/getMinAreaRect` spec (rotations recovered mod 180, rectangularity of a circle, degenerate input); `utils/objectSnap` spec (candidate sets for square vs elongated, guide half-lengths); `autoAlign` refactor covered by the existing `mouse`/`pathActions`/menubar specs.
- **Manual**: scenarios §4 on fbb2 (region), fbm2 (full area + mask), Promark (full area), web (fallback); low-RAM Windows VM for the warning.
