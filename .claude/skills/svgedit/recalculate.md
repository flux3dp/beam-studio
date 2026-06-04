# SVG Transform Recalculation System

## Purpose

Simplifies SVG element transform lists by absorbing translate/scale into element attributes (x, y, width, height, d, points, etc.), leaving only a rotation transform `[R]`. When absorption isn't possible, reduces to `[R][M]` form (rotation + matrix).

## File Locations

- `packages/core/src/web/app/svgedit/transform/recalculate.ts` — main recalculate logic
- `packages/core/src/web/app/svgedit/transform/coords.ts` — `remapElement` (applies matrix to element attributes)
- `packages/core/src/web/app/svgedit/transform/transformlist.ts` — `getTransformList` wrapper

## Key Functions

### `recalculateDimensions(selected: Element): BatchCommand | null`

Main entry point. Processes the transform list of `selected` and simplifies it.

1. Gets the element's transform list via `getTransformList`
2. Determines the operation type based on transform pattern
3. Absorbs transforms into attributes where possible
4. Returns a `BatchCommand` with all changes (or `null` if no changes)

### `remapElement(selected, changes, m)` (from coords.ts)

Applies a transformation matrix `m` to element attributes. Handles different element types:
- **rect/image/svg/use**: remaps x, y, width, height
- **path**: remaps `d` attribute control points
- **text/tspan**: remaps x, y, dx, dy arrays
- **circle**: remaps cx, cy, r
- **ellipse**: remaps cx, cy, rx, ry
- **line**: remaps x1, y1, x2, y2
- **polygon/polyline**: remaps points array
- **g**: recurses into children

### `updateClipPath(attr, tx, ty)`

Updates clip-path transforms when elements are moved.

### `init(context)`

Initializes the module with editor context:
- `getStartTransform()` — current start transform string
- `getSVGRoot()` — the SVG root element
- `setStartTransform(t)` — sets the start transform

## Transform Operations

The code identifies 4 operation types from the transform list pattern:

| Op | Pattern | Action |
|----|---------|--------|
| 1 | `[M]` or `[R][M]` | Absorb matrix into element attributes |
| 2 | `[T]` or `[R][T]` | Absorb translate into x/y attributes |
| 3 | `[R][Tcenter][S][T-center]` | Absorb scale into width/height/attributes |
| 4 | `[R]` only | No absorption needed (already in goal form) |

### Goal Form

The target transform list is `[R]` — a single rotation around the element's bbox center. If a matrix can't be fully absorbed (e.g., skew), the result is `[R][M]`.

### Operation 1: Matrix Absorption (`[R][M]`)

For elements with `[R][M]`:
1. Extract the old rotation angle and the matrix M
2. Compute new bbox center after applying M
3. Create new rotation `R_new` around the new center
4. Compute `extrat = R_new^-1 * R_old` (translation correction for rotation center shift)
5. For paths: remap d through `extrat * M`, insert `R_new`
6. For text: remap tspan children, set new rotation
7. For other elements: compute `M' = R_new^-1 * R_old * M`, absorb M' into attributes

### Operation 2: Translate Absorption

Adds translate values to element's x/y (or cx/cy, x1/y1/x2/y2, etc.).

### Operation 3: Scale Absorption

For `[R][Tc][S][T-c]` pattern:
- Multiplies width/height by scale factors
- Adjusts position for the scale center offset
- Special handling for groups (recurses into children)

### Operation 4: Rotation Only

Already in goal form. Just validates the rotation center matches current bbox center.

## Dependencies

- `svgedit.math.*` — matrix operations (`matrixMultiply`, `transformPoint`, `isIdentity`, etc.)
- `svgedit.utilities.*` — `getBBox`, element attribute helpers
- `svgedit.transformlist` — wrapped by `getTransformList` in transformlist.ts
- `history` — `BatchCommand`, `ChangeElementCommand` for undo/redo

## Usage Pattern

```ts
import { recalculateDimensions } from '@core/app/svgedit/transform/recalculate';
import { remapElement } from '@core/app/svgedit/transform/coords';

// After modifying transforms (mouse move, resize, etc.)
const cmd = recalculateDimensions(element);
if (cmd && !cmd.isEmpty()) {
  batchCmd.addSubCommand(cmd);
}
```

## Important Notes

- Always call after transform modifications (mouseUp, paste, import, etc.)
- Groups are handled specially: children are recursively processed
- The function modifies the DOM directly and returns history commands
- `startTransform` context tracks the initial transform state for comparison
- Clip paths on elements are updated when translating
