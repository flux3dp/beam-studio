import { create } from 'zustand';

export type TransformMode = 'rotate' | 'scale' | 'translate';
export type ProjectionMode = 'orthographic' | 'perspective';
/**
 * `custom` is not selectable: the camera falls into it as soon as the user orbits or pans, which
 * clears the highlight from the preset buttons and stops anything from snapping the view back.
 */
export type ViewPreset = 'back' | 'custom' | 'front' | 'isometric' | 'left' | 'right' | 'top';

/**
 * Direction from the view target towards the camera, for each preset.
 *
 * Scene axes: X right, Y away from the default camera, Z up. "Front" is therefore −Y, the side the
 * canvas opens on. The isometric view looks in from −X −Y, above.
 *
 * These are directions rather than positions: the distance comes from the work area and material
 * size, so the framing follows whatever is actually on the canvas.
 */
export const VIEW_DIRECTIONS: Record<Exclude<ViewPreset, 'custom'>, [number, number, number]> = {
  back: [0, 1, 0],
  front: [0, -1, 0],
  isometric: [-1, -1, 1],
  left: [-1, 0, 0],
  right: [1, 0, 0],
  top: [0, 0, 1],
};

export const DEFAULT_VIEW: Exclude<ViewPreset, 'custom'> = 'isometric';

/**
 * How far back the camera sits, as a multiple of the scene extent. Enough to keep the whole material
 * in frame without the perspective looking flattened.
 */
export const DISTANCE_RATIO = 1.6;

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
  setProjection: (projection: ProjectionMode) => void;
  setRatioLocked: (locked: boolean) => void;
  setTransformMode: (mode: TransformMode) => void;
  transformMode: TransformMode;
  /**
   * The requested camera preset. `version` increments on every request so that asking for the preset
   * you are already on still snaps the camera back, which is what the reset button needs.
   */
  view: { preset: ViewPreset; version: number };
}

export const useViewStore = create<ViewStore>((set) => ({
  markViewCustom: () =>
    set((state) => (state.view.preset === 'custom' ? state : { view: { ...state.view, preset: 'custom' } })),
  projection: 'perspective',
  ratioLocked: true,
  requestView: (preset) => set((state) => ({ view: { preset, version: state.view.version + 1 } })),
  setProjection: (projection) => set({ projection }),
  setRatioLocked: (ratioLocked) => set({ ratioLocked }),
  setTransformMode: (transformMode) => set({ transformMode }),
  transformMode: 'translate',
  view: { preset: DEFAULT_VIEW, version: 0 },
}));
