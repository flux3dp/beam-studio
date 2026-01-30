import { LoopSubdivision } from 'three-subdivide';

import type { CurveEngraving, Point } from '@core/interfaces/ICurveEngraving';

import { createTriangularGeometry, setGeometryAngleAlertColor } from './createTriangularGeometry';
import { retrievePointsFromGeometry } from './retrievePointsFromGeometry';

export interface ThreeDisplayData {
  depth: number;
  displayPoints: Point[];
  geometry: THREE.BufferGeometry;
  height: number;
  maxX: number;
  maxY: number;
  maxZ: number;
  minX: number;
  minY: number;
  minZ: number;
  subdividedGeometry: THREE.BufferGeometry;
  width: number;
}

/**
 * Preprocess curve engraving data to Three.js display friendly format, and also generate subdivided points if needed
 */
export const preprocessData = (
  data: CurveEngraving,
  {
    maxEdgeLength = 0,
    reverseX = false,
    reverseY = false,
    reverseZ = false,
    subdivisionIterations = 2,
  }: {
    maxEdgeLength?: number;
    reverseX?: boolean;
    reverseY?: boolean;
    reverseZ?: boolean;
    subdivisionIterations?: number;
  } = {},
): { displayData: ThreeDisplayData; subdividedPoints: Array<[number, number, number]> } => {
  // Apply offset
  let points = data.points
    .flat()
    .map(([x, y, z, xOffset = 0, yOffset = 0]) => [x + xOffset, y + yOffset, z]) as Point[];

  let maxX = -Infinity;
  let minX = Infinity;
  let maxY = -Infinity;
  let minY = Infinity;
  let maxZ = -Infinity;
  let minZ = Infinity;

  points.forEach(([x, y, z]) => {
    z = z ?? 0;
    maxX = Math.max(maxX, x);
    minX = Math.min(minX, x);
    maxY = Math.max(maxY, y);
    minY = Math.min(minY, y);
    maxZ = Math.max(maxZ, z);
    minZ = Math.min(minZ, z);
  });

  const width = maxX - minX;
  const height = maxY - minY;
  const depth = maxZ - minZ;

  // Center and optionally reverse axes
  const displayPoints = points.map(([x, y, z]) => {
    const newX = (x - (minX + maxX) / 2) * (reverseX ? -1 : 1);
    const newY = (y - (minY + maxY) / 2) * (reverseY ? -1 : 1);
    const newZ = z === null ? null : (z - (minZ + maxZ) / 2) * (reverseZ ? -1 : 1);

    return [newX, newY, newZ] as Point;
  });
  const filteredPoints = displayPoints.filter((p) => p[2] !== null) as Array<[number, number, number]>;
  const geometry = createTriangularGeometry(filteredPoints, width, height, maxEdgeLength);
  const subdividedGeometry = LoopSubdivision.modify(geometry, subdivisionIterations, { preserveEdges: true });
  const subdividedPoints = retrievePointsFromGeometry(subdividedGeometry, {
    centerX: maxX / 2 + minX / 2,
    centerY: maxY / 2 + minY / 2,
    centerZ: maxZ / 2 + minZ / 2,
    reverseX,
    reverseY,
    reverseZ,
  });

  setGeometryAngleAlertColor(geometry);
  setGeometryAngleAlertColor(subdividedGeometry);

  return {
    displayData: {
      depth,
      displayPoints,
      geometry,
      height,
      maxX,
      maxY,
      maxZ,
      minX,
      minY,
      minZ,
      subdividedGeometry,
      width,
    },
    subdividedPoints,
  };
};
