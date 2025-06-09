import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';

const moduleBoundaries: Partial<
  Record<WorkAreaModel, Partial<Record<LayerModuleType, { bottom: number; left: number; right: number; top: number }>>>
> = {};

// Module Boundary for ador
// bottom boundary is added by 20mm for 1064nm laser
const moduleBoundary: {
  [model: LayerModuleType]: { bottom: number; left: number; right: number; top: number };
} = {
  [LayerModule.LASER_10W_DIODE]: { bottom: 20, left: 0, right: 0, top: 0 },
  [LayerModule.LASER_20W_DIODE]: { bottom: 30, left: 0, right: 0, top: 0 },
  [LayerModule.LASER_1064]: { bottom: 38, left: 0, right: 0, top: 0 },
  [LayerModule.PRINTER]: { bottom: 50, left: 0, right: 0, top: 12.7 },
};

export default moduleBoundary;
