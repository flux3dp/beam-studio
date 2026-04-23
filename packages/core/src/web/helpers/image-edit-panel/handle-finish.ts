import selectionManager from '@core/app/svgedit/selection';
import imageEdit from '@core/helpers/image-edit';

const handleFinish = (
  element: SVGImageElement,
  src: string,
  base64: string,
  attrs: Record<string, number | string> = {},
): void => {
  const changes: Record<string, number | string> = { origImage: src, 'xlink:href': base64, ...attrs };

  imageEdit.addBatchCommand('Image Edit', element, changes);
  selectionManager.selectOnly([element], true);
};

export default handleFinish;
