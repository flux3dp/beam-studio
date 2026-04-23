import history from '@core/app/svgedit/history/history';
import HistoryCommandFactory from '@core/app/svgedit/history/HistoryCommandFactory';
import undoManager from '@core/app/svgedit/history/undoManager';
import layerManager from '@core/app/svgedit/layer/layerManager';
import selectionManager from '@core/app/svgedit/selection';
import updateElementColor from '@core/helpers/color/updateElementColor';
import type { IBatchCommand } from '@core/interfaces/IHistory';

const moveElementsToLayer = (layerName: string, elements: SVGElement[]): IBatchCommand | null => {
  const layer = layerManager.getLayerByName(layerName);

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
    const oldParent = element.parentNode!;

    layer.appendChildren([element]);
    updateElementColor(element);
    batchCmd.addSubCommand(new history.MoveElementCommand(element, oldNextSibling, oldParent));
  });

  return batchCmd;
};

export const moveSelectedToLayer = (layerName: string): void => {
  const selectedElements = selectionManager.getSelectedElements(true);
  const batchCmd = moveElementsToLayer(layerName, selectedElements);

  if (batchCmd && !batchCmd.isEmpty()) {
    undoManager.addCommandToHistory(batchCmd);
  }

  selectionManager.multiSelect(selectedElements);
};

export default moveElementsToLayer;
