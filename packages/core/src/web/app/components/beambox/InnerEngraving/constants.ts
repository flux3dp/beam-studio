import { MM_TO_SCENE } from './utils/coordinates';

/** Matches the 2D canvas: white inside the work area, grey outside. */
export const FLOOR_COLOR = '#ffffff';
export const BACKGROUND_COLOR = '#f0f0f0';
export const GRID_COLOR = '#dadada';
export const RULER_COLOR = '#999999';
/** Semi-transparent light grey, as specified for the material preview. */
export const MATERIAL_COLOR = '#1890ff';
export const MATERIAL_OPACITY = 0.15;
/**
 * The part of the material outside the work area.
 *
 * Same grey the 2D canvas uses outside the work area, so "grey means the laser cannot reach here"
 * reads the same in both canvases. Deliberately not a danger red: sticking out is a normal way to
 * hold a large workpiece, not an error.
 */
export const OUT_OF_RANGE_COLOR = '#dadada';
export const OUT_OF_RANGE_OPACITY = 0.4;
/**
 * Axis colours, matching three.js — the same red / green / blue as `AxesHelper` and the transform
 * gizmo, so a label in the panel names the arrow on the canvas.
 *
 * Green is darkened from three.js's pure `0x00ff00`, which is close to unreadable as small text on
 * a white panel. The hue is unchanged, so it still reads as the same axis.
 */
export const AXIS_COLORS = ['#ff0000', '#00a000', '#0000ff'] as const;

/** The blue the 2D canvas outlines a selection with (`svgedit/selector.ts`). */
export const SELECTION_COLOR = '#0000FF';

/** How far the floor reaches past the work area, so its edge is not flush with the boundary. */
export const FLOOR_MARGIN = 10 * MM_TO_SCENE;

/**
 * The floor sits just below z = 0 so the grid and the ruler, which stay exactly on the focus origin
 * plane, are unambiguously in front of it. Co-planar lines over a surface are a depth-buffer coin
 * flip: line and triangle rasterization do not produce identical depth values, so whether the lines
 * survive the depth test changes with the viewing angle. 0.2mm is far below anything visible.
 */
export const FLOOR_Z = -2;

/** Candidate grid cell sizes in scene units (0.1mm): 1mm, 5mm, 10mm, 50mm, 100mm. */
export const GRID_STEPS = [10, 50, 100, 500, 1000];
/** Roughly how many cells to keep across the view when picking a step from GRID_STEPS. */
export const TARGET_GRID_CELLS = 20;

export const TICK_LENGTH = 20; // 2mm
export const LABEL_OFFSET = 15; // 1.5mm past the tick
/**
 * Label height as a fraction of the current grid step. Tying it to the step, which is itself chosen
 * from the camera distance, keeps the text about the same size on screen at any zoom.
 */
export const LABEL_SCALE_RATIO = 0.35;
