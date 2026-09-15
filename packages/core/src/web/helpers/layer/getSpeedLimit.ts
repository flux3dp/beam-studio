import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { galvoModules, LayerModule } from '@core/app/constants/layer-module/layer-modules';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';

/**
 * Traverse speed of a galvo module head, in mm/s.
 *
 * A galvo steers the beam with mirrors instead of moving the gantry, so the machine's own maxSpeed
 * does not apply to it. TODO: provisional, mirrors the Promark ceiling; confirm against hardware.
 */
export const GALVO_MAX_SPEED = 10000;

/**
 * Speed range of a layer, in mm/s.
 *
 * The workarea sets the baseline. A module head that moves independently of the gantry replaces
 * it, then every further restriction is intersected on top, so the result is the slowest limit
 * that actually applies to this layer.
 *
 * curveSpeedLimit is opt-in because it describes the state of the canvas rather than the layer:
 * only the speed input passes it, which is how it has always behaved. Applying it to presets and
 * to postPresetChange would change every curve-engraving model, so it is left alone here.
 */
export const getSpeedLimit = (
  module: LayerModuleType,
  workarea: WorkAreaModel,
  { hasCurveEngraving = false }: { hasCurveEngraving?: boolean } = {},
): { max: number; min: number } => {
  const { curveSpeedLimit, maxSpeed, minSpeed } = getWorkarea(workarea);
  let max = galvoModules.has(module) ? GALVO_MAX_SPEED : maxSpeed;

  if (hasCurveEngraving && curveSpeedLimit?.x !== undefined) max = Math.min(max, curveSpeedLimit.x);

  if (module === LayerModule.PRINTER_4C) max = Math.min(max, 45);
  else if (module === LayerModule.LASER_1064 && workarea === 'fbm2') max = Math.min(max, 150);

  return { max, min: minSpeed };
};

/**
 * Speed range shared by a selection of layers: the narrowest range every layer can honour.
 *
 * Selecting a CO2 layer together with a galvo layer has to fall back to the CO2 ceiling, because
 * one slider writes one value to all of them.
 */
export const getSelectionSpeedLimit = (
  modules: LayerModuleType[],
  workarea: WorkAreaModel,
  opts?: { hasCurveEngraving?: boolean },
): { max: number; min: number } =>
  modules.reduce(
    (acc, module) => {
      const { max, min } = getSpeedLimit(module, workarea, opts);

      return { max: Math.min(acc.max, max), min: Math.max(acc.min, min) };
    },
    { max: Number.POSITIVE_INFINITY, min: 0 },
  );
