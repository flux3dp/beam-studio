import imageEdit from '@core/helpers/image-edit';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

const handleFinish = (
  element: SVGImageElement,
  src: string,
  base64: string,
  attrs: Record<string, number | string> = {},
): void => {
  const changes: Record<string, number | string> = {
    origImage: src,
    'xlink:href': base64,
    ...attrs,
  };

  imageEdit.addBatchCommand('Image Edit', element, changes);
  svgCanvas.selectOnly([element], true);
};

export default handleFinish;
