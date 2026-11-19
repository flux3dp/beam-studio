import { match } from 'ts-pattern';

import type { Field, GalvoParameters, PromarkInfo, RedDot } from '@core/interfaces/Promark';

export const promarkWatts = [20, 30, 50] as const;
export const mopaWatts = [20, 60, 100] as const;
export const uvWatts = [5] as const;

export const laserSourceWattMap = { Desktop: promarkWatts, MOPA: mopaWatts, UV: uvWatts } as const;
export const laserTypes = ['Desktop', 'MOPA', 'UV'] as const;

export enum LaserType {
  Desktop = 0,
  MOPA = 1,
  UV = 2,
}

export const MOPA_WORKAREA_OPTIONS = [110, 150, 220] as const;
export const UV_INNER_ENGRAVING_WORKAREA = 70;
export const UV_WORKAREA_OPTIONS = [UV_INNER_ENGRAVING_WORKAREA, 200] as const;

export type PromarkLaserSource = 'MOPA' | 'UV';

/** Work areas compatible with the selected Promark laser source. */
export const getPromarkWorkareaOptions = (laserType: LaserType): ReadonlyArray<number> =>
  laserType === LaserType.UV ? UV_WORKAREA_OPTIONS : MOPA_WORKAREA_OPTIONS;

/** Default work area shared by initialization and document settings. */
export const getDefaultPromarkWorkarea = ({ laserType, watt }: { laserType: LaserType; watt: number }): number => {
  if (laserType === LaserType.UV) return UV_INNER_ENGRAVING_WORKAREA;

  if (laserType === LaserType.MOPA && watt === 20) return MOPA_WORKAREA_OPTIONS[0];

  return MOPA_WORKAREA_OPTIONS.at(-1)!;
};

export const isPromarkWorkareaCompatible = (laserType: LaserType, size: number): boolean =>
  getPromarkWorkareaOptions(laserType).includes(size);

/** Swiftray currently distinguishes UV from all MOPA-family sources. */
export const getPromarkLaserSource = (laserType: unknown): PromarkLaserSource =>
  laserType === LaserType.UV ? 'UV' : 'MOPA';

/**
 * Default frequency (kHz) and pulse width (ns) of a Promark laser source, by laser type and watt; a
 * new Promark layer starts from these. UV starts at its weakest output (200kHz, about 15.6%) so a new
 * layer is safe. 27kHz and 500ns are the defaults of every other laser (baseConfig).
 */
export const getPromarkSourceDefaults = ({ laserType, watt }: PromarkInfo): { frequency: number; pulseWidth: number } =>
  match(laserType)
    .with(LaserType.UV, () => ({ frequency: 200, pulseWidth: 13 }))
    .with(LaserType.MOPA, () => ({
      frequency: match(watt)
        .when(
          (w) => w >= 100,
          () => 55,
        )
        .when(
          (w) => w >= 60,
          () => 40,
        )
        .otherwise(() => 25),
      pulseWidth: 500,
    }))
    // Desktop, and whatever a stored info holds: this feeds every new layer, so it must not throw
    .otherwise(() => ({
      frequency: match(watt)
        .when(
          (w) => w >= 50,
          () => 45,
        )
        .when(
          (w) => w >= 30,
          () => 30,
        )
        .otherwise(() => 27),
      pulseWidth: 500,
    }));

// Recommended layer parameters for the Promark example file, keyed by laser type and watt.
// pulseWidth only applies to MOPA sources. UV stays empty until hardware defaults are available.
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
  [LaserType.UV]: {},
};

export const defaultField: Field = { angle: 0, offsetX: 0, offsetY: 0 };
export const defaultGalvoParameters: GalvoParameters = {
  x: { bulge: 1, scale: 100, skew: 1, trapezoid: 1 },
  y: { bulge: 1, scale: 100, skew: 1, trapezoid: 1 },
};
export const defaultRedLight: RedDot = { offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1 };

/** Values outside `error` cannot be saved; values outside `warning` are saved after a confirmation. */
export interface LensParameterRange {
  error: readonly [number, number];
  warning: readonly [number, number];
}

/** The field offset limit is a share of the work area; see `getLensParameterRanges`. */
export const FIELD_OFFSET_ERROR_RATIO = 0.1;

export const getLensParameterRanges = (workarea: number) =>
  ({
    fieldAngle: { error: [-10, 10], warning: [-2, 2] },
    fieldOffset: {
      error: [-workarea * FIELD_OFFSET_ERROR_RATIO, workarea * FIELD_OFFSET_ERROR_RATIO],
      warning: [-5, 5],
    },
    galvoBulge: { error: [0.8, 1.2], warning: [0.9, 1.1] },
    // %
    galvoScale: { error: [50, 150], warning: [70, 110] },
    galvoSkew: { error: [0.9, 1.1], warning: [0.97, 1.03] },
    galvoTrapezoid: { error: [0.9, 1.1], warning: [0.98, 1.02] },
    redDotOffset: { error: [-10, 10], warning: [-5, 5] },
    redDotScale: { error: [0.8, 1.2], warning: [0.95, 1.05] },
  }) as const satisfies Record<string, LensParameterRange>;

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
  uvWatts,
};
