import { match } from 'ts-pattern';

import { PreviewMode } from '@core/app/constants/cameraConstants';
import type { PerspectiveGrid, WideAngleRegion } from '@core/interfaces/FisheyePreview';

type Points = Array<[number, number]>;

export const adorPnPPoints: Points = [
  [155, 90],
  [275, 90],
  [155, 210],
  [275, 210],
  [185, 120],
  [245, 120],
  [185, 180],
  [245, 180],
];

// Share with hexa 2
export const bb2PnPPoints: Points = [
  [-60, 10],
  [60, 10],
  [-60, 90],
  [60, 90],
  [-30, 30],
  [30, 30],
  [-30, 70],
  [30, 70],
];

/**
 * Where fcode/hx2galvo-calibration.fc puts its dots, relative to the head parked at cameraCenter
 * [440, 180] -- absolute x 200/420 with 255/365 inside, y 200/300 with 225/275 inside.
 *
 * Wider than Beambox II's set because HEXA II's head camera sees about 260mm across while the
 * nozzle blocks the right of that view: the pattern has to reach left to sit centred in what is
 * left. The first attempt kept Beambox II's 120x80mm pattern, which left 130mm of the view with no
 * control points at all -- the distortion that showed up on the left of the preview.
 */
export const hx2GalvoPnPPoints: Points = [
  [-240, 20],
  [-20, 20],
  [-240, 120],
  [-20, 120],
  [-185, 45],
  [-75, 45],
  [-185, 95],
  [-75, 95],
];

// Share with hexa 2
export const bb2PerspectiveGrid: PerspectiveGrid = {
  x: [-80, 80, 10],
  y: [0, 100, 10],
} as const;

export const hx2GalvoPerspectiveGrid: PerspectiveGrid = {
  x: [-160, 0, 10],
  y: [0, 100, 10],
} as const;

// Share with hexa 2
export const bb2PerspectiveGridWide: PerspectiveGrid = {
  x: [-130, 130, 10],
  y: [0, 145, 10],
} as const;

export const hx2GalvoPerspectiveGridWide: PerspectiveGrid = {
  x: [-260, 0, 10],
  y: [0, 145, 10],
} as const;

export const bb2WideAngleCameraPnpPoints: Record<'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight', Points> = {
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

export const bb2FullAreaPerspectiveGrid: PerspectiveGrid = {
  x: [0, 600, 20],
  y: [0, 375, 15],
} as const;

export const hx2WideAngleCameraPnpPoints: Record<'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight', Points> = {
  bottomLeft: [
    [100, 270],
    [240, 270],
    [100, 370],
    [240, 370],
  ] as const,
  bottomRight: [
    [500, 270],
    [640, 270],
    [500, 370],
    [640, 370],
  ] as const,
  topLeft: [
    [100, 40],
    [240, 40],
    [100, 140],
    [240, 140],
  ] as const,
  topRight: [
    [500, 40],
    [640, 40],
    [500, 140],
    [640, 140],
  ] as const,
} as const;

export const hx2FullAreaPerspectiveGrid: PerspectiveGrid = {
  x: [0, 740, 20],
  y: [0, 410, 20],
} as const;

export const bm2PnPPoints: Record<'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight', Points> = {
  bottomLeft: [
    [30, 150],
    [130, 150],
    [30, 210],
    [130, 210],
  ] as const,
  bottomRight: [
    [230, 150],
    [330, 150],
    [230, 210],
    [330, 210],
  ] as const,
  topLeft: [
    [30, 30],
    [130, 30],
    [30, 90],
    [130, 90],
  ] as const,
  topRight: [
    [230, 30],
    [330, 30],
    [230, 90],
    [330, 90],
  ] as const,
} as const;

export const bm2PerspectiveGrid: PerspectiveGrid = {
  x: [-70, 70, 10],
  y: [0, 90, 10],
} as const;

export const bm2FullAreaPerspectiveGrid: PerspectiveGrid = {
  x: [0, 360, 10],
  y: [0, 240, 10],
} as const;

/**
 * The two region-preview grids each model can use: the plain one, and the wider one an oblique
 * camera sees in REGION mode. HEXA II's head camera looks to the left of the head rather than
 * straight down at it, so its pair is shifted rather than centred on the head -- which is why it
 * cannot share Beambox II's.
 */
const regionPreviewGrids: Record<string, { narrow: PerspectiveGrid; wide: PerspectiveGrid }> = {
  fbb2: { narrow: bb2PerspectiveGrid, wide: bb2PerspectiveGridWide },
  fbm2: { narrow: bm2PerspectiveGrid, wide: bm2PerspectiveGrid },
  fhx2galvo: { narrow: hx2GalvoPerspectiveGrid, wide: hx2GalvoPerspectiveGridWide },
  fhx2rf: { narrow: bb2PerspectiveGrid, wide: bb2PerspectiveGridWide },
};

/** The models whose region preview is a grid footprint, as opposed to the legacy Beam geometry. */
export const gridRegionPreviewModels = new Set(Object.keys(regionPreviewGrids));

/**
 * Perspective grid (= single-shot capture footprint) used by region preview. The one definition:
 * RegionPreviewMixin, Bb2Hx2PreviewManager and the hover indicator all ask here, so a grid cannot
 * be right in the capture and wrong in the rectangle drawn under the cursor.
 */
export const getRegionPreviewGrid = (
  model: string,
  { isCameraOblique = false, mode = PreviewMode.REGION }: { isCameraOblique?: boolean; mode?: PreviewMode } = {},
): PerspectiveGrid => {
  const { narrow, wide } = regionPreviewGrids[model] ?? regionPreviewGrids.fbb2;

  return isCameraOblique && mode === PreviewMode.REGION ? wide : narrow;
};

export const getRegionalPoints = (
  region: WideAngleRegion,
  points: Record<'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight', Points> = bb2WideAngleCameraPnpPoints,
): Points => {
  const res = match(region)
    .with('top', () => [points.topLeft[1], points.topRight[0], points.topLeft[3], points.topRight[2]])
    .with('bottom', () => [points.bottomLeft[1], points.bottomRight[0], points.bottomLeft[3], points.bottomRight[2]])
    .with('left', () => [points.topLeft[2], points.topLeft[3], points.bottomLeft[0], points.bottomLeft[1]])
    .with('right', () => [points.topRight[2], points.topRight[3], points.bottomRight[0], points.bottomRight[1]])
    .with('center', () => [points.topLeft[3], points.topRight[2], points.bottomLeft[1], points.bottomRight[0]])
    .otherwise((key) => points[key]);

  return res;
};

export const promarkPnPPoints: { [size: number]: Points } = {
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
