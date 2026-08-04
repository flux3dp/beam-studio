import constant from '@core/app/actions/beambox/constant';
import { todo } from '@core/helpers/is-dev';

todo('TBC: 確認這個視角於座標正確');

/**
 * Scene space for the inner engraving canvas.
 *
 * - **Unit**: 0.1mm, the same as SVG user units (`constant.dpmm` = 10), so the projection rect's
 *   attributes and the scene use one number system.
 * - **Axes**: X right, Y towards the back of the scene, Z up (height). Origin at (0, 0, 0), which is
 *   where the user manually focuses; the material's position does not move it.
 * - **Handedness**: the scene stays **right-handed**, the CAD/CNC convention, so STL files load
 *   without mirroring, face winding stays correct and rotation gizmos read the usual way. The
 *   "Y down" convention the rest of the app uses is a *viewing* convention: the default top view
 *   orients the camera so +Y appears downward on screen, matching the 2D canvas.
 *
 * Everything outside the 3D canvas — the projection rect's attributes, DimensionPanel values, the
 * payload sent to swiftray — stays in SVG convention (Y down). The flip lives only here, so
 * reversing this decision is a one-file change.
 */

/** mm -> scene units. STL vertex data is in mm; the scene is in 0.1mm. */
export const MM_TO_SCENE = constant.dpmm;

/** SVG user units (Y down) -> scene units (Y towards the back). */
export const svgToSceneY = (y: number): number => -y;

/** Scene units (Y towards the back) -> SVG user units (Y down). */
export const sceneToSvgY = (y: number): number => -y;
