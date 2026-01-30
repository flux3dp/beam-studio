import type * as THREE from 'three';

export const retrievePointsFromGeometry = (
  geometry: THREE.BufferGeometry,
  {
    centerX = 0,
    centerY = 0,
    centerZ = 0,
    reverseX = false,
    reverseY = false,
    reverseZ = false,
  }: {
    centerX?: number;
    centerY?: number;
    centerZ?: number;
    reverseX?: boolean;
    reverseY?: boolean;
    reverseZ?: boolean;
  } = {},
): Array<[number, number, number]> => {
  const posAttr = geometry.getAttribute('position');
  const pts: Array<[number, number, number]> = [];
  const existedXY = new Set<string>();

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
