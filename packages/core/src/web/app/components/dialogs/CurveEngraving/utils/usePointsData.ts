import { useMemo } from 'react';

import type { Point } from '@core/interfaces/ICurveEngraving';

export interface PointsData {
  depth: number;
  displayPoints: Point[][];
  height: number;
  // Maximum and minimum coordinates before applying reversal, used to match with canvas and camera
  maxX: number;
  maxY: number;
  maxZ: number;
  minX: number;
  minY: number;
  minZ: number;
  // Whether axes are reversed, used for display in Three.js
  reverseX?: boolean;
  reverseY?: boolean;
  reverseZ?: boolean;
  width: number;
}

/**
 * Transform raw points into PointsData for easier use in Three.js
 * @param points 2D array of points, measured from the device, x y in canvas coordinate, z is height/depth
 * @param options Options to reverse axes
 */
export const usePointsData = (
  points: Point[][],
  {
    reverseX = false,
    reverseY = false,
    reverseZ = false,
  }: { reverseX?: boolean; reverseY?: boolean; reverseZ?: boolean } = {},
): PointsData => {
  return useMemo(() => {
    // Apply offset
    const offsetPoints: Point[][] = points.map((row) =>
      row.map(([x, y, z, xOffset = 0, yOffset = 0]) => [x + xOffset, y + yOffset, z]),
    );

    let maxX = -Infinity;
    let minX = Infinity;
    let maxY = -Infinity;
    let minY = Infinity;
    let maxZ = -Infinity;
    let minZ = Infinity;

    offsetPoints.flat().forEach(([x, y, z]) => {
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

    const displayPoints = offsetPoints.map((row) =>
      row.map(([x, y, z]) => {
        const newX = (x - (minX + maxX) / 2) * (reverseX ? -1 : 1);
        const newY = (y - (minY + maxY) / 2) * (reverseY ? -1 : 1);
        const newZ = z === null ? null : (z - (minZ + maxZ) / 2) * (reverseZ ? -1 : 1);

        return [newX, newY, newZ] as Point;
      }),
    );

    return {
      depth,
      displayPoints,
      height,
      maxX,
      maxY,
      maxZ,
      minX,
      minY,
      minZ,
      reverseX,
      reverseY,
      reverseZ,
      width,
    };
  }, [points, reverseX, reverseY, reverseZ]);
};
