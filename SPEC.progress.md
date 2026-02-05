# Puzzle Generator — Implementation Progress

Detailed spec: [SPEC.md](SPEC.md)

## File Structure

```text
packages/core/src/web/app/components/dialogs/PuzzleGenerator/
├── index.tsx                      # Main modal with 3-panel layout
├── index.module.scss              # Root layout styles (container, modal, footer)
├── types.ts                       # ShapeType, discriminated union state, property defs, state factories
├── constants.ts                   # Shared color sets (COLORS), ViewMode/ColorSet types
├── puzzleTypes.config.ts          # Circle, Rectangle, Heart configs (schema-driven)
├── utils.ts                       # Shared utilities (type name resolution)
├── geometry/                      # Pure math, no React (barrel-exported)
│   ├── index.ts                   # Barrel re-export
│   ├── puzzleGeometry.ts          # Unified geometry service
│   ├── puzzleGenerator.ts         # Edge-based puzzle generation with merging (+ TabJitter/PuzzleJitterMap types)
│   ├── shapeGenerators.ts         # Shape paths, metadata, boundary checks
│   └── svgExport.ts               # Export to canvas with exploded layout
├── hooks/                         # Custom hooks (direct imports)
│   ├── useContainerSize.ts        # ResizeObserver hook
│   ├── useClipFunctions.ts        # Memoized Konva clipFunc wrappers
│   └── useImageLayout.ts          # Image layout computation
└── components/                    # UI components (direct imports)
    ├── Preview/                   # Canvas preview (9 files)
    ├── PropertyRenderer/          # Dynamic form generator (7 files)
    ├── OptionsPanel.tsx + .scss   # Right panel wrapper
    └── TypeSelector.tsx + .scss   # Left sidebar thumbnails
```

---

## Completed Phases

### Phase 1: Foundation ✅

Modal, config system, type selector, property renderer, i18n entries, registration in generators.

### Phase 2: Preview Canvas ✅

Konva Stage/Layer, edge-based tab generation (Bezier curves, seeded random), all three shape boundaries (rectangle, ellipse, heart), centered coordinate system, boundary clipping, exploded view toggle.

### Phase 3: Export to Canvas ✅

SVG path generation, small piece merging (< 50% → iterative until ≥ 80%), SVG clip-path for non-rectangular shapes, separate layers with descriptive naming, side-by-side exploded export layout.

### Phase 4: Refactoring & Polish ✅

- **4.0** — Consolidated shape generators into `shapeGenerators.ts`, removed Paper.js, cleaned up types, exploded view export with 30mm gap, full viewport modal, i18n audit
- **4.5** — Rectangle radius property, `getShapeMetadata()` pattern replacing all hardcoded shape checks
- **4.6** — Error handling, zh-tw translations, `ComponentNameProps` naming, discriminated union refactor (`PuzzleState` by `typeId`)
- **4.7** — Image overlay (upload, "center and cover" preview with bleed, offscreen canvas export with `imageData()` processing, printing/engraving modes)
- **4.8** — UnitInput replacing InputNumber, mm↔inch conversion for dimension properties, slider/input step separation, preview header unit display
- **4.9** — Guide Lines toggle: independent toggle in Puzzle Board group, renamed `outlines` → `guideLines` across Preview/svgExport, fixed GroupProperty to only filter header toggle (not all toggles)
- **4.10** — Folder restructuring: reorganized 13 flat files into `geometry/` (barrel-exported pure math), `hooks/` (useContainerSize, useClipFunctions, useImageLayout), and `components/` (Preview/ with 9 files, PropertyRenderer/ with 7 files, OptionsPanel, TypeSelector). Colocated SCSS modules per component. Moved `ShapeType` to `types.ts`. Used `isMobile` prop pattern instead of `.mobile &` parent-context selectors (CSS Modules hash namespaces differ across files). Root `index.module.scss` trimmed from 343 → 35 lines.
- **4.11** — Code review improvements (bugs, robustness, DRY, performance, dead code):
  - **Bugs**: `createBaseDefaults()` factory function to avoid shared mutable nested objects; fixed `.mobile &` CSS Modules parent-selector that never matched; `useMemo` for `acceptedTypes` array to stabilize `useCallback` deps
  - **Robustness**: svgCanvas null guard in `exportToCanvas`; replaced magic `pxPerMm=10`/`svgDpmm=10` with shared `dpmm` from `@core/app/actions/beambox/constant`; documented blob URL lifecycle
  - **DRY**: extracted `computeHeartControlPoints()` shared by 3 functions; created `NestedStateKey` type replacing 4 inline unions; auto-derived `PuzzleStateUpdate` from union variants
  - **Performance**: extracted `handleViewModeChange` useCallback; Map-based O(1) visibility lookup in `calculateMergeGroups`; `requestAnimationFrame` throttle on ResizeObserver
  - **Dead code**: removed `getDefaultsForType()`, `totalWidth`/`totalHeight` dead fields, unused `x` prop on PuzzleStack
  - **Quality**: moved `TabJitter`/`PuzzleJitterMap` to `geometry/puzzleGenerator.ts`; orientation comment; removed redundant `gridGenerator` param; renamed `f2` → `fmt`; extracted `DIALOG_ID` constant; `useId()` for ImageUploadProperty input; `classNames()` consistency

### Phase 5: Future Features 🔲

- [ ] Add thumbnail image assets for type selector (infrastructure ready in TypeSelector.tsx, needs actual images)
- [ ] Implement workarea size validation warning
- [ ] Add loading state during export
- [ ] Test with different puzzle configurations
- [ ] Test mobile layout

---

## Integration Points

- **Entry**: `generators.config.tsx` — puzzle generator with `AppstoreOutlined` icon
- **Dialog**: `showPuzzleGenerator()` registered in dialog system
- **i18n**: `en.ts`, `zh-tw.ts`, `ILang.ts` under `puzzle_generator` namespace
- **Canvas Export**: SVG layers via `importSvgString`, image layer via `addSvgElementFromJson`
- **Unit System**: `useStorageStore.isInch` → `UnitInput` for mm↔inch conversion
