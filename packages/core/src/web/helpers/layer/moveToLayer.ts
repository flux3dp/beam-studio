import history from '@core/app/svgedit/history/history';
import HistoryCommandFactory from '@core/app/svgedit/history/HistoryCommandFactory';
import updateElementColor from '@core/helpers/color/updateElementColor';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const moveElementsToLayer = (layerName: string, elements: SVGElement[]): IBatchCommand | null => {
  const drawing = svgCanvas.getCurrentDrawing();
  const layer = drawing.getLayerByName(layerName);

  if (!layer) {
    return null;
  }

  const batchCmd = HistoryCommandFactory.createBatchCommand('Move Elements to Layer');

  elements.forEach((element) => {
    if (!element) {
      return;
    }

    const descendants = [element, ...element.querySelectorAll('*')] as Element[];

    descendants.forEach((descendant) => {
      descendant.removeAttribute('data-original-layer');
    });

    const oldNextSibling = element.nextSibling;
    const oldParent = element.parentNode;

    layer.appendChild(element);
    updateElementColor(element);
    batchCmd.addSubCommand(new history.MoveElementCommand(element, oldNextSibling, oldParent));
  });

  return batchCmd;
};

export const moveSelectedToLayer = (layerName: string): void => {
  if (svgCanvas.getTempGroup()) {
    const children = svgCanvas.ungroupTempGroup();

    svgCanvas.selectOnly(children, false);
  }

  const selectedElements = svgCanvas.getSelectedElems();
  const batchCmd = moveElementsToLayer(layerName, selectedElements);

  if (batchCmd && !batchCmd.isEmpty()) {
    svgCanvas.addCommandToHistory(batchCmd);
  }

  svgCanvas.tempGroupSelectedElements();
};

export default moveElementsToLayer;
