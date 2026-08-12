import { useShallow } from 'zustand/shallow';

import type { MaterialShape } from '@core/app/constants/innerEngraving';
import { useDocumentStore } from '@core/app/stores/documentStore';

import { MM_TO_SCENE } from './coordinates';

/**
 * The configured material, in scene units (0.1mm).
 *
 * The document store keeps the material in mm and positions it by its **centre**; this is the one
 * place that converts both, so nothing in the canvas has to think about units or anchors. `x`/`y`
 * here are the bounding box's minimum corner, which is what the geometry needs.
 */
export interface Material {
  center: [number, number, number];
  /** Y extent of the bounding box. */
  depth: number;
  /** Z extent. For a sphere this is the liquid level, never more than the diameter. */
  height: number;
  shape: MaterialShape;
  /** X extent of the bounding box. For a round shape this equals `depth` (the diameter). */
  width: number;
  x: number;
  y: number;
}

const toMaterial = (state: {
  depth: number;
  diameter: number;
  height: number;
  shape: MaterialShape;
  width: number;
  x: number;
  y: number;
}): Material => {
  const isRound = state.shape !== 'box';
  const width = (isRound ? state.diameter : state.width) * MM_TO_SCENE;
  const depth = (isRound ? state.diameter : state.depth) * MM_TO_SCENE;
  // a sphere is filled to the liquid level, which cannot be above the top of the ball
  const height = (state.shape === 'sphere' ? Math.min(state.height, state.diameter) : state.height) * MM_TO_SCENE;
  // the store positions the material by its centre, the geometry below wants the min corner
  const x = state.x * MM_TO_SCENE - width / 2;
  const y = state.y * MM_TO_SCENE - depth / 2;

  return {
    center: [x + width / 2, y + depth / 2, height / 2],
    depth,
    height,
    shape: state.shape,
    width,
    x,
    y,
  };
};

const select = (state: ReturnType<typeof useDocumentStore.getState>) => ({
  depth: state['inner-engraving-depth'],
  diameter: state['inner-engraving-diameter'],
  height: state['inner-engraving-height'],
  shape: state['inner-engraving-shape'],
  width: state['inner-engraving-width'],
  x: state['inner-engraving-x'],
  y: state['inner-engraving-y'],
});

/** Subscribes to the material settings, so the canvas follows edits in InnerEngravingSettings. */
export const useMaterial = (): Material => toMaterial(useDocumentStore(useShallow(select)));

/** Non-reactive read, for the places that only need the material once (initial camera placement). */
export const getMaterial = (): Material => toMaterial(select(useDocumentStore.getState()));

/**
 * How high the material's top surface sits above the focus origin, in mm.
 *
 * What swiftray needs for the refraction compensation — the beam enters the workpiece there, so
 * without it there is nothing to measure the optical path against. Read through here rather than
 * off `inner-engraving-height` directly, so a sphere still reports its liquid level rather than a
 * height that could exceed the ball.
 */
export const getMaterialHeightMm = (): number => getMaterial().height / MM_TO_SCENE;
