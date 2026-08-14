import { MathUtils } from 'three';
import { create } from 'zustand';

import workareaManager from '@core/app/svgedit/workarea';

import { getMaterial } from './utils/material';

export type TransformMode = 'rotate' | 'scale' | 'translate';
export type ProjectionMode = 'orthographic' | 'perspective';
/**
 * `custom` is not selectable: the camera falls into it as soon as the user orbits or pans, which
 * clears the highlight from the preset buttons and stops anything from snapping the view back.
 */
export type ViewPreset = 'back' | 'bottom' | 'custom' | 'front' | 'isometric' | 'left' | 'right' | 'top';

/**
 * How far the two vertical views are tilted off the pole, as a fraction of the viewing distance.
 *
 * Looking straight down the up axis has no answer for which way is up *on screen*: `lookAt` fixes
 * the roll by taking `cross(up, viewDirection)`, and when those two are parallel that cross product
 * is zero. three.js does not fail on it — `Matrix4.lookAt` nudges the view direction along +X by
 * 0.0001 and carries on — but the roll then comes out of that fallback rather than out of anything
 * written here, and for this camera it lands 90° off. OrbitControls happens to undo it a moment
 * later (`Spherical.makeSafe` clamps the polar angle off the pole and re-aims), so the view on
 * screen has been right by luck, and only for as long as a preset is followed by `controls.update()`.
 *
 * Tilting the preset itself is the same trick made deliberate: it picks the axis, so the roll is a
 * decision rather than a side effect. 1e-3 radians is invisible — a twentieth of a degree — and a
 * thousand times `makeSafe`'s own epsilon, so the controls leave it alone.
 */
const POLE_TILT = 1e-3;

/**
 * Direction from the view target towards the camera, for each preset.
 *
 * Scene axes: X right, Y away from the default camera, Z up. "Front" is therefore −Y, the side the
 * canvas opens on. The isometric view looks in from −X −Y, above.
 *
 * These are directions rather than positions: the distance comes from the work area and material
 * size, so the framing follows whatever is actually on the canvas.
 *
 * Top and bottom are tilted off the pole by POLE_TILT, both towards −Y, which is the direction an
 * orbit would carry them: sweeping the camera from top through front to bottom holds that azimuth
 * the whole way, so the two presets are where a drag would have left you rather than somewhere only
 * a button can reach. The resulting roll puts +Y up the screen in the top view — deliberately the
 * opposite of the 2D canvas, where +Y runs down the page.
 */
export const VIEW_DIRECTIONS: Record<Exclude<ViewPreset, 'custom'>, [number, number, number]> = {
  back: [0, 1, 0],
  bottom: [0, -POLE_TILT, -1],
  front: [0, -1, 0],
  isometric: [-1, -1, 1],
  left: [-1, 0, 0],
  right: [1, 0, 0],
  top: [0, -POLE_TILT, 1],
};

export const DEFAULT_VIEW: Exclude<ViewPreset, 'custom'> = 'isometric';

/**
 * How far back the camera sits, as a multiple of the scene extent. Enough to keep the whole material
 * in frame without the perspective looking flattened.
 */
export const DISTANCE_RATIO = 1.6;

/**
 * The perspective camera's vertical field of view, in degrees.
 *
 * Named rather than left to r3f's default because the framing is worked out from it in three
 * places — the orthographic camera's zoom, the zoom control's readout, and the zoom control's
 * starting value — and a default that quietly changed would put all three out of step with the
 * camera. The value is r3f's own, so the view looks exactly as it did before it was written down.
 */
export const CAMERA_FOV = 75;

/** How much of the scene a preset frames vertically, as a multiple of `extent`. */
export const VIEW_HEIGHT_RATIO = 2 * DISTANCE_RATIO * Math.tan(MathUtils.degToRad(CAMERA_FOV) / 2);

/**
 * Screen pixels per scene unit the canvas opens at — worked out rather than waited for.
 *
 * r3f sizes its canvas from a ResizeObserver, so a canvas that has only just been asked for cannot
 * yet say what its zoom is, and the zoom control, which lives outside it, would have to show a
 * placeholder until it can. Every term is known before then, though: the presets all sit
 * `extent * DISTANCE_RATIO` from the target, and the canvas fills the work area container, which is
 * in the document long before inner engraving mode is entered. Same number, one paint earlier.
 *
 * Returns 0 — the store's "not measured yet" — if that container is not in the document.
 */
export const getDefaultZoomLevel = (): number => {
  // the 3D canvas is an `inset: 0` child of this, so the two always have the same height
  const canvasHeight = document.getElementById('workarea-container')?.clientHeight ?? 0;

  if (!canvasHeight) return 0;

  const { height, width } = workareaManager;
  const extent = Math.max(width, height, getMaterial().height);

  return canvasHeight / (extent * VIEW_HEIGHT_RATIO);
};

/**
 * Camera position for a preset. Shared by the canvas's initial `camera` prop and by ViewController,
 * so the first frame and every later preset application agree exactly — computing it in two places
 * is how the view ended up slightly different on each mount.
 */
export const getPresetPosition = (
  preset: Exclude<ViewPreset, 'custom'>,
  target: [number, number, number],
  extent: number,
): [number, number, number] => {
  const [dx, dy, dz] = VIEW_DIRECTIONS[preset];
  const length = Math.hypot(dx, dy, dz);
  const distance = extent * DISTANCE_RATIO;

  return [
    target[0] + (dx / length) * distance,
    target[1] + (dy / length) * distance,
    target[2] + (dz / length) * distance,
  ];
};

interface ViewStore {
  /** Called when the user drives the camera by hand, dropping out of whatever preset was active. */
  markViewCustom: () => void;
  projection: ProjectionMode;
  /**
   * Uniform scaling. Lives here rather than on the object because it is a tool mode, not a property
   * of the model: it has to constrain the scale gizmo as well as the panel's size inputs.
   */
  ratioLocked: boolean;
  requestView: (preset: Exclude<ViewPreset, 'custom'>) => void;
  /** A zoom asked for from outside the canvas. `version` so asking for the current value still applies. */
  requestZoom: (zoomLevel: number) => void;
  setProjection: (projection: ProjectionMode) => void;
  setRatioLocked: (locked: boolean) => void;
  setTransformMode: (mode: TransformMode) => void;
  /** Published by the canvas so the zoom control has something to display. */
  setZoomLevel: (zoomLevel: number) => void;
  transformMode: TransformMode;
  /**
   * The requested camera preset. `version` increments on every request so that asking for the preset
   * you are already on still snaps the camera back, which is what the reset button needs.
   */
  view: { preset: ViewPreset; version: number };
  /**
   * Screen pixels per scene unit at the orbit target — the 3D equivalent of the SVG canvas's zoom.
   *
   * Measured at the target plane because that is the only depth at which a perspective camera has a
   * single answer; the number is what the zoom control shows and what a typed-in percentage means.
   */
  zoomLevel: number;
  zoomRequest: { version: number; zoomLevel: number };
}

export const useViewStore = create<ViewStore>((set) => ({
  markViewCustom: () =>
    set((state) => (state.view.preset === 'custom' ? state : { view: { ...state.view, preset: 'custom' } })),
  projection: 'perspective',
  ratioLocked: true,
  requestView: (preset) => set((state) => ({ view: { preset, version: state.view.version + 1 } })),
  requestZoom: (zoomLevel) => set((state) => ({ zoomRequest: { version: state.zoomRequest.version + 1, zoomLevel } })),
  // deliberately does not touch `view`: the camera keeps its pose across the swap (ViewController
  // carries it over), so the preset the user is on is still the preset they are on. This used to
  // bump the version to force a snap back to a named view, which was a way of coping with the pose
  // being lost — and it threw away any camera the user had orbited to by hand
  setProjection: (projection) => set({ projection }),
  setRatioLocked: (ratioLocked) => set({ ratioLocked }),
  setTransformMode: (transformMode) => set({ transformMode }),
  setZoomLevel: (zoomLevel) => set({ zoomLevel }),
  transformMode: 'translate',
  view: { preset: DEFAULT_VIEW, version: 0 },
  // 0 means "no canvas has measured itself yet", which is what sends the zoom control to
  // `getDefaultZoomLevel`. A made-up level would be indistinguishable from a measured one, and the
  // control would show it in preference to the framing it can work out for itself
  zoomLevel: 0,
  zoomRequest: { version: 0, zoomLevel: 0 },
}));
