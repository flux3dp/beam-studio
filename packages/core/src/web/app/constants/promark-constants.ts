import type { Field, GalvoParameters, RedDot } from '@core/interfaces/Promark';

export const workareaOptions = [110, 150, 220] as const;
export const promarkWatts = [20, 30, 50] as const;
export const mopaWatts = [20, 60, 100] as const;

export const laserSourceWattMap = { Desktop: promarkWatts, MOPA: mopaWatts } as const;

export enum LaserType {
  Desktop = 0,
  MOPA = 1,
}

export const defaultField: Field = { angle: 0, offsetX: 0, offsetY: 0 };
export const defaultGalvoParameters: GalvoParameters = {
  x: { bulge: 1, scale: 100, skew: 1, trapezoid: 1 },
  y: { bulge: 1, scale: 100, skew: 1, trapezoid: 1 },
};
export const defaultRedLight: RedDot = { offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1 };

export const controlConfig = {
  aSpeed: 19.6875, // mm/ms
  jumpDelay: 300, // us ((MaxJumpDelay+MinJumpDelay)/2)
  laserDelay: 200, // us (LaserOffDelay-LaserOnDelay)
  travelSpeed: 4000, // mm/s
  zSpeed: 3, // mm/s (RunSpeed/pulsePerMM)
};

export default {
  mopaWatts,
  promarkWatts,
  workareaOptions,
};
