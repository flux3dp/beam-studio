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
    [LayerModule.LASER_1064]: { bottom: 20, left: 0, right: 90, top: 20 },
    [LayerModule.PRINTER_4C]: { bottom: 0, left: 0, right: 30, top: 0 },
    [LayerModule.UV_VARNISH]: { bottom: 0, left: 0, right: 30, top: 0 },
    [LayerModule.UV_WHITE_INK]: { bottom: 0, left: 0, right: 30, top: 0 },
  },
  // The galvo heads sit to the right, whether connected to the nozzle or parked at the edge, so both
  // states lose the same strip of travel.
  // TODO: confirm how much, the values below are placeholders
  fhx2galvo: {
    [LayerModule.GALVO_CO2]: { bottom: 0, left: 0, right: 50, top: 0 },
    [LayerModule.GALVO_MOPA]: { bottom: 0, left: 0, right: 100, top: 0 },
    [LayerModule.LASER_UNIVERSAL]: { bottom: 0, left: 0, right: 50, top: 0 },
  },
};

type ModuleBoundaries = Partial<Record<LayerModuleType, { bottom: number; left: number; right: number; top: number }>>;

/**
 * DEVELOPMENT ONLY. Boundaries computed from what a machine reports rather than from the table
 * above, pushed in by helpers/device/galvoWorkRange so this file keeps no device imports -- boxgen
 * and the material test panel read it too. For release the machine path goes away and the table is
 * the only source again.
 */
const overrides: Partial<Record<WorkAreaModel, ModuleBoundaries>> = {};

export const setModuleBoundaryOverride = (model: WorkAreaModel, boundaries: ModuleBoundaries): void => {
  overrides[model] = boundaries;
};

export const getModuleBoundary = (model: WorkAreaModel, layerModule: LayerModuleType) => {
  return (
    overrides[model]?.[layerModule] ||
    moduleBoundaries[model]?.[layerModule] || { bottom: 0, left: 0, right: 0, top: 0 }
  );
};
