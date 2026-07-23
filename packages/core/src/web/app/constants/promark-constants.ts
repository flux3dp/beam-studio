import type { Field, GalvoParameters, RedDot } from '@core/interfaces/Promark';

export const workareaOptions = [110, 150, 220] as const;
export const promarkWatts = [20, 30, 50] as const;
export const mopaWatts = [20, 60, 100] as const;

export const laserSourceWattMap = { Desktop: promarkWatts, MOPA: mopaWatts } as const;

export enum LaserType {
  Desktop = 0,
  MOPA = 1,
}

// Recommended layer parameters for the Promark example file, keyed by laser type and watt.
// pulseWidth only applies to MOPA sources.
export const promarkExampleParams: Record<
  LaserType,
  Record<number, { frequency: number; power: number; pulseWidth?: number; speed: number }>
> = {
  [LaserType.Desktop]: {
    20: { frequency: 27, power: 90, speed: 2000 },
    30: { frequency: 30, power: 72, speed: 2000 },
    50: { frequency: 45, power: 90, speed: 2000 },
  },
  [LaserType.MOPA]: {
    20: { frequency: 25, power: 90, pulseWidth: 350, speed: 2500 },
    60: { frequency: 25, power: 45, pulseWidth: 350, speed: 2500 },
    100: { frequency: 55, power: 55, pulseWidth: 500, speed: 3500 },
  },
};

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
