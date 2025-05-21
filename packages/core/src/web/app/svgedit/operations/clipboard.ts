import history from '@core/app/svgedit/history/history';
import { deleteElements } from '@core/app/svgedit/operations/delete';
import { moveElements } from '@core/app/svgedit/operations/move';
import selector from '@core/app/svgedit/selector';
import findDefs from '@core/app/svgedit/utils/findDef';
import workareaManager from '@core/app/svgedit/workarea';
import updateElementColor from '@core/helpers/color/updateElementColor';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import symbolMaker from '@core/helpers/symbol-helper/symbolMaker';
import type { ClipboardCore } from '@core/interfaces/Clipboard';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import undoManager from '../history/undoManager';

import MemoryClipboard from './clipboard/MemoryClipboard';
import NativeClipboard, { checkNativeClipboardSupport } from './clipboard/NativeClipboard';
import { updateSymbolStyle } from './clipboard/utils';

// TODO: decouple with svgcanvas
const { svgedit } = window;

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

let clipboardCore: ClipboardCore = new MemoryClipboard();

checkNativeClipboardSupport().then((res) => {
  console.log('checkNativeClipboardSupport', res);

  if (res) clipboardCore = new NativeClipboard();
});

export const hasClipboardData = async (): Promise<boolean> => {
  return clipboardCore.hasData();
};

const copyElements = async (elems: Element[]): Promise<void> => {
  await clipboardCore.copyElements(elems);
};

const copySelectedElements = async (): Promise<void> => {
  const selectedElems = svgCanvas.getSelectedWithoutTempGroup();

  await copyElements(selectedElems);
  svgCanvas.tempGroupSelectedElements();
};

const cutElements = async (elems: Element[]): Promise<void> => {
  const batchCmd = new history.BatchCommand('Cut Elements');

  await copyElements(elems);

  const cmd = deleteElements(elems, true);

  if (cmd && !cmd.isEmpty()) {
    batchCmd.addSubCommand(cmd);
    undoManager.addCommandToHistory(batchCmd);
  }
};

const cutSelectedElements = async (): Promise<void> => {
  const selectedElems = svgCanvas.getSelectedWithoutTempGroup();

  await cutElements(selectedElems);
};

const pasteRef = async (
  useElement: SVGUseElement,
  opts?: {
    addToHistory?: boolean;
    parentCmd?: IBatchCommand;
  },
): Promise<void> => {
  const { addToHistory = true, parentCmd } = opts || {};
  const batchCmd = new history.BatchCommand('Paste Ref');
  const drawing = svgCanvas.getCurrentDrawing();
  const symbolId = svgedit.utilities.getHref(useElement);
  const refElement = clipboardCore.getRefFromClipboard(symbolId)!;
  const copiedRef = refElement.cloneNode(true) as SVGSymbolElement;

  copiedRef.id = drawing.getNextId();
  copiedRef.setAttribute('data-image-symbol', `${copiedRef.id}_image`);
  updateSymbolStyle(copiedRef, refElement.id);

  const defs = findDefs();

  defs.appendChild(copiedRef);
  batchCmd.addSubCommand(new history.InsertElementCommand(copiedRef));
  svgedit.utilities.setHref(useElement, `#${copiedRef.id}`);

  const imageSymbol = symbolMaker.createImageSymbol(copiedRef);

  batchCmd.addSubCommand(new history.InsertElementCommand(imageSymbol));

  if (parentCmd) {
    parentCmd.addSubCommand(batchCmd);
  } else if (addToHistory) {
    undoManager.addCommandToHistory(batchCmd);
  }

  await symbolMaker.reRenderImageSymbol(useElement);
  updateElementColor(useElement);
};

export const handlePastedRef = async (copy: Element, opts: { parentCmd?: IBatchCommand } = {}): Promise<void> => {
  const promises = Array.of<Promise<void>>();
  const uses = Array.from(copy.querySelectorAll('use'));

  if (copy.tagName === 'use') {
    uses.push(copy as SVGUseElement);
  }

  uses.forEach((use: SVGUseElement) => {
    clipboardCore.addRefToClipboard(use);
    promises.push(pasteRef(use, { parentCmd: opts?.parentCmd }));
  });

  const passThroughObjects = Array.from(copy.querySelectorAll('[data-pass-through]'));

  if (copy.getAttribute('data-pass-through')) passThroughObjects.push(copy);

  passThroughObjects.forEach((element: SVGGElement) => {
    const clipPath = element.querySelector(':scope > clipPath');

    if (clipPath) {
      element.childNodes.forEach((child: SVGGraphicsElement) => {
        if (child.getAttribute('clip-path')?.startsWith('url')) {
          child.setAttribute('clip-path', `url(#${clipPath.id})`);
        }
      });
    }
  });

  const textPathGroups = Array.from(copy.querySelectorAll('[data-textpath-g="1"]'));

  if (copy.getAttribute('data-textpath-g') === '1') textPathGroups.push(copy);

  textPathGroups.forEach((element: SVGGElement) => {
    const newTextPath = element.querySelector('textPath');
    const newPath = element.querySelector('path');

    newTextPath?.setAttribute('href', `#${newPath?.id}`);
  });

  await Promise.allSettled(promises);
};

const pasteElements = async (args: {
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
  for (let i = 0; i < clipboard.length; i += 1) {
    const elem = clipboard[i];

    if (!elem) {
      continue;
    }

    const copy = drawing.copyElem(elem);

    // See if elem with elem ID is in the DOM already
    if (!svgedit.utilities.getElem(elem.id)) {
      copy.id = elem.id;
    }

    pasted.push(copy);

    if (copy.getAttribute('data-origin-layer') && clipboard.length > 1) {
      const layer = drawing.getLayerByName(copy.getAttribute('data-origin-layer')) || drawing.getCurrentLayer();

      layer.appendChild(copy);
    } else {
      drawing.getCurrentLayer().appendChild(copy);
    }

    const promise = handlePastedRef(copy);

    batchCmd.addSubCommand(new history.InsertElementCommand(copy));
    svgCanvas.restoreRefElems(copy);
    promise.then(() => {
      updateElementColor(copy);
    });
  }

  if (selectElement) svgCanvas.selectOnly(pasted, true);

  if (type !== 'in_place') {
    let ctrX: number;
    let ctrY: number;

    if (type === 'mouse') {
      const lastClickPoint = svgCanvas.getLastClickPoint();

      ctrX = lastClickPoint.x;
      ctrY = lastClickPoint.y;
    } else if (type === 'point') {
      ctrX = x;
      ctrY = y;
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

/**
 * Create deep DOM copies (clones) of all selected elements
 * @param dx dx of the cloned elements
 * @param dy dy of the cloned elements
 */
const cloneElements = async (
  elements: Element[],
  dx: number | number[],
  dy: number | number[],
  opts: {
    addToHistory?: boolean;
    callChangOnMove?: boolean;
    parentCmd?: IBatchCommand;
    selectElement?: boolean;
  } = {
    addToHistory: true,
    callChangOnMove: true,
    selectElement: true,
  },
): Promise<null | { cmd: IBatchCommand; elems: Element[] }> => {
  const { addToHistory = true, callChangOnMove = true, parentCmd, selectElement = true } = opts;
  const batchCmd = new history.BatchCommand('Clone elements');

  await copyElements(elements);

  const pasteRes = await pasteElements({
    isSubCmd: true,
    selectElement,
    type: 'in_place',
  });

  if (!pasteRes) return null;

  const { elems } = pasteRes;
  let { cmd } = pasteRes;

  if (cmd && !cmd.isEmpty()) {
    batchCmd.addSubCommand(cmd);
  }

  cmd = moveElements(dx, dy, elems, false, !callChangOnMove);

  if (cmd && !cmd.isEmpty()) {
    batchCmd.addSubCommand(cmd);
  }

  if (!batchCmd.isEmpty()) {
    if (parentCmd) parentCmd.addSubCommand(batchCmd);
    else if (addToHistory) undoManager.addCommandToHistory(batchCmd);
  }

  return { cmd: batchCmd, elems };
};

/**
 * Create deep DOM copies (clones) of all selected elements
 * @param dx dx of the cloned elements
 * @param dy dy of the cloned elements
 */
const cloneSelectedElements = async (
  dx: number | number[],
  dy: number | number[],
  opts: {
    addToHistory?: boolean;
    callChangOnMove?: boolean;
    parentCmd?: IBatchCommand;
    selectElement?: boolean;
  } = {
    addToHistory: true,
    callChangOnMove: true,
    selectElement: true,
  },
): Promise<null | { cmd: IBatchCommand; elems: Element[] }> => {
  const selectedElems = svgCanvas.getSelectedWithoutTempGroup();
  const res = await cloneElements(selectedElems, dx, dy, opts);

  svgCanvas.tempGroupSelectedElements();

  return res;
};

const pasteInCenter = async (): Promise<null | { cmd: IBatchCommand; elems: Element[] }> => {
  const zoom = workareaManager.zoomRatio;
  const workarea = document.getElementById('workarea')!;
  const x = (workarea.scrollLeft + workarea.clientWidth / 2) / zoom - workareaManager.width;
  const y = (workarea.scrollTop + workarea.clientHeight / 2) / zoom - workareaManager.height;

  return pasteElements({ type: 'point', x, y });
};

const generateSelectedElementArray = async (
  interval: { dx: number; dy: number },
  { column, row }: { column: number; row: number },
): Promise<IBatchCommand> => {
  const batchCmd = new history.BatchCommand('Grid elements');

  await copySelectedElements();

  const arrayElements = [...svgCanvas.getSelectedWithoutTempGroup()];

  for (let i = 0; i < column; i += 1) {
    for (let j = 0; j < row; j += 1) {
      if (i !== 0 || j !== 0) {
        const pasteRes = await pasteElements({
          isSubCmd: true,
          selectElement: false,
          type: 'in_place',
        });

        if (!pasteRes) continue;

        const { cmd: pasteCmd, elems } = pasteRes;

        arrayElements.push(...elems);

        elems.forEach((elem) => {
          if (elem.getAttribute('data-vt-offset')) {
            elem.setAttribute('data-vt-offset', `${Number(elem.getAttribute('data-vt-offset')) + i + j * column}`);
          } else {
            const subElems = Array.from(elem.querySelectorAll('[data-vt-offset]'));

            subElems.forEach((subElem) => {
              subElem.setAttribute(
                'data-vt-offset',
                `${Number(subElem.getAttribute('data-vt-offset')) + i + j * column}`,
              );
            });
          }
        });

        if (pasteCmd && !pasteCmd.isEmpty()) {
          batchCmd.addSubCommand(pasteCmd);
        }

        const dx = Array(elems.length).fill(i * interval.dx);
        const dy = Array(elems.length).fill(j * interval.dy);
        const moveCmd = moveElements(dx, dy, elems, false, true);

        if (moveCmd && !moveCmd.isEmpty()) {
          batchCmd.addSubCommand(moveCmd);
        }
      }
    }
  }

  svgCanvas.multiSelect(arrayElements);

  if (!batchCmd.isEmpty()) {
    undoManager.addCommandToHistory(batchCmd);
  }

  return null;
};

export default {
  cloneElements,
  cloneSelectedElements,
  copySelectedElements,
  cutElements,
  cutSelectedElements,
  generateSelectedElementArray,
  handlePastedRef,
  pasteElements,
  pasteInCenter,
};
