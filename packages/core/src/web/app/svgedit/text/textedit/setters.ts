import type { ISVGEditor } from '@core/app/actions/beambox/svg-editor';
import textActions from '@core/app/svgedit/text/textactions';
import { getRotationAngle } from '@core/app/svgedit/transform/rotation';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { ICommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import changeAttribute from '../../history/changeAttribute';
import history from '../../history/history';
import undoManager from '../../history/undoManager';

import { getCurText } from './curText';
import type { FitTextAlign } from './getters';
import { getFitTextAlign, getIsVertical } from './getters';
import { renderAll, renderText } from './renderText';

export const textContentEvents = eventEmitterFactory.createEventEmitter('text-content');

let svgCanvas: ISVGCanvas;
let svgEditor: ISVGEditor;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
  svgEditor = globalSVG.Editor;
});

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

export const setFontFamily = (val: string, isSubCmd = false, elems: SVGTextElement[]): ICommand | null => {
  let cmd: ICommand | null = null;
  const quotedVal = `'${val}'`;

  getCurText().font_family = quotedVal;

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

export const setFontPostscriptName = (val: string, isSubCmd: boolean, elems: SVGTextElement[]): ICommand | null => {
  let cmd: ICommand | null = null;

  getCurText().font_postscriptName = val;

  if (isSubCmd) {
    svgCanvas.undoMgr.beginUndoableChange('font-postscript', elems);
    svgCanvas.changeSelectedAttributeNoUndo('font-postscript', val, elems);
    cmd = svgCanvas.undoMgr.finishUndoableChange();
  } else {
    svgCanvas.changeSelectedAttribute('font-postscript', val, elems);
  }

  return cmd;
};

export const setFontSize = (val: number, textElems: SVGTextElement[]): void => {
  getCurText().font_size = val;
  svgCanvas.changeSelectedAttribute('font-size', val, textElems);
  textActions.setFontSize(val);
  initCursor(textElems);
  renderAll(textElems);
};

export const setFontWeight = (fontWeight: number, isSubCmd: boolean, textElems: SVGTextElement[]): ICommand | null => {
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

export const setIsVertical = (val: boolean, textElems: SVGTextElement[]): void => {
  const command = new history.BatchCommand('Set Vertical');

  for (const text of textElems) {
    const oldValue = getIsVertical(text);

    if (oldValue === val) continue;

    const subCommand = changeAttribute(text, { 'data-verti': val.toString() });

    if (subCommand) {
      command.addSubCommand(subCommand);
    }
  }

  if (!command.isEmpty()) {
    const onAfter = () => {
      initCursor(textElems);
      textActions.setIsVertical(val);
      updateRotation(textElems);
      svgEditor.updateContextPanel();
    };

    command.onAfter = onAfter;
    undoManager.addCommandToHistory(command);
    onAfter();
  }
};

export const setItalic = (val: boolean, isSubCmd = false, textElems: SVGTextElement[]): ICommand | null => {
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

export const setLetterSpacing = (val: number, textElems: SVGTextElement[]): void => {
  svgCanvas.changeSelectedAttribute('letter-spacing', val ? `${val.toString()}em` : '0em', textElems);
  renderAll(textElems);
  initCursor(textElems);
};

export const setLineSpacing = (val: number, textElems: SVGTextElement[]): void => {
  svgCanvas.changeSelectedAttribute('data-line-spacing', val, textElems);
  initCursor(textElems);
  updateRotation(textElems);
};

/**
 * Updates the text element with the given string
 * @param val new text value
 */
export const setTextContent = (val: string): void => {
  const selectedElements = svgCanvas.getSelectedElems();
  const elem = selectedElements[0];

  renderText(elem, val, true);
  textActions.init();
  textActions.setCursor();
  textContentEvents.emit('changed');
};

export const setFitTextAlign = (text: SVGTextElement, align: FitTextAlign): void => {
  const currentAlign = getFitTextAlign(text);

  if (currentAlign === align) return;

  const isVertical = getIsVertical(text);
  const command = new history.BatchCommand('Set Fit Text Align');

  if (!isVertical) {
    const anchorRatio = { end: 1, justify: 0, middle: 0.5, start: 0 } as const;
    const oldRatio = anchorRatio[currentAlign];
    const newRatio = anchorRatio[align];
    const width = Number.parseFloat(text.getAttribute('data-fit-text-size') || '0');
    const currentX = Number.parseFloat(text.getAttribute('x') || '0');
    const subCommand = changeAttribute(text, { x: (currentX + (newRatio - oldRatio) * width).toString() });

    if (subCommand) {
      command.addSubCommand(subCommand);
    }
  }

  const alignCommand = changeAttribute(text, { 'data-fit-text-align': align });

  if (alignCommand) {
    command.addSubCommand(alignCommand);
  }

  if (!command.isEmpty()) {
    command.onAfter = () => renderText(text);
    undoManager.addCommandToHistory(command);
  }

  renderText(text);
};
