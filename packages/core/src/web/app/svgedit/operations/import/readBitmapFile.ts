import history from '@core/app/svgedit/history/history';
import updateElementColor from '@core/helpers/color/updateElementColor';
import getExifRotationFlag from '@core/helpers/image/getExifRotationFlag';
import imageData from '@core/helpers/image-data';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

// TODO: add unit test
const imageToPngBlob = async (image: HTMLImageElement) =>
  new Promise<Blob>((resolve) => {
    const canvas = document.createElement('canvas');

    canvas.width = image.width;
    canvas.height = image.height;

    const ctx = canvas.getContext('2d')!;

    ctx.drawImage(image, 0, 0);
    canvas.toBlob((blob) => {
      resolve(blob!);
    });
  });

const readBitmapFile = async (
  file: Blob | File,
  opts?: { gray?: boolean; offset?: number[]; parentCmd?: IBatchCommand; scale?: number },
): Promise<SVGImageElement> => {
  const { gray = true, offset = [0, 0], parentCmd } = opts ?? {};
  const reader = new FileReader();
  const arrayBuffer = await new Promise<ArrayBuffer>((resolve) => {
    reader.onloadend = (e) => {
      resolve(e.target?.result as ArrayBuffer);
    };
    reader.readAsArrayBuffer(file);
  });
  // TODO: comment out this until more precise spec is defined
  // const [dpmmX, dpmmY] = await getDpmm(arrayBuffer, file.type);
  const [dpmmX, dpmmY] = [10, 10];
  const scaleX = 10 / dpmmX;
  const scaleY = 10 / dpmmY;
  const rotationFlag = getExifRotationFlag(arrayBuffer);
  const img = new Image();
  const blob = new Blob([arrayBuffer]);

  await new Promise<void>((resolve) => {
    img.onload = () => resolve();
    img.style.opacity = '0';
    img.src = URL.createObjectURL(blob);
  });

  const { height, width } = img;
  const newImage = svgCanvas.addSvgElementFromJson({
    attr: {
      'data-ratiofixed': true,
      'data-shading': true,
      'data-threshold': 254,
      height: (rotationFlag <= 4 ? height : width) * scaleY,
      id: svgCanvas.getNextId(),
      origImage: img.src,
      preserveAspectRatio: 'none',
      style: 'pointer-events:inherit',
      width: (rotationFlag <= 4 ? width : height) * scaleX,
      x: offset[0],
      y: offset[1],
    },
    element: 'image',
  });

  if (file.type === 'image/webp') {
    const pngBlob = await imageToPngBlob(img);
    const newSrc = URL.createObjectURL(pngBlob);

    URL.revokeObjectURL(img.src);
    newImage.setAttribute('origImage', newSrc);
  }

  await new Promise<void>((resolve) => {
    imageData(newImage.getAttribute('origImage')!, {
      grayscale: gray ? { is_rgba: true, is_shading: true, is_svg: false, threshold: 254 } : undefined,
      height,
      onComplete: (result: any) => {
        svgCanvas.setHref(newImage, result.pngBase64);
      },
      rotationFlag,
      width,
    });
    updateElementColor(newImage);
    svgCanvas.selectOnly([newImage]);

    const cmd = new history.InsertElementCommand(newImage);

    if (!parentCmd) svgCanvas.undoMgr.addCommandToHistory(cmd);
    else parentCmd.addSubCommand(cmd);

    if (!offset) {
      svgCanvas.alignSelectedElements('l', 'page');
      svgCanvas.alignSelectedElements('t', 'page');
    }

    resolve();
  });

  return newImage as SVGImageElement;
};

export default readBitmapFile;
