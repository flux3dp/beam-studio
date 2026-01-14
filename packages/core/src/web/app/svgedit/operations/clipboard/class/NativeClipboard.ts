import { match } from 'ts-pattern';
import { v4 as uuid } from 'uuid';

import tabController from '@core/app/actions/tabController';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { ClipboardCore, ClipboardData, ClipboardElement } from '@core/interfaces/Clipboard';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { updateSymbolStyle } from '../helpers/updateSymbolStyle';
import { useClipboardStore } from '../useClipboardStore';

import { Clipboard } from './Clipboard';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

const serializeElement = ({
  attributes,
  childNodes,
  innerHTML,
  namespaceURI,
  nodeName,
  nodeType,
  nodeValue,
}: Element) => {
  const result: ClipboardElement = {
    attributes: [],
    childNodes: [],
    innerHTML,
    namespaceURI,
    nodeName,
    nodeType,
    nodeValue,
  };

  if (attributes?.length) {
    for (const { namespaceURI, nodeName, value } of attributes) {
      result.attributes.push({ namespaceURI, nodeName, value });
    }
  }

  childNodes?.forEach((node) => {
    result.childNodes.push(serializeElement(node as Element));
  });

  return result;
};

export class NativeClipboard extends Clipboard implements ClipboardCore {
  protected writeDataToClipboard = async (elems: Element[]): Promise<void> => {
    const serializedData: ClipboardData = {
      elements: [],
      id: uuid(),
      imageData: {},
      refs: {},
      source: String(tabController.currentId),
    };

    useClipboardStore.getState().reset(serializedData.id);

    elems.forEach((elem) => {
      serializedData.elements.push(serializeElement(elem));
    });

    const keys = Object.keys(this.refClipboard);

    for (const key of keys) {
      serializedData.refs[key] = serializeElement(this.refClipboard[key]);
    }

    // save original image data as base64
    const origImageUrls = Array.from(
      new Set(elems.filter((elem) => elem.tagName === 'image').map((elem) => elem.getAttribute('origImage'))),
    ).filter((url): url is string => url !== null);

    const imageResults = await Promise.allSettled(
      origImageUrls.map(async (url) => {
        const resp = await fetch(url);

        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}: Failed to fetch ${url}`);
        }

        const blob = await resp.blob();
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();

          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error(`FileReader failed for ${url}`));
          reader.onabort = () => reject(new Error(`FileReader aborted for ${url}`));
          reader.readAsDataURL(blob);
        });

        serializedData.imageData[url] = base64;
      }),
    );

    const failedImages = imageResults.filter((r) => r.status === 'rejected');

    if (failedImages.length > 0) {
      console.warn(`Failed to process ${failedImages.length} image(s) for clipboard`);
    }

    try {
      await navigator.clipboard.writeText(`BX clip:${JSON.stringify(serializedData)}`);
    } catch (err) {
      console.error('Failed to write to clipboard:', err);
    }
  };

  getRawData = async (): Promise<ClipboardData | null> => {
    const clipboardData = await navigator.clipboard.readText();

    if (!clipboardData.startsWith('BX clip:')) {
      return null;
    }

    try {
      return JSON.parse(clipboardData.substring(8)) as ClipboardData;
    } catch (err) {
      console.error('Failed to parse clipboard data:', err);

      return null;
    }
  };

  getData = async (): Promise<Element[]> => {
    const data = await this.getRawData();

    if (!data) {
      return [];
    }

    const { elements, imageData, refs } = data;
    const drawing = svgCanvas.getCurrentDrawing();
    const keys = Object.keys(refs);

    this.refClipboard = {};

    for (const key of keys) {
      const symbolElemData = refs[key];
      const id = symbolElemData.attributes.find(({ nodeName }) => nodeName === 'id')?.value!;
      const newSymbol = drawing.copyElemData(symbolElemData) as SVGSymbolElement;

      updateSymbolStyle(newSymbol, id);
      this.refClipboard[key] = newSymbol;
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
      }),
    );

    const newElements = elements.map((element) => drawing.copyElemData(element));

    // use clipboard image data if original image is not available
    await Promise.allSettled(
      newElements.map(async (element: Element) => {
        if (element.tagName === 'image') {
          const origImage = element.getAttribute('origImage');

          if (origImage && imageData[origImage]) {
            try {
              await fetch(origImage);
            } catch {
              element.setAttribute('origImage', imageData[origImage]);
            }
          }
        }
      }),
    );

    return newElements;
  };

  hasData = async (): Promise<boolean> => {
    try {
      const clipboardData = await navigator.clipboard.readText();

      return clipboardData.startsWith('BX clip:');
    } catch (err) {
      // Expected when clipboard permission is denied or document is not focused
      console.warn('Failed to read clipboard:', err);

      return false;
    }
  };
}

const checkNativeClipboardByPermissions = async (): Promise<boolean | undefined> => {
  try {
    const readState = (await navigator.permissions.query({ name: 'clipboard-read' as PermissionName })).state;
    const writeState = (await navigator.permissions.query({ name: 'clipboard-write' as PermissionName })).state;

    return match([readState, writeState])
      .with(['granted', 'granted'], () => true)
      .when(
        ([r, w]) => [r, w].includes('denied'),
        () => false,
      )
      .otherwise(() => undefined);
  } catch (err) {
    console.log('Failed to access native clipboard permission.', err);

    // some browsers do not support clipboard permission
    return undefined;
  }
};

const checkNativeClipboardByReadWrite = async (): Promise<boolean> => {
  if (!document.hasFocus()) {
    console.log('not focused, wait for 1000ms');
    // If the document is not focused, we cannot access the clipboard
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return checkNativeClipboardByReadWrite();
  }

  try {
    const origClipboard = await navigator.clipboard.readText();

    await navigator.clipboard.writeText('BX Clipboard test');

    const clipboardData = await navigator.clipboard.readText();
    const res = clipboardData.startsWith('BX Clipboard test');

    await navigator.clipboard.writeText(origClipboard);

    return res;
  } catch (err) {
    console.log('Failed to access native clipboard.', err);

    return false;
  }
};

export const checkNativeClipboardSupport = async (): Promise<boolean> => {
  const permissionResult = await checkNativeClipboardByPermissions();

  if (permissionResult !== undefined) return permissionResult;

  return checkNativeClipboardByReadWrite();
};
