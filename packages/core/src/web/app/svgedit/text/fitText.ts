import { isShallowEqual } from 'remeda';

import history from '@core/app/svgedit/history/history';
import updateElementColor from '@core/helpers/color/updateElementColor';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { HistoryActionOptions, IBatchCommand, ICommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import changeAttribute from '../history/changeAttribute';
import undoManager from '../history/undoManager';
import { getTransformList } from '../transform/transformlist';
import { getBBox } from '../utils/getBBox';

import textActions from './textactions';
import { getCurText, getFitTextAlign, getIsVertical, renderText } from './textedit';

let svgCanvas: ISVGCanvas;

const canvasEvents = eventEmitterFactory.createEventEmitter('canvas');

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

interface FitTextOptions {
  addToHistory?: boolean;
  fill?: string;
  isToSelect?: boolean;
  text?: string;
}

/**
 * Creates a new fitText element with a fixed bounding box.
 * The text fits within the box: short text is aligned via text-anchor,
 * long text is compressed via textLength on tspan elements.
 * Font size is derived from the box height.
 */
export const createNewFitText = (
  boxX: number,
  boxY: number,
  width: number,
  { addToHistory = false, fill = '#333333', isToSelect = false, text = '' }: FitTextOptions = {},
): SVGElement => {
  const currentShape = svgCanvas.getCurrentShape();
  const modelText = getCurText();
  const fontSize = modelText.font_size;

  // Use middle as default alignment and calculate x.
  const fitTextAlign = 'middle';
  const textX = boxX + width / 2;
  // SVG text y is baseline position
  const textY = boxY + fontSize;

  const newText = svgCanvas.addSvgElementFromJson({
    attr: {
      'data-fit-text': '1',
      'data-fit-text-align': fitTextAlign,
      'data-fit-text-size': width,
      'data-ratiofixed': false,
      fill,
      'fill-opacity': fill === 'none' ? modelText.fill_opacity : 1,
      'font-family': modelText.font_family,
      'font-postscript': modelText.font_postscriptName,
      'font-size': fontSize,
      id: svgCanvas.getNextId(),
      opacity: currentShape.opacity,
      'stroke-width': 2,
      x: textX,
      'xml:space': 'preserve',
      y: textY,
    },
    curStyles: true,
    element: 'text',
  }) as SVGTextElement;

  updateElementColor(newText);

  if (text) {
    renderText(newText, text);
  }

  if (isToSelect) {
    svgCanvas.selectOnly([newText]);
  }

  if (addToHistory) {
    undoManager.addCommandToHistory(new history.InsertElementCommand(newText));
  }

  canvasEvents.emit('addText', newText);

  return newText;
};

const fitTextAttributesBeforeResize: Map<SVGTextElement, Record<string, string>> = new Map<
  SVGTextElement,
  Record<string, string>
>();

export const recordFitTextAttributesBeforeResize = (text: SVGTextElement): void => {
  const attributes = {
    'data-fit-text-size': text.getAttribute('data-fit-text-size') || '',
    'font-size': text.getAttribute('font-size') || '',
    x: text.getAttribute('x') || '',
    y: text.getAttribute('y') || '',
  };

  fitTextAttributesBeforeResize.set(text, attributes);
};

export const generateFitTextResizeCommand = (text: SVGTextElement): ICommand | null => {
  const oldAttributes = fitTextAttributesBeforeResize.get(text);

  if (!oldAttributes) {
    return null;
  }

  fitTextAttributesBeforeResize.delete(text);

  const batchCmd = new history.BatchCommand('Fit Text Resize');

  for (const key in oldAttributes) {
    const oldValue = oldAttributes[key];
    const newValue = text.getAttribute(key) || '';

    if (oldValue !== newValue) {
      batchCmd.addSubCommand(new history.ChangeElementCommand(text, { [key]: oldValue }));
    }
  }

  if (batchCmd.isEmpty()) {
    return null;
  }

  batchCmd.onAfter = () => {
    renderText(text);
    textActions.setCursor();
  };

  return batchCmd;
};

export const clearFitTextResizeRecords = (): void => {
  fitTextAttributesBeforeResize.clear();
};

export const setFitTextBBox = (
  text: SVGTextElement,
  newBBox: Partial<DOMRect>,
  {
    addToHistory = true,
    oldBBox,
    parentCmd,
  }: HistoryActionOptions & {
    oldBBox?: { height: number; width: number; x: number; y: number };
  } = {},
): ICommand | null => {
  if (!oldBBox) {
    oldBBox = getBBox(text, { ignoreTransform: true });
  }

  if (!Object.keys(newBBox)) {
    return null;
  }

  const targetBBox = { ...oldBBox, ...newBBox };

  if (isShallowEqual(oldBBox, targetBBox)) {
    return null;
  }

  const { height, width, x, y } = targetBBox;
  const isVertical = getIsVertical(text);
  const fontSize = Number.parseFloat(text.getAttribute('font-size') || '0');
  const fitTextAlign = getFitTextAlign(text);

  // Horizontal: width → constraint, height → font-size
  // Vertical: height → constraint, width → font-size
  const fontScaleFactor = isVertical
    ? oldBBox.width > 0
      ? width / oldBBox.width
      : 1
    : oldBBox.height > 0
      ? height / oldBBox.height
      : 1;
  const newFontSize = fontSize * fontScaleFactor;
  const newConstraint = isVertical ? height : width;

  const newY = isVertical ? y : y + newFontSize;
  let newX = x;

  if (isVertical) {
    newX = x + width - newFontSize;
  } else {
    if (fitTextAlign === 'middle' || fitTextAlign === 'justify') {
      newX = x + width / 2;
    } else if (fitTextAlign === 'end') {
      newX = x + width;
    }
  }

  const cmd = changeAttribute(text, {
    'data-fit-text-size': newConstraint.toString(),
    'font-size': newFontSize.toString(),
    x: newX.toString(),
    y: newY.toString(),
  });

  if (cmd) {
    if (parentCmd) parentCmd.addSubCommand(cmd);
    else if (addToHistory) undoManager.addCommandToHistory(cmd);

    cmd.onAfter = () => {
      renderText(text);
      textActions.setCursor();
    };
  }

  renderText(text);

  return cmd;
};

export const handleFitTextTransform = (text: SVGTextElement, opts: HistoryActionOptions = {}): IBatchCommand | null => {
  const transformList = getTransformList(text);

  if (!transformList) return null;

  const targetBBox = getBBox(text);
  const batchCmd = new history.BatchCommand('Fit Text Transform');

  const oldTransform = text.getAttribute('transform');

  // Remove any non-rotate transforms
  for (let i = transformList.numberOfItems - 1; i >= 0; i--) {
    if (transformList.getItem(i).type === 4) {
      break;
    }

    transformList.removeItem(i);
  }

  const newTransform = text.getAttribute('transform');

  if (oldTransform !== newTransform) {
    batchCmd.addSubCommand(new history.ChangeElementCommand(text, { transform: oldTransform }));
  }

  // rerender after the transform is removed so that we can get the correct bbox for the new transform
  const cmd = setFitTextBBox(text, targetBBox, { ...opts });

  if (cmd) batchCmd.addSubCommand(cmd);

  return batchCmd;
};
