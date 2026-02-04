import React from 'react';

import JsBarcode from 'jsbarcode';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';

import { promarkModels } from '@core/app/actions/beambox/constant';
import MessageCaller, { MessageLevel } from '@core/app/actions/message-caller';
import type { BarcodeProps, BarcodeRef } from '@core/app/components/dialogs/CodeGenerator/BarcodePreview';
import QRCodePreview from '@core/app/components/dialogs/CodeGenerator/QRCodePreview';
import type { QRcodeProps, QRcodeRef } from '@core/app/components/dialogs/CodeGenerator/QRCodePreview';
import {
  importBarcodeSvgElement,
  importQrCodeSvgElement,
} from '@core/app/components/dialogs/CodeGenerator/svgOperation';
import { CanvasElements } from '@core/app/constants/canvasElements';
import NS from '@core/app/constants/namespaces';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { useVariableTextState } from '@core/app/stores/variableText';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import layerManager from '@core/app/svgedit/layer/layerManager';
import textActions from '@core/app/svgedit/text/textactions';
import textedit from '@core/app/svgedit/text/textedit';
import getLocalizedTime from '@core/helpers/getLocalizedTime';
import i18n from '@core/helpers/i18n';
import { getObjectLayer } from '@core/helpers/layer/layer-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';
import { VariableTextType } from '@core/interfaces/ObjectPanel';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

export const isVariableTextSupported = (): boolean => {
  // Note:
  // When supporting Fcode machines, update MonitorContext.getTaskWithVariableText and check PathPreview.updateGcode
  // When supporting in mobile, add VariableTextBlock in TextOptions and fix UI of VariableTextSettings

  return promarkModels.has(useDocumentStore.getState().workarea);
};

export const getVariableTextType = (elem: SVGElement): VariableTextType => {
  const typeStr = elem.getAttribute('data-vt-type');
  let type: VariableTextType = VariableTextType.NONE;

  if (typeStr) {
    type = Number.parseInt(typeStr, 10);
  }

  return type;
};

export const getVariableTextOffset = (elem: SVGElement): number => {
  return +(elem.getAttribute('data-vt-offset') ?? '0');
};

export const getVariableTexts = (opt?: { type?: VariableTextType; visibleOnly?: boolean }): NodeListOf<SVGElement> => {
  const prefix = opt?.visibleOnly ? 'g.layer:not([display="none"]) ' : '';

  if (opt?.type === undefined) {
    const selector = [VariableTextType.NUMBER, VariableTextType.TIME, VariableTextType.CSV]
      .map((type) => `${prefix}[data-vt-type="${type}"]`)
      .join(', ');

    return document.querySelectorAll(selector);
  }

  return document.querySelectorAll(`${prefix}[data-vt-type="${opt.type}"]`);
};

export const hasVariableText = (opt?: { root?: Element; visibleOnly?: boolean }): boolean => {
  if (!isVariableTextSupported()) return false;

  const selector = [VariableTextType.NUMBER, VariableTextType.TIME, VariableTextType.CSV]
    .map((type) => `${opt?.visibleOnly ? 'g.layer:not([display="none"]) ' : ''}[data-vt-type="${type}"]`)
    .join(', ');

  return !!(opt?.root || document).querySelector(selector);
};

export const getRealCurrent = (current: number, start: number, end: number): number => {
  if (start >= end) {
    return start;
  }

  const range = end - start + 1;

  return ((((current - start) % range) + range) % range) + start;
};

const getTextContent = (elem: SVGTextElement) => {
  return Array.from(elem.childNodes)
    .filter((child) => ['textpath', 'tspan'].includes(child.nodeName.toLowerCase()))
    .map((child) => child.textContent)
    .join('\u0085');
};

const getContent = (elem: SVGElement): string => {
  if (elem.nodeName.toLowerCase() === 'text') {
    return getTextContent(elem as SVGTextElement);
  } else {
    try {
      const props = JSON.parse(elem.getAttribute('data-props') ?? '') as BarcodeProps | QRcodeProps;

      return props.value;
    } catch {
      return '';
    }
  }
};

const updateContent = async (
  elem: SVGElement,
  value: string,
  oldValue: string,
  batchCmd: IBatchCommand,
  root: Root,
  barcodeSvg: SVGSVGElement,
): Promise<void> => {
  if (elem.nodeName.toLowerCase() === 'text') {
    // Normal text
    const subcmd = new history.ChangeTextCommand(elem, oldValue, value);

    batchCmd.addSubCommand(subcmd);
    textedit.renderText(elem, value);
  } else {
    // QRcode or Barcode
    batchCmd.addSubCommand(new history.RemoveElementCommand(elem, elem.nextSibling, elem.parentNode!));

    if (!value) {
      elem.remove();

      return;
    }

    const isQrCode = elem.getAttribute('data-code') === 'qrcode';

    try {
      const svg = await new Promise<null | SVGSVGElement | undefined>((resolve) => {
        let resolved = false;
        const props = JSON.parse(elem.getAttribute('data-props') ?? '') as BarcodeProps | QRcodeProps;
        let ref = null as BarcodeRef | null | QRcodeRef;
        const refCallback = (refObject?: BarcodeRef | null | QRcodeRef) => {
          if (refObject?.getElem()) {
            resolve(refObject?.getElem());
            resolved = true;
          }

          ref = refObject || null;
        };

        if (isQrCode) {
          root.render(<QRCodePreview key={elem.id} {...(props as QRcodeProps)} ref={refCallback} value={value} />);
        } else {
          JsBarcode(barcodeSvg, value, (props as BarcodeProps).options);
          resolve(barcodeSvg);
          resolved = true;
        }

        setTimeout(() => {
          if (!resolved) resolve(ref?.getElem());
        }, 1000);
      });

      if (svg) {
        let newElem: SVGElement;
        const isInvert = elem.getAttribute('data-invert') === 'true';
        const layer = getObjectLayer(elem)!;

        layerManager.setCurrentLayer(layer.title);

        if (isQrCode) {
          newElem = await importQrCodeSvgElement(svg, isInvert, { batchCmd, hidden: true });
        } else {
          newElem = await importBarcodeSvgElement(svg, isInvert, { batchCmd, hidden: true });
        }

        newElem.setAttribute('x', elem.getAttribute('x') || '0');
        newElem.setAttribute('y', elem.getAttribute('y') || '0');
        newElem.setAttribute('transform', elem.getAttribute('transform') || '');
        newElem.setAttribute('data-ratiofixed', elem.getAttribute('data-ratiofixed') || '');
        newElem.style.visibility = '';
        elem.replaceWith(newElem);
        batchCmd.addSubCommand(new history.MoveElementCommand(newElem, null, newElem.parentNode!));
      } else {
        throw new Error('Failed to get SVG');
      }
    } catch (e) {
      MessageCaller.openMessage({
        content: i18n.lang.variable_text_settings.failed_to_convert,
        level: MessageLevel.ERROR,
      });
      console.error('[VariableText] Failed to update qrcode/barcode content', elem, value, e);
    }
    elem.remove();
  }
};

export const convertVariableText = async ({
  addToHistory = false,
  configs = useVariableTextState.getState(),
} = {}): Promise<(() => void) | null> => {
  if (!isVariableTextSupported()) return null;

  const tmpContainer = document.createElement('div');
  const barcodeContainer = document.createElement('div');
  const barcodeSvg = document.createElementNS(NS.SVG, 'svg');
  const batchCmd = new history.BatchCommand('Bake Variable Text');
  let texts: NodeListOf<SVGElement>;

  textActions.clear();
  svgCanvas.clearSelection();
  tmpContainer.style.visibility = 'hidden';
  barcodeContainer.style.visibility = 'hidden';
  document.body.appendChild(tmpContainer);
  document.body.appendChild(barcodeContainer);
  barcodeContainer.appendChild(barcodeSvg);

  const root = createRoot(tmpContainer);

  try {
    texts = getVariableTexts({ type: VariableTextType.NUMBER, visibleOnly: !addToHistory });

    for (const elem of texts) {
      const currentValue = getRealCurrent(configs.current + getVariableTextOffset(elem), configs.start, configs.end);
      const content = getContent(elem);
      const regex = /0?(d+|h+|H+)/;
      const match = content?.match(regex);

      if (!content || !match) continue;

      const padStart = match[0].startsWith('0');
      const format = match[1][0];
      const length = match[1].length;
      let value = '';

      if (format === 'd') {
        value = currentValue.toString(10);
      } else if (format === 'h') {
        value = currentValue.toString(16);
      } else if (format === 'H') {
        value = currentValue.toString(16).toUpperCase();
      }

      if (padStart) {
        value = value.padStart(length, '0');
      }

      value = value.slice(-length);
      value = content.replace(regex, value);
      await updateContent(elem, value, content, batchCmd, root, barcodeSvg);
    }

    texts = getVariableTexts({ type: VariableTextType.TIME, visibleOnly: !addToHistory });

    if (texts.length > 0) {
      const now = await getLocalizedTime();

      for (const elem of texts) {
        const content = getContent(elem);

        if (!content) continue;

        const value = now.format(content);

        await updateContent(elem, value, content, batchCmd, root, barcodeSvg);
      }
    }

    texts = getVariableTexts({ type: VariableTextType.CSV, visibleOnly: !addToHistory });
    for (const elem of texts) {
      const currentValue = getRealCurrent(configs.current + getVariableTextOffset(elem), configs.start, configs.end);
      const content = getContent(elem);
      const csvContent = configs.csvContent[currentValue] || [];

      if (!content) continue;

      const value = content.replaceAll(/%(\d+)/g, (_, index) => {
        return csvContent[Number.parseInt(index, 10)] || '';
      });

      await updateContent(elem, value, content, batchCmd, root, barcodeSvg);
    }

    batchCmd.onAfter = () => {
      textActions.clear();
      svgCanvas.clearSelection();
      svgCanvas.selectorManager.releaseSelectors();
    };

    if (addToHistory) {
      const allElements: SVGElement[] = Array.from(getVariableTexts());

      allElements.forEach((elem) => {
        const type = getVariableTextType(elem);
        const offset = getVariableTextOffset(elem);

        elem.removeAttribute('data-vt-type');
        elem.removeAttribute('data-vt-offset');
        batchCmd.addSubCommand(
          new history.ChangeElementCommand(elem, {
            'data-vt-offset': offset,
            'data-vt-type': type,
          }),
        );
      });

      undoManager.addCommandToHistory(batchCmd);

      return null;
    }

    return () => batchCmd.unapply({ handleHistoryEvent: () => {}, renderText: textedit.renderText });
  } finally {
    svgCanvas.clearSelection();
    root.unmount();
    tmpContainer.remove();
    barcodeContainer.remove();
  }
};

export const removeVariableText = (): (() => void) | null => {
  if (!isVariableTextSupported()) return null;

  const allElements: SVGElement[] = Array.from(getVariableTexts());

  if (allElements.length === 0) return null;

  const revertMaps: Array<{ elem: Element; nextSibling: Node | null; parentNode: Node | null }> = [];

  textActions.clear();
  svgCanvas.clearSelection();
  svgCanvas.selectorManager.releaseSelectors();
  allElements.forEach((elem) => {
    revertMaps.unshift({ elem, nextSibling: elem.nextSibling, parentNode: elem.parentNode });
    elem.remove();
  });

  const revert = () => {
    textActions.clear();
    svgCanvas.clearSelection();
    svgCanvas.selectorManager.releaseSelectors();
    revertMaps.forEach(({ elem, nextSibling, parentNode }) => {
      if (nextSibling) {
        parentNode!.insertBefore(elem, nextSibling);
      } else {
        parentNode!.appendChild(elem);
      }
    });
  };

  return revert;
};

export type VariableTextElemHandler = { extract: () => void; revert: () => void };

export const extractVariableText = (doExtract = true): null | VariableTextElemHandler => {
  if (!hasVariableText()) return null;

  const svgcontent = document.getElementById('svgcontent');

  if (!svgcontent) return null;

  const revertMaps: Array<{ elem: Element; nextSibling: Node | null; parentNode: Node | null }> = [];

  const findNonVariableElem = (node: Element) => {
    const childNodes = node.children;

    if (getVariableTextType(node as SVGElement)) {
      // Keep variable elements
      return;
    }

    // Keep layer structures
    const shouldKeep = node.classList.contains('layer') || CanvasElements.defElems.includes(node.tagName.toLowerCase());

    if (!shouldKeep && (childNodes.length === 0 || !hasVariableText({ root: node }))) {
      revertMaps.unshift({ elem: node, nextSibling: node.nextSibling, parentNode: node.parentNode });

      return;
    }

    for (let i = 0; i < childNodes.length; i += 1) {
      findNonVariableElem(childNodes[i]);
    }
  };

  findNonVariableElem(svgcontent);

  const extract = () => {
    textActions.clear();
    svgCanvas.clearSelection();
    svgCanvas.selectorManager.releaseSelectors();
    revertMaps.forEach(({ elem }) => elem.remove());
  };
  const revert = () => {
    textActions.clear();
    svgCanvas.clearSelection();
    svgCanvas.selectorManager.releaseSelectors();
    revertMaps.forEach(({ elem, nextSibling, parentNode }) => {
      if (nextSibling) {
        parentNode!.insertBefore(elem, nextSibling);
      } else {
        parentNode!.appendChild(elem);
      }
    });
  };

  if (doExtract) {
    extract();
  }

  return { extract, revert };
};

export function setVariableCodeData(
  elem: SVGElement,
  type: VariableTextType,
  offset: number,
  isInvert: boolean,
  props: BarcodeProps | QRcodeProps,
  codeType: string,
): void {
  elem.setAttribute('data-vt-type', type.toString());
  elem.setAttribute('data-vt-offset', offset.toString());
  elem.setAttribute('data-invert', isInvert.toString());
  elem.setAttribute('data-props', JSON.stringify(props));
  elem.setAttribute('data-code', codeType);
}
