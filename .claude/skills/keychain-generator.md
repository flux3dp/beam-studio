# Keychain Generator

Location: `packages/core/src/web/app/components/dialogs/KeyChainGenerator/`

## Overview

A dialog for generating laser-cuttable keychain designs. Users pick a category (shape), customize text/elements/holes/decorations, and export to the SVG canvas. Uses Paper.js for geometry operations (boolean ops, offset, path intersection).

## File Structure

```
KeyChainGenerator/
├── KeyChainGenerator.tsx           # Modal dialog entry point
├── types.ts                        # All type definitions
├── categories.ts                   # resolveCategory/getStateForCategory + re-exports KEYCHAIN_CATEGORIES & DEFAULT_*
├── useKeychainShapeStore.ts        # Zustand store (state + build actions)
├── exportToCanvas.ts               # Export final shape to SVG canvas
├── constants/
│   ├── index.ts                    # PX_TO_MM_RATIO=10, PUNCH_HOLE_OFFSET=-5, colors
│   ├── decorations.ts              # Decoration path definitions
│   ├── designTokens.ts             # Theme tokens
│   ├── elementOptions.ts           # Available element/icon options
│   └── categories/                 # Category definitions (data), grouped by family
│       ├── index.ts                # Assembles KEYCHAIN_CATEGORIES[] (order matters); re-exports defaults
│       ├── basePaths.ts            # SVG base path data per shape (CAPSULE, OVAL, ANIMAL_1, etc.)
│       ├── defaults.ts             # DEFAULT_HOLE/ELEMENT/TEXT/DECORATION/CUSTOM_SHAPE_*/OUTLINE_OFFSET
│       ├── shapes.ts               # surfingBoard, capsule, oval, roundArch, tag, rounded, polygonal, quadrilateral
│       ├── pet.ts                  # pet (cat/dog variants)
│       ├── dialogBox.ts            # dialogBox variants
│       ├── geometry.ts             # geometry variants
│       ├── plant.ts                # plant variants
│       ├── animal.ts               # animal variants
│       └── customShapes.ts         # text, iconTextLeft (isCustomShape)
├── builders/
│   ├── buildShape.ts               # importBasePath, applyHoles, getStartPoint (ray intersection)
│   ├── buildDecorations.ts         # buildDecorations (text + elements + decoration paths)
│   ├── buildSvgViews.ts            # buildSvgView → design/exploded SVG strings
│   ├── buildText.ts                # createTextElement, createTextPath, applyTexts
│   ├── buildElement.ts             # loadShape, applyElements for icon shapes
│   ├── buildCustomBaseShape.ts     # Text/icon-derived base shape generation
│   └── *.spec.ts                   # Unit tests
├── components/
│   ├── Preview.tsx                 # SVG preview + triggers rebuild via useEffect
│   ├── CategorySelector.tsx        # Category picker
│   ├── ViewModeToggle.tsx          # Design vs exploded view
│   └── OptionsPanel/
│       ├── OptionsPanel.tsx        # Options container
│       ├── ShapeVariantSelector.tsx # Variant picker (e.g. rounded_1–6)
│       ├── SizeGroup.tsx           # Width/height controls
│       ├── Text/                   # Text option controls
│       ├── Hole/                   # Hole option controls
│       ├── Element/                # Element/icon option controls
│       ├── CustomShape/            # Custom shape text/element controls
│       └── Controls/               # Reusable UI (NumberControl, SelectControl, etc.)
└── hooks/
    └── useContainerSize.ts         # Container dimension tracking
```

## Build Pipeline

```
Category selection
  → buildBaseShape(category)
    ├─ Predefined: importBasePath(svgContent) → unite sub-paths → reorient normals
    └─ Custom (text/icon): fontkit text→path + element union + outline offset
  → applyOptions()
    ├─ applyHoles(basePath, state, holeDefs, sizeRatio) → boolean ops (unite outer, subtract inner)
    ├─ buildDecorations(project, state, ...) → text/element/path decorations split by emboss
    └─ buildSvgView('design'/'exploded') → final SVG strings
  → Store shape → Preview renders SVG
```

## Key Concepts

### Categories & Variants

- `KeyChainCategory`: Defines a shape with svgContent, options (holes/texts/elements/decorations), defaultSize
- `ShapeVariant`: Override within a category (different svgContent/options). Used by `rounded` category (6 variants)
- `resolveCategory(category, variantKey)`: Merges variant overrides into base category
- `getStateForCategory(category)`: Initializes all option values from defaults

### Hole Positioning (buildShape.ts)

Holes are positioned along the shape contour at a percentage offset from a start point.

**Start point algorithm — `getStartPoint(path, startPositionRef)`:**

1. Get `refPoint` from `path.bounds[startPositionRef]` (e.g. `bounds.topCenter`)
2. Cast a ray from `refPoint` → `path.bounds.center` via `new paper.Path.Line()`
3. Find all `path.getIntersections(ray)` and pick the one closest to `refPoint` (i.e. farthest from center)
4. Fallback: `path.getNearestPoint(refPoint)` if no intersections

This ray intersection approach handles **concave shapes** (e.g. four-leaf clover) where `getNearestPoint` would snap to an inner concavity instead of the outer contour.

**Positioning flow:**
1. Offset the main path by `holeOffsetDist` via `PaperOffset.offset()` — this is where the hole center sits
2. Find start point on offset path (or main path if offset produces CompoundPath)
3. Walk `position%` along the path from the start point
4. Create inner circle (hole) and optional outer circle (ring thickness)
5. Unite outer circles with base, subtract inner circles

**Hole types:**
- `ring`: Has both inner hole and outer thickness ring united with base
- `punch`: Inner hole only, uses `PUNCH_HOLE_OFFSET = -5` to shift inward

### Store (useKeychainShapeStore.ts)

Zustand store with cached Paper.js objects:

| Field | Description |
|-------|-------------|
| `project` | Paper.js canvas project |
| `basePath` | Imported/generated base path (cached per category) |
| `resultPath` | Base path after holes applied |
| `innerPath` | Inner geometry for custom shapes (text glyphs) |
| `shape` | Final output: `{ designSvg, explodedSvg, resultBasePath, decorations, ... }` |
| `sizeRatio` | Scale factor: `(targetMM × PX_TO_MM_RATIO) / basePath.bounds[dimension]` |
| `buildVersion` | Incremented per build call — stale async builds detected and discarded |
| `state` | User-editable params: `KeyChainState` |

Key actions: `buildBaseShape(category)`, `applyOptions()`, `setCategoryState()`, `setVariant()`, `updateState()`

### Custom Shapes (text/icon categories)

When the category is `text` or `icon-text-*`:
- No predefined SVG; base path generated from user text via fontkit (`convertTextToPathByFontkit`)
- Element shapes can be combined via union
- Outline offset applied via `PaperOffset.offset()` to create the outer ring
- Build is async (font loading); uses `buildVersion` for stale-call detection

### View Modes

- **design**: Monochrome output for laser cutting
- **exploded**: Color-coded layers — base (black), engraving (orange), emboss (green/blue)

## Testing

```bash
pnpm test packages/core/src/web/app/components/dialogs/KeyChainGenerator/builders
```

Paper.js is fully mocked in tests (MockPath, MockCompoundPath, MockCircle, MockLine). The mock lives inline in the spec file via `jest.mock('paper', ...)`.
