# Puzzle Generator Implementation Progress

## Overview

Implementation of a jigsaw puzzle generator for laser cutting in Beam Studio.

## Architecture

### Schema-Driven Configuration System

The puzzle generator uses a flexible, config-driven architecture:

- **Property Definitions** - Schema describing controls (sliders, toggles, selects)
- **PropertyRenderer** - Generic component that renders controls from schema
- **Puzzle Type Configs** - Self-contained configs with property lists per type
- **Nested State** - State organized by groups (image, border) for clean updates

### File Structure

```
packages/core/src/web/app/components/dialogs/PuzzleGenerator/
├── index.tsx                    ✅ Main modal with 3-panel layout
├── index.module.scss            ✅ Styles (responsive, mobile support)
├── types.ts                     ✅ TypeScript interfaces & state factories
├── puzzleTypes.config.ts        ✅ Circle, Rectangle, Heart configs
├── TypeSelector.tsx             ✅ Left sidebar thumbnails
├── Preview.tsx                  ✅ Konva canvas preview (edge-based, clipped)
├── OptionsPanel.tsx             ✅ Right panel wrapper
├── PropertyRenderer.tsx         ✅ Dynamic form generator (slider, toggle, select, group, image-upload)
├── puzzleGenerator.ts           ✅ Edge-based puzzle generation algorithm with merging
└── svgExport.ts                 ✅ Export to canvas with SVG clip-path
```

---

## Checklist

### Phase 1: Foundation ✅

- [x] Design flexible configuration system
- [x] Create `types.ts` with property definitions and state shape
- [x] Create `puzzleTypes.config.ts` with type configurations
- [x] Create main modal component (`index.tsx`)
- [x] Create `TypeSelector.tsx` - left sidebar
- [x] Create `OptionsPanel.tsx` - right panel wrapper
- [x] Create `PropertyRenderer.tsx` - generic form renderer
- [x] Create `index.module.scss` - styling
- [x] Register in `generators.config.tsx`
- [x] Add `showPuzzleGenerator` function
- [x] Add i18n entries to `en.ts`
- [x] Add i18n types to `ILang.ts`
- [x] Verify build passes

### Phase 2: Preview Canvas ✅

- [x] Create Konva Stage/Layer setup in `Preview.tsx`
- [x] Implement basic grid rendering (rectangle)
- [x] Implement jigsaw tab generation algorithm (Bezier curves)
- [x] Implement deterministic alternating tab pattern
- [x] Add real-time preview updates (via React state)
- [x] Implement assembled view
- [x] Implement exploded view toggle (hidden for non-rectangular)
- [x] Add dimension display update
- [ ] Support image overlay on puzzle (deferred)
- [x] Implement circle shape boundary (ellipse fitting full grid)
- [x] Implement heart shape boundary (Bezier curves)
- [x] Fix puzzle centering (centered at origin)
- [x] Rewrite to edge-based algorithm (proper interlocking)
- [x] Implement Konva clipFunc for boundary clipping
- [ ] Add border rendering in preview (deferred)

### Phase 3: Export to Canvas ✅

- [x] Create `svgExport.ts`
- [x] Generate SVG paths from puzzle edges
- [x] Implement small piece merging (< 50% threshold)
- [x] Implement iterative merging until ≥ 80% visibility
- [x] Implement merge direction priority (right → left → bottom → top)
- [x] Export puzzle cuts layer
- [x] Export boundary layer
- [x] Export border layer (if enabled)
- [x] Translate centered paths to positive coordinates
- [x] Add proper layer naming
- [x] Close modal after import
- [x] Implement SVG clip-path for non-rectangular shape export

### Phase 4: Polish 🔲

- [ ] Add thumbnail images for type selector
- [ ] Implement workarea size validation warning
- [ ] Test with different puzzle configurations
- [ ] Test mobile layout
- [ ] Add loading state during export
- [ ] Add image overlay support in preview

---

## Key Implementation Details

### Tab Generation Algorithm (Edge-Based)

- **Approach**: Generate all horizontal cuts, then all vertical cuts (not per-piece)
- **Pattern**: Deterministic alternating based on row/col parity via `getTabFlip()`
- **Shape**: 10-point Bezier curves inspired by Draradech's algorithm
- **Size**: 0-12% of piece size (display 0-30 with 0.4% steps, prevents overlap)
- **Interlocking**: Each edge is drawn once, ensuring proper fit
- **Depth**: `TAB_DEPTH_MULTIPLIER = 3.0` controls tab protrusion

### Shape Handling (Truncate-at-Boundary)

- Rectangular grid extends past shape boundary
- Preview uses Konva `clipFunc` with canvas context methods
- Export uses SVG `<clipPath>` element to clip edges
- Small pieces (< 50% visible) merged with neighbors
- Pieces with ≤ 1% visibility are completely hidden

### Small Piece Merging Algorithm

```typescript
// Direction priority: right, left, bottom, top
const getNeighborsInOrder = (row, col) => [
  { col: col + 1, row }, // right
  { col: col - 1, row }, // left
  { col, row: row + 1 }, // bottom
  { col, row: row - 1 }, // top
];

// Iterative merging until totalVisibility >= 0.8 (80%)
while (totalVisibility < 0.8) {
  // Find first valid neighbor and merge
  // Remove shared edge from cut paths
}
```

### Ellipse & Heart Shapes

- **Ellipse (Circle type)**: Uses full grid dimensions (width × height) not min(width, height)
- **Heart**: Uses Bezier algorithm with `topCurveHeight = height * 0.3`
- Both shapes use same clipping approach in preview (clipFunc) and export (SVG clipPath)

### Coordinate System (Centered)

- Puzzle centered at origin (0, 0)
- `calculatePuzzleLayout()` returns negative offsets (-width/2, -height/2)
- Adding rows/columns expands symmetrically
- Export translates to positive coordinates for canvas

### SVG Export with Clip-Path

For non-rectangular shapes, the export uses nested groups:

```svg
<g transform="translate(width/2, height/2)">  <!-- Outer: moves to positive coords -->
  <g clip-path="url(#boundaryClip)">          <!-- Inner: clips in local coords -->
    <path d="[edge cuts centered at origin]"/>
  </g>
</g>
```

Key insight: clipPath is defined at origin (same as paths), so when both are translated together, they stay aligned.

### State Management

```typescript
interface PuzzleState {
  typeId: string;
  columns: number;
  rows: number;
  pieceSize: number;
  tabSize: number;           // Display 0-30, internal (value * 0.4 / 100)
  orientation: 1 | 2 | 3 | 4;
  image: ImageState;
  border: BorderState;
  viewMode: 'assembled' | 'exploded';
}
```

### Export Layers

1. **Puzzle Cuts** - Horizontal + vertical edge paths (clipped for non-rectangular)
2. **Puzzle Boundary** - Shape outline (circle/heart/rectangle)
3. **Puzzle Border** - Outer frame with width offset (if enabled)

---

## Current Status

**Phase 1 Complete** - Modal opens, UI renders, controls work, state updates properly.

**Phase 2 Complete** - Konva preview renders puzzles with:

- Edge-based algorithm with proper tab interlocking
- Centered coordinate system (symmetric growth)
- Ellipse/heart shapes that fit full grid dimensions
- Konva clipFunc clips edges to boundary shape
- Visual size decoupled from pieceSize (auto-zoom to fill)
- Exploded view hidden for non-rectangular types
- Real-time updates as settings change

**Phase 3 Complete** - SVG export to Beam Studio canvas with:

- SVG clip-path for non-rectangular shape clipping
- Small piece merging with iterative algorithm (≥ 80% target)
- Merge direction priority: right → left → bottom → top
- Separate layers for cuts, boundary, border
- Coordinate translation for canvas placement

**Next Steps**: Phase 4 polish - thumbnails, validation, testing, image overlay.

---

## Files Modified This Session

| File | Changes |
|------|---------|
| `puzzleGenerator.ts` | Iterative merging algorithm, direction priority (right→left→bottom→top), merge until ≥80% |
| `Preview.tsx` | Edge-based rendering, Konva clipFunc for boundary clipping |
| `svgExport.ts` | SVG clip-path implementation with nested groups for coordinate alignment |
| `puzzleTypes.config.ts` | Tab size 0-12% (0.4% steps), border radius hidden for circle/heart |
| `types.ts` | `supportsExplodedView` property, tabSize comment |

## Integration Points

- **Entry**: `generators.config.tsx` - Added puzzle generator with `AppstoreOutlined` icon
- **Dialog**: `showPuzzleGenerator()` function registered in dialog system
- **i18n**: Full translations added to `en.ts` under `puzzle_generator` namespace
- **Canvas Export**: Uses `importSvgString` from `@core/app/svgedit/operations/import/`
