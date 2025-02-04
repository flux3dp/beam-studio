import history from '@core/app/svgedit/history/history';
import textEdit from '@core/app/svgedit/text/textedit';
import updateElementColor from '@core/helpers/color/updateElementColor';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import fontHelper from '@core/helpers/fonts/fontHelper';
import getDefaultFont from '@core/helpers/fonts/getDefaultFont';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

let svgCanvas: ISVGCanvas;

const canvasEvents = eventEmitterFactory.createEventEmitter('canvas');

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

interface Options {
  addToHistory?: boolean;
  fill?: string;
  fontSize?: number;
  isDefaultFont?: boolean;
  isToSelect?: boolean;
  text?: string;
}

const createNewText = (
  x: number,
  y: number,
  { addToHistory = false, fill = 'none', fontSize, isDefaultFont = false, isToSelect = false, text = '' }: Options = {},
): SVGElement => {
  const currentShape = svgCanvas.getCurrentShape();
  const modelText = isDefaultFont ? getDefaultFont() : textEdit.getCurText();
  const usePostscriptAsFamily = fontHelper.usePostscriptAsFamily(modelText.font_postscriptName);

  const newText = svgCanvas.addSvgElementFromJson({
    attr: {
      'data-ratiofixed': true,
      fill,
      'fill-opacity': fill === 'none' ? modelText.fill_opacity : 1,
      'font-family': usePostscriptAsFamily ? `'${modelText.font_postscriptName}'` : modelText.font_family,
      'font-postscript': modelText.font_postscriptName,
      'font-size': fontSize ?? modelText.font_size,
      id: svgCanvas.getNextId(),
      opacity: currentShape.opacity,
      'stroke-width': 2,
      'text-anchor': modelText.text_anchor,
      x,
      'xml:space': 'preserve',
      y,
    },
    curStyles: true,
    element: 'text',
  });

  if (usePostscriptAsFamily) {
    newText.setAttribute('data-font-family', modelText.font_family);
  }

  updateElementColor(newText);

  if (text) {
    textEdit.renderText(newText, text);

    if (isToSelect) {
      svgCanvas.selectOnly([newText]);
    }
  }

  if (addToHistory) {
    svgCanvas.addCommandToHistory(new history.InsertElementCommand(newText));
  }

  canvasEvents.emit('addText', newText);

  return newText;
};

export default createNewText;
