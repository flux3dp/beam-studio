# SPEC

## Puzzle Generator

A puzzle generator feature for Beam Studio that creates jigsaw puzzles for laser cutting purposes using Konva.js.

### Entry Point

Located in the **Generators** section of the app, alongside Box Generator, Code Generator, and Material Test Generator.

---

## UI Layout

The puzzle generator opens as a **full-viewport modal dialog** with three main sections:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Puzzle Generator                                                          X │
├──────────┬──────────────────────────────────────────────────┬───────────────┤
│          │                              [250mm × 250mm]     │ Circle Jigsaw │
│  [Type]  │                                                  │               │
│  [Type]  │              PREVIEW AREA                        │  [Options]    │
│  [Type]  │                                                  │  [Controls]   │
│          │                                                  │               │
│          │                  ┌──┐ ┌──┐                       │               │
│          │                  │▦▦│ │░░│                       │ [Import Btn]  │
│          │                  └──┘ └──┘                       │               │
└──────────┴──────────────────────────────────────────────────┴───────────────┘
```

**Modal Dimensions:**

- Width: `calc(100vw - 64px)` (full viewport minus padding)
- Height: `calc(100vh - 100px)` (full viewport minus header/footer)
- Mobile: `flex-direction: column`, `max-height: 80svh`

### 1. Left Sidebar - Puzzle Type Selection

- **Display**: Photo thumbnails of laser-cut puzzle examples (static images)
- **Function**: Clickable type selectors
- **Behavior**: Clicking a type resets all options to that type's default values

**Available Types:**

1. Circle Jigsaw (ellipse that fits full grid dimensions)
2. Rectangle Jigsaw
3. Heart Jigsaw

### 2. Center - Preview Area

- **Auto-fit**: Preview always scales to show the entire puzzle
- **Size Display**: Shows current puzzle dimensions in top-right corner, respects unit preference (mm or inches)
- **Real-time Updates**: Preview updates immediately as user adjusts settings
- **Edge-based Rendering**: Uses horizontal + vertical edge paths for accurate preview
- **Clipping**: Shapes that don't fill their bounding box use reusable SVG boundary path for clipping

**View Toggle Buttons** (bottom center):

- **Design Preview**: Shows puzzle as it would look when assembled (default)
- **Exploded View**: Shows puzzle and puzzle board side-by-side with 30mm gap
  - Puzzle on left, board base on right (matching export layout)
  - Proper centering around combined bounding box
  - Board base shown in different color to distinguish from puzzle
  - Available for all puzzle types

### 3. Right Panel - Options & Controls

**Header**: Displays current puzzle type name (e.g., "Circle Jigsaw")

#### Options

**Image** (Toggle Checkbox)

- When enabled, reveals an expandable/accordion section containing:
  - **Upload Area**: Supports drag-and-drop AND file picker button. Shows thumbnail after upload with "Click to change image" text
  - **Supported Formats**: JPG, PNG, WebP (max 10MB, 4000px)
  - **Adjustment controls** (appear only after an image is uploaded):
    - **Zoom**: Slider 25% - 400% (default: 100%)
    - **Bleed**: Slider 0mm - 5mm (step: 0.5mm, default: 2mm) — extends image beyond cut boundary
    - **X Offset**: Slider -1000 to 1000 (default: 0)
    - **Y Offset**: Slider -1000 to 1000 (default: 0)
    - **Export As**: Dropdown - Printing Layer or Engraving Layer
- **Image Preview Behavior**:
  - Clipped to puzzle shape boundary (expanded by bleed amount)
  - Default positioning: Center and cover (maintains aspect ratio, crops excess)
  - Visible in both design preview and exploded view (on puzzle side only, below raised edges)
  - Visible in view mode thumbnail buttons
- **Image Export Behavior**:
  - Pre-cropped on an offscreen canvas clipped to the boundary shape (no SVG `<clipPath>`)
  - Processed through `imageData()` for proper display (grayscale/color conversion)
  - Created as a dedicated layer with `origImage` blob URL, `data-shading`, `data-threshold` attributes
  - Compatible with Beam Studio's image editing tools (ImageEditPanel, CropPanel)
  - Printing mode: creates fullcolor layer with `LayerModule.PRINTER`
  - Engraving mode: creates standard laser layer
  - Exported last (top-most layer in layer panel)

**Puzzle Board** (Toggle Checkbox)

- When enabled, adds outer frame (board base) around entire puzzle perimeter
- **Board Width**: Slider + UnitInput, 1mm - 20mm (step: 0.5mm), supports mm↔inch conversion
- **Board Radius**: Slider + UnitInput, 0 - 50
  - Rectangle: Controls corner rounding (visible in UI)
  - Heart: Uses fixed DEFAULT_HEART_SHARPNESS (25) for optimal shape (hidden from UI)
  - Circle: Hidden (circles have no corners)
- **Guide Lines** (Toggle, default: off)
  - When enabled, engraves complete puzzle edge pattern (including tabs) onto the board base
  - Creates a visual guide for puzzle assembly
  - Shown in exploded view preview on the board base side
  - Exported as a separate "Guide Lines" layer

**Columns**

- Slider + UnitInput (no unit conversion — count)
- Range: 2 - 20
- Default: 5

**Rows**

- Slider + UnitInput (no unit conversion — count)
- Range: 2 - 20
- Default: 5

**Piece Size**

- Slider + UnitInput, supports mm↔inch conversion
- Range: 10mm - 100mm
- Default: 15mm

**Tab Size**

- Slider + UnitInput (no unit conversion — unitless ratio)
- Range: 0 - 30 (display value; internally converted to 0-12% via `value * 0.4 / 100`)
- Default: 20 (= 8% actual tab size)
- *Note: 0 creates simple grid pieces with no interlocking tabs*

**Piece Orientation**

- Dropdown select
- Options: Type 1, Type 2, Type 3, Type 4
- Represents different tab placement patterns (seeded random based on orientation)

**Radius** *(Rectangle only)*

- Slider + UnitInput (no unit conversion — unitless ratio)
- Range: 0 - 50
- Default: 0
- Rounds puzzle boundary corners; when > 0, enables boundary clipping and piece merging
- Independent from Board Radius (which controls outer border frame corners)
- On Raised Edges: inner cutout uses this radius, outer boundary uses Board Radius

**Import to Canvas** (Primary Button)

- Generates puzzle and imports to Beam Studio canvas
- Placement: Center of current workarea
- Closes modal after successful import
- *[Future: Show loading indicator if export takes > 500ms]*

---

## Technical Specifications

### Architecture Decisions

1. **Schema-driven Configuration**: Keep the extensible property schema system for future puzzle types
2. **Multi-pass Merging Algorithm**: Keep the 3-pass approach for handling edge cases in non-rectangular shapes
3. **Full Tab Jitter System**: Keep Draradech's algorithm with 5 coefficients for natural-looking tabs
4. **Centered Coordinate System**: Keep origin at (0,0) with translation on export
5. **ts-pattern for Matching**: Keep the library for exhaustive pattern matching
6. **Shape Metadata Pattern**: Shape-specific behavior (clipping, corner radii, visibility) is resolved through `getShapeMetadata()` rather than hardcoded shape-name checks in consumer code. Adding a new shape forces a single `.exhaustive()` update that flows to all consumers.
7. **Discriminated Union State**: `PuzzleState` is a discriminated union by `typeId: ShapeType`, with a separate `PuzzleStateUpdate` type for property updates that excludes the discriminant. This ensures shape-specific fields (e.g. `radius` on rectangle) are typed per-shape, and adding a new shape produces compile errors in the factory and metadata functions.

### Grid & Shape Behavior

**Rectangle Jigsaw**

- Standard rectangular grid based on Columns × Rows
- All edge pieces have flat outer edges
- **Radius** (0-50): Rounds the puzzle boundary corners
  - When radius > 0, corner pieces are clipped to rounded boundary (same as circle/heart)
  - Visibility sampling and piece merging activate when radius > 0
  - Always applies regardless of whether Puzzle Board is enabled
  - Independent from Board Radius (which controls the outer border frame corners)
- On Raised Edges: inner cutout uses puzzle Radius; outer boundary uses Board Radius

**Circle Jigsaw (Ellipse)**

- Uses "truncate-at-boundary" approach: rectangular grid is generated, then clipped by ellipse
- Ellipse fits full grid dimensions (width × height), not min(width, height)
- Edge pieces are clipped to ellipse boundary
- Small pieces (< 50% visible) are merged with neighbors
- No border radius option (circles have no corners)

**Heart Jigsaw**

- Uses "truncate-at-boundary" approach: rectangular grid is generated, then clipped by heart shape
- Heart uses Bezier curves with `topCurveHeight = height * 0.3`
- Bottom curves are more linear for a cleaner look
- Small pieces (< 50% visible) are merged with neighbors
- Uses `DEFAULT_HEART_SHARPNESS = 25` for optimal heart shape (hidden from UI)

### Shape Path Consolidation (shapeGenerators.ts)

A single reusable shape generator module provides:

- `generateShapePath()` - SVG path for any shape type
- `generateBorderPath()` - Expanded shape path for borders
- `generateRaisedEdgesPath()` - Frame with inner cutout (supports separate inner/outer corner radii)
- `isPointInShape()` - Boundary check for visibility calculations (supports cornerRadius)
- `drawShapeClipPath()` - Canvas context drawing for Konva clipFunc
- `getShapeMetadata()` - Resolves shape capabilities and corner radii from state (`.exhaustive()` enforced)
- `DEFAULT_HEART_SHARPNESS = 25` - Optimal heart shape constant

**Shape Metadata** (`getShapeMetadata`):

Centralized dispatch that resolves shape-specific behavior from state. All consumer code queries metadata instead of checking shape names directly. Returns:

- `fillsBoundingBox` — whether clipping/merging is needed (false for circle, heart; true for sharp-cornered rectangle)
- `boundaryCornerRadius` — corner radius for the puzzle boundary path and visibility sampling
- `borderCornerRadius` — corner radius for the outer border frame
- `innerCutoutCornerRadius` — corner radius for the inner cutout of raised edges

Used in:

- geometry/puzzleGenerator.ts (boundary generation, visibility checks)
- geometry/puzzleGeometry.ts (merge groups, boundary path, border paths)
- hooks/useClipFunctions.ts (preview clipping via canvas clipFunc)
- geometry/svgExport.ts (SVG clipPath decision)

### Small Piece Merging Algorithm

For shapes that don't fill their bounding box (per `getShapeMetadata().fillsBoundingBox`), pieces with < 50% visibility are merged:

1. **Pass 0 - Very Small Corners (< 25%)**: Handle corner pieces with extended neighbor search including diagonal bridging
2. **Pass 1 - Horizontal Merging**: Right → Left priority, creates horizontal strips
3. **Pass 2 - Vertical Merging**: Bottom → Top priority, handles remaining pieces
4. **Pass 3 - Expansion**: Expand groups until combined visibility ≥ 80%

**Merge Direction Priority**: right → left → bottom → top

### Tab Generation Algorithm

**Pattern**: Seeded random via `generateJitterMap()` based on orientation

- Each orientation (1-4) has a unique seed for distinct visual character
- Random flip direction per tab creates variety
- 5 jitter coefficients (a, b, c, d, e) per tab for natural variation

**Tab Shape**: 10-point Bezier curves (Draradech algorithm)

- Three cubic Bezier segments per tab
- `TAB_DEPTH_MULTIPLIER = 3.0` controls tab depth relative to size
- Smooth curves for clean laser cutting

**Tab Size Conversion**:

- Display value: 0-30 (user-facing slider)
- Internal fraction: `(displayValue * 0.4) / 100` = 0-0.12 (0-12%)
- 30 steps with 0.4% increments prevent tab overlap

### Coordinate System (Centered)

- Puzzle is centered at origin (0, 0)
- `calculatePuzzleLayout()` returns negative offsets (`-width/2`, `-height/2`)
- Adding rows/columns expands symmetrically from center
- Export translates to positive coordinates for canvas placement

### Unit Input & Inch Support

All numeric inputs use `UnitInput` from `@core/app/widgets/UnitInput`. Properties with `unit: 'mm'` support automatic mm↔inch conversion based on the user's global unit preference (`useStorageStore.isInch`).

**Conversion behavior:**

- Internal state is always stored in mm — no schema or geometry changes needed
- UnitInput's formatter divides by 25.4 for display, parser multiplies by 25.4 on input
- Properties without `unit: 'mm'` (counts, percentages, unitless ratios) use UnitInput without `isInch` for visual consistency

**Step behavior:**

- Slider always uses the original mm step (avoids grid-snapping misalignment)
- UnitInput uses 0.254mm (= 0.01in) step for mm properties when in inch mode
- Slider tooltip is hidden; UnitInput shows the authoritative value
- UnitInput stepper arrows are hidden (`controls={false}`) — users use slider or type directly

**Precision:**

- mm mode: derived from property step (`Math.ceil(-Math.log10(step))`) — e.g., step=1 → 0 decimals, step=0.5 → 1 decimal
- inch mode: always 4 decimals (codebase convention)

**Unit display:**

- Unit suffix removed from property label, shown via UnitInput's `unit` prop instead
- mm properties: dynamic `'mm'` / `'in'`
- Other properties: pass through (`'%'` for zoom, `undefined` for unitless)

**Preview header:** Shows dimensions in user's preferred unit (e.g., `3.94in × 5.91in` or `100mm × 75mm`)

### Performance Optimizations

**Visibility Memoization**:

- Cache piece visibility calculations per piece
- Recalculate only when pieceSize, rows, columns, or shape type changes
- Sampling uses 5×5 grid + 4 corners + 12 tab samples = 41 points per piece

### Size Validation — *[Future: Phase 5]*

**Constraints**: Based on maximum workarea from `workarea-constants.ts`

- **Warning**: Displayed when puzzle exceeds largest workarea size
- **Behavior**: Warning shown but generation is allowed (user may have larger machine)

**Kerf Compensation**: None

- User handles kerf adjustment in their laser cutting software
- Generator outputs exact mathematical paths

### Export/Output

**Layout**: Exploded view export (puzzle and board base side-by-side)

- Puzzle positioned on the left
- Board base positioned on the right (if enabled)
- 30mm gap between puzzle and board base (`LAYERS_EXPORT_GAP`)
- Combined bounding box calculated for proper canvas placement

**Layers** (with descriptive auto-naming for cut order/material separation, bottom-to-top in layer panel):

**LEFT SIDE (Puzzle Material):**

1. **Board Base** (cutting): Solid base piece (if Puzzle Board enabled)
   - Same outer dimensions as Raised Edges
   - Positioned at right side of combined layout
2. **Guide Lines** (engraving): Puzzle piece edges engraved onto board base (if Puzzle Board + Guide Lines enabled)
   - Same pattern as Puzzle Pieces layer
   - Creates visual guide showing where pieces fit
   - Positioned at right side of combined layout

**RIGHT SIDE (Board Material):**

3. **Raised Edges** (cutting): Frame with inner cutout (if Puzzle Board enabled)
   - Outer boundary matches Board Base dimensions (puzzle + board width), uses `borderCornerRadius`
   - Inner boundary is the puzzle shape, uses `innerCutoutCornerRadius` (creates the "walls" holding puzzle pieces)
   - Uses even-odd fill rule to create the cutout effect
   - Positioned at left side of combined layout
4. **Puzzle Pieces** (cutting): Combined horizontal + vertical edge paths for laser cutting
   - Uses SVG `<clipPath>` when shape doesn't fill its bounding box
   - Positioned at left side of combined layout

**TOP (Image):**

5. **Puzzle Image** (if image enabled and uploaded): Pre-cropped PNG of user's image
   - Clipped to puzzle boundary shape on offscreen canvas (no SVG clipPath)
   - Processed through `imageData()` with `origImage` blob URL for Beam Studio compatibility
   - Printing mode: fullcolor layer with `LayerModule.PRINTER`
   - Engraving mode: standard laser layer with grayscale processing
   - Positioned on puzzle side (left) of combined layout

**SVG Export with Clip-Path** (for shapes that don't fill their bounding box):

```svg
<svg>
  <defs>
    <clipPath id="boundaryClip">
      <path d="[boundary shape at origin]"/>
    </clipPath>
  </defs>
  <g transform="translate(width/2, height/2)">
    <g clip-path="url(#boundaryClip)">
      <path d="[edge cuts]" stroke-width="0.1"/>
    </g>
  </g>
</svg>
```

**Stroke Width**: 0.1mm for visibility in preview software

---

## Default Values

| Parameter | Default |
|-----------|---------|
| Puzzle Type | Circle Jigsaw |
| Columns | 5 |
| Rows | 5 |
| Piece Size | 15mm |
| Tab Size | 20 (display) / 8% (actual) |
| Piece Orientation | Type 1 |
| Radius | 0 (rectangle only) |
| Image | Disabled |
| Puzzle Board | Disabled |
| Board Width | 5mm |
| Board Radius | 0 |
| Guide Lines | Disabled |
| Image Zoom | 100% |
| Image Bleed | 2mm |
| Image X Offset | 0 |
| Image Y Offset | 0 |
| Image Export As | Printing Layer |

*Note: Each puzzle type may have different default values in future iterations*

---

## Modal Behavior

**State Persistence**: None

- Modal resets to default values each time it opens
- No preset/template system

**Close Methods**:

- X button in top-right corner
- ESC key support (standard modal behavior)
- Cancel button in footer

**After Import**:

- Modal closes automatically after successful import to canvas

**Type Switching**:

- Changing puzzle type resets all options to that type's defaults

**Undo/Redo**: Not needed

- Settings are simple enough for manual readjustment

---

## Accessibility

**Focus**: Mouse/touch-focused interface

- Basic keyboard support (Enter/Space for type selection)
- No advanced screen reader support required

---

## Edge Cases

**Very Small/Large Puzzles** (e.g., 2x2 or 20x20):

- No special handling or warnings
- Allow any combination within the defined ranges

**Extreme Image Aspect Ratios**:

- Image is centered and scaled to cover puzzle area
- Excess portions are cropped
- User can adjust with zoom and offset controls

**Pieces Completely Outside Boundary**:

- Pieces with ≤ 1% visibility are skipped entirely
- No edges are generated for completely outside pieces

---

## i18n Requirements

All user-facing strings must use the i18n system under `puzzle_generator` namespace:

- Type names: `types.circle_jigsaw`, `types.rectangle_jigsaw`, `types.heart_jigsaw`
- Property labels: `columns`, `rows`, `piece_size`, `tab_size`, `orientation`, `radius`, etc.
- Action buttons: `import_to_canvas`, `cancel`
- View modes: `design_preview`, `exploded_view`
- Validation messages and warnings

**No hardcoded fallback strings** - all text must have i18n keys.

---

## Type System

**Discriminated Union for PuzzleState**:

`PuzzleState` uses a discriminated union keyed on `typeId: ShapeType` (`'circle' | 'heart' | 'rectangle'`):

- `BasePuzzleState` — shared fields (border, columns, image, orientation, pieceSize, rows, tabSize, viewMode)
- `CirclePuzzleState` — `typeId: 'circle'`, no extra fields
- `HeartPuzzleState` — `typeId: 'heart'`, no extra fields
- `RectanglePuzzleState` — `typeId: 'rectangle'`, adds required `radius: number`

`PuzzleStateUpdate = Partial<Omit<CirclePuzzleState, 'typeId'> & Omit<HeartPuzzleState, 'typeId'> & Omit<RectanglePuzzleState, 'typeId'>>` — auto-derived from the union variants so new shape-specific fields are included automatically. Excludes `typeId` to prevent accidental discriminant changes. Shape switching goes through `createDefaultPuzzleState()`.

`PuzzleTypeConfig.id` is typed as `ShapeType` (not `string`), ensuring config entries match the union.

Adding a new shape requires:

1. Add literal to `ShapeType` in `types.ts`
2. Add per-shape interface extending `BasePuzzleState` in `types.ts`
3. Add case to `createDefaultPuzzleState()` (compiler-enforced via `.exhaustive()`)
4. Add case to `getShapeMetadata()` (compiler-enforced via `.exhaustive()`)
5. Add config entry to `PUZZLE_TYPES` in `puzzleTypes.config.ts`

---

## File Structure

```
packages/core/src/web/app/components/dialogs/PuzzleGenerator/
├── index.tsx                      # Main modal with 3-panel layout (full viewport)
├── index.module.scss              # Root layout styles (container, modal, footer)
├── types.ts                       # ShapeType, discriminated union state, property defs, state factories
├── constants.ts                   # Shared color sets (COLORS), ViewMode/ColorSet types
├── puzzleTypes.config.ts          # Circle, Rectangle, Heart configs (schema-driven)
├── utils.ts                       # Shared utilities (type name resolution)
│
├── geometry/                      # Pure math, no React (barrel-exported via index.ts)
│   ├── index.ts                   # Barrel re-export
│   ├── puzzleGeometry.ts          # Unified geometry service (shared by Preview + svgExport)
│   ├── puzzleGenerator.ts         # Edge-based puzzle generation algorithm with merging (+ TabJitter/PuzzleJitterMap types)
│   ├── shapeGenerators.ts         # Shape paths, metadata, and boundary checks (extensibility hub)
│   └── svgExport.ts               # Export to canvas with exploded view layout (side-by-side)
│
├── hooks/                         # Custom hooks (no barrel, direct imports)
│   ├── useContainerSize.ts        # ResizeObserver hook for canvas sizing
│   ├── useClipFunctions.ts        # Memoized Konva clipFunc wrappers
│   └── useImageLayout.ts          # Image "center and cover" layout computation
│
└── components/                    # UI components (no barrel, direct imports)
    ├── Preview/
    │   ├── index.tsx              # Main Preview component (~160 lines)
    │   ├── Preview.module.scss    # Preview-specific styles
    │   ├── constants.ts           # COLORS, STROKE_WIDTH, THUMB_SIZE, etc.
    │   ├── computeViewLayout.ts   # ViewLayout interface + function
    │   ├── DesignScene.tsx        # Design view scene (exports SceneProps)
    │   ├── ExplodedScene.tsx      # Exploded view scene
    │   ├── PuzzleStack.tsx        # Puzzle boundary + edges stack
    │   ├── PuzzleEdges.tsx        # Horizontal + vertical edge paths
    │   └── ImageOverlay.tsx       # Clipped image overlay
    │
    ├── PropertyRenderer/
    │   ├── index.tsx              # Routing logic + getValue/setValue (~110 lines)
    │   ├── PropertyRenderer.module.scss
    │   ├── SliderProperty.tsx     # Slider + number input
    │   ├── SelectProperty.tsx     # Select dropdown
    │   ├── ToggleProperty.tsx     # Switch toggle
    │   ├── GroupProperty.tsx      # Expandable group (recursive)
    │   └── ImageUploadProperty.tsx # File upload with drag/drop
    │
    ├── OptionsPanel.tsx           # Options container + OptionsPanel.module.scss
    ├── OptionsPanel.module.scss
    ├── TypeSelector.tsx           # Type selector + TypeSelector.module.scss
    └── TypeSelector.module.scss
```

---

## Completed Phases

- ✅ **Phase 1** — Foundation (modal, config system, type selector, property renderer, i18n)
- ✅ **Phase 2** — Preview canvas (Konva, edge-based algorithm, all shape boundaries, exploded view)
- ✅ **Phase 3** — Export to canvas (SVG paths, piece merging, clip-path, layer naming)
- ✅ **Phase 4** — Refactoring (shape consolidation, metadata pattern, discriminated union, exploded export)
- ✅ **Phase 4.7** — Image overlay (upload, preview with clipping/bleed, offscreen canvas export)
- ✅ **Phase 4.8** — UnitInput & inch support (mm↔inch conversion, slider/input separation)
- ✅ **Phase 4.9** — Guide Lines toggle (independent toggle in Puzzle Board group, rename outlines → guideLines)
- ✅ **Phase 4.10** — Folder restructuring (13 flat files → organized hierarchy: geometry/, hooks/, components/ with Preview/, PropertyRenderer/ subfolders, colocated SCSS modules, isMobile prop pattern)
- ✅ **Phase 4.11** — Code review improvements: factory function for base defaults (shared-reference bug), CSS Modules `.mobile &` fix, `useMemo` for acceptedTypes, svgCanvas null guard, reuse `dpmm` constant, extracted `computeHeartControlPoints()`, `NestedStateKey` type, auto-derived `PuzzleStateUpdate`, `useCallback` for viewMode handler, Map-based visibility lookup, ResizeObserver throttle, dead code removal (getDefaultsForType, totalWidth/totalHeight, unused x prop)

## Phase 5: Future Features 🔲

- [ ] Add thumbnail image assets for type selector (infrastructure ready, needs actual images)
- [ ] Implement workarea size validation warning
- [ ] Implement loading state during export (if > 500ms)
- [ ] Test with different puzzle configurations
- [ ] Test mobile layout

---

## UI Reference

![Puzzle Generator UI Mockup](image.png)
