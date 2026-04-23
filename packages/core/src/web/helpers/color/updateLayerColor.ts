import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import selectionManager from '@core/app/svgedit/selection';
import { getLayerName } from '@core/helpers/layer/layer-helper';

import setElementsColor from './setElementsColor';
import updateLayerColorFilter from './updateLayerColorFilter';

// TODO: add test
const updateLayerColor = async (layer: SVGGElement): Promise<void> => {
  const useLayerColor = useGlobalPreferenceStore.getState().use_layer_color;
  const color = (useLayerColor ? layer.getAttribute('data-color') : '#000') ?? '#000';
  const isFullColor = layer.getAttribute('data-fullcolor') === '1';
  const elems = Array.from(layer.childNodes);

  if (selectionManager.isMultiSelecting) {
    const layerName = getLayerName(layer);
    const multiSelectedElems = selectionManager.getElementsFromTempGroupByLayer(layerName);

    elems.push(...multiSelectedElems);
  }

  await setElementsColor(elems as Element[], color, isFullColor);
  updateLayerColorFilter(layer);
};

export default updateLayerColor;
