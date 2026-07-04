# Beam Studio Feature Map

> Companion app for FLUX laser machines. Sources: release-test sheet (331 cases), codebase, `lang/en.ts` · `zh-tw.ts`. Test coverage details: `docs/tests/<category>/Summary.md`. Chinese version: `feature-map.zh-TW.md`.
> Entry-point / component hierarchy (which level & component each feature lives in): `docs/ui-entry-map.zh-TW.md`.

## Platforms & Backends

| | Web (PWA) | Desktop (Electron) |
|---|---|---|
| Multi-tab, native menus, recent files, auto-save | — | ✓ |
| Swiftray engine (Promark, path-engine option) | — (hardwired off) | ✓ |
| Everything else | ✓ | ✓ |

Backend services: **FLUXGhost** (WebSocket API — SVG/PDF/AI parsing, task/gcode generation, camera, discovery; dynamic port when bundled with the desktop app), **Swiftray** (port 6611 — Promark & alternative convert engine), **FLUX ID cloud** (`id.flux3dp.com` — auth, My Cloud, AI credits, Google-Fonts proxy, S3 font files).

## Supported Machines

beamo (fbm1) · beamo II (fbm2) · Beambox / Pro (fbb1b/p) · Beambox II (fbb2) · HEXA / HEXA RF (fhexa1) · Ador (ado1, modular: 10W/20W diode, 2W IR, printing) · Lazervida (flv1) · Promark (fpm1) · Miro UV (fuv1)

## 1. File Operations
- **Import**: JPG, PNG, SVG†, DXF, PDF†, AI†, .beam, .bvg; drag-and-drop; layering popups on SVG import (by layer / by color / single; module-dependent option sets)
- **Export / Save**: .beam, .bvg, SVG, PNG, JPG; save / save-as; recent files (desktop); auto-save (desktop; interval + file-count pruning)
- **Examples**: bundled sample projects & material test files per machine

## 2. Canvas & Drawing
- Shapes (rect w/ rounded corner, ellipse, polygon ±sides, line), pen/Bézier paths with path-edit mode
- **Elements library**: built-in icon library + **Noun Project** online-library integration (categories / search / pin; free icons unlocked after sign-in — copy reads "Sign in to get 10,000+ free icons", the feature announcement claims "over one million graphics"; not "7 million")
- Text: system + bundled web fonts + **Google Fonts panel** (search/language/category); size, spacing, line spacing, vertical text; text on path; **variable text** (serials/CSV)
- Selection (single/multi/shift-angle-lock), transform (move/rotate/scale, lock ratio), group/ungroup, copy/paste/paste-in-place, undo/redo
- **Generators**: QR code (error-tolerance levels, invert) & barcode, **Boxgen** (finger/t-slot/edge joints, cover, inner/outer dims), **material test grid** (speed×power sweeps), keychain, puzzle, stamp maker

## 3. Object Operations
- Dimension/position/rotation inputs; boolean ops (union/subtract/intersect/difference); **offset** (in/out, corner styles; bitmap = bounding-rect); **tabs/bridges** (hold-in-place, manual mode + gap); array; mirror; decompose; **weld text**; text→path (per-char option, font substitution warning)
- Image ops: gradient toggle, curve, sharpen, crop, bevel, invert, vectorize, replace; **Edit Image window** (eraser / magic wand / rounded corner, Konva); **Stamp Maker** (image → stamp: bevel radius, horizontal flip, filter undo/redo)
- **Auto Fit** (smart nesting onto camera-detected workpieces), auto-align guides & snapping, **depth mode** (gradient bitmaps → min-power option)

## 4. Layers
- CRUD, per-layer params (power/speed/repeat…), color, reorder (drag), merge (down/all), lock, show/hide, move-elements-between with param prompts
- **Ador printing layers**: full-color vs single-color, CMYK expansion, laser↔printing module switch popups, prespray zone; White Ink (dev-gated); UV print (dev-gated / Miro UV)

## 5. Presets & Parameters
- Material presets per model/module; add/import/export/reset custom params
- Guards: vector speed limit (20 mm/s; BB2 50) with red-slider warning, low-power hint (<10%), high-power confirm at job send (beamo/BB2), print advanced mode

## 6. Viewport
- Zoom (buttons/wheel/pinch), pan (middle-drag/space-drag), fit-to-window, zoom-with-window, grid, rulers, layer-color view, anti-aliasing
- Workarea canvas per model; Ador per-module boundary overlays; borderless (open-bottom) mode

## 7. Camera
- Preview (area drag), trace image, background opacity 0–100% (5 steps), clear preview, preserve-on-import; calibration wizards (per model); autofocus-height prompts; camera data backup

## 8. Task Generation & Path Preview
- Convert engines: FLUXGhost/beamify (all web tasks) · Swiftray (desktop Promark / opt-in path engine)
- **Path preview**: playback + speed, travel-path / invert display, start-here (hidden under calc-acceleration, desktop), size/time estimate (= canvas corner estimate), cut order inner→outer
- Document settings feeding tasks: **engrave DPI** (125/250/500/1000), **auto-shrink** (HEXA, ≥250 DPI, 1-px erode), rotary mode & scale, job origin, diode offset (hybrid laser, default 70/7 mm), autofocus, Z speed-limit test
- **Pass-through / large-format sectioned engraving** (BB2 / Ador): enter object length → work area is auto-split into height sections; **reference layer** (power defaults to 0, not executed — alignment only); **guide marks** (engraved on canvas as alignment reference between sections; length + X coordinate configurable); export to work area

## 9. Machine Integration
- **Initial connection setup wizard** (`pages/InitializeMachine`): select machine model → choose connection type (Wi-Fi / wired Ethernet / direct Wired / USB, model-dependent) → step-by-step Wi-Fi setup, machine IP entry (with connection hint + next-step validation); Promark-specific flow (select laser source, Promark settings, init camera calibration)
- Discovery (network scan), machine IP tools & network test
- **Monitor/dashboard**: job progress, remaining time, camera, file browser on device; start/pause/stop/quit
- **Frame preview**: framing (bbox of visible layers) / convex hull / area-check; low-laser (blue light) on Ador
- Rotary axis (chuck/roller, mirror, extend workarea), auto-feeder, door protect, firmware update, connection test, Promark settings (laser source, red-dot, Z-axis, galvo calibration)

## 10. 3D Curve Engraving (BB2)
- Area select → focus-point grid → probe (reference Z + per-point autofocus) → mesh preview with >45° red points → click red point for error reason → re-measure selected points → engrave with curve compensation

## 11. Account & Cloud
- FLUX ID: email + Google/Facebook OAuth login, remember-me, AI credits display
- **My Cloud**: save/save-as/rename/duplicate/delete/sort, thumbnails, 5-file free-tier quota
- AI background removal (credit-gated; see §13); Design Market (dmkt.io); social links; announcement panel & rating prompt

## 12. Settings, Onboarding & Misc
- 23 UI languages; units mm/inch; default font/machine/document settings; guides; auto-save config; update check; Sentry opt-in; reset-all
- **Welcome page**: Recent Files, My Cloud, Help Center, Follow Us tabs; promo banners (region-dependent), example / new-file shortcuts, guide cards
- **Onboarding**: initial flow (language → machine select → connection setup, see §9); **New User Tutorial** (guided canvas walkthrough) + **Interface Tutorial** (step-by-step tour: camera preview, select machine, start work, basic shapes, pen tool, add layer, …); media/video tutorials; help menu (docs, forum, change logs, keyboard shortcuts)

## 13. AI & Smart Features
- **BEAMY AI assistant** (`components/Chat`): entry points in the left toolbar (DrawingToolButtonGroup → ai-chat drawer) and the welcome page; embeds a udify.app chatbot iframe, loading a per-machine Q&A assistant matched to the current model (beamo / Beambox / BB2 / HEXA / Promark / Ador…) for operation & support help (labeled "Beamy can make mistakes. Check important info.")
- **AiGenerate (text-to-image)** (`components/AiGenerate`): prompt-based image generation (prompt, style selection, dimension selection, multi-image count, Laser-friendly toggle, generation history); billed via **AI credits** (fixed cost per image; low-balance prompt links to the FLUX ID purchase page)
- **AI background removal** (credit-gated)
> AI features require FLUX ID sign-in and consume cloud AI credits.

---
† Requires FLUXGhost (SVG parse; PDF/AI additionally need the full local rig build).
