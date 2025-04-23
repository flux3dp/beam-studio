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
    [120, 260],
    [180, 260],
    [120, 300],
    [180, 300],
  ] as const,
  bottomRight: [
    [390, 240],
    [510, 240],
    [390, 320],
    [510, 320],
    [420, 260],
    [480, 260],
    [420, 300],
    [480, 300],
  ] as const,
  topLeft: [
    [90, 40],
    [210, 40],
    [90, 120],
    [210, 120],
    [120, 60],
    [180, 60],
    [120, 100],
    [180, 100],
  ] as const,
  topRight: [
    [390, 40],
    [510, 40],
    [390, 120],
    [510, 120],
    [420, 60],
    [480, 60],
    [420, 100],
    [480, 100],
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
    .with('top', () => [
      points.topLeft[1],
      points.topRight[0],
      points.topLeft[3],
      points.topRight[2],
      points.topLeft[5],
      points.topRight[4],
      points.topLeft[7],
      points.topRight[6],
    ])
    .with('bottom', () => [
      points.bottomLeft[1],
      points.bottomRight[0],
      points.bottomLeft[3],
      points.bottomRight[2],
      points.bottomLeft[5],
      points.bottomRight[4],
      points.bottomLeft[7],
      points.bottomRight[6],
    ])
    .with('left', () => [
      points.topLeft[6],
      points.topLeft[7],
      points.topLeft[2],
      points.topLeft[3],
      points.bottomLeft[0],
      points.bottomLeft[1],
      points.bottomLeft[4],
      points.bottomLeft[5],
    ])
    .with('right', () => [
      points.topRight[6],
      points.topRight[7],
      points.topRight[2],
      points.topRight[3],
      points.bottomRight[0],
      points.bottomRight[1],
      points.bottomRight[4],
      points.bottomRight[5],
    ])
    .with('center', () => [
      points.topLeft[7],
      points.topRight[6],
      points.bottomLeft[5],
      points.bottomRight[4],
      points.topLeft[3],
      points.topRight[2],
      points.bottomLeft[1],
      points.bottomRight[0],
    ])
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
