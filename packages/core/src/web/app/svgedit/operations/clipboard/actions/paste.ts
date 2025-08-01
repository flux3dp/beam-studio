import history from '@core/app/svgedit/history/history';
import { moveElements } from '@core/app/svgedit/operations/move';
import selector from '@core/app/svgedit/selector';
import workareaManager from '@core/app/svgedit/workarea';
import updateElementColor from '@core/helpers/color/updateElementColor';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import undoManager from '../../../history/undoManager';
import { handlePastedRef } from '../helpers/paste';
import { clipboardCore } from '../singleton';

const { svgedit } = window;

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

export const pasteElements = async (args: {
  isSubCmd?: boolean;
  selectElement?: boolean;
  type: 'in_place' | 'mouse' | 'point';
  x?: number;
  y?: number;
}): Promise<null | { cmd: IBatchCommand; elems: Element[] }> => {
  const { isSubCmd = false, selectElement = true, type, x, y } = args || {};
  const clipboard = await clipboardCore.getData();

  if (!clipboard?.length) {
    return null;
  }

  const pasted = [];
  const batchCmd = new history.BatchCommand('Paste elements');
  const drawing = svgCanvas.getCurrentDrawing();

  // Move elements to lastClickPoint
  for (const elem of clipboard) {
    if (!elem) continue;

    const copy = drawing.copyElem(elem) as SVGGElement;

    // See if elem with elem ID is in the DOM already
    if (!svgedit.utilities.getElem(elem.id)) {
      copy.id = elem.id;
    }

    pasted.push(copy);

    if (copy.getAttribute('data-origin-layer') && clipboard.length > 1) {
      const layer = drawing.getLayerByName(copy.getAttribute('data-origin-layer')!) || drawing.getCurrentLayer();

      layer!.appendChild(copy);
    } else {
      drawing.getCurrentLayer()!.appendChild(copy);
    }

    const promise = handlePastedRef(copy);

    batchCmd.addSubCommand(new history.InsertElementCommand(copy));
    (svgCanvas as any).restoreRefElems(copy);
    promise.then(() => {
      updateElementColor(copy);
    });
  }

  if (selectElement) svgCanvas.selectOnly(pasted as SVGGElement[], true);

  if (type !== 'in_place') {
    let ctrX: number = 0;
    let ctrY: number = 0;

    if (type === 'mouse') {
      const lastClickPoint = (svgCanvas as any).getLastClickPoint();

      ctrX = lastClickPoint.x;
      ctrY = lastClickPoint.y;
    } else if (type === 'point') {
      ctrX = x!;
      ctrY = y!;
    }

    const bbox = svgCanvas.getStrokedBBox(pasted);
    const cx = ctrX - (bbox.x + bbox.width / 2);
    const cy = ctrY - (bbox.y + bbox.height / 2);
    const dx: number[] = [];
    const dy: number[] = [];

    pasted.forEach(() => {
      dx.push(cx);
      dy.push(cy);
    });

    const cmd = moveElements(dx, dy, pasted, false, true);

    batchCmd.addSubCommand(cmd);
  }

  if (!isSubCmd) {
    undoManager.addCommandToHistory(batchCmd);
    svgCanvas.call('changed', pasted);
  }

  if (selectElement) {
    if (pasted.length === 1) {
      const selectorManager = selector.getSelectorManager();

      selectorManager.requestSelector(pasted[0]).resize();
    } else {
      svgCanvas.tempGroupSelectedElements();
    }
  }

  return { cmd: batchCmd, elems: pasted };
};

export const pasteInCenter = async (): Promise<null | { cmd: IBatchCommand; elems: Element[] }> => {
  const zoom = workareaManager.zoomRatio;
  const workarea = document.getElementById('workarea')!;
  const x = (workarea.scrollLeft + workarea.clientWidth / 2) / zoom - workareaManager.width;
  const y = (workarea.scrollTop + workarea.clientHeight / 2) / zoom - workareaManager.height;

  return pasteElements({ type: 'point', x, y });
};
