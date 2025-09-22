import { pipe } from 'remeda';

import { useConfigPanelStore } from '@core/app/stores/configPanel';
import layerManager from '@core/app/svgedit/layer/layerManager';
import { getLayerConfig, getLayersConfig } from '@core/helpers/layer/layer-config-helper';

import LayerPanelController from '../contexts/LayerPanelController';

export const initState = (layers: string[] = LayerPanelController.getSelectedLayers()) => {
  if (layers.length === 0) layers = [layerManager.getCurrentLayerName()!];

  const { update } = useConfigPanelStore.getState();

  if (layers.length === 1) {
    pipe(getLayerConfig(layers[0])!, (payload) => update(payload));

    return;
  }

  pipe(
    layerManager.getCurrentLayerName(),
    (currentLayerName) => getLayersConfig(layers, currentLayerName!),
    (payload) => update(payload),
  );
};

export default initState;
