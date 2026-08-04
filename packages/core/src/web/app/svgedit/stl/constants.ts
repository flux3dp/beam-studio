import { todo } from '@core/helpers/is-dev';

/**
 * An STL object is represented by two separate things, and they must not be conflated:
 *
 * 1. the **STL 3D object** — the mesh plus its 3D transform and engraving parameters. This is the
 *    source of truth. It lives outside the SVG DOM and is what the three.js canvas renders.
 * 2. the **projection rect** — a plain `<rect data-stl="1">` inside `svgcontent`, whose geometry is
 *    the XY projection of the 3D object's bounding box. It exists so that selection, layer
 *    membership, undo/redo, clipboard and .beam serialization all reuse the existing svgedit
 *    plumbing, and so that anything reading a 2D bbox (alignment, framing,
 *    `getVisibleElementsAndBBoxes`) keeps working unchanged.
 *
 * The rect is **derived**: every change to the 3D transform recomputes its x/y/width/height. It is
 * never editable geometry on its own — a 2D edit (e.g. the XY inputs in DimensionPanel) has to be
 * routed back to the 3D object, which then re-projects.
 *
 * The two are linked by the element id: the rect's `id` is the key used for the mesh binary in the
 * .beam file (block 6) and in the `stlObjects` payload sent to swiftray.
 */
todo(
  'TBC：註解裡，a 2D edit (e.g. the XY inputs in DimensionPanel) has to be routed back to the 3D object, which then re-projects. 實際上，在內雕模式裡，rect 不應該被接觸到，DimensionPanel 裡的值應該直接影響到 3D object，然後投影',
);
export const STL_ATTR = {
  /** Marks a rect as the projection of an STL 3D object. Value is always '1'. */
  marker: 'data-stl',
  /**
   * The 3D object's transform: a column-major 4x4 matrix, 16 numbers separated by spaces.
   *
   * Maps the mesh from its own space (STL files are in mm) into scene space (0.1mm, matching
   * `constant.dpmm`), so the mm -> 0.1mm factor of 10 is already baked in. Consumers apply the
   * matrix as-is and never need to reason about units.
   */
  matrix: 'data-stl-matrix',
} as const;
