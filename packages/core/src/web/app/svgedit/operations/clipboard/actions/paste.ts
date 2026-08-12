import type { StlObject } from '@core/app/stores/stlStore';
import history from '@core/app/svgedit/history/history';
import layerManager from '@core/app/svgedit/layer/layerManager';
import { moveElements } from '@core/app/svgedit/operations/move';
import selectionManager from '@core/app/svgedit/selection';
import selector from '@core/app/svgedit/selector';
import { createPastedStlObject } from '@core/app/svgedit/stl/clipboard';
import { isStlProjection } from '@core/app/svgedit/stl/getters';
import { syncStlObjectsWithDom } from '@core/app/svgedit/stl/sync';
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
  // the projection rects among `pasted`, paired with the object they were copied from: their mesh
  // has to be rebuilt once the paste offset is known
  const pastedStl = Array.of<{ copy: SVGRectElement; source: StlObject }>();
  const batchCmd = new history.BatchCommand('Paste elements');
  const drawing = svgCanvas.getCurrentDrawing();

  for (const elem of clipboard) {
    if (!elem) continue;

    const stlSource = isStlProjection(elem) ? clipboardCore.getStlFromClipboard(elem.id) : undefined;

    if (isStlProjection(elem) && !stlSource) {
      // no mesh to attach — copied in another tab, which cannot carry one. A rect on its own is a
      // broken STL object (invisible in 3D, and it would fail to export), so it is not pasted.
      console.error(`No mesh available for STL projection rect ${elem.id}, it is not pasted`);
      continue;
    }

    const copy = drawing.copyElem(elem) as SVGGElement;

    if (!svgedit.utilities.getElem(elem.id)) {
      copy.id = elem.id;
    }

    pasted.push(copy);

    if (stlSource) pastedStl.push({ copy: copy as unknown as SVGRectElement, source: stlSource });

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

  if (selectElement) selectionManager.selectOnly(pasted, true);

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

  // after the move, so the offset the rects actually received is what gets routed into the 3D
  // transforms. The mesh is not in the DOM and no element command can carry it, so undo and redo
  // put it back through `onAfter` (see `stl/sync.ts`).
  if (pastedStl.length) {
    const objects = pastedStl.map(({ copy, source }) => createPastedStlObject(copy, source));

    syncStlObjectsWithDom(objects);
    batchCmd.onAfter = () => syncStlObjectsWithDom(objects);
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
      selectionManager.tempGroupSelectedElements();
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
