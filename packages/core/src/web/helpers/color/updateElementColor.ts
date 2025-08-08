import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import setElementsColor from '@core/helpers/color/setElementsColor';
import { getObjectLayer } from '@core/helpers/layer/layer-helper';

// TODO: add test
const updateElementColor = (elem: Element): void => {
  const layer = getObjectLayer(elem as SVGElement)?.elem;
  const isFullColor = layer?.getAttribute('data-fullcolor') === '1';
  const color = useGlobalPreferenceStore.getState().use_layer_color ? layer?.getAttribute('data-color') : '#000';

  setElementsColor([elem], color!, isFullColor);
};

export default updateElementColor;
