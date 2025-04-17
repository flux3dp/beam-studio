import { pipe } from 'remeda';

import { useConfigPanelStore } from '@core/app/stores/configPanel';
import { getLayerConfig, getLayersConfig } from '@core/helpers/layer/layer-config-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import LayerPanelController from '../contexts/LayerPanelController';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

export const initState = (layers: string[] = LayerPanelController.getSelectedLayers()) => {
  if (layers.length === 0) layers = [svgCanvas.getCurrentDrawing().getCurrentLayerName()!];

  const { update } = useConfigPanelStore.getState();

  if (layers.length === 1) {
    pipe(getLayerConfig(layers[0])!, (payload) => update(payload));

    return;
  }

  pipe(
    svgCanvas.getCurrentDrawing(),
    (drawing) => drawing.getCurrentLayerName(),
    (currentLayerName) => getLayersConfig(layers, currentLayerName!),
    (payload) => update(payload),
  );
};

export default initState;
