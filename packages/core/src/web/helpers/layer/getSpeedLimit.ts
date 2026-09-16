import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { galvoModules, LayerModule } from '@core/app/constants/layer-module/layer-modules';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import layerManager from '@core/app/svgedit/layer/layerManager';
import { getLayerModule } from '@core/helpers/layer-module/layer-module-helper';

/**
 * Traverse speed of a galvo module head, in mm/s.
 *
 * A galvo steers the beam with mirrors instead of moving the gantry, so the machine's own maxSpeed
 * does not apply to it. TODO: provisional, mirrors the Promark ceiling; confirm against hardware.
 */
export const GALVO_MAX_SPEED = 10000;

const getModuleOfLayer = (layerName: string): LayerModuleType | undefined =>
  getLayerModule(layerManager.getLayerElementByName(layerName));

const getModuleSpeedLimit = (
  module: LayerModuleType,
  workarea: WorkAreaModel,
  hasCurveEngraving: boolean,
): { max: number; min: number } => {
  // a UV print layer has no speed of its own, so it never narrows the range
  if (module === LayerModule.UV_PRINT) return { max: Number.POSITIVE_INFINITY, min: 0 };

  const { curveSpeedLimit, maxSpeed, minSpeed } = getWorkarea(workarea);
  let max = galvoModules.has(module) ? GALVO_MAX_SPEED : maxSpeed;

  if (hasCurveEngraving && curveSpeedLimit?.x !== undefined) max = Math.min(max, curveSpeedLimit.x);

  if (module === LayerModule.PRINTER_4C) max = Math.min(max, 45);
  else if (module === LayerModule.LASER_1064 && workarea === 'fbm2') max = Math.min(max, 150);

  return { max, min: minSpeed };
};

/**
 * Speed range of a layer, in mm/s.
 *
 * The workarea sets the baseline. A module head that moves independently of the gantry replaces
 * it, then every further restriction is intersected on top, so the result is the slowest limit
 * that actually applies.
 *
 * hasMultiModule is for a selection spanning several modules: one input writes one value to all of
 * them, so the range narrows to what every selected layer can honour. UV print layers are the
 * exception — speed means nothing to them, so they never drag the ceiling down, and a selection of
 * nothing but UV print layers falls back to the machine's own range.
 *
 * curveSpeedLimit is opt-in because it describes the state of the canvas rather than the layer:
 * only the speed input passes it, which is how it has always behaved. Applying it to presets and
 * to postPresetChange would change every curve-engraving model, so it is left alone here.
 */
export const getSpeedLimit = (
  module: LayerModuleType,
  workarea: WorkAreaModel,
  { hasCurveEngraving = false, hasMultiModule = false }: { hasCurveEngraving?: boolean; hasMultiModule?: boolean } = {},
): { max: number; min: number } => {
  const selected = hasMultiModule
    ? layerManager
        .getSelectedLayers()
        .map(getModuleOfLayer)
        .filter((value): value is LayerModuleType => value !== undefined)
    : [];
  const modules = selected.length > 0 ? selected : [module];
  const { max, min } = modules.reduce(
    (acc, current) => {
      const limit = getModuleSpeedLimit(current, workarea, hasCurveEngraving);

      return { max: Math.min(acc.max, limit.max), min: Math.max(acc.min, limit.min) };
    },
    { max: Number.POSITIVE_INFINITY, min: 0 },
  );

  if (Number.isFinite(max)) return { max, min };

  // nothing in the selection constrains the speed
  const { maxSpeed, minSpeed } = getWorkarea(workarea);

  return { max: maxSpeed, min: minSpeed };
};
