import updateElementColor from '@core/helpers/color/updateElementColor';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import history from '../history/history';
import layerManager from '../layer/layerManager';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

// TODO add unit tests
export const ungroupElement = (elem: Element): null | { batchCmd: IBatchCommand; children: Element[] } => {
  if (elem?.getAttribute('data-pass-through') || elem?.getAttribute('data-textpath-g')) return null;

  if (elem.tagName === 'g' || elem.tagName === 'a') {
    const batchCmd = new history.BatchCommand('Ungroup Elements');
    const cmd = svgCanvas.pushGroupProperties(elem as SVGGElement, true);

    if (cmd && !cmd.isEmpty()) {
      batchCmd.addSubCommand(cmd);
    }

    const parent = elem.parentNode!;
    const anchor = elem.nextSibling;
    const children = [];

    console.log(`Ungrouped ${elem.childNodes.length} nodes`);
    while (elem.firstChild) {
      let child = elem.firstChild as Element;
      const oldNextSibling = child.nextSibling;
      const oldParent = child.parentNode!;

      if (child.getAttribute('data-imageborder') === 'true') {
        child.remove();

        continue;
      }

      // Remove child title elements
      if (child.tagName === 'title') {
        const { nextSibling } = child;

        batchCmd.addSubCommand(new history.RemoveElementCommand(child, nextSibling, oldParent));
        oldParent.removeChild(child);

        continue;
      }

      const originalLayer = layerManager.getLayerByName(child.getAttribute('data-original-layer')!);

      if (originalLayer) {
        originalLayer.appendChildren([child as SVGElement]);
        updateElementColor(child);
      } else {
        child = parent.insertBefore(child, anchor);
      }

      children.push(child);
      batchCmd.addSubCommand(new history.MoveElementCommand(child, oldNextSibling, oldParent));
    }

    // delete the group element (but make undo-able)
    const gNextSibling = elem.nextSibling;
    const newElem = parent.removeChild(elem);

    batchCmd.addSubCommand(new history.RemoveElementCommand(newElem, gNextSibling, parent));

    return { batchCmd, children };
  }

  return null;
};

export default ungroupElement;
