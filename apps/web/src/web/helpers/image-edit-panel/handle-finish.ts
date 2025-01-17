import imageEdit from 'helpers/image-edit';
import ISVGCanvas from 'interfaces/ISVGCanvas';
import { getSVGAsync } from 'helpers/svg-editor-helper';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

const handleFinish = (
  element: SVGImageElement,
  src: string,
  base64: string,
  attrs: Record<string, string | number> = {}
): void => {
  const changes: Record<string, string | number> = {
    origImage: src,
    'xlink:href': base64,
    ...attrs,
  };

  imageEdit.addBatchCommand('Image Edit', element, changes);
  svgCanvas.selectOnly([element], true);
};

export default handleFinish;
