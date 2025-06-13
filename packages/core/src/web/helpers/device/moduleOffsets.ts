import beamboxPreference from '@core/app/actions/beambox/beambox-preference';
import { LayerModule, type LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import type { ModuleOffsets } from '@core/app/constants/layer-module/module-offsets';
import moduleOffsets from '@core/app/constants/layer-module/module-offsets';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';

export const getModuleOffsets = ({
  module = LayerModule.LASER_10W_DIODE,
  offsets = beamboxPreference.read('module-offsets'),
  useRealValue = true,
  workarea = beamboxPreference.read('workarea'),
}: Partial<{
  module: LayerModuleType;
  offsets: ModuleOffsets;
  useRealValue: boolean;
  workarea: WorkAreaModel;
}> = {}): [number, number] => {
  const customOffset = offsets?.[workarea]?.[module];
  const defaultOffset = moduleOffsets[workarea]?.[module];

  if (useRealValue) {
    return customOffset ?? defaultOffset ?? [0, 0];
  }

  if (!customOffset || !defaultOffset) {
    return customOffset ?? [0, 0];
  }

  return [customOffset[0] - defaultOffset[0], customOffset[1] - defaultOffset[1]];
};

export const updateModuleOffsets = (
  newOffsets: [number, number],
  {
    isRealValue = false,
    module = LayerModule.LASER_10W_DIODE,
    offsets = beamboxPreference.read('module-offsets'),
    shouldWrite = false,
    workarea = beamboxPreference.read('workarea'),
  }: Partial<{
    isRealValue: boolean;
    module: LayerModuleType;
    offsets: ModuleOffsets;
    shouldWrite: boolean;
    workarea: WorkAreaModel;
  }> = {},
): ModuleOffsets => {
  const defaultOffset = moduleOffsets[workarea]?.[module];

  if (!offsets[workarea]) {
    offsets[workarea] = {};
  }

  if (isRealValue || !defaultOffset) {
    offsets[workarea][module] = newOffsets;
  } else {
    offsets[workarea][module] = [newOffsets[0] + defaultOffset[0], newOffsets[1] + defaultOffset[1]];
  }

  if (shouldWrite) {
    beamboxPreference.write('module-offsets', offsets);
  }

  return offsets;
};
