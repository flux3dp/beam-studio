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
 * is module offset, handled by toolhead_shift, so the settings dialog hides them.
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
 * Only one focusHeight is needed even though the two field lens sizes focus differently: workarea
 * falls back to 110 as well, so an unconfigured machine is always the 110 case.
 *
 * TODO: focusHeight is 0 as a placeholder. How it drives the machine is not settled yet.
 */
export const defaultGalvoConfig: GalvoConfig = {
  field: { angle: 0, offsetX: 0, offsetY: 0 },
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

// keyed by `${uuid}:${configKey}`, in memory only
const cache: Record<string, GalvoConfig> = {};
const isConfigured: Record<string, boolean> = {};

const getCacheKey = (uuid: string, module: GalvoModule) => `${uuid}:${configKeys[module]}`;

export const getGalvoConfig = async (
  module: GalvoModule,
  { useCache = true }: { useCache?: boolean } = {},
): Promise<GalvoConfig> => {
  const uuid = deviceMaster.currentDevice?.info.uuid;

  if (!uuid) return { ...defaultGalvoConfig };

  const cacheKey = getCacheKey(uuid, module);

  if (useCache && cache[cacheKey]) return cache[cacheKey];

  try {
    const res = await deviceMaster.getDeviceSetting(configKeys[module]);
    // an uncalibrated machine answers empty, and a calibrated one may still omit keys it has
    // never been given, so every read is layered onto the defaults
    const stored = res.value ? (JSON.parse(res.value) as Partial<GalvoConfig>) : {};
    const config: GalvoConfig = { ...defaultGalvoConfig, ...stored };

    cache[cacheKey] = config;
    // an empty answer means the machine has never been configured for this head
    isConfigured[cacheKey] = Boolean(res.value);

    return config;
  } catch (error) {
    console.error(`Failed to get ${configKeys[module]} from device`, error);
  }

  return { ...defaultGalvoConfig };
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

    cache[cacheKey] = { ...(cache[cacheKey] ?? defaultGalvoConfig), ...config };
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
