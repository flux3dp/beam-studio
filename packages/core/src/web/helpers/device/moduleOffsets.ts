import beamboxPreference from '@core/app/actions/beambox/beambox-preference';
import moduleBoundaryDrawer from '@core/app/actions/canvas/module-boundary-drawer';
import { LayerModule, type LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import type { ModuleOffsets, OffsetTuple } from '@core/app/constants/layer-module/module-offsets';
import moduleOffsets from '@core/app/constants/layer-module/module-offsets';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';

export const getModuleOffsets = ({
  isRelative = false,
  module = LayerModule.LASER_10W_DIODE,
  offsets = beamboxPreference.read('module-offsets'),
  workarea = beamboxPreference.read('workarea'),
}: Partial<{
  isRelative: boolean;
  module: LayerModuleType;
  offsets: ModuleOffsets;
  workarea: WorkAreaModel;
}> = {}): OffsetTuple => {
  const defaultOffset = moduleOffsets[workarea]?.[module] ?? [0, 0];
  const customOffset = offsets?.[workarea]?.[module] ?? defaultOffset;

  console.debug('get model offset', offsets, moduleOffsets);

  return isRelative ? [customOffset[0] - defaultOffset[0], customOffset[1] - defaultOffset[1]] : customOffset;
};

export const updateModuleOffsets = (
  newOffsets: [number, number],
  {
    isRelative = false,
    module = LayerModule.LASER_10W_DIODE,
    offsets = beamboxPreference.read('module-offsets'),
    shouldWrite = false,
    workarea = beamboxPreference.read('workarea'),
  }: Partial<{
    isRelative: boolean;
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

  if (!isRelative || !defaultOffset) {
    offsets[workarea][module] = newOffsets;
  } else {
    offsets[workarea][module] = [newOffsets[0] + defaultOffset[0], newOffsets[1] + defaultOffset[1]];
  }

  offsets[workarea][module][2] = true;

  if (shouldWrite) {
    beamboxPreference.write('module-offsets', offsets);
    moduleBoundaryDrawer.update();
  }

  return offsets;
};
