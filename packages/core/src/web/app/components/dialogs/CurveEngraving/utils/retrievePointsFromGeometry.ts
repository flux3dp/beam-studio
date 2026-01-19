import type * as THREE from 'three';

import type { PointsData } from './usePointsData';

export const retrievePointsFromGeometry = (
  geometry: THREE.BufferGeometry,
  pointsData?: PointsData,
): Array<[number, number, number]> => {
  const posAttr = geometry.getAttribute('position');
  const pts: Array<[number, number, number]> = [];
  const existedXY = new Set<string>();
  let centerX = 0;
  let centerY = 0;
  let centerZ = 0;
  let reverseX = false;
  let reverseY = false;
  let reverseZ = false;

  if (pointsData) {
    centerX = (pointsData.maxX + pointsData.minX) / 2;
    centerY = (pointsData.maxY + pointsData.minY) / 2;
    centerZ = (pointsData.maxZ + pointsData.minZ) / 2;
    reverseX = Boolean(pointsData.reverseX);
    reverseY = Boolean(pointsData.reverseY);
    reverseZ = Boolean(pointsData.reverseZ);
  }

  for (let i = 0; i < posAttr.count; i++) {
    const key = `${posAttr.getX(i).toFixed(5)}_${posAttr.getY(i).toFixed(5)}`;

    if (existedXY.has(key)) continue;

    existedXY.add(key);

    const x = posAttr.getX(i) * (reverseX ? -1 : 1) + centerX;
    const y = posAttr.getY(i) * (reverseY ? -1 : 1) + centerY;
    const z = posAttr.getZ(i) * (reverseZ ? -1 : 1) + centerZ;

    pts.push([x, y, z]);
  }

  return pts;
};
