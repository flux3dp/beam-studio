/**
 * Editing text element attribute
 */

import type { ISVGEditor } from '@core/app/actions/beambox/svg-editor';
import NS from '@core/app/constants/namespaces';
import { TabEvents } from '@core/app/constants/tabConstants';
import { getStorage, useStorageStore } from '@core/app/stores/storageStore';
import selector from '@core/app/svgedit/selector';
import textActions from '@core/app/svgedit/text/textactions';
import { getRotationAngle } from '@core/app/svgedit/transform/rotation';
import updateElementColor from '@core/helpers/color/updateElementColor';
import isWeb from '@core/helpers/is-web';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import communicator from '@core/implementations/communicator';
import type { IDefaultFont } from '@core/interfaces/IFont';
import type { ICommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';
import type { TextAttribute } from '@core/interfaces/Text';

const { svgedit } = window;

// Note: curText is initialized when svgCanvas is ready
// Initial value is defined in svg-editor.ts defaultConfig.text
let curText = {} as unknown as TextAttribute;
let svgCanvas: ISVGCanvas;
let svgEditor: ISVGEditor;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
  svgEditor = globalSVG.Editor;
});

export const initCurText = () => {
  const defaultFont: IDefaultFont = getStorage('default-font');

  curText = {
    fill_opacity: 0,
    font_family: defaultFont ? defaultFont.family : 'Arial',
    font_postscriptName: defaultFont ? defaultFont.postscriptName : 'ArialMT',
    font_size: isWeb() ? 200 : 100,
    stroke_width: 2,
  };
};

const updateCurText = (newValue: Partial<TextAttribute>): void => {
  curText = { ...curText, ...newValue };
};

const useDefaultFont = (): void => {
  const defaultFont: IDefaultFont = getStorage('default-font');

  if (defaultFont) {
    curText.font_family = defaultFont.family;
    curText.font_postscriptName = defaultFont.postscriptName;
  }
};

communicator.on(TabEvents.ReloadSettings, () => {
  useDefaultFont();
});

const getCurText = (): TextAttribute => curText;

const getFontFamily = (elem: SVGTextElement): string => {
  return elem.getAttribute('font-family') ?? curText.font_family;
};

/**
 * @deprecated
 * Returns the font family data of element
 * Used for mac, because we set font-family to font postscript name
 */
const getFontFamilyData = (elem: SVGTextElement): string => {
  const dataFontFamily = elem.getAttribute('data-font-family');

  if (!dataFontFamily) return getFontFamily(elem);

  return dataFontFamily;
};

const getFontPostscriptName = (elem: SVGTextElement): string => {
  return elem.getAttribute('font-postscript') ?? curText.font_postscriptName;
};

const getFontSize = (elem: SVGTextElement): number => {
  const fontSize = elem.getAttribute('font-size');

  if (!fontSize) return Number(curText.font_size);

  return Number.parseFloat(fontSize);
};

const getFontWeight = (elem: SVGTextElement): number => {
  return Number(elem.getAttribute('font-weight'));
};

const getIsVertical = (elem: SVGTextElement): boolean => {
  return elem.getAttribute('data-verti') === 'true';
};

const getItalic = (elem: SVGTextElement): boolean => {
  return elem.getAttribute('font-style') === 'italic';
};

const getLetterSpacing = (elem: SVGTextElement): number => {
  const val = elem.getAttribute('letter-spacing');

  if (val) {
    if (val.toLowerCase().endsWith('em')) {
      return Number.parseFloat(val.slice(0, -2));
    }

    console.warn('letter-spacing should be em!');
  }

  return 0;
};

const getLineSpacing = (elem: SVGTextElement): number => {
  return Number.parseFloat(elem.getAttribute('data-line-spacing') || '1');
};

const renderTextPath = (text: SVGTextElement, val?: string) => {
  if (typeof val === 'string') {
    const textPath = text.querySelector('textPath');

    if (textPath) {
      textPath.textContent = val;
    }
  }
};

const renderTspan = (text: SVGTextElement, val?: string) => {
  const tspans = (Array.from(text.childNodes) as Element[]).filter(
    (child) => child.tagName === 'tspan',
  ) as SVGTextContentElement[];
  const lines = typeof val === 'string' ? val.split('\u0085') : tspans.map((tspan) => tspan.textContent ?? '');
  const isVertical = getIsVertical(text);
  const lineSpacing = getLineSpacing(text);
  const charHeight = getFontSize(text);
  const letterSpacing = getLetterSpacing(text);
  let isNewElementCreated = false;

  textActions.setIsVertical(isVertical);

  for (let i = 0; i < Math.max(lines.length, tspans.length); i += 1) {
    if (i < lines.length) {
      let tspan: SVGTextContentElement;

      if (tspans[i]) {
        tspan = tspans[i];
      } else {
        tspan = document.createElementNS(NS.SVG, 'tspan') as unknown as SVGTextContentElement;
        text.appendChild(tspan);
        isNewElementCreated = true;
      }

      tspan.textContent = lines[i];

      if (isVertical) {
        const xPos = Number(text.getAttribute('x')) - i * lineSpacing * charHeight;
        let yPos = Number(text.getAttribute('y'));
        // Always set first x, y position
        const x = [xPos.toFixed(2)];
        const y = [yPos.toFixed(2)];

        // Add more position if there are more than 2 characters
        for (let j = 1; j < lines[i].length; j += 1) {
          yPos += (1 + letterSpacing) * charHeight; // text spacing
          x.push(xPos.toFixed(2));
          y.push(yPos.toFixed(2));
        }
        tspan.setAttribute('x', x.join(' '));
        tspan.setAttribute('y', y.join(' '));
      } else {
        tspan.setAttribute('x', text.getAttribute('x')!);
        tspan.setAttribute('y', (Number(text.getAttribute('y')) + i * lineSpacing * charHeight).toFixed(2));
        tspan.textContent = lines[i];
        text.appendChild(tspan);
      }
    } else if (tspans[i]) {
      tspans[i].remove();
    }
  }

  if (isNewElementCreated) updateElementColor(text);
};

/**
 * Render text element
 * @param elem element
 * @param val text to display, break line with \u0085, use current text content if not provided
 * @param showGrips show grip or not
 */
const renderText = (elem: Element, val?: string, showGrips?: boolean): void => {
  if (!elem) {
    return;
  }

  let textElem = elem;

  if (elem.getAttribute('data-textpath-g')) {
    const text = elem.querySelector('text');

    if (text) {
      renderTextPath(text, val);
      textElem = text;
    }
  } else if (elem.getAttribute('data-textpath')) {
    renderTextPath(elem as SVGTextElement, val);
  } else {
    // render multiLine Text
    renderTspan(elem as SVGTextElement, val);
  }

  svgedit.recalculate.recalculateDimensions(textElem);

  if (showGrips) {
    const selectorManager = selector.getSelectorManager();

    selectorManager.requestSelector(textElem)?.resize();
  }
};

const renderAll = (elems: SVGElement[]): void => {
  elems.forEach((elem) => renderText(elem));
};

const initCursor = (elems: SVGElement[]): void => {
  if (elems.length === 1 && !elems[0].textContent) {
    textActions.setCursor();
  }
};

const updateRotation = (elems: SVGElement[]): void => {
  elems.forEach((elem) => {
    const angle = getRotationAngle(elem);

    svgCanvas.setRotationAngle(0, true, elem);
    renderText(elem);
    svgCanvas.setRotationAngle(angle, true, elem);
  });
};

const setFontFamily = (val: string, isSubCmd = false, elems: SVGTextElement[]): ICommand | null => {
  let cmd: ICommand | null = null;
  const quotedVal = `'${val}'`;

  curText.font_family = quotedVal;

  if (isSubCmd) {
    svgCanvas.undoMgr.beginUndoableChange('font-family', elems);
    svgCanvas.changeSelectedAttributeNoUndo('font-family', quotedVal, elems);
    cmd = svgCanvas.undoMgr.finishUndoableChange();
  } else {
    svgCanvas.changeSelectedAttribute('font-family', quotedVal);
  }

  initCursor(elems);

  return cmd;
};

const setFontPostscriptName = (val: string, isSubCmd: boolean, elems: SVGTextElement[]): ICommand | null => {
  let cmd: ICommand | null = null;

  curText.font_postscriptName = val;

  if (isSubCmd) {
    svgCanvas.undoMgr.beginUndoableChange('font-postscript', elems);
    svgCanvas.changeSelectedAttributeNoUndo('font-postscript', val, elems);
    cmd = svgCanvas.undoMgr.finishUndoableChange();
  } else {
    svgCanvas.changeSelectedAttribute('font-postscript', val, elems);
  }

  return cmd;
};

const setFontSize = (val: number, textElems: SVGTextElement[]): void => {
  curText.font_size = val;
  svgCanvas.changeSelectedAttribute('font-size', val, textElems);
  textActions.setFontSize(val);
  initCursor(textElems);
  renderAll(textElems);
};

const setFontWeight = (fontWeight: number, isSubCmd: boolean, textElems: SVGTextElement[]): ICommand | null => {
  let cmd = null;

  if (isSubCmd) {
    svgCanvas.undoMgr.beginUndoableChange('font-weight', textElems);
    svgCanvas.changeSelectedAttributeNoUndo('font-weight', fontWeight || 'normal', textElems);
    cmd = svgCanvas.undoMgr.finishUndoableChange();
  } else {
    svgCanvas.changeSelectedAttribute('font-weight', fontWeight || 'normal', textElems);
  }

  initCursor(textElems);

  return cmd;
};

const setIsVertical = (val: boolean, textElems: SVGTextElement[]): void => {
  svgCanvas.changeSelectedAttribute('data-verti', val.toString(), textElems);
  initCursor(textElems);
  textActions.setIsVertical(val);
  updateRotation(textElems);
  svgEditor.updateContextPanel();
};

const setItalic = (val: boolean, isSubCmd = false, textElems: SVGTextElement[]): ICommand | null => {
  let cmd = null;

  if (isSubCmd) {
    svgCanvas.undoMgr.beginUndoableChange('font-style', textElems);
    svgCanvas.changeSelectedAttributeNoUndo('font-style', val ? 'italic' : 'normal', textElems);
    cmd = svgCanvas.undoMgr.finishUndoableChange();
  } else {
    svgCanvas.changeSelectedAttribute('font-style', val ? 'italic' : 'normal', textElems);
  }

  initCursor(textElems);

  return cmd;
};

const setLetterSpacing = (val: number, textElems: SVGTextElement[]): void => {
  svgCanvas.changeSelectedAttribute('letter-spacing', val ? `${val.toString()}em` : '0em', textElems);
  renderAll(textElems);
  initCursor(textElems);
};

const setLineSpacing = (val: number, textElems: SVGTextElement[]): void => {
  svgCanvas.changeSelectedAttribute('data-line-spacing', val, textElems);
  initCursor(textElems);
  updateRotation(textElems);
};

/**
 * Updates the text element with the given string
 * @param val new text value
 */
const setTextContent = (val: string): void => {
  const selectedElements = svgCanvas.getSelectedElems();
  const elem = selectedElements[0];

  renderText(elem, val, true);
  textActions.init();
  textActions.setCursor();
};

useStorageStore.subscribe(
  (state) => state['default-font'],
  ({ family, postscriptName }) => updateCurText({ font_family: family, font_postscriptName: postscriptName }),
);

export default {
  getCurText,
  getFontFamily,
  getFontFamilyData,
  getFontPostscriptName,
  getFontSize,
  getFontWeight,
  getIsVertical,
  getItalic,
  getLetterSpacing,
  getLineSpacing,
  renderText,
  setFontFamily,
  setFontPostscriptName,
  setFontSize,
  setFontWeight,
  setIsVertical,
  setItalic,
  setLetterSpacing,
  setLineSpacing,
  setTextContent,
  updateCurText,
  useDefaultFont,
};
