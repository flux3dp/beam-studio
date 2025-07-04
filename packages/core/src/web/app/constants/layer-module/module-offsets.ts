// Default value of module offset
import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';

/**
 * A tuple representing the offset of a module.
 *
 * - [0] X offset in millimeters.
 *        A positive value means the module is positioned to the right of the laser head.
 * - [1] Y offset in millimeters.
 *        A positive value means the module is positioned below the laser head.
 * - [2] Optional flag indicating whether this offset was calibrated or from default.
 */
export type OffsetTuple = [number, number, boolean?];

export type ModuleOffsets = Partial<Record<WorkAreaModel, Partial<Record<LayerModuleType, OffsetTuple>>>>;

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
    [LayerModule.LASER_1064]: [81.4, 7.9],
    [LayerModule.LASER_UNIVERSAL]: [0, 0], // TODO: add true flag to force update offset
    [LayerModule.PRINTER_4C]: [15.5, -37.1],
    [LayerModule.UV_VARNISH]: [30.2, -1.1],
    [LayerModule.UV_WHITE_INK]: [19.7, -1.1],
  },
};

export default moduleOffsets;
