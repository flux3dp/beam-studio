# PRD: ONNX contour detection — Auto Fit v2 & image-contour Auto Align

| | |
|---|---|
| **Status** | In progress — PR 2 (fluxghost) committed, PR 3 (Swiftray `feat/segment-onnx`) and PR 4 (beam-studio `feat/onnx-contour-detection`) written, awaiting build/test on a Qt machine; §10 decisions pending |
| **Author** | Product (AI PM agent) with Dean |
| **Created** | 2026-09-21 |
| **Target product** | Beam Studio desktop (Electron). Web falls back to the OpenCV engine (no Swiftray). |
| **Owner area** | Camera preview, Auto Fit, Auto Align, Swiftray backend |
| **Playground** | `../mini-sam` — validated MobileSAM "segment everything" C++17 tool (ONNX Runtime, CPU). Golden parity 20/20 vs the Python prototype on a beamo II bed capture. |
| **Related code** | Auto Fit: `packages/core/src/web/app/svgedit/operations/autoFit/`, `components/dialogs/autoFit/`, `helpers/api/utils-ws.ts` (`get_all_similar_contours`); Auto Align: `app/svgedit/svgcanvas.ts` (`alignPoints`/`alignEdges`, lines ~158–190 and ~2632–2860), `svgedit/interaction/mouse/index.ts`, `mouse/utils/getMatchedDiffFromBBox/`, `svgedit/utils/findNearestAndFarthestAlignPoints.ts`; Preview: `app/actions/beambox/preview-mode-background-drawer.ts`, `actions/camera/preview-helper/RegionPreviewMixin.ts`; Swiftray client: `helpers/api/swiftray-client.ts`, `app/constants/swiftray-constants.ts`; Preferences: `interfaces/Preference.d.ts`, `actions/beambox/beambox-preference.ts`, `app/stores/globalPreferenceStore.ts`, `components/settings/categories/Camera.tsx` |
| **External repos** | `../swiftray` (C++17 / Qt 6.7.2 / OpenCV already linked; ws server on 6611), `../fluxghost` (`fluxghost/api/utils.py`, `fluxghost/utils/contour/`) |

---

## 1. Summary

Beam Studio detects objects on the camera preview in exactly one place today: **Auto Fit** sends the composited preview PNG to fluxghost, which runs Canny + HSV-gradient edge detection, groups similar shapes and returns per-shape `{bbox, center, angle, contour}`. The classic-CV stage is the weak link: boundaries depend on lighting, wood grain, glare and the Canny thresholds, so results are unstable across materials.

This PRD replaces the *detection* stage with a **MobileSAM ONNX model** hosted in **Swiftray** (the C++ backend Beam Studio already spawns and talks to on port 6611), and uses that same detector for a **new feature: image-contour Auto Align** — while the camera preview is being taken, Beam Studio detects the physical objects on the bed and adds their bounding boxes (corners, edge midpoints, centre) to the existing Auto Align snap points, so a design can be snapped to the centre or the sides of a real object without any dialog.

Three design choices drive everything else:

1. **One detector, one contract.** A single frontend function `detectContours(blob, opts)` returns the existing `AutoFitContour` shape from either engine. Auto Fit and image-contour align both consume it; grouping/rotation matching for Auto Fit stays in fluxghost (already validated) and is fed the ONNX contours instead of Canny ones.
2. **Engine is a preference with silent fallback.** `contour_detection_engine: 'onnx' | 'opencv'` (default `onnx`). Effective engine = `onnx` only when Swiftray is present and new enough; otherwise OpenCV via fluxghost, no user action needed. A one-time perf warning on weak machines (Windows < 8 GB RAM, Intel Mac) offers the OpenCV switch.
3. **Detect while previewing, incrementally.** Each region-preview tile that lands on the background dirties a rect; a coalescing worker re-detects the union of the dirty rect and any existing contours it overlaps, removes those, and inserts the new ones. The user sees `Detecting contours…` / `Contours detected` toasts and never waits on a dialog.

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
- G4 Weak machines are warned once and can opt out.
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
| `auto_align_image_contour` | `boolean` | `true` | image-contour align on/off (also requires `auto_align`) |

**Settings UI** — `components/settings/categories/Camera.tsx`: `SettingSelect` "Contour detection" (`lang.settings.contour_engine_smart` / `_classic`), disabled with a hint when `!hasSwiftray`; `SettingSwitch` "Snap to objects in camera preview" (`auto_align_image_contour`). No new menu item; `AUTO_ALIGN` menu stays the master switch.

**Weak-machine warning** — new `helpers/contour/checkContourEnginePerf.ts`, called once per session before the first ONNX call:
- Add `totalMemory: () => number` to `IOperatingSystem` (`os.totalmem` in `apps/app/src/implementations/os.ts`, `() => 0` on web).
- weak = (`os.type() === 'Windows_NT'` && `totalMemory() < 8 GiB`) || (`os.type() === 'Darwin'` && `os.arch() === 'x64'`). Note `os.arch()` reports the *process* arch; an x64 build under Rosetta also counts as weak, which is the right call since ORT under Rosetta is slow too.
- Alert `lang.settings.contour_engine_slow_warning` with buttons **Use classic detection** (sets pref `opencv`) / **Continue**, and the `alertConfig` "don't show again" key `skip_contour_engine_perf_warning` (`helpers/api/alert-config.ts`).

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

**Store** — `app/stores/imageContourStore.ts` (Zustand + `subscribeWithSelector`, wide-scope per conventions):

```ts
type ImageContour = { id: string; bbox: [x, y, w, h]; center: [x, y]; angle: number; contour: Array<[number, number]> }; // canvas px
type State = { contours: ImageContour[]; status: 'idle' | 'detecting' | 'detected' | 'error' };
```

**Service** — `app/actions/beambox/image-contour-align.ts` (started once from `svgEditor` init, like `previewModeController`):

1. **Trigger.** `previewModeBackgroundDrawer.drawImageToCanvas` and `drawFullWorkarea` emit a new `canvasEventEmitter 'preview-region-drawn'` with `{x, y, width, height}` in canvas px (the drawer already computes these to stamp). The service subscribes when `auto_align && auto_align_image_contour && isPreviewMode`.
2. **Coalesce.** Dirty rects accumulate in a module array; a 300 ms trailing debounce starts a run; a run in flight sets `pending = true` and the next run starts when it finishes. Region preview stamps a tile every few seconds, ONNX takes ~3 s a pass, so runs naturally batch 1–2 tiles on fast machines and many on slow ones.
3. **Run.** `dirty = union(dirtyRects)`; `victims = contours whose bbox intersects dirty`; `roi = union(dirty, victims.bbox)` clamped to the workarea; remove `victims` from the store; `status = 'detecting'`; `crop = previewModeBackgroundDrawer.getCanvasCrop(roi)`; `objects = await detectContours(crop.blob)`; map each back with `crop.x + x / crop.ratio` (this is also the `canvasRatio` fix from §2.1); drop objects whose bbox touches the **roi border** unless that border is also the workarea border (they are truncated by the crop and will be re-detected when the neighbouring tile lands); insert; `status = 'detected'`.
4. **Clear.** Subscribe to `cameraPreview.isClean === true` and to `model-changed` → `contours = []`. Also clear when `auto_align_image_contour` flips to false.
5. **Toasts.** `MessageCaller.openMessage({ key: 'image-contour', level: LOADING, content: lang.auto_align.detecting_contours, duration: 0 })` on the first `detecting` after idle; `SUCCESS` `contours_detected` (duration 2 s) when the queue drains with ≥ 1 contour; silent on zero results; `WARNING` once per preview session on repeated engine errors. `key` reuse means the toasts replace each other rather than stack.

**Align integration** — inside the new `autoAlign` module's `collectAlignPoints()`:

```ts
const imageContours = useImageContourStore.getState().contours;
points.push(...imageContours.flatMap(getContourAlignPoints)); // 8 bbox points + centre
edges.push(...imageContours.flatMap(getBboxEdges));
```

- The **centre point is included** for image contours (elements deliberately skip it). "Centre a design on the object" is the headline use case.
- Because `collectAlignPoints()` already re-runs on selection change and undo, no extra wiring is needed for points to refresh; the store additionally calls `autoAlign.collectAlignPoints()` on change so a drag already in progress picks new contours up on the next mouse-down.
- `angle` is stored but unused for snapping in v1.

**Overlay (should-have).** A `#imageContourOverlay` `<g>` inside `#previewSvg` (non-exported, cleared with the preview) drawing each bbox as a 1 px dashed rect with `vector-effect: non-scaling-stroke`, shown only while `auto_align_image_contour` is on. Lets the user see what will snap. Cheap; ship if the first user test asks "why did it snap there?".

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
- `settings.contour_engine`, `settings.contour_engine_smart`, `settings.contour_engine_classic`, `settings.contour_engine_unavailable`, `settings.contour_engine_slow_warning`, `settings.use_classic_detection`, `settings.auto_align_image_contour`
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

**Preferences**: `contour_detection_engine`, `auto_align_image_contour` (§5.3). Both are global (broadcast via `TabEvents.GlobalPreferenceChanged` like `auto_align`).

---

## 7. Performance & memory

| item | number | consequence |
|---|---|---|
| Full pass, x64 desktop CPU | ≈ 3.3 s | Auto Fit is comparable to today's fluxghost round trip; align runs stay behind the preview but catch up |
| Full pass, Intel Mac (i5-1038NG7), Swiftray, 600 mm bed preview | **8.5 s wall / 7.4 s model** after downscaling to 1280 px (was 58 s at the native 6000 px) — measured 2026-09-22 | frontend downscales to `ONNX_MAX_SIDE = 1280` before sending (§5.3); warning (§5.3); coalescing keeps the queue depth at 1 |
| Apple Silicon CPU / CoreML | unmeasured (`mac-todo.md` §4) | fill the timing matrix before choosing default EP on mac |
| Model RAM | ≈ 560 MB loaded | lazy load + 5 min idle unload; this is why < 8 GB machines get the warning |
| Install size | +16 MB ORT, +43 MB models | inside the Swiftray S3 zip; INT8 (~12 MB) is the follow-up if size is challenged |
| Tile crop vs full bed | encoder rescales longest side to 1024; the frontend caps inputs at 1280 px so full-res mask/polygon work and transfer don't scale with bed size | a 100 mm tile gets ~10× the pixel budget per mm of a full-bed pass — region-based detection is *better*, not just faster |

Region tiles that partially contain an object produce truncated masks; the roi-border filter in §5.5 step 3 plus re-detection when the neighbour lands handles it. Objects larger than one tile (e.g. a full sheet) are found only after the union roi covers them; the accumulator crop makes this automatic.

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
| 5 | beam-studio | `imageContourStore`, `preview-region-drawn` event, detection service with coalescing, toasts, align integration, `auto_align_image_contour`. | M |
| 6 | beam-studio | (optional) bbox overlay in `#previewSvg`. | S |
| 7 | beam-studio | CD workflow version bump once 3 is on S3. | XS |

---

## 10. Open decisions (need Dean)

1. **Default engine on weak machines** — proposal: default `onnx` for everyone + one-time warning with a one-click switch. Alternative: auto-default to `opencv` when weak. Proposal keeps one code path for "what does a fresh install do".
2. **Grouping stays in fluxghost** (`group_contours`) vs. port to C++ — proposal: fluxghost (§5.4 rationale).
3. **Overlay of detected bboxes** — ship in v1 or wait for feedback?
4. **Include the object centre as a snap point** — proposed yes (elements skip centre today; contours would not).
5. ~~Model files in the Swiftray zip vs. on-demand download~~ — **decided 2026-09-21: bundled.** Models (43 MB) and ORT ship inside Swiftray; no runtime download.
6. **Which region-preview machines get align-on-preview** — all that emit `preview-region-drawn` (region + full-area). Full-area single shot on Ador/Promark/beamo II runs one whole-bed pass (~3 s); fine.

---

## 11. Risks & follow-ups

- **Mask quality on low-contrast objects** (clear acrylic, white paper on white honeycomb) — SAM is markedly better than Canny here but not perfect; the OpenCV fallback and Auto Fit's existing bg-removal retry remain.
- **Latency on Intel Macs** unmeasured — measure before GA; the warning exists for this.
- **Swiftray process RAM** while a convert runs concurrently — separate thread and idle unload; if both peak together on 8 GB machines, add a "skip detection while converting" guard.
- Follow-ups: INT8 models; decoder re-export with dynamic batch (biggest speedup); CoreML/DirectML EPs behind Experimental; click-to-segment Auto Fit using `prompt`; rotation-aware snapping using `angle`; onnxruntime-web for the web app.

---

## 12. Test plan

- **Swiftray**: port `test/compare.py` golden (`bed.jpg` → 20/20 objects, centre < 6 px) as a Swiftray CI step against the `/segment` ws path; `angle` sanity on a rotated rectangle fixture.
- **fluxghost**: `ws_smoke.py` cases for `get_contours` and `group_contours` (must end `ALL PASS`); grouping parity: ONNX polygons of `bed.jpg` → same groups as `get_all_similar_contours`.
- **beam-studio unit**: `detectContours` engine selection matrix (pref × hasSwiftray × version × info.available × failure → retry); `image-contour-align` coalescing (dirty union, victim removal, roi-border filter, mapping with `ratio`); `autoAlign` refactor covered by existing `mouse`/`pathActions` specs plus one spec asserting image-contour points and centre enter `collectAlignPoints`.
- **Manual**: scenarios §4 on fbb2 (region), fbm2 (full area + mask), Promark (full area), web (fallback); low-RAM Windows VM for the warning.
