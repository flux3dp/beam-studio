import React, { useMemo } from 'react';

import { GRID_COLOR, GRID_WALL_COLOR } from './constants';

interface SceneGridProps {
  /** Height of the two walls, in scene units. */
  depth: number;
  height: number;
  /** Cell size, in scene units. Chosen from the camera distance by `useAdaptiveStep`. */
  step: number;
  width: number;
}

/** One plane of the box: `count` cells each way, drawn as line segments in the given plane. */
const buildPlane = (
  uSize: number,
  vSize: number,
  step: number,
  toPoint: (u: number, v: number) => [number, number, number],
): number[] => {
  const points: number[] = [];
  // the last line lands on the edge even when the extent is not a whole number of steps
  const uLines = [...Array.from({ length: Math.floor(uSize / step) + 1 }, (_, i) => i * step), uSize];
  const vLines = [...Array.from({ length: Math.floor(vSize / step) + 1 }, (_, i) => i * step), vSize];

  uLines.forEach((u) => points.push(...toPoint(u, 0), ...toPoint(u, vSize)));
  vLines.forEach((v) => points.push(...toPoint(0, v), ...toPoint(uSize, v)));

  return points;
};

/**
 * The work area grid, drawn as three sides of a box rather than a flat floor.
 *
 * Inner engraving places objects at a depth, and a floor grid alone gives no sense of height at all
 * — every object reads as sitting on the floor whatever its Z. The two walls behind and to the left
 * (the far edges from the default isometric view, so they never sit between the camera and the
 * model) give the eye something to measure height against, the way a CAD viewport does.
 *
 * Wall lines are drawn fainter than the floor's: they are a backdrop, and at full strength they
 * compete with the model for attention.
 */
const SceneGrid = ({ depth, height, step, width }: SceneGridProps): React.JSX.Element => {
  const { floor, walls } = useMemo(
    () => ({
      floor: new Float32Array(buildPlane(width, height, step, (u, v) => [u, v, 0])),
      walls: new Float32Array([
        // back wall, at the far edge in Y
        ...buildPlane(width, depth, step, (u, v) => [u, height, v]),
        // left wall, at x = 0
        ...buildPlane(height, depth, step, (u, v) => [0, u, v]),
      ]),
    }),
    [depth, height, step, width],
  );

  return (
    <group>
      {/* keyed on the vertex count so the geometry is rebuilt rather than partially updated */}
      <lineSegments key={`floor-${floor.length}`} raycast={() => null}>
        <bufferGeometry>
          <bufferAttribute args={[floor, 3]} attach="attributes-position" />
        </bufferGeometry>
        <lineBasicMaterial color={GRID_COLOR} />
      </lineSegments>
      <lineSegments key={`walls-${walls.length}`} raycast={() => null}>
        <bufferGeometry>
          <bufferAttribute args={[walls, 3]} attach="attributes-position" />
        </bufferGeometry>
        <lineBasicMaterial color={GRID_WALL_COLOR} />
      </lineSegments>
    </group>
  );
};

export default SceneGrid;
