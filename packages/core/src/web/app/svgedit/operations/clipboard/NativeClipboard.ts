import { match } from 'ts-pattern';

import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { ClipboardCore, ClipboardElement } from '@core/interfaces/Clipboard';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import BaseClipboardCore from './base';
import { updateSymbolStyle } from './utils';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

interface ClipboardData {
  elements: ClipboardElement[];
  imageData: Record<string, string>;
  refs: Record<string, ClipboardElement>;
}

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

  for (let i = 0; i < attributes?.length; i += 1) {
    const { namespaceURI, nodeName, value } = attributes[i];

    result.attributes.push({ namespaceURI, nodeName, value });
  }

  childNodes?.forEach((node) => {
    result.childNodes.push(serializeElement(node as Element));
  });

  return result;
};

export class NativeClipboard extends BaseClipboardCore implements ClipboardCore {
  protected writeDataToClipboard = async (elems: Element[]): Promise<void> => {
    const serializedData: ClipboardData = {
      elements: [],
      imageData: {},
      refs: {},
    };

    elems.forEach((elem) => serializedData.elements.push(serializeElement(elem)));

    const keys = Object.keys(this.refClipboard);

    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];

      serializedData.refs[key] = serializeElement(this.refClipboard[key]);
    }

    // save original image data as base64
    const origImageUrls = Array.from(
      new Set(elems.filter((elem) => elem.tagName === 'image').map((elem) => elem.getAttribute('origImage'))),
    );
    const promises = [];

    for (let i = 0; i < origImageUrls.length; i += 1) {
      const origImage = origImageUrls[i]!;

      if (!origImage) continue;

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
        }),
      );
    }
    await Promise.allSettled(promises);

    try {
      await navigator.clipboard.writeText(`BX clip:${JSON.stringify(serializedData)}`);
    } catch (err) {
      console.log('🚀 ~ file: clipboard.ts:131 ~ copyElements ~ err:', err);
    }
  };

  getData = async (): Promise<Element[]> => {
    const clipboardData = await navigator.clipboard.readText();

    if (!clipboardData.startsWith('BX clip:')) {
      return [];
    }

    const drawing = svgCanvas.getCurrentDrawing();
    const data = JSON.parse(clipboardData.substring(8)) as ClipboardData;
    const { elements, imageData, refs } = data;

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
      console.log('🚀 ~ file: clipboard.ts:45 ~ isValidNativeClipboard ~ err:', err);

      return false;
    }
  };
}

const checkNativeClipboardByPermissions = async (): Promise<boolean | undefined> => {
  try {
    // eslint-disable-next-line no-undef
    const readState = (await navigator.permissions.query({ name: 'clipboard-read' as PermissionName })).state;
    // eslint-disable-next-line no-undef
    const writeState = (await navigator.permissions.query({ name: 'clipboard-write' as PermissionName })).state;

    return match([readState, writeState])
      .with(['granted', 'granted'], () => true)
      .when(
        ([r, w]) => r === 'denied' || w === 'denied',
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

export default NativeClipboard;
