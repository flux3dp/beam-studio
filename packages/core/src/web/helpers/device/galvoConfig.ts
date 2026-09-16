import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import type { Field, GalvoParameters, RedDot } from '@core/interfaces/Promark';

import deviceMaster from '../device-master';

import { stringifyDeviceSettingJson } from './deviceSettingJson';

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
  /** field lens size in mm, one of galvoWorkareaOptions */
  workarea: number;
}

export const galvoWorkareaOptions = [70, 110] as const;

/** Keep in sync with galvo_default in the firmware's fluxmonitor/storage.py */
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
    // the firmware fills in its own defaults, so anything missing is still worth defaulting here
    const config: GalvoConfig = { ...defaultGalvoConfig, ...(JSON.parse(res.value) as Partial<GalvoConfig>) };

    cache[cacheKey] = config;

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

    return true;
  } catch (error) {
    console.error(`Failed to set ${configKeys[module]} on device`, error);

    return false;
  }
};
