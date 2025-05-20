import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

import beamboxPreference from '@core/app/actions/beambox/beambox-preference';
import { promarkModels } from '@core/app/actions/beambox/constant';
import { useVariableTextState } from '@core/app/stores/variableText';
import type { ChangeTextCommand } from '@core/app/svgedit/history/history';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import setSvgContent from '@core/app/svgedit/operations/import/setSvgContent';
import textActions from '@core/app/svgedit/text/textactions';
import textedit from '@core/app/svgedit/text/textedit';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';
import { VariableTextType } from '@core/interfaces/ObjectPanel';

dayjs.extend(utc);
dayjs.extend(timezone);

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

export const isVariableTextSupported = (): boolean => {
  // Note:
  // When supporting Fcode machines, update MonitorContext.getTaskWithVariableText and check PathPreview.updateGcode
  // When supporting in mobile, add VariableTextBlock in TextOptions and fix UI of VariableTextSettings
  const workarea = beamboxPreference.read('workarea');

  return promarkModels.has(workarea);
};

export const getVariableTextType = (elem: SVGTextElement): VariableTextType => {
  const typeStr = elem.getAttribute('data-vt-type');
  let type: VariableTextType = VariableTextType.NONE;

  if (typeStr) {
    type = Number.parseInt(typeStr, 10);
  }

  return type;
};

export const getVariableTextOffset = (elem: SVGTextElement): number => {
  return +(elem.getAttribute('data-vt-offset') ?? '0');
};

export const getVariableTexts = (opt?: {
  type?: VariableTextType;
  visibleOnly?: boolean;
}): NodeListOf<SVGTextElement> => {
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

const getLocalizedTime = async () => {
  let lang = navigator.language.toLowerCase();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  try {
    console.log(`[dayjs] Loading locale '${lang}'`);
    await import(`dayjs/locale/${lang}.js`);
    dayjs.locale(lang);
  } catch {
    console.warn(`[dayjs] Locale '${lang}' not found`);
    try {
      lang = lang.split('-')[0];
      console.log(`[dayjs] Loading locale '${lang}'`);
      await import(`dayjs/locale/${lang}.js`);
      dayjs.locale(lang);
    } catch {
      console.warn(`[dayjs] Locale '${lang}' not found, using default 'en'`);
      dayjs.locale('en');
    }
  }

  return dayjs().tz(timeZone);
};

export const convertVariableText = async ({
  addToHistory = false,
  configs = useVariableTextState.getState(),
} = {}): Promise<(() => void) | null> => {
  if (!isVariableTextSupported()) return null;

  const batchCmd = new history.BatchCommand('Bake Variable Text');
  let texts: NodeListOf<SVGTextElement>;
  let subcmd: ChangeTextCommand;

  svgCanvas.clearSelection();
  textActions.hideCursor();
  texts = getVariableTexts({ type: VariableTextType.NUMBER, visibleOnly: !addToHistory });

  for (const elem of texts) {
    const currentValue = getRealCurrent(configs.current + getVariableTextOffset(elem), configs.start, configs.end);
    const content = getTextContent(elem);
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
    subcmd = new history.ChangeTextCommand(elem, content, value);
    batchCmd.addSubCommand(subcmd);
    textedit.renderText(elem, value);
  }

  texts = getVariableTexts({ type: VariableTextType.TIME, visibleOnly: !addToHistory });

  if (texts.length > 0) {
    const now = await getLocalizedTime();

    for (const elem of texts) {
      const content = getTextContent(elem);

      if (!content) continue;

      const value = now.format(content);

      subcmd = new history.ChangeTextCommand(elem, content, value);
      batchCmd.addSubCommand(subcmd);
      textedit.renderText(elem, value);
    }
  }

  texts = getVariableTexts({ type: VariableTextType.CSV, visibleOnly: !addToHistory });
  for (const elem of texts) {
    const currentValue = getRealCurrent(configs.current + getVariableTextOffset(elem), configs.start, configs.end);
    const content = getTextContent(elem);
    const csvContent = configs.csvContent[currentValue] || [];

    if (!content) continue;

    const value = content.replaceAll(/%(\d+)/g, (_, index) => {
      return csvContent[Number.parseInt(index, 10)] || '';
    });

    subcmd = new history.ChangeTextCommand(elem, content, value);
    batchCmd.addSubCommand(subcmd);
    textedit.renderText(elem, value);
  }

  if (addToHistory) {
    const allElements: SVGTextElement[] = Array.from(getVariableTexts());

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
};

export const removeVariableText = (): (() => void) | null => {
  if (!isVariableTextSupported()) return null;

  const allElements: SVGTextElement[] = Array.from(getVariableTexts());

  if (allElements.length === 0) return null;

  const revertMaps: Array<{ elem: Element; nextSibling: Node | null; parentNode: Node | null }> = [];

  svgCanvas.clearSelection();
  textActions.hideCursor();
  allElements.forEach((elem) => {
    revertMaps.unshift({ elem, nextSibling: elem.nextSibling, parentNode: elem.parentNode });
    elem.remove();
  });

  const revert = () => {
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

export const extractVariableText = (): null | VariableTextElemHandler => {
  if (!hasVariableText()) return null;

  const svgcontent = document.getElementById('svgcontent');

  if (!svgcontent) return null;

  const oldContent = svgcontent.outerHTML;
  const cloned = svgcontent.cloneNode(true) as Element;

  const removeNonVariableTextElem = (node: Element) => {
    const childNodes = node.children;

    if (childNodes.length === 0) {
      if (node.tagName !== 'title') {
        node.remove();
      }
    } else if (getVariableTextType(node as SVGTextElement)) {
      // Keep element
    } else if (node.getAttribute('display') === 'none' || !hasVariableText({ root: node })) {
      node.remove();
    } else {
      for (let i = childNodes.length - 1; i >= 0; i -= 1) {
        removeNonVariableTextElem(childNodes[i]);
      }
    }
  };

  removeNonVariableTextElem(cloned);

  const extract = () => {
    svgCanvas.clearSelection();
    textActions.hideCursor();
    setSvgContent(cloned.outerHTML);
  };
  const revert = () => {
    svgCanvas.clearSelection();
    textActions.hideCursor();
    setSvgContent(oldContent);
  };

  extract();

  return { extract, revert };
};
