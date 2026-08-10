import { useShallow } from 'zustand/shallow';

import { useDocumentStore } from '@core/app/stores/documentStore';
import workareaManager from '@core/app/svgedit/workarea';

import { MM_TO_SCENE } from './coordinates';
import type { Material } from './material';
import { getMaterial, useMaterial } from './material';

/**
 * The box that can actually be engraved, in scene units (0.1mm).
 *
 * Three things bound it, and all three matter:
 * 1. the **material** — nothing outside the workpiece can be engraved
 * 2. the **work area** — the galvo field is 70x70mm however large the workpiece is
 * 3. the **safety margin** — cracking too close to a surface breaks it out
 *
 * `isValid` is false when the margin eats the whole thing (a small workpiece with a large margin),
 * which is a legitimate configuration, not an error: the callers just have nothing to offer.
 */
export interface EngravableBox {
  center: [number, number, number];
  depth: number;
  height: number;
  isValid: boolean;
  max: [number, number, number];
  min: [number, number, number];
  width: number;
}

/**
 * The material's XY half-extents once the margin is taken off.
 *
 * A round shape is reduced to the largest box that fits inside it, not to its bounding box: the
 * bounding box corners of a cylinder are outside the workpiece, and placing an object there would
 * put engraving in mid-air. Conservative on purpose — this feeds the safety check.
 */
const getInsetHalfExtents = (material: Material, margin: number): { x: number; y: number; z: number } => {
  const halfHeight = material.height / 2 - margin;

  if (material.shape === 'box') {
    return { x: material.width / 2 - margin, y: material.depth / 2 - margin, z: halfHeight };
  }

  const radius = material.width / 2 - margin;

  if (material.shape === 'cylinder') {
    // largest square inscribed in the circle
    return { x: radius / Math.SQRT2, y: radius / Math.SQRT2, z: halfHeight };
  }

  // sphere: largest cube inscribed in the ball, then still bounded by the liquid level
  const half = radius / Math.sqrt(3);

  return { x: half, y: half, z: Math.min(half, halfHeight) };
};

export const getEngravableBoxFrom = (
  material: Material,
  workarea: { height: number; width: number },
  marginMm: number,
): EngravableBox => {
  const margin = marginMm * MM_TO_SCENE;
  const inset = getInsetHalfExtents(material, margin);
  const [cx, cy] = material.center;
  // the sphere's inscribed cube is centred on the ball, every other shape on its own centre
  const cz = material.shape === 'sphere' ? material.width / 2 : material.height / 2;

  // intersect with the work area in XY; Z is unbounded by the machine here, the material is the limit
  const min: [number, number, number] = [
    Math.max(cx - inset.x, 0),
    Math.max(cy - inset.y, 0),
    Math.max(cz - inset.z, margin),
  ];
  const max: [number, number, number] = [
    Math.min(cx + inset.x, workarea.width),
    Math.min(cy + inset.y, workarea.height),
    Math.min(cz + inset.z, material.height - margin),
  ];
  const [width, depth, height] = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];

  return {
    center: [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2],
    depth,
    height,
    isValid: width > 0 && depth > 0 && height > 0,
    max,
    min,
    width,
  };
};

const selectMargin = (state: ReturnType<typeof useDocumentStore.getState>) => state['inner-engraving-safety-margin'];

/** Subscribes to everything the box depends on, so the canvas follows material and margin edits. */
export const useEngravableBox = (): EngravableBox => {
  const material = useMaterial();
  const margin = useDocumentStore(useShallow(selectMargin));
  const { height, width } = workareaManager;

  return getEngravableBoxFrom(material, { height, width }, margin);
};

/** Non-reactive read, for the places that run outside React (import). */
export const getEngravableBox = (): EngravableBox =>
  getEngravableBoxFrom(
    getMaterial(),
    { height: workareaManager.height, width: workareaManager.width },
    selectMargin(useDocumentStore.getState()),
  );
