import { match } from 'ts-pattern';

import alertCaller from '@core/app/actions/alert-caller';
import progressCaller from '@core/app/actions/progress-caller';
import NS from '@core/app/constants/namespaces';
import changeAttribute from '@core/app/svgedit/history/changeAttribute';
import type { RemoveElementCommand } from '@core/app/svgedit/history/history';
import history, { InsertElementCommand } from '@core/app/svgedit/history/history';
import { insertBefore } from '@core/app/svgedit/history/moveElement';
import { removeElement } from '@core/app/svgedit/history/removeElement';
import { handleHistoryActionOptions } from '@core/app/svgedit/history/utils/handleHistoryActionOptions';
import { updateSymbolStyle } from '@core/app/svgedit/operations/clipboard/helpers/updateSymbolStyle';
import importSvg from '@core/app/svgedit/operations/import/importSvg';
import parseSvg from '@core/app/svgedit/operations/parseSvg';
import selectionManager from '@core/app/svgedit/selection';
import findDefs from '@core/app/svgedit/utils/findDef';
import { getBBox, getSymbolBBox } from '@core/app/svgedit/utils/getBBox';
import { convertSvgToImage } from '@core/helpers/convertToImage';
import { convertTextToPath } from '@core/helpers/convertToPath';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import i18n from '@core/helpers/i18n';
import updateImageDisplay from '@core/helpers/image/updateImageDisplay';
import { getData } from '@core/helpers/layer/layer-config-helper';
import { getObjectLayer } from '@core/helpers/layer/layer-helper';
import { getDefaultModule } from '@core/helpers/layer-module/layer-module-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import { getOriginSymbol, getRealSymbol, getSymbols } from '@core/helpers/symbol-helper/getSymbol';
import symbolMaker from '@core/helpers/symbol-helper/symbolMaker';
import { isMac } from '@core/helpers/system-helper';
import webNeedConnectionWrapper from '@core/helpers/web-need-connection-helper';
import dialog from '@core/implementations/dialog';
import type { HistoryActionOptions } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

let svgCanvas: ISVGCanvas;
let svgedit: any;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
  svgedit = globalSVG.Edit;
});

// Events
const eventEmitter = eventEmitterFactory.createEventEmitter('library');
const CONTENT_UPDATED = 'CONTENT_UPDATED';

// Placeholder elements
const getDefaultContentId = (elem: Element): null | string => {
  return elem.getAttribute('data-library-default');
};

const setDefaultContentId = (elem: Element, id: string, options?: HistoryActionOptions) => {
  const cmd = changeAttribute(elem, { ['data-library-default']: id });

  handleHistoryActionOptions(cmd, options);
};

export const getCurrentContentId = (elem: Element): string => {
  return elem.getAttribute('data-library-current') ?? elem.id;
};

const setCurrentContentId = (elem: Element, id: string, options?: HistoryActionOptions) => {
  const cmd = changeAttribute(elem, { ['data-library-current']: id });

  handleHistoryActionOptions(cmd, options);
};

export const getCustomerUploadAllowed = (elem: Element): boolean => {
  return elem.getAttribute('data-customer-upload') === 'true';
};

export const setCustomerUploadAllowed = (elem: Element, allowed: boolean) => {
  const cmd = changeAttribute(elem, { ['data-customer-upload']: String(allowed) });

  handleHistoryActionOptions(cmd);
};

// Content elements
const setContentOwner = (content: Element, ownerId: string, options?: HistoryActionOptions): void => {
  const cmd = changeAttribute(content, { ['data-library-owner']: ownerId });

  handleHistoryActionOptions(cmd, options);
};

export const getContentElements = ({
  doc = document,
  ownerId,
  target = 'all',
}: Partial<{
  doc: Document;
  ownerId: string;
  target: 'all' | 'image' | 'origin_data' | 'preview' | 'use_image' | 'use_origin';
}> = {}): SVGSymbolElement[] => {
  let query = `symbol[data-library-owner${ownerId ? `=${ownerId}` : ''}]`;

  query += match(target)
    .with('all', () => '')
    .with('image', () => ':not([data-image-symbol]):not([data-origin-symbol])') // image symbol
    .with('use_origin', () => '[data-image-symbol]') // use origin symbol
    .with('use_image', () => '[data-origin-symbol]') // use image symbol
    .with('origin_data', () => ':not([data-origin-symbol])') // image symbol + use origin symbol
    .with('preview', () => ':not([data-image-symbol])') // image symbol + use image symbol
    .exhaustive();

  return Array.from(doc.querySelectorAll(query));
};

export const importContents = async (owner: SVGElement) => {
  const file = await dialog.getFileFromDialog({
    filters: [{ extensions: ['svg'], name: 'SVG' }],
  });

  if (!file) return;

  const batchCmd = new history.BatchCommand('Import library contents');
  let success = false;

  try {
    await progressCaller.openNonstopProgress({
      caption: i18n.lang.beambox.popup.loading_image,
      id: 'loading_image',
    });

    const svgString = await file.text();
    const newDoc = svgedit.utilities.text2xml(svgString);

    svgCanvas.prepareSvg(newDoc);

    const doc = document.adoptNode(newDoc.documentElement);

    if (owner.tagName === 'image') {
      const contents = getContentElements({ doc, target: 'image' });

      for (const content of contents) {
        if (content.children[0].getAttribute('xlink:href')) {
          const newId = svgCanvas.getNextId();

          content.id = newId;
          findDefs().appendChild(content);
          setContentOwner(content, owner.id, { addToHistory: false });
          batchCmd.addSubCommand(new InsertElementCommand(content));
          success = true;
        }
      }
    } else {
      const contents = getContentElements({ doc, target: 'use_origin' });

      for (const content of contents) {
        const oldId = content.id;
        const newId = svgCanvas.getNextId();

        content.id = newId;
        updateSymbolStyle(content, oldId);
        findDefs().appendChild(content);

        const imageSymbol = await symbolMaker.makeImageSymbol(content, { fullColor: false });

        if (imageSymbol) {
          setContentOwner(content, owner.id, { addToHistory: false });
          setContentOwner(imageSymbol, owner.id, { addToHistory: false });
          batchCmd.addSubCommand(new InsertElementCommand(imageSymbol));
          batchCmd.addSubCommand(new InsertElementCommand(content));
          success = true;
        } else {
          content.remove();
        }
      }
    }

    handleHistoryActionOptions(batchCmd);
  } finally {
    progressCaller.popById('loading_image');
    eventEmitter.emit(CONTENT_UPDATED);

    if (!success) {
      alertCaller.popUpError({
        message: i18n.lang.beambox.right_panel.object_panel.library.image_not_supported,
      });
    }
  }
};

export const exportContents = async (ownerId: string) => {
  const getContent = () => {
    const contents = getContentElements({ ownerId });
    const wrapper = document.createElementNS(NS.SVG, 'svg');
    const defs = document.createElementNS(NS.SVG, 'defs');

    contents.forEach((content) => defs.appendChild(content.cloneNode(true)));
    wrapper.appendChild(defs);
    wrapper.setAttribute('xmlns', NS.SVG);
    wrapper.setAttribute('xmlns:xlink', NS.XLINK);

    return wrapper.outerHTML;
  };
  const defaultFileName = 'LibraryContents';

  await dialog.writeFileDialog(
    getContent,
    i18n.lang.beambox.right_panel.object_panel.library.download_library_contents,
    defaultFileName,
    [{ extensions: ['svg'], name: isMac() ? `${defaultFileName} (*.bvg)` : defaultFileName }],
  );
};

// Add, Init & Refresh
const blobSrcToBase64 = async (src: string): Promise<string> => {
  try {
    const res = await fetch(src);
    const blob = await res.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return src;
  }
};

const addImageContent = async (owner: SVGElement, src: string, options?: HistoryActionOptions) => {
  const symbol = document.createElementNS(NS.SVG, 'symbol');
  const image = document.createElementNS(NS.SVG, 'image');
  const href = await blobSrcToBase64(src);

  symbol.id = svgCanvas.getNextId();
  image.setAttribute('origImage', src);
  image.setAttribute('xlink:href', href);
  image.setAttribute('width', '100');
  image.setAttribute('height', '100');
  symbol.appendChild(image);
  findDefs().appendChild(symbol);
  setContentOwner(symbol, owner.id, { addToHistory: false });
  handleHistoryActionOptions(new history.InsertElementCommand(symbol), options);

  return { image, symbol };
};

const initContentLibrary = async (owner: SVGElement) => {
  // Init default content in defs
  let defaultId: string | undefined = getDefaultContentId(owner) ?? undefined;

  if (defaultId && !document.getElementById(defaultId)) {
    defaultId = undefined;
  }

  if (!defaultId) {
    const batchCmd = new history.BatchCommand('Init content library');

    if (owner.tagName === 'image') {
      const { symbol } = await addImageContent(owner, owner.getAttribute('origImage')!, { parentCmd: batchCmd });

      defaultId = symbol.id;
    } else {
      const symbols = getSymbols(owner as SVGUseElement);

      defaultId = symbols.image!.id;
      setContentOwner(symbols.origin!, owner.id, { parentCmd: batchCmd });
      setContentOwner(symbols.image!, owner.id, { parentCmd: batchCmd });
    }

    setDefaultContentId(owner, defaultId, { parentCmd: batchCmd });
    setCurrentContentId(owner, defaultId, { parentCmd: batchCmd });
    handleHistoryActionOptions(batchCmd);
  }

  eventEmitter.emit(CONTENT_UPDATED);
};

export const addContentFromDialog = async (owner: SVGElement) => {
  const isUse = owner.tagName === 'use';

  if (isUse && !(await webNeedConnectionWrapper(() => true))) {
    return;
  }

  const file = await dialog.getFileFromDialog({
    filters: [
      isUse
        ? { extensions: ['svg'], name: 'SVG' }
        : { extensions: ['png', 'jpg', 'jpeg', 'bmp', 'webp'], name: 'Image' },
    ],
  });

  if (!file) return;

  try {
    await progressCaller.openNonstopProgress({
      caption: i18n.lang.beambox.popup.loading_image,
      id: 'loading_image',
    });

    const batchCmd = new history.BatchCommand(`Add ${owner.tagName} library content from file`);

    if (isUse) {
      const layerModule = getData(getObjectLayer(owner)?.elem, 'module') ?? getDefaultModule();
      const useElems = await importSvg(file, {
        asLibraryContent: true,
        importType: 'nolayer',
        parentCmd: batchCmd,
        targetModule: layerModule,
      });
      let success = false;

      if (useElems) {
        for (const useElem of useElems) {
          const symbols = getSymbols(useElem);

          if (symbols.origin && symbols.image) {
            setContentOwner(symbols.origin, owner.id, { parentCmd: batchCmd });
            setContentOwner(symbols.image, owner.id, { parentCmd: batchCmd });
            success = true;
          }

          handleHistoryActionOptions(removeElement(useElem), { parentCmd: batchCmd });
        }
      }

      if (!success) {
        alertCaller.popUpError({
          message: i18n.lang.beambox.right_panel.object_panel.library.svg_not_supported,
        });
      }
    } else {
      const src = URL.createObjectURL(file);

      await addImageContent(owner, src, { parentCmd: batchCmd });
    }

    handleHistoryActionOptions(batchCmd);
  } finally {
    progressCaller.popById('loading_image');
    eventEmitter.emit(CONTENT_UPDATED);
  }
};

// Change
const getAttributesToFitOwnerBBox = (owner: SVGElement, content: SVGSymbolElement): Record<string, string> => {
  const targetBBox = getBBox(owner);
  const symbolBBox = getSymbolBBox(content);

  const newAttributes: Record<string, string> = {
    'data-xform': `height=${symbolBBox.height} width=${symbolBBox.width} x=${symbolBBox.x} y=${symbolBBox.y}`,
  };

  if (symbolBBox.width === 0 || symbolBBox.height === 0 || targetBBox.width === 0 || targetBBox.height === 0) {
    return newAttributes;
  }

  if (
    targetBBox.width === symbolBBox.width &&
    targetBBox.height === symbolBBox.height &&
    targetBBox.x === symbolBBox.x &&
    targetBBox.y === symbolBBox.y
  ) {
    return newAttributes;
  }

  const sx = targetBBox.width / symbolBBox.width;
  const sy = targetBBox.height / symbolBBox.height;
  const tx = targetBBox.x - symbolBBox.x * sx;
  const ty = targetBBox.y - symbolBBox.y * sy;

  newAttributes.x = '0';
  newAttributes.y = '0';
  newAttributes.transform = `matrix(${sx} 0 0 ${sy} ${tx} ${ty})`;

  return newAttributes;
};

export const changeContent = (owner: SVGElement, content: SVGSymbolElement, options?: HistoryActionOptions) => {
  const batchCmd = new history.BatchCommand('Change current library content');

  if (owner.tagName === 'image') {
    const imageElem = content.children[0];
    const imageData = imageElem.getAttribute('data-origImage') ?? imageElem.getAttribute('xlink:href')!;
    const cmd = changeAttribute(owner, { origImage: imageData });

    handleHistoryActionOptions(cmd, { parentCmd: batchCmd });
    batchCmd.onAfter = () => updateImageDisplay(owner as SVGImageElement);
    updateImageDisplay(owner as SVGImageElement);
  } else {
    const newAttributes = { ...getAttributesToFitOwnerBBox(owner, content), ['xlink:href']: `#${content.id}` };
    const cmd = changeAttribute(owner, newAttributes);

    handleHistoryActionOptions(cmd, { parentCmd: batchCmd });
    symbolMaker.reRenderImageSymbol(owner as SVGUseElement);
  }

  setCurrentContentId(owner, content.id, { parentCmd: batchCmd });
  handleHistoryActionOptions(batchCmd, options);
};

export const setDefaultContent = (owner: SVGElement, content: SVGSymbolElement) => {
  const batchCmd = new history.BatchCommand('Change default library content');

  changeContent(owner, content, { parentCmd: batchCmd });
  setDefaultContentId(owner, content.id, { parentCmd: batchCmd });
  handleHistoryActionOptions(batchCmd);
};

// Reorder
export const reorderContents = (sourceId: string, destinationId: string, isBackward: boolean) => {
  const sourceElement = document.getElementById(sourceId) as null | SVGSymbolElement;
  const destinationElement = document.getElementById(destinationId) as null | SVGSymbolElement;

  if (!sourceElement || !destinationElement || sourceElement === destinationElement) return;

  const parent = sourceElement.parentNode;

  if (!parent) return;

  const originSymbol = getOriginSymbol(sourceElement);
  const batchCmd = new history.BatchCommand('Reorder library content');
  let cmd = insertBefore(parent, sourceElement, isBackward ? destinationElement.nextSibling : destinationElement);

  handleHistoryActionOptions(cmd, { parentCmd: batchCmd });

  if (originSymbol && originSymbol !== sourceElement) {
    cmd = insertBefore(parent, originSymbol, sourceElement);
    handleHistoryActionOptions(cmd, { parentCmd: batchCmd });
  }

  handleHistoryActionOptions(batchCmd);
  eventEmitter.emit(CONTENT_UPDATED);
};

// Remove
export const removeContent = (content: SVGElement) => {
  const batchCmd = new history.BatchCommand('Remove library content');
  let cmd: null | RemoveElementCommand = null;

  if (content.tagName === 'symbol') {
    cmd = removeElement(getOriginSymbol(content as SVGSymbolElement));
    handleHistoryActionOptions(cmd, { parentCmd: batchCmd });
  }

  cmd = removeElement(content);
  handleHistoryActionOptions(cmd, { parentCmd: batchCmd });
  handleHistoryActionOptions(batchCmd);
  eventEmitter.emit(CONTENT_UPDATED);
};

export type TContent = {
  element: SVGSymbolElement;
  image: SVGImageElement;
  isDefault: boolean;
};

export const enum LibraryType {
  USE,
  IMAGE,
}

export class ContentLibraryManager {
  owner: null | SVGElement = null;
  type = LibraryType.USE;

  init = (elem: SVGElement, onUpdate: () => void) => {
    eventEmitter.on(CONTENT_UPDATED, onUpdate);
    this.owner = elem;
    this.type = elem.tagName === 'image' ? LibraryType.IMAGE : LibraryType.USE;
    initContentLibrary(elem);

    return () => {
      // Clear up for hooks
      eventEmitter.off(CONTENT_UPDATED, onUpdate);
      this.owner = null;
    };
  };

  getContent = (): TContent[] => {
    if (!this.owner) return [];

    const defaultId = getDefaultContentId(this.owner);
    const libraryItems = getContentElements({ ownerId: this.owner.id, target: 'preview' });
    const contents: TContent[] = libraryItems.map((element) => {
      return {
        element,
        image: element.children[0] as SVGImageElement,
        isDefault: defaultId === element.id,
      };
    });

    return contents;
  };

  addContentFromCanvas = async (pickedElem: SVGGraphicsElement) => {
    if (!this.owner) return;

    let success = false;
    const owner = this.owner;
    const batchCmd = new history.BatchCommand(`Add ${this.owner.tagName} library content from canvas`);
    const pickedObjectTag = pickedElem.tagName;

    try {
      if (this.type === LibraryType.IMAGE) {
        let newImageSrc: null | string = null;

        if (pickedObjectTag !== 'image') {
          const tempCmd = new history.BatchCommand();
          const result = await convertSvgToImage({
            isToSelect: true, // required to merge images
            parentCmd: tempCmd,
            svgElement: pickedElem,
          });

          if (result) {
            newImageSrc = result.imageElements[0]?.getAttribute('origImage');
            tempCmd.doUnapply();
          }
        } else {
          newImageSrc = pickedElem.getAttribute('origImage');
        }

        if (newImageSrc) {
          await addImageContent(this.owner, newImageSrc, { parentCmd: batchCmd });
          success = true;
        }
      } else {
        let newOriginSymbol: SVGSymbolElement;

        if (pickedElem.tagName === 'use') {
          const originSymbol = getRealSymbol(pickedElem);

          if (!originSymbol) return;

          newOriginSymbol = originSymbol.cloneNode(true) as SVGSymbolElement;
          newOriginSymbol.id = svgCanvas.getNextId();
        } else if (pickedElem.tagName === 'image') {
          return;
        } else {
          const cloned = pickedElem.cloneNode(true) as typeof pickedElem;
          const wrapper = document.createElementNS(NS.SVG, 'svg');

          cloned.style.visibility = 'hidden';
          pickedElem.parentElement?.appendChild(cloned);

          if (cloned.tagName === 'text') {
            const result = await convertTextToPath(cloned, { addToHistory: false, isToSelect: false });

            if (result.path) wrapper.appendChild(result.path);
          } else {
            const images = Array.from(cloned.querySelectorAll('image'));

            images.forEach((image) => image.remove());

            const texts = Array.from(cloned.querySelectorAll('text'));

            for (const text of texts) {
              await convertTextToPath(text, { addToHistory: false, isToSelect: false });
              // Remove text in case convert failed
              text.remove();
            }

            cloned.style.visibility = '';
            wrapper.appendChild(cloned);
          }

          const tempCmd = new history.BatchCommand();
          const { symbols } = parseSvg(tempCmd, wrapper, 'nolayer');

          newOriginSymbol = symbols[0];
        }

        if (!newOriginSymbol) return;

        findDefs().appendChild(newOriginSymbol);

        const imageSymbol = await symbolMaker.makeImageSymbol(newOriginSymbol, { fullColor: false });

        if (imageSymbol) {
          setContentOwner(newOriginSymbol, this.owner.id, { addToHistory: false });
          setContentOwner(imageSymbol, this.owner.id, { addToHistory: false });
          batchCmd.addSubCommand(new history.InsertElementCommand(imageSymbol));
          batchCmd.addSubCommand(new history.InsertElementCommand(newOriginSymbol));
          success = true;
        } else {
          newOriginSymbol.remove();
        }
      }
    } finally {
      handleHistoryActionOptions(batchCmd);
      eventEmitter.emit(CONTENT_UPDATED);

      if (!success) {
        alertCaller.popUpError({
          message: i18n.lang.beambox.right_panel.object_panel.library.object_not_supported,
        });
      } else {
        // Sometimes selected elements are changed during conversion
        // Reset them manually
        selectionManager.selectOnly([owner]);
      }
    }
  };
}

export const contentLibraryManager = new ContentLibraryManager();
