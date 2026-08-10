import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import useLayerStore from '@core/app/stores/layer/layerStore';
import { getObjectLayer } from '@core/helpers/layer/layer-helper';

/**
 * The colour an STL object should be drawn in, resolved the same way `updateElementColor` resolves
 * it for 2D elements: the owning layer's colour, or black when layer colours are turned off.
 *
 * Reads through to the projection rect in the DOM, so subscribing to the layer store is what makes
 * this re-run when layers change.
 */
export const useLayerColor = (id: string): string => {
  const useLayerColorPreference = useGlobalPreferenceStore((state) => state.use_layer_color);

  // not read directly: subscribing re-renders the caller when layers are added, reordered or recoloured
  useLayerStore();

  if (!useLayerColorPreference) return '#000';

  const elem = document.getElementById(id);
  const layer = elem ? getObjectLayer(elem as unknown as SVGElement)?.elem : null;

  return layer?.getAttribute('data-color') ?? '#000';
};

export default useLayerColor;
