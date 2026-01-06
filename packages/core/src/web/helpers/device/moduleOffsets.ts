import { round } from 'remeda';

import { boundaryDrawer } from '@core/app/actions/canvas/boundaryDrawer';
import { getLayerModuleName, LayerModule, type LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import type { DeviceModuleOffsets, ModuleOffsets, OffsetTuple } from '@core/app/constants/layer-module/module-offsets';
import moduleOffsets from '@core/app/constants/layer-module/module-offsets';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';

import deviceMaster from '../device-master';

const devicesModuleOffsetsCache: Record<string, DeviceModuleOffsets> = {};
const modelsWithStores = ['fbm2', 'fuv1'] as const;

export const getAllOffsetsFromDevices = async (useCache = true): Promise<DeviceModuleOffsets | null> => {
  if (!deviceMaster.currentDevice || !modelsWithStores.includes(deviceMaster.currentDevice.info.model)) return null;

  const { uuid } = deviceMaster.currentDevice.info;

  if (useCache && uuid) return devicesModuleOffsetsCache[uuid] ?? null;

  try {
    const res = await deviceMaster.getDeviceSetting('toolhead_shift');
    const value = JSON.parse(res.value) as Record<string, OffsetTuple>;
    const translated: DeviceModuleOffsets = {};

    Object.entries(value).forEach(([key, val]) => {
      const k = LayerModule[key as keyof typeof LayerModule];

      if (k) translated[k] = val;
    });

    devicesModuleOffsetsCache[uuid] = translated;

    return translated;
  } catch (error) {
    console.error('Failed to get module offsets from device', error);
  }

  return null;
};

export const getAllOffsets = async (
  model: WorkAreaModel,
  { useCache = true }: { useCache?: boolean } = {},
): Promise<DeviceModuleOffsets> => {
  const defaultOffsets = moduleOffsets[model] ?? {};

  if (modelsWithStores.includes(model)) return (await getAllOffsetsFromDevices(useCache)) ?? defaultOffsets;

  return useGlobalPreferenceStore.getState()['module-offsets'][model] ?? defaultOffsets;
};

export const getModuleOffsetsFromDevices = async (
  module: LayerModuleType,
  {
    useCache = true,
  }: {
    useCache?: boolean;
  } = {},
): Promise<null | OffsetTuple> => {
  const allOffsets = await getAllOffsetsFromDevices(useCache);

  return allOffsets?.[module] ?? null;
};
type GetModuleOffsetsArgs = Partial<{
  isRelative: boolean;
  module: LayerModuleType;
  offsets: ModuleOffsets;
  useCache: boolean;
  workarea: WorkAreaModel;
}>;

export const getModuleOffsetsFromStore = ({
  isRelative = false,
  module = LayerModule.LASER_10W_DIODE,
  offsets = useGlobalPreferenceStore.getState()['module-offsets'],
  workarea = useDocumentStore.getState().workarea,
}: GetModuleOffsetsArgs = {}): OffsetTuple => {
  const defaultOffset = moduleOffsets[workarea]?.[module] ?? [0, 0];
  const customOffset = offsets?.[workarea]?.[module] ?? defaultOffset;

  return isRelative ? [customOffset[0] - defaultOffset[0], customOffset[1] - defaultOffset[1]] : customOffset;
};

export const getModuleOffsets = async ({
  isRelative = false,
  module = LayerModule.LASER_10W_DIODE,
  offsets = useGlobalPreferenceStore.getState()['module-offsets'],
  useCache = true,
  workarea = useDocumentStore.getState().workarea,
}: GetModuleOffsetsArgs = {}): Promise<OffsetTuple> => {
  if (!modelsWithStores.includes(workarea)) {
    return getModuleOffsetsFromStore({ isRelative, module, offsets, workarea });
  }

  const defaultOffset = moduleOffsets[workarea]?.[module] ?? [0, 0];
  const customOffset = (await getModuleOffsetsFromDevices(module, { useCache })) ?? defaultOffset;

  return isRelative ? [customOffset[0] - defaultOffset[0], customOffset[1] - defaultOffset[1]] : customOffset;
};

type UpdateModuleOffsetsArgs = Partial<{
  isRelative: boolean;
  module: LayerModuleType;
  offsets: ModuleOffsets;
  shouldWrite: boolean;
  workarea: WorkAreaModel;
}>;

export const updateModuleOffsetsInDevice = async (
  newOffsets: [number, number],
  { isRelative, module, workarea }: UpdateModuleOffsetsArgs = {},
): Promise<boolean> => {
  if (!deviceMaster.currentDevice || !modelsWithStores.includes(deviceMaster.currentDevice.info.model) || !module) {
    return false;
  }

  if (!workarea) workarea = deviceMaster.currentDevice.info.model;

  const { uuid } = deviceMaster.currentDevice.info;
  const defaultOffset = moduleOffsets[workarea]?.[module];

  if (defaultOffset && isRelative) {
    newOffsets = [newOffsets[0] + defaultOffset[0], newOffsets[1] + defaultOffset[1]];
  }

  const data = JSON.stringify({ [getLayerModuleName(module)]: newOffsets }, (_, val) => {
    if (typeof val === 'number') return round(val, 2);

    return val;
  });

  const res = await deviceMaster.setDeviceSetting('toolhead_shift', data.replaceAll('"', '\\\\\\"'));

  console.log(res);

  if (!devicesModuleOffsetsCache[uuid]) devicesModuleOffsetsCache[uuid] = {};

  devicesModuleOffsetsCache[uuid][module] = [...newOffsets, 1]; // Mark as calibrated

  return true;
};

export const updateModuleOffsetsInStore = (
  newOffsets: [number, number],
  {
    isRelative = false,
    module = LayerModule.LASER_10W_DIODE,
    offsets = useGlobalPreferenceStore.getState()['module-offsets'],
    shouldWrite = false,
    workarea = useDocumentStore.getState().workarea,
  }: UpdateModuleOffsetsArgs = {},
): ModuleOffsets => {
  const defaultOffset = moduleOffsets[workarea]?.[module];

  if (!offsets[workarea]) {
    offsets[workarea] = {};
  }

  if (!isRelative || !defaultOffset) {
    offsets[workarea][module] = newOffsets;
  } else {
    offsets[workarea][module] = [newOffsets[0] + defaultOffset[0], newOffsets[1] + defaultOffset[1]];
  }

  offsets[workarea][module][2] = 1; // Mark as calibrated

  if (shouldWrite) {
    useGlobalPreferenceStore.getState().set('module-offsets', offsets);
    boundaryDrawer.update();
  }

  return offsets;
};

export const updateModuleOffsets = async (
  newOffsets: [number, number],
  args?: UpdateModuleOffsetsArgs,
): Promise<boolean> => {
  const workarea = args?.workarea;

  if (workarea && modelsWithStores.includes(workarea)) {
    return await updateModuleOffsetsInDevice(newOffsets, args);
  }

  updateModuleOffsetsInStore(newOffsets, { ...args, shouldWrite: true });

  return true;
};
