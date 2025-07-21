import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';

/**
 * Boundaries of laser head (without module offset) for different work area models.
 */
const moduleBoundaries: Partial<
  Record<WorkAreaModel, Partial<Record<LayerModuleType, { bottom: number; left: number; right: number; top: number }>>>
> = {
  ado1: {
    [LayerModule.LASER_10W_DIODE]: { bottom: 20, left: 0, right: 0, top: 0 },
    [LayerModule.LASER_20W_DIODE]: { bottom: 30, left: 0, right: 0, top: 0 },
    [LayerModule.LASER_1064]: { bottom: 38, left: 0, right: 0, top: 0 },
    [LayerModule.PRINTER]: { bottom: 50, left: 0, right: 0, top: 0 },
  },
  fbm2: {
    [LayerModule.LASER_1064]: { bottom: 20, left: 0, right: 90, top: 0 },
  },
};

export const getModuleBoundary = (model: WorkAreaModel, layerModule: LayerModuleType) => {
  return moduleBoundaries[model]?.[layerModule] || { bottom: 0, left: 0, right: 0, top: 0 };
};
