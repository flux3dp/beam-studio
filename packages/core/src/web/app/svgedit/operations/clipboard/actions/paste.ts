import history from '@core/app/svgedit/history/history';
import layerManager from '@core/app/svgedit/layer/layerManager';
import { moveElements } from '@core/app/svgedit/operations/move';
import selector from '@core/app/svgedit/selector';
import { getBBoxFromElements } from '@core/app/svgedit/utils/getBBox';
import updateElementColor from '@core/helpers/color/updateElementColor';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import undoManager from '../../../history/undoManager';
import { handlePastedRef } from '../helpers/paste';
import { clipboardCore } from '../singleton';
import { updateSignatureClipboardCommand, useClipboardStore } from '../useClipboardStore';

const { svgedit } = window;

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

let dataCache: Element[] | null = null;

export const clearCache = () => {
  dataCache = null;
};

export const pasteElements = async ({
  isSubCmd = false,
  selectElement = true,
  type,
  useCache = false,
  x,
  y,
}: {
  isSubCmd?: boolean;
  selectElement?: boolean;
  type: 'coordinate' | 'inPlace' | 'mouse';
  /**
   * For array, use cached clipboard data to avoid multiple reads
   */
  useCache?: boolean;
  x?: number;
  y?: number;
}): Promise<null | { cmd: IBatchCommand; elems: Element[] }> => {
  const clipboard = useCache && dataCache ? dataCache : await clipboardCore.getData();

  if (!clipboard?.length) {
    return null;
  }

  if (!useCache || !dataCache) dataCache = clipboard;

  const pasted = Array.of<SVGGElement>();
  const batchCmd = new history.BatchCommand('Paste elements');
  const drawing = svgCanvas.getCurrentDrawing();

  for (const elem of clipboard) {
    if (!elem) continue;

    const copy = drawing.copyElem(elem) as SVGGElement;

    if (!svgedit.utilities.getElem(elem.id)) {
      copy.id = elem.id;
    }

    pasted.push(copy);

    let targetLayer = layerManager.getCurrentLayer()!;

    if (copy.getAttribute('data-origin-layer') && clipboard.length > 1) {
      const layer = layerManager.getLayerByName(copy.getAttribute('data-origin-layer')!);

      if (layer) targetLayer = layer;
    }

    targetLayer.appendChildren([copy]);

    const promise = handlePastedRef(copy);

    batchCmd.addSubCommand(new history.InsertElementCommand(copy));
    (svgCanvas as any).restoreRefElems(copy);
    promise.then(() => {
      updateElementColor(copy);
    });
  }

  if (selectElement) svgCanvas.selectOnly(pasted, true);

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

    const bbox = getBBoxFromElements(pasted, { ignoreRotation: false, withStroke: true });

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

      selectorManager.requestSelector(pasted[0])?.resize();
    } else {
      svgCanvas.tempGroupSelectedElements();
    }
  }

  return { cmd: batchCmd, elems: pasted };
};

/**
 * Pastes elements from the clipboard.
 * - If pasting the same content consecutively, applies an incremental offset.
 * - If pasting new content, resets the offset.
 * - If pasting from another tab, pastes in place without an offset.
 * @param x - The horizontal offset. Defaults to 100.
 * @param y - The vertical offset. Defaults to 100.
 */
export const pasteWithDefaultPosition = async (
  x = 100,
  y = 100,
): Promise<null | { cmd: IBatchCommand; elems: Element[] }> => {
  const batchCommand = new history.BatchCommand('Paste elements with default position');
  const rawData = await clipboardCore.getRawData();

  if (!rawData) {
    return null;
  }

  const dataId = rawData.id;

  if (!dataId) {
    return null;
  }

  const updateSignatureCommand = new updateSignatureClipboardCommand(dataId);

  useClipboardStore.getState().updateSignature(dataId);

  const consecutivePasteCounter = useClipboardStore.getState().counter;
  const offsetX = x * consecutivePasteCounter;
  const offsetY = y * consecutivePasteCounter;
  const pasteCommand = await pasteElements({ isSubCmd: true, type: 'inPlace', x: offsetX, y: offsetY });

  batchCommand.addSubCommand(updateSignatureCommand);
  batchCommand.addSubCommand(pasteCommand?.cmd!);

  undoManager.addCommandToHistory(batchCommand);
  svgCanvas.call('changed', pasteCommand?.elems!);

  return { cmd: batchCommand, elems: pasteCommand?.elems! };
};
