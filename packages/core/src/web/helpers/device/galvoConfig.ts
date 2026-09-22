import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import type { Field, GalvoParameters, RedDot } from '@core/interfaces/Promark';

import deviceMaster from '../device-master';

import { stringifyDeviceSettingJson } from './deviceSettingJson';

export const galvoWorkareaOptions = [70, 110] as const;

export type GalvoWorkarea = (typeof galvoWorkareaOptions)[number];

/**
 * Settings of one galvo module head, stored on the machine.
 *
 * field.offsetX and field.offsetY stay zero on HEXA II: the head's position relative to the nozzle
 * is module offset, so the settings dialog reads and writes those two numbers through
 * toolhead_shift instead -- the same place module calibration and the canvas boundary read them.
 */
export interface GalvoConfig {
  field: Field;
  /** distance from the lens to the focal plane, in mm */
  focusHeight: number;
  galvoParameters: GalvoParameters;
  redDot: RedDot;
  /** field lens size in mm */
  workarea: GalvoWorkarea;
}

/**
 * Neutral values, not measurements: a machine that has never been calibrated should behave as if
 * no correction were applied. The firmware keeps no defaults of its own, so these have to agree
 * with the player's own fallback.
 *
 * Axis orientation is the one exception -- it is mounting, not calibration -- so it is overridden
 * per head in getDefaultGalvoConfig rather than left neutral here.
 *
 * Only one focusHeight is needed even though the two field lens sizes focus differently: workarea
 * falls back to 110 as well, so an unconfigured machine is always the 110 case.
 *
 * TODO: focusHeight is 0 as a placeholder. How it drives the machine is not settled yet.
 */
export const defaultGalvoConfig: GalvoConfig = {
  field: { angle: 0, invertX: false, invertY: false, offsetX: 0, offsetY: 0, swapXY: false },
  focusHeight: 0,
  galvoParameters: {
    x: { bulge: 1, scale: 100, skew: 1, trapezoid: 1 },
    y: { bulge: 1, scale: 100, skew: 1, trapezoid: 1 },
  },
  redDot: { offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1 },
  workarea: 110,
};

const configKeys = {
  [LayerModule.GALVO_CO2]: 'galvo_co2',
  [LayerModule.GALVO_MOPA]: 'galvo_mopa',
} as const;

export type GalvoModule = keyof typeof configKeys;

export const isGalvoModule = (module: LayerModuleType): module is GalvoModule => module in configKeys;

/**
 * How each head is mounted, which is fixed by the hardware rather than measured per machine: the
 * CO2 galvo sits mirrored in both axes, the MOPA one does not.
 */
const defaultAxesByModule = {
  [LayerModule.GALVO_CO2]: { invertX: true, invertY: true, swapXY: false },
  [LayerModule.GALVO_MOPA]: { invertX: false, invertY: false, swapXY: false },
} as const satisfies Record<GalvoModule, Pick<Field, 'invertX' | 'invertY' | 'swapXY'>>;

/** The defaults standing in for a head the machine has never been configured for. */
export const getDefaultGalvoConfig = (module: GalvoModule): GalvoConfig => ({
  ...defaultGalvoConfig,
  field: { ...defaultGalvoConfig.field, ...defaultAxesByModule[module] },
});

// keyed by `${uuid}:${configKey}`, in memory only
const cache: Record<string, GalvoConfig> = {};
const isConfigured: Record<string, boolean> = {};

const getCacheKey = (uuid: string, module: GalvoModule) => `${uuid}:${configKeys[module]}`;

export const getGalvoConfig = async (
  module: GalvoModule,
  { useCache = true }: { useCache?: boolean } = {},
): Promise<GalvoConfig> => {
  const uuid = deviceMaster.currentDevice?.info.uuid;

  const defaults = getDefaultGalvoConfig(module);

  if (!uuid) return defaults;

  const cacheKey = getCacheKey(uuid, module);

  if (useCache && cache[cacheKey]) return cache[cacheKey];

  try {
    const res = await deviceMaster.getDeviceSetting(configKeys[module]);
    // an uncalibrated machine answers empty, and a calibrated one may still omit keys it has
    // never been given, so every read is layered onto the defaults
    const stored = res.value ? (JSON.parse(res.value) as Partial<GalvoConfig>) : {};
    // One level deep: a machine configured before a key existed answers without it, and a plain
    // spread would drop the whole nested group's defaults along with it.
    const config: GalvoConfig = {
      ...defaults,
      ...stored,
      field: { ...defaults.field, ...stored.field },
      galvoParameters: {
        x: { ...defaults.galvoParameters.x, ...stored.galvoParameters?.x },
        y: { ...defaults.galvoParameters.y, ...stored.galvoParameters?.y },
      },
      redDot: { ...defaults.redDot, ...stored.redDot },
    };

    cache[cacheKey] = config;
    // an empty answer means the machine has never been configured for this head
    isConfigured[cacheKey] = Boolean(res.value);

    return config;
  } catch (error) {
    console.error(`Failed to get ${configKeys[module]} from device`, error);
  }

  return defaults;
};

/**
 * Write the given keys back to the machine. The firmware merges them into what it already has, so
 * only the changed ones need sending, but a nested value is replaced rather than merged.
 */
export const updateGalvoConfig = async (module: GalvoModule, config: Partial<GalvoConfig>): Promise<boolean> => {
  const uuid = deviceMaster.currentDevice?.info.uuid;

  if (!uuid) return false;

  try {
    await deviceMaster.setDeviceSetting(configKeys[module], stringifyDeviceSettingJson(config));

    const cacheKey = getCacheKey(uuid, module);

    cache[cacheKey] = { ...(cache[cacheKey] ?? getDefaultGalvoConfig(module)), ...config };
    isConfigured[cacheKey] = true;

    return true;
  } catch (error) {
    console.error(`Failed to set ${configKeys[module]} on device`, error);

    return false;
  }
};

/**
 * Whether the machine holds a config for this head, as opposed to the defaults standing in for
 * one. Reads the machine unless a previous read is cached.
 */
export const hasGalvoConfig = async (module: GalvoModule): Promise<boolean> => {
  const uuid = deviceMaster.currentDevice?.info.uuid;

  if (!uuid) return false;

  const cacheKey = getCacheKey(uuid, module);

  if (isConfigured[cacheKey] === undefined) await getGalvoConfig(module);

  return Boolean(isConfigured[cacheKey]);
};
