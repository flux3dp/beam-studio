import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import useLayerStore from '@core/app/stores/layer/layerStore';
import { getObjectLayer } from '@core/helpers/layer/layer-helper';

export interface ObjectLayerState {
  color: string;
  isLocked: boolean;
  isVisible: boolean;
}

/** Resolve the DOM-backed layer properties that affect a 3D object. */
export const getObjectLayerState = (id: string, useLayerColorPreference: boolean): ObjectLayerState => {
  const elem = document.getElementById(id);
  const layer = elem ? getObjectLayer(elem as unknown as SVGElement)?.elem : null;

  return {
    color: useLayerColorPreference ? (layer?.getAttribute('data-color') ?? '#000') : '#000',
    isLocked: layer?.getAttribute('data-lock') === 'true',
    // An object without a projection in a real layer is broken/transient and must not remain an
    // interactive ghost on the 3D canvas.
    isVisible: Boolean(layer) && layer?.getAttribute('display') !== 'none',
  };
};

/**
 * The colour an STL object should be drawn in, resolved the same way `updateElementColor` resolves
 * it for 2D elements: the owning layer's colour, or black when layer colours are turned off.
 *
 * Reads through to the projection rect in the DOM, so subscribing to the layer store is what makes
 * this re-run when layers change.
 */
export const useObjectLayerState = (id: string): ObjectLayerState => {
  const useLayerColorPreference = useGlobalPreferenceStore((state) => state.use_layer_color);

  // not read directly: subscribing re-renders the caller when layers are added, reordered or recoloured
  useLayerStore();

  return getObjectLayerState(id, useLayerColorPreference);
};

export const useLayerColor = (id: string): string => useObjectLayerState(id).color;

export default useLayerColor;
