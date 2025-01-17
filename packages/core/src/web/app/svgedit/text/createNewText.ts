import eventEmitterFactory from 'helpers/eventEmitterFactory';
import fontHelper from 'helpers/fonts/fontHelper';
import history from 'app/svgedit/history/history';
import ISVGCanvas from 'interfaces/ISVGCanvas';
import textEdit from 'app/svgedit/text/textedit';
import updateElementColor from 'helpers/color/updateElementColor';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import getDefaultFont from 'helpers/fonts/getDefaultFont';

let svgCanvas: ISVGCanvas;

const canvasEvents = eventEmitterFactory.createEventEmitter('canvas');

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

interface Options {
  text?: string;
  addToHistory?: boolean;
  fill?: string;
  fontSize?: number;
  isToSelect?: boolean;
  isDefaultFont?: boolean;
}

const createNewText = (
  x: number,
  y: number,
  {
    fontSize,
    text = '',
    fill = 'none',
    addToHistory = false,
    isToSelect = false,
    isDefaultFont = false,
  }: Options = {}
): SVGElement => {
  const currentShape = svgCanvas.getCurrentShape();
  const modelText = isDefaultFont ? getDefaultFont() : textEdit.getCurText();
  const usePostscriptAsFamily = fontHelper.usePostscriptAsFamily(modelText.font_postscriptName);

  const newText = svgCanvas.addSvgElementFromJson({
    element: 'text',
    curStyles: true,
    attr: {
      x,
      y,
      id: svgCanvas.getNextId(),
      fill,
      'fill-opacity': fill === 'none' ? modelText.fill_opacity : 1,
      'stroke-width': 2,
      'font-size': fontSize ?? modelText.font_size,
      'font-family': usePostscriptAsFamily
        ? `'${modelText.font_postscriptName}'`
        : modelText.font_family,
      'font-postscript': modelText.font_postscriptName,
      'text-anchor': modelText.text_anchor,
      'data-ratiofixed': true,
      'xml:space': 'preserve',
      opacity: currentShape.opacity,
    },
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
