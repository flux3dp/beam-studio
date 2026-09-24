import { DeviceOperationEvents } from '@core/app/constants/deviceEvents';
import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import { setModuleBoundaryOverride } from '@core/app/constants/layer-module/module-boundary';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import storage from '@core/implementations/storage';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

import deviceMaster from '../device-master';

import { stringifyDeviceSettingJson } from './deviceSettingJson';
import { getGalvoConfig } from './galvoConfig';
import { getAllOffsetsFromDevices } from './moduleOffsets';

/**
 * DEVELOPMENT ONLY. The machine being brought up needs its travel limits changed without a
 * rebuild, so the boundary is computed from what the machine reports. For release this whole
 * path goes away -- module-boundary.ts gets one fixed safe set of numbers, and this file, the
 * locally stored minimums and the panel that edits them are all deleted.
 *
 * Range is where the gantry may go, in machine mm; the boundary is what that leaves unreachable
 * at each edge of the canvas. Only two ranges exist: the CO2 galvo is always fitted, so the plain
 * laser head shares its range, and the MOPA head parked on the machine narrows things further
 * whether or not this job uses it.
 */
export type GalvoWorkRangeMode = 'galvo' | 'mopa';
export interface GalvoRange {
  x: number;
  y: number;
}
export type GalvoWorkRange = Record<GalvoWorkRangeMode, GalvoRange>;

/** Must agree with the backend's galvo_work_range_default(); nothing enforces it. */
export const defaultGalvoWorkRange: GalvoWorkRange = {
  galvo: { x: 600, y: 520 },
  mopa: { x: 600, y: 520 },
};

/** The near edges are not on the machine yet, so they are kept here and default to no limit. */
export const defaultGalvoWorkRangeMin: GalvoWorkRange = {
  galvo: { x: 0, y: 0 },
  mopa: { x: 0, y: 0 },
};

const CONFIG_KEY = 'galvo_work_range';
const MODEL = 'fhx2galvo';

export const galvoWorkRangeModes: Partial<Record<LayerModuleType, GalvoWorkRangeMode>> = {
  [LayerModule.GALVO_CO2]: 'galvo',
  [LayerModule.GALVO_MOPA]: 'mopa',
  [LayerModule.LASER_UNIVERSAL]: 'galvo',
};

// by uuid, in memory only
const cache: Record<string, GalvoWorkRange> = {};

const merge = (stored: Partial<GalvoWorkRange> | undefined): GalvoWorkRange => ({
  galvo: { ...defaultGalvoWorkRange.galvo, ...stored?.galvo },
  mopa: { ...defaultGalvoWorkRange.mopa, ...stored?.mopa },
});

export const getGalvoWorkRangeMin = (): GalvoWorkRange => {
  const stored = storage.get('galvo-work-range-min') as Partial<GalvoWorkRange> | undefined;

  return {
    galvo: { ...defaultGalvoWorkRangeMin.galvo, ...stored?.galvo },
    mopa: { ...defaultGalvoWorkRangeMin.mopa, ...stored?.mopa },
  };
};

export const setGalvoWorkRangeMin = (value: GalvoWorkRange): void => {
  storage.set('galvo-work-range-min', value);
  applyToModuleBoundary();
};

/**
 * Whatever the last read left behind, without asking the machine. The boundary is drawn on every
 * canvas change, far too often to wait on a device round trip, so reading is done once per select
 * and everything downstream reads the answer synchronously.
 */
export const getCachedGalvoWorkRange = (): GalvoWorkRange => {
  const uuid = deviceMaster.currentDevice?.info.uuid;

  return (uuid && cache[uuid]) || defaultGalvoWorkRange;
};

/** Range in, inset out: what each edge of the canvas loses because the gantry stops short. */
const toBoundary = (max: GalvoRange, min: GalvoRange) => {
  const { height, width } = getWorkarea(MODEL);

  return {
    bottom: Math.max(height - max.y, 0),
    left: Math.max(min.x, 0),
    right: Math.max(width - max.x, 0),
    top: Math.max(min.y, 0),
  };
};

/** Every path that changes the override ends here, so none of them can forget the redraw. */
const applyToModuleBoundary = (): void => {
  const max = getCachedGalvoWorkRange();
  const min = getGalvoWorkRangeMin();

  setModuleBoundaryOverride(
    MODEL,
    Object.fromEntries(
      Object.entries(galvoWorkRangeModes).map(([module, mode]) => [module, toBoundary(max[mode], min[mode])]),
    ),
  );
  eventEmitterFactory.createEventEmitter('canvas').emit('canvas-change');
};

export const fetchGalvoWorkRange = async ({
  useCache = true,
}: { useCache?: boolean } = {}): Promise<GalvoWorkRange> => {
  const uuid = deviceMaster.currentDevice?.info.uuid;

  if (!uuid) return defaultGalvoWorkRange;

  if (useCache && cache[uuid]) return cache[uuid];

  try {
    const res = await deviceMaster.getDeviceSetting(CONFIG_KEY);

    cache[uuid] = merge(res.value ? (JSON.parse(res.value) as Partial<GalvoWorkRange>) : undefined);
  } catch (error) {
    console.error(`Failed to get ${CONFIG_KEY} from device`, error);
  }

  applyToModuleBoundary();

  return cache[uuid] ?? defaultGalvoWorkRange;
};

export const updateGalvoWorkRange = async (value: GalvoWorkRange): Promise<boolean> => {
  const uuid = deviceMaster.currentDevice?.info.uuid;

  if (!uuid) return false;

  try {
    await deviceMaster.setDeviceSetting(CONFIG_KEY, stringifyDeviceSettingJson(value));
    cache[uuid] = value;
    applyToModuleBoundary();

    return true;
  } catch (error) {
    console.error(`Failed to set ${CONFIG_KEY} on device`, error);

    return false;
  }
};

/**
 * Everything the canvas wants to know about a HEXA II sits on the machine, and none of it can be
 * read while drawing. Pull it whenever a machine answers, so the boundary and the export both
 * work from the real values instead of the defaults.
 *
 * Every read goes past its cache: this is the one moment the machine is known to be reachable, and
 * a value edited on the machine or from another copy of Beam Studio would otherwise never be
 * noticed. The cost is four reads per select, and select runs on every export and camera action.
 */
const prefetchOnSelect = async (device: IDeviceInfo): Promise<void> => {
  if (device.model !== MODEL) return;

  await Promise.allSettled([
    fetchGalvoWorkRange({ useCache: false }),
    // the field lens sets how far the galvo reaches past the head; read both heads while
    // connected, since the boundary follows what is mounted rather than what this job uses
    getGalvoConfig(LayerModule.GALVO_CO2, { useCache: false }),
    getGalvoConfig(LayerModule.GALVO_MOPA, { useCache: false }),
    // toolhead_shift: where each head sits relative to the nozzle. One read covers every module.
    getAllOffsetsFromDevices(false),
  ]);
  eventEmitterFactory.createEventEmitter('canvas').emit('canvas-change');
};

eventEmitterFactory.createEventEmitter('device').on(DeviceOperationEvents.Selected, prefetchOnSelect);
