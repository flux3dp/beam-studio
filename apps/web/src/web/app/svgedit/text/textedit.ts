/**
 * Editing text element attribute
 */

import fontHelper from 'helpers/fonts/fontHelper';
import selector from 'app/svgedit/selector';
import storage from 'implementations/storage';
import textActions from 'app/svgedit/text/textactions';
import { getRotationAngle } from 'app/svgedit/transform/rotation';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { ICommand } from 'interfaces/IHistory';

const { svgedit } = window;
const { NS } = svgedit;

let curText: TextAttribute = {};
let svgCanvas;
let svgEditor;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
  svgEditor = globalSVG.Editor;
});

const updateCurText = (newValue: TextAttribute): void => {
  curText = { ...curText, ...newValue };
};

const useDefaultFont = (): void => {
  const defaultFont = storage.get('default-font');
  if (defaultFont) {
    curText.font_family = defaultFont.family;
    curText.font_postscriptName = defaultFont.postscriptName;
  }
};

const getCurText = (): TextAttribute => curText;

const getTextElement = (elem: SVGTextElement): SVGTextElement => {
  const selectedElements = svgCanvas.getSelectedElems();
  const textElem = elem || selectedElements[0];
  return textElem;
};

const getBold = (): boolean => {
  // should only have one element selected
  const selectedElements = svgCanvas.getSelectedElems();
  const textElem = selectedElements[0];
  if (textElem != null && textElem.tagName === 'text' && selectedElements[1] == null) {
    return textElem.getAttribute('font-weight') === 'bold';
  }
  return false;
};

const getFontFamily = (elem: SVGTextElement): string => {
  const textElem = getTextElement(elem);
  if (textElem) {
    return textElem.getAttribute('font-family');
  }
  return curText.font_family;
};

/**
 * Returns the font family data of element
 * Used for mac, because we set font-family to font postscript name
 */
const getFontFamilyData = (elem: SVGTextElement): string => {
  const textElem = getTextElement(elem);
  if (textElem) {
    if (!textElem.getAttribute('data-font-family')) {
      return getFontFamily(elem);
    }
    return textElem.getAttribute('data-font-family');
  }
  return curText.font_family;
};

const getFontPostscriptName = (elem: SVGTextElement): string => {
  const textElem = getTextElement(elem);
  if (textElem) {
    return textElem.getAttribute('font-postscript');
  }
  return curText.font_postscriptName;
};

const getFontSize = (elem?: SVGTextElement): number => {
  const textElem = getTextElement(elem);
  if (textElem) {
    return parseFloat(textElem.getAttribute('font-size'));
  }
  return Number(curText.font_size);
};

const getFontWeight = (elem: SVGTextElement): number => {
  const selectedElements = svgCanvas.getSelectedElems();
  const textElem = getTextElement(elem);
  if (textElem != null && textElem.tagName === 'text' && selectedElements[1] == null) {
    return Number(textElem.getAttribute('font-weight'));
  }
  return null;
};

const getIsVertical = (elem: SVGTextElement): boolean => {
  const selectedElements = svgCanvas.getSelectedElems();
  const textElem = getTextElement(elem);
  if (textElem != null && textElem.tagName === 'text' && selectedElements[1] == null) {
    const val = textElem.getAttribute('data-verti') === 'true';
    textActions.setIsVertical(val);
    return val;
  }
  return false;
};

const getItalic = (elem?: SVGTextElement): boolean => {
  const selectedElements = svgCanvas.getSelectedElems();
  const textElem = getTextElement(elem);
  if (textElem != null && textElem.tagName === 'text' && selectedElements[1] == null) {
    return textElem.getAttribute('font-style') === 'italic';
  }
  return false;
};

const getLetterSpacing = (elem?: SVGTextElement): number => {
  const selectedElements = svgCanvas.getSelectedElems();
  const textElem = getTextElement(elem);
  if (textElem != null && textElem.tagName === 'text' && selectedElements[1] == null) {
    const val = textElem.getAttribute('letter-spacing');
    if (val) {
      if (val.toLowerCase().endsWith('em')) {
        return parseFloat(val.slice(0, -2));
      }
      // eslint-disable-next-line no-console
      console.warn('letter-spacing should be em!');
      return 0;
    }
    return 0;
  }
  return 0;
};

const getLineSpacing = (elem: SVGTextElement): string => {
  const selectedElements = svgCanvas.getSelectedElems();
  const textElem = getTextElement(elem);
  if (textElem != null && textElem.tagName === 'text' && selectedElements[1] == null) {
    const val = textElem.getAttribute('data-line-spacing') || '1';
    return val;
  }
  return '1';
};

const renderTextPath = (text: SVGTextElement, val?: string) => {
  if (typeof val === 'string') {
    const textPath = text.querySelector('textPath');
    textPath.textContent = val;
  }
};

const renderTspan = (text: SVGTextElement, val?: string) => {
  const tspans = Array.from(text.childNodes).filter(
    (child: Element) => child.tagName === 'tspan'
  ) as SVGTextContentElement[];
  const lines =
    typeof val === 'string' ? val.split('\u0085') : tspans.map((tspan) => tspan.textContent);
  const isVertical = getIsVertical(text);
  const lineSpacing = parseFloat(getLineSpacing(text));
  const charHeight = getFontSize(text);
  const letterSpacing = getLetterSpacing(text);

  for (let i = 0; i < Math.max(lines.length, tspans.length); i += 1) {
    if (i < lines.length) {
      let tspan: SVGTextContentElement;
      if (tspans[i]) {
        tspan = tspans[i];
      } else {
        tspan = document.createElementNS(NS.SVG, 'tspan') as unknown as SVGTextContentElement;
        text.appendChild(tspan);
      }
      tspan.textContent = lines[i];
      tspan.setAttribute('vector-effect', 'non-scaling-stroke');
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
        tspan.setAttribute('x', text.getAttribute('x'));
        tspan.setAttribute(
          'y',
          (Number(text.getAttribute('y')) + i * lineSpacing * charHeight).toFixed(2)
        );
        tspan.textContent = lines[i];
        text.appendChild(tspan);
      }
    } else if (tspans[i]) {
      tspans[i].remove();
    }
  }
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
    selectorManager.requestSelector(textElem).resize();
  }
};

const setBold = (val: boolean): void => {
  const selectedElements = svgCanvas.getSelectedElems();
  const selected = selectedElements[0];
  if (selected != null && selected.tagName === 'text' && selectedElements[1] == null) {
    svgCanvas.changeSelectedAttribute('font-weight', val ? 'bold' : 'normal');
  }
  if (!selectedElements[0].textContent) {
    textActions.setCursor();
  }
};

/**
 * Set the new font family, in macOS value will be postscript to make text correctly rendered
 * @param val New font family
 * @param isSubCmd Whether this operation is a sub command or a sole command
 */
const setFontFamily = (val: string, isSubCmd = false, elems?: Element[]): ICommand => {
  const elemsToChange = elems || svgCanvas.getSelectedElems();
  let cmd = null;
  if (!fontHelper.usePostscriptAsFamily(curText.font_postscriptName))
    curText.font_family = `'${val}'`;
  if (isSubCmd) {
    svgCanvas.undoMgr.beginUndoableChange('font-family', elemsToChange);
    svgCanvas.changeSelectedAttributeNoUndo('font-family', `'${val}'`, elemsToChange);
    cmd = svgCanvas.undoMgr.finishUndoableChange();
  } else {
    svgCanvas.changeSelectedAttribute('font-family', `'${val}'`);
  }
  if (elemsToChange[0] && !elemsToChange[0].textContent) {
    textActions.setCursor();
  }
  return cmd;
};

/**
 * Set the data font family (Used for MacOS only)
 * In mac font-family would be set to font-postscript to make sure text would be rendered correctly.
 * So addition attribution is needed to record it's font family data.
 * @param val New font family
 * @param isSubCmd Whether this operation is a sub command or a sole command
 */
const setFontFamilyData = (val: string, isSubCmd = false, elems?: Element[]): ICommand => {
  const elemsToChange = elems || svgCanvas.getSelectedElems();
  let cmd = null;
  curText.font_family = val;
  if (isSubCmd) {
    svgCanvas.undoMgr.beginUndoableChange('data-font-family', elemsToChange);
    svgCanvas.changeSelectedAttributeNoUndo('data-font-family', val, elemsToChange);
    cmd = svgCanvas.undoMgr.finishUndoableChange();
  } else {
    svgCanvas.changeSelectedAttribute('data-font-family', val, elemsToChange);
  }
  return cmd;
};

const setFontPostscriptName = (val: string, isSubCmd: boolean, elems?: Element[]): ICommand => {
  let cmd = null;
  curText.font_postscriptName = val;
  if (isSubCmd) {
    const elemsToChange = elems || svgCanvas.getSelectedElems();
    svgCanvas.undoMgr.beginUndoableChange('font-postscript', elemsToChange);
    svgCanvas.changeSelectedAttributeNoUndo('font-postscript', val, elemsToChange);
    cmd = svgCanvas.undoMgr.finishUndoableChange();
  } else {
    svgCanvas.changeSelectedAttribute('font-postscript', val, elems);
  }
  return cmd;
};

const setFontSize = (val: number, elems?: Element[]): void => {
  const elemsToChange = elems || svgCanvas.getSelectedElems();
  const textElem = elemsToChange[0];
  curText.font_size = val;
  svgCanvas.changeSelectedAttribute('font-size', val, [textElem]);
  textActions.setFontSize(val);
  if (!textElem.textContent) {
    textActions.setCursor();
  }
  renderText(textElem);
};

const setFontWeight = (fontWeight: number, isSubCmd: boolean, elem?: Element): ICommand => {
  const textElem = elem || svgCanvas.getSelectedElems()[0];
  let cmd = null;
  if (textElem?.tagName === 'text') {
    if (isSubCmd) {
      svgCanvas.undoMgr.beginUndoableChange('font-weight', [textElem]);
      svgCanvas.changeSelectedAttributeNoUndo('font-weight', fontWeight || 'normal', [textElem]);
      cmd = svgCanvas.undoMgr.finishUndoableChange();
    } else {
      svgCanvas.changeSelectedAttribute('font-weight', fontWeight || 'normal', [textElem]);
    }
  }
  if (!textElem.textContent) {
    textActions.setCursor();
  }
  return cmd;
};

const setIsVertical = (val: boolean): void => {
  const selectedElements = svgCanvas.getSelectedElems();
  const elem = selectedElements[0];
  svgCanvas.changeSelectedAttribute('data-verti', val);
  if (!elem.textContent) {
    textActions.setCursor();
  }
  textActions.setIsVertical(val);
  const angle = getRotationAngle(elem);
  svgCanvas.setRotationAngle(0, true, elem);
  renderText(elem);
  svgCanvas.setRotationAngle(angle, true, elem);
  svgEditor.updateContextPanel();
};

const setItalic = (val: boolean, isSubCmd = false, elem?: Element): ICommand => {
  const textElem = elem || svgCanvas.getSelectedElems()[0];
  let cmd = null;
  if (textElem?.tagName === 'text') {
    if (isSubCmd) {
      svgCanvas.undoMgr.beginUndoableChange('font-style', [textElem]);
      svgCanvas.changeSelectedAttributeNoUndo('font-style', val ? 'italic' : 'normal', [textElem]);
      cmd = svgCanvas.undoMgr.finishUndoableChange();
    } else {
      svgCanvas.changeSelectedAttribute('font-style', val ? 'italic' : 'normal', [textElem]);
    }
  }
  if (!textElem.textContent) {
    textActions.setCursor();
  }
  return cmd;
};

const setLetterSpacing = (val: number, elem?: Element): void => {
  const textElem = elem || svgCanvas.getSelectedElems()[0];
  if (textElem?.tagName === 'text') {
    svgCanvas.changeSelectedAttribute('letter-spacing', val ? `${val.toString()}em` : '0em', [
      textElem,
    ]);
    renderText(textElem);
  }
  if (!textElem.textContent) {
    textActions.setCursor();
  }
};

const setLineSpacing = (val: number): void => {
  const selectedElements = svgCanvas.getSelectedElems();
  const elem = selectedElements[0];
  svgCanvas.changeSelectedAttribute('data-line-spacing', val);
  if (!elem || !elem.textContent) {
    textActions.setCursor();
  }
  const angle = getRotationAngle(elem);
  svgCanvas.setRotationAngle(0, true, elem);
  renderText(elem);
  svgCanvas.setRotationAngle(angle, true, elem);
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

export default {
  updateCurText,
  useDefaultFont,
  getCurText,
  getBold,
  setBold,
  getFontFamily,
  setFontFamily,
  getFontFamilyData,
  setFontFamilyData,
  getFontPostscriptName,
  setFontPostscriptName,
  getFontSize,
  setFontSize,
  getFontWeight,
  setFontWeight,
  getIsVertical,
  setIsVertical,
  getItalic,
  setItalic,
  getLineSpacing,
  setLineSpacing,
  getLetterSpacing,
  setLetterSpacing,
  setTextContent,
  renderText,
};
