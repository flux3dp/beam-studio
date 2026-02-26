import history from '@core/app/svgedit/history/history';
import updateElementColor from '@core/helpers/color/updateElementColor';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import undoManager from '../history/undoManager';
import { getTransformList } from '../transform/transformlist';
import { getBBox } from '../utils/getBBox';

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
  height: number,
  { addToHistory = false, fill = '#333333', isToSelect = false, text = '' }: FitTextOptions = {},
): SVGElement => {
  const currentShape = svgCanvas.getCurrentShape();
  const modelText = getCurText();
  const fontSize = height;

  // Use middle as default alignment and calculate x.
  const fitTextAlign = 'middle';
  const textX = boxX + width / 2;
  // SVG text y is baseline position
  const textY = boxY + height;

  const newText = svgCanvas.addSvgElementFromJson({
    attr: {
      'data-fit-text': 'true',
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
  });

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

export const handleFitTextTransform = (
  text: SVGTextElement,
  initBBox: { height: number; width: number; x: number; y: number },
) => {
  // handle undo
  const transformList = getTransformList(text);

  if (!transformList) return;

  const { height, width, x, y } = getBBox(text);
  const isVertical = getIsVertical(text);
  const fontSize = Number.parseFloat(text.getAttribute('font-size') || '0');
  const newFontSize = isVertical ? (fontSize * width) / initBBox.width : (fontSize * height) / initBBox.height;
  const newTextSize = isVertical ? height : width;
  const newY = isVertical ? y : y + newFontSize;
  const fitTextAlign = getFitTextAlign(text);
  let newX = x;

  if (isVertical) {
    // calculate new x by the x attribute (left side of first line) and bounding box right edge
    const oldX = Number.parseFloat(text.getAttribute('x') || '0');
    const deltaX = ((initBBox.x + initBBox.width - oldX) * newFontSize) / fontSize;

    newX = x + width - deltaX;
  } else {
    if (fitTextAlign === 'middle') {
      newX = x + width / 2;
    } else if (fitTextAlign === 'end') {
      newX = x + width;
    }
  }

  text.setAttribute('x', newX.toString());
  text.setAttribute('y', newY.toString());
  text.setAttribute('data-fit-text-size', newTextSize.toString());
  text.setAttribute('font-size', newFontSize.toString());

  // Remove any non-rotate transforms
  for (let i = transformList.numberOfItems - 1; i >= 0; i--) {
    if (transformList.getItem(i).type === 4) {
      break;
    }

    transformList.removeItem(i);
  }
  renderText(text);
};

export default createNewFitText;
