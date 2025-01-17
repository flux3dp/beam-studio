/* eslint-disable no-restricted-syntax */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-console */
import findDefs from 'app/svgedit/utils/findDef';
import history from 'app/svgedit/history/history';
import selector from 'app/svgedit/selector';
import symbolMaker from 'helpers/symbol-maker';
import updateElementColor from 'helpers/color/updateElementColor';
import workareaManager from 'app/svgedit/workarea';
import { deleteElements } from 'app/svgedit/operations/delete';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { moveElements } from 'app/svgedit/operations/move';
import { IBatchCommand } from 'interfaces/IHistory';
import undoManager from '../history/undoManager';

interface ClipboardElement {
  namespaceURI: string;
  nodeName: string;
  innerHTML: string;
  childNodes: Array<ClipboardElement>;
  nodeType: number;
  nodeValue: string;
  dataGSVG?: string;
  dataSymbol?: string;
  attributes: Array<Record<'namespaceURI' | 'nodeName' | 'value', string>>;
}

// TODO: decouple with svgcanvas
const { svgedit } = window;

let svgCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

let refClipboard: Record<string, Element> = {};

export const isValidNativeClipboard = async (): Promise<boolean> => {
  try {
    const clipboardData = await navigator.clipboard.readText();

    return clipboardData.startsWith('BX clip:');
  } catch (err) {
    console.log('🚀 ~ file: clipboard.ts:45 ~ isValidNativeClipboard ~ err:', err);

    return false;
  }
};

const serializeElement = ({
  namespaceURI,
  nodeName,
  innerHTML,
  nodeType,
  nodeValue,
  attributes,
  childNodes,
}: Element) => {
  const result: ClipboardElement = {
    namespaceURI,
    nodeName,
    innerHTML,
    nodeType,
    nodeValue,
    childNodes: [],
    attributes: [],
  };

  for (let i = 0; i < attributes?.length; i += 1) {
    const { namespaceURI, nodeName, value } = attributes[i];

    result.attributes.push({ namespaceURI, nodeName, value });
  }

  childNodes?.forEach((node) => {
    result.childNodes.push(serializeElement(node as Element));
  });

  return result;
};

export const addRefToClipboard = (useElement: SVGUseElement): void => {
  const symbolId = svgedit.utilities.getHref(useElement);
  const symbolElement = document.querySelector(symbolId);
  const originalSymbolElement =
    document.getElementById(symbolElement?.getAttribute('data-origin-symbol')) || symbolElement;

  if (originalSymbolElement) {
    refClipboard[symbolId] = originalSymbolElement;
  }
};

const copyElements = async (elems: Array<Element>): Promise<void> => {
  const layerNames = new Set<string>();
  const serializedData = { elements: [], refs: {}, imageData: {} };
  let layerCount = 0;
  refClipboard = {};

  for (let i = 0; i < elems.length; i += 1) {
    const elem = elems[i];
    const layerName = $(elem.parentNode).find('title').text();
    elem.setAttribute('data-origin-layer', layerName);
    if (elem.tagName === 'use') addRefToClipboard(elem as SVGUseElement);
    else
      Array.from(elem.querySelectorAll('use')).forEach((use: SVGUseElement) =>
        addRefToClipboard(use)
      );
    if (!layerNames.has(layerName)) {
      layerNames.add(layerName);
      layerCount += 1;
    }
  }

  // If there is only one layer selected, don't force user to paste on the same layer
  if (layerCount === 1) {
    elems.forEach((elem) => elem?.removeAttribute('data-origin-layer'));
  }

  elems.forEach((elem) => serializedData.elements.push(serializeElement(elem)));

  const keys = Object.keys(refClipboard);
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    serializedData.refs[key] = serializeElement(refClipboard[key]);
  }

  // save original image data as base64
  const origImageUrls = Array.from(
    new Set(
      elems.filter((elem) => elem.tagName === 'image').map((elem) => elem.getAttribute('origImage'))
    )
  );
  const promises = [];
  for (let i = 0; i < origImageUrls.length; i += 1) {
    const origImage = origImageUrls[i];
    promises.push(
      // eslint-disable-next-line no-async-promise-executor
      new Promise<void>(async (resolve) => {
        try {
          const resp = await fetch(origImage);
          const blob = await resp.blob();
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          serializedData.imageData[origImage] = base64;
        } finally {
          resolve();
        }
      })
    );
  }
  await Promise.allSettled(promises);

  try {
    await navigator.clipboard.writeText(`BX clip:${JSON.stringify(serializedData)}`);
  } catch (err) {
    console.log('🚀 ~ file: clipboard.ts:131 ~ copyElements ~ err:', err);
  }
};

const copySelectedElements = async (): Promise<void> => {
  const selectedElems = svgCanvas.getSelectedWithoutTempGroup();
  await copyElements(selectedElems);
  svgCanvas.tempGroupSelectedElements();
};

const cutElements = async (elems: Array<Element>): Promise<void> => {
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

const updateSymbolStyle = (symbol: SVGSymbolElement, oldId: string) => {
  const styles = symbol.querySelectorAll('style, STYLE');
  for (let i = 0; i < styles.length; i += 1) {
    const style = styles[i];
    const { textContent } = style;
    const newContent = textContent.replace(RegExp(oldId, 'g'), symbol.id);
    style.textContent = newContent;
  }
};

async function getElementsFromNativeClipboard(): Promise<Array<Element>> {
  const clipboardData = await navigator.clipboard.readText();

  if (!clipboardData.startsWith('BX clip:')) {
    return [];
  }

  const drawing = svgCanvas.getCurrentDrawing();
  const data = JSON.parse(clipboardData.substring(8));
  const { elements, refs, imageData } = data;

  const keys = Object.keys(refs);
  refClipboard = {};
  for (const key of keys) {
    const symbolElemData = refs[key];
    const id = symbolElemData.attributes.find(({ nodeName }) => nodeName === 'id')?.value;
    const newSymbol = drawing.copyElemData(symbolElemData);

    updateSymbolStyle(newSymbol, id);
    refClipboard[key] = newSymbol;
  }

  // retrieve image data and convert to blob url
  await Promise.allSettled(
    Object.keys(imageData).map(async (key) => {
      try {
        const base64 = imageData[key];
        const resp = await fetch(base64);
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        imageData[key] = url;
      } catch (error) {
        console.error('Failed to fetch image data', error);
      }
    })
  );

  const newElements = elements.map((element: Element) => drawing.copyElemData(element));
  // use clipboard image data if original image is not available
  await Promise.allSettled(
    newElements.map(async (element: Element) => {
      if (element.tagName === 'image') {
        const origImage = element.getAttribute('origImage');
        if (imageData[origImage]) {
          try {
            await fetch(origImage);
          } catch {
            element.setAttribute('origImage', imageData[origImage]);
          }
        }
      }
    })
  );
  return newElements;
}

const pasteRef = async (
  useElement: SVGUseElement,
  opts?: {
    parentCmd?: IBatchCommand;
    addToHistory?: boolean;
  }
): Promise<void> => {
  const { parentCmd, addToHistory = true } = opts || {};
  const batchCmd = new history.BatchCommand('Paste Ref');
  const drawing = svgCanvas.getCurrentDrawing();
  const symbolId = svgedit.utilities.getHref(useElement);
  const refElement = refClipboard[symbolId];
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

export const handlePastedRef = async (
  copy: Element,
  opts: { parentCmd?: IBatchCommand } = {}
): Promise<void> => {
  const promises = Array.of<Promise<void>>();
  const uses = Array.from(copy.querySelectorAll('use'));

  if (copy.tagName === 'use') {
    uses.push(copy as SVGUseElement);
  }

  uses.forEach((use: SVGUseElement) => {
    addRefToClipboard(use);
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

const pasteElements = (
  clipboard: Array<Element>,
  args: {
    type: 'mouse' | 'in_place' | 'point';
    x?: number;
    y?: number;
    isSubCmd: boolean;
    selectElement?: boolean;
  }
): { cmd: IBatchCommand; elems: Array<Element> } | null => {
  const { type, x, y, isSubCmd = false, selectElement = true } = args || {};

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
      // eslint-disable-next-line no-continue
      continue;
    }
    const copy = drawing.copyElem(elem);

    // See if elem with elem ID is in the DOM already
    if (!svgedit.utilities.getElem(elem.id)) {
      copy.id = elem.id;
    }

    pasted.push(copy);

    if (copy.getAttribute('data-origin-layer') && clipboard.length > 1) {
      const layer =
        drawing.getLayerByName(copy.getAttribute('data-origin-layer')) || drawing.getCurrentLayer();
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
    const dx = [];
    const dy = [];

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
  elements: Array<Element>,
  dx: number | number[],
  dy: number | number[],
  opts: {
    parentCmd?: IBatchCommand;
    addToHistory?: boolean;
    selectElement?: boolean;
    callChangOnMove?: boolean;
  } = {
    addToHistory: true,
    selectElement: true,
    callChangOnMove: true,
  }
): Promise<{ cmd: IBatchCommand; elems: Array<Element> } | null> => {
  const { parentCmd, addToHistory = true, selectElement = true, callChangOnMove = true } = opts;
  const batchCmd = new history.BatchCommand('Clone elements');

  await copyElements(elements);

  const pasteRes = pasteElements(await getElementsFromNativeClipboard(), {
    type: 'in_place',
    x: null,
    y: null,
    isSubCmd: true,
    selectElement,
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
    parentCmd?: IBatchCommand;
    addToHistory?: boolean;
    selectElement?: boolean;
    callChangOnMove?: boolean;
  } = {
    addToHistory: true,
    selectElement: true,
    callChangOnMove: true,
  }
): Promise<{ cmd: IBatchCommand; elems: Array<Element> } | null> => {
  const selectedElems = svgCanvas.getSelectedWithoutTempGroup();
  const res = await cloneElements(selectedElems, dx, dy, opts);
  svgCanvas.tempGroupSelectedElements();
  return res;
};

const pasteFromNativeClipboard = async (
  type: 'mouse' | 'in_place' | 'point',
  x?: number,
  y?: number,
  isSubCmd = false
): Promise<{ cmd: IBatchCommand; elems: Array<Element> } | null> =>
  pasteElements(await getElementsFromNativeClipboard(), { type, x, y, isSubCmd });

const pasteInCenter = async (): Promise<{ cmd: IBatchCommand; elems: Array<Element> } | null> => {
  const zoom = workareaManager.zoomRatio;
  const workarea = document.getElementById('workarea');
  const x = (workarea.scrollLeft + workarea.clientWidth / 2) / zoom - workareaManager.width;
  const y = (workarea.scrollTop + workarea.clientHeight / 2) / zoom - workareaManager.height;
  return pasteFromNativeClipboard('point', x, y);
};

const generateSelectedElementArray = async (
  interval: { dx: number; dy: number },
  { row, column }: { row: number; column: number }
): Promise<IBatchCommand> => {
  const batchCmd = new history.BatchCommand('Grid elements');
  await copySelectedElements();
  const arrayElements = [...svgCanvas.getSelectedWithoutTempGroup()];
  const clipboard = await getElementsFromNativeClipboard();

  for (let i = 0; i < column; i += 1) {
    for (let j = 0; j < row; j += 1) {
      if (i !== 0 || j !== 0) {
        const pasteRes = pasteElements(clipboard, {
          type: 'in_place',
          isSubCmd: true,
          selectElement: false,
        });

        if (!pasteRes) {
          // eslint-disable-next-line no-continue
          continue;
        }

        const { cmd: pasteCmd, elems } = pasteRes;

        arrayElements.push(...elems);

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
  addRefToClipboard,
  copySelectedElements,
  cutElements,
  cutSelectedElements,
  pasteElements: pasteFromNativeClipboard,
  pasteInCenter,
  pasteRef,
  cloneElements,
  cloneSelectedElements,
  generateSelectedElementArray,
  handlePastedRef,
};
