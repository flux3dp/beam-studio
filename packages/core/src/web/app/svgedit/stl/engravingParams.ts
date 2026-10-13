import type { EngravingMode } from '@core/app/constants/innerEngraving';
import { DEFAULT_LAYER_SPACING, DEFAULT_POINT_SPACING } from '@core/app/constants/innerEngraving';
import { getData } from '@core/helpers/layer/layer-config-helper';
import { getObjectLayer } from '@core/helpers/layer/layer-helper';

/**
 * The engraving parameters that apply to a 3D object: those of the layer it sits in.
 *
 * They are layer parameters (data-stl-* on the layer group, see `innerEngravingConfigKeys`) because
 * the dot / line choice decides which laser parameters fit, and Swiftray reads them off the layer.
 */
export interface StlEngravingParams {
  layerSpacing: number;
  /** `null` keeps fixed spacing; a positive value enables adaptive slicing in line mode. */
  minLayerSpacing: null | number;
  mode: EngravingMode;
  pointSpacing: number;
  solid: boolean;
}

const positiveOr = (value: number | undefined, fallback: number): number =>
  value !== undefined && Number.isFinite(value) && value > 0 ? value : fallback;

export const getStlEngravingParams = (elem: Element): StlEngravingParams => {
  const layer = getObjectLayer(elem as SVGElement)?.elem ?? null;
  const minLayerSpacing = getData(layer, 'stlMinLayerSpacing');

  return {
    layerSpacing: positiveOr(getData(layer, 'stlLayerSpacing'), DEFAULT_LAYER_SPACING),
    minLayerSpacing: minLayerSpacing !== undefined && minLayerSpacing > 0 ? minLayerSpacing : null,
    mode: getData(layer, 'stlMode') === 'line' ? 'line' : 'dot',
    pointSpacing: positiveOr(getData(layer, 'stlPointSpacing'), DEFAULT_POINT_SPACING),
    solid: Boolean(getData(layer, 'stlSolid')),
  };
};
