import constant from '@core/app/actions/beambox/constant';
import workareaManager from '@core/app/svgedit/workarea';

/**
 * Scene space for the inner engraving canvas.
 *
 * - **Unit**: 0.1mm, the same as SVG user units (`constant.dpmm` = 10).
 * - **Axes**: X right, **Y towards the back of the scene** (away from the default camera), Z up.
 *   This is the CAD / CNC convention the PM asked for, and it is what the transform gizmo's arrows
 *   and the panel's Y values agree on.
 * - **Origin**: (0, 0, 0) — the work area's near-left corner, at the height the user manually
 *   focuses to. The material's position does not move it.
 *
 * ⚠️ **Scene Y and canvas Y point in opposite directions.** SVG (and therefore the G-code position)
 * has Y going down / towards the front, so the same point is `y_svg = workarea_height - y_scene`.
 * The conversion happens **once**, where the 3D object is projected onto its rect
 * (`utils/projection.ts`) — everything downstream of that, including the matrix sent to swiftray,
 * is already in canvas coordinates and must not convert again.
 */

/** mm -> scene units. STL vertex data is in mm; the scene is in 0.1mm. */
export const MM_TO_SCENE = constant.dpmm;

/** Scene Y -> SVG / canvas Y, in scene units. Its own inverse. */
export const sceneToSvgY = (y: number): number => workareaManager.height - y;

/** Scene Y -> SVG / canvas Y, in mm. */
export const sceneToSvgYMm = (y: number): number => workareaManager.height / MM_TO_SCENE - y;
