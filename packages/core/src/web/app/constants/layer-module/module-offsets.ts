// Default value of module offset
import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';

export type ModuleOffsets = Partial<Record<WorkAreaModel, Partial<Record<LayerModuleType, [number, number]>>>>;

// Default Module Boundary
const moduleOffsets: ModuleOffsets = {
  ado1: {
    [LayerModule.LASER_10W_DIODE]: [0, 0],
    [LayerModule.LASER_20W_DIODE]: [0, 0],
    [LayerModule.LASER_1064]: [0, 26.95],
    [LayerModule.LASER_UNIVERSAL]: [0, 0],
    [LayerModule.PRINTER]: [0, -13.37],
  },
  fbm2: {
    [LayerModule.LASER_1064]: [0, 0], // temp
    [LayerModule.LASER_UNIVERSAL]: [0, 0],
    [LayerModule.PRINTER_4C]: [0, 0], // temp
    [LayerModule.UV_WHITE_INK]: [-0.7, -22.8],
  },
};

export default moduleOffsets;
