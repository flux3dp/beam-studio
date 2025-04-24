import { match } from 'ts-pattern';

import type { WideAngleRegion } from '@core/interfaces/FisheyePreview';

export const adorPnPPoints: Array<[number, number]> = [
  [155, 90],
  [275, 90],
  [155, 210],
  [275, 210],
  [185, 120],
  [245, 120],
  [185, 180],
  [245, 180],
];

export const bb2PnPPoints: Array<[number, number]> = [
  [-60, 10],
  [60, 10],
  [-60, 90],
  [60, 90],
  [-30, 30],
  [30, 30],
  [-30, 70],
  [30, 70],
];

export const bb2WideAngleCameraPnpPoints: Record<
  'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight',
  Array<[number, number]>
> = {
  bottomLeft: [
    [90, 240],
    [210, 240],
    [90, 320],
    [210, 320],
  ] as const,
  bottomRight: [
    [390, 240],
    [510, 240],
    [390, 320],
    [510, 320],
  ] as const,
  topLeft: [
    [90, 40],
    [210, 40],
    [90, 120],
    [210, 120],
  ] as const,
  topRight: [
    [390, 40],
    [510, 40],
    [390, 120],
    [510, 120],
  ] as const,
} as const;

export const getBB2WideAnglePoints = (
  region: WideAngleRegion,
  points: Record<
    'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight',
    Array<[number, number]>
  > = bb2WideAngleCameraPnpPoints,
): Array<[number, number]> => {
  const res = match(region)
    .with('top', () => [points.topLeft[1], points.topRight[0], points.topLeft[3], points.topRight[2]])
    .with('bottom', () => [points.bottomLeft[1], points.bottomRight[0], points.bottomLeft[3], points.bottomRight[2]])
    .with('left', () => [points.topLeft[2], points.topLeft[3], points.bottomLeft[0], points.bottomLeft[1]])
    .with('right', () => [points.topRight[2], points.topRight[3], points.bottomRight[0], points.bottomRight[1]])
    .with('center', () => [points.topLeft[3], points.topRight[2], points.bottomLeft[1], points.bottomRight[0]])
    .otherwise((key) => points[key]);

  return res;
};

export const promarkPnPPoints: { [size: number]: Array<[number, number]> } = {
  110: [
    [5, 5],
    [105, 5],
    [5, 105],
    [105, 105],
    [35, 35],
    [75, 35],
    [35, 75],
    [75, 75],
  ],
  150: [
    [25, 25],
    [125, 25],
    [25, 125],
    [125, 125],
    [55, 55],
    [95, 55],
    [55, 95],
    [95, 95],
  ],
  220: [
    [40, 40],
    [180, 40],
    [40, 180],
    [180, 180],
    [80, 80],
    [140, 80],
    [80, 140],
    [140, 140],
  ],
};

export default {
  adorPnPPoints,
  bb2PnPPoints,
  promarkPnPPoints,
};
