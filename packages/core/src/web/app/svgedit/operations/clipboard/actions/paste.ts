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
let svgEdit: any;

getSVGAsync(({ Canvas, Edit }) => {
  svgCanvas = Canvas;
  svgEdit = Edit;
});

export const pasteElements = async ({
  isSubCmd = false,
  selectElement = true,
  type,
  x,
  y,
}: {
  isSubCmd?: boolean;
  selectElement?: boolean;
  type: 'coordinate' | 'inPlace' | 'mouse';
  x?: number;
  y?: number;
}): Promise<null | { cmd: IBatchCommand; elems: Element[] }> => {
  const clipboard = await clipboardCore.getData();

  if (!clipboard?.length) return null;

  const pasted = Array.of<SVGGElement>();
  const batchCmd = new history.BatchCommand('Paste elements');
  const drawing = svgCanvas.getCurrentDrawing();

  for (const elem of clipboard) {
    if (!elem) continue;

    const copy = drawing.copyElem(elem) as SVGGElement;

    if (!svgedit.utilities.getElem(elem.id)) {
      copy.id = elem.id;
    }

    console.log('Copying element:', elem, 'to:', copy);

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

    await promise;
    updateElementColor(copy);
  }

  if (selectElement) svgCanvas.selectOnly(pasted, true);

  // Unified positioning logic
  let dx: number | undefined;
  let dy: number | undefined;

  if (type === 'inPlace' && (x !== undefined || y !== undefined)) {
    // Paste in place with an offset
    dx = x;
    dy = y;
  } else if (type === 'mouse' || type === 'coordinate') {
    // Paste at a specific point (mouse or coordinate)
    let ctrX = 0;
    let ctrY = 0;

    if (type === 'mouse') {
      const lastClickPoint = (svgCanvas as any).getLastClickPoint();

      ctrX = lastClickPoint.x;
      ctrY = lastClickPoint.y;
    } else {
      ctrX = x!;
      ctrY = y!;
    }

    const bbox = svgCanvas.getStrokedBBox(pasted);

    dx = ctrX - (bbox.x + bbox.width / 2);
    dy = ctrY - (bbox.y + bbox.height / 2);
  }

  // Apply the move command if an offset is calculated
  if (dx !== undefined && dy !== undefined) {
    const dxArr = Array(pasted.length).fill(dx);
    const dyArr = Array(pasted.length).fill(dy);
    const cmd = moveElements(dxArr, dyArr, pasted, false, true);

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

/**
 * @deprecated Use pasteWithOffset or pasteElements({ type: 'coordinate', ... }) instead.
 */
export const pasteInCenter = async (): Promise<null | { cmd: IBatchCommand; elems: Element[] }> => {
  const zoom = workareaManager.zoomRatio;
  const workarea = document.getElementById('workarea')!;
  const x = (workarea.scrollLeft + workarea.clientWidth / 2) / zoom - workareaManager.width;
  const y = (workarea.scrollTop + workarea.clientHeight / 2) / zoom - workareaManager.height;

  return pasteElements({ type: 'coordinate', x, y });
};

/**
 * Pastes elements to the current drawing with a default offset with 100 100 pixels.
 * Or pastes in place if the first element from clipboard is not present.
 * @param x - The horizontal offset. Defaults to 100.
 * @param y - The vertical offset. Defaults to 100.
 */
export const pasteWithDefaultPosition = async (
  x = 100,
  y = 100,
): Promise<null | { cmd: IBatchCommand; elems: Element[] }> => {
  return pasteElements({ type: 'inPlace', x, y });
};
