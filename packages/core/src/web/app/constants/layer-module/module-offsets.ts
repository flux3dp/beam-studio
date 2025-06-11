// Default value of module offset
import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { LayerModule } from '@core/app/constants/layer-module/layer-modules';

// Module Boundary for ador
const moduleOffsets = {
  [LayerModule.LASER_10W_DIODE]: [0, 0],
  [LayerModule.LASER_20W_DIODE]: [0, 0],
  [LayerModule.LASER_1064]: [0, 26.95],
  [LayerModule.LASER_UNIVERSAL]: [0, 0],
  [LayerModule.PRINTER]: [0, -13.37],
  [LayerModule.UV_WHITE_INK]: [-0.7, -22.8],
} as Record<LayerModuleType, [number, number]>;

export default moduleOffsets;
