import updateLayerColor from '@core/helpers/color/updateLayerColor';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { getData, writeDataLayer } from '../layer-config-helper';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

export const setLayerFullColor = (layer: Element, value: boolean): IBatchCommand => {
  const prev = getData(layer, 'fullcolor') ?? false;

  if (getData(layer, 'split')) return null as any;

  console.log(`Toggle Full Color Layer ${layer} from ${prev} to ${value}`);

  console.log(getData(layer, 'fullcolor'));
  console.log(getData(layer, 'uv-export'));

  if (value === prev) return null as any;

  svgCanvas.undoMgr.beginUndoableChange('data-fullcolor', [layer]);
  writeDataLayer(layer, 'fullcolor', value);

  const cmd = svgCanvas.undoMgr.finishUndoableChange();

  updateLayerColor(layer as SVGGElement);
  cmd.onAfter = () => updateLayerColor(layer as SVGGElement) as any;

  return cmd;
};
