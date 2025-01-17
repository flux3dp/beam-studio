import getDpmm from 'helpers/image/getDpmm';
import getExifRotationFlag from 'helpers/image/getExifRotationFlag';
import history from 'app/svgedit/history/history';
import ISVGCanvas from 'interfaces/ISVGCanvas';
import imageData from 'helpers/image-data';
import updateElementColor from 'helpers/color/updateElementColor';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { IBatchCommand } from 'interfaces/IHistory';

let svgCanvas: ISVGCanvas;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

// TODO: add unit test
const imageToPngBlob = async (image) =>
  new Promise<Blob>((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    canvas.toBlob((blob) => {
      resolve(blob);
    });
  });

const readBitmapFile = async (
  file: File | Blob,
  opts?: {
    scale?: number;
    offset?: number[];
    gray?: boolean;
    parentCmd?: IBatchCommand;
  }
): Promise<SVGImageElement> => {
  const { parentCmd, offset = [0, 0], gray = true } = opts ?? {};
  const reader = new FileReader();
  const arrayBuffer = await new Promise<ArrayBuffer>((resolve) => {
    reader.onloadend = (e) => {
      resolve(e.target.result as ArrayBuffer);
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

  const { width, height } = img;
  const newImage = svgCanvas.addSvgElementFromJson({
    element: 'image',
    attr: {
      x: offset[0],
      y: offset[1],
      width: (rotationFlag <= 4 ? width : height) * scaleX,
      height: (rotationFlag <= 4 ? height : width) * scaleY,
      id: svgCanvas.getNextId(),
      style: 'pointer-events:inherit',
      preserveAspectRatio: 'none',
      'data-threshold': 254,
      'data-shading': true,
      origImage: img.src,
      'data-ratiofixed': true,
    },
  });
  if (file.type === 'image/webp') {
    const pngBlob = await imageToPngBlob(img);
    const newSrc = URL.createObjectURL(pngBlob);
    URL.revokeObjectURL(img.src);
    newImage.setAttribute('origImage', newSrc);
  }
  await new Promise<void>((resolve) => {
    imageData(newImage.getAttribute('origImage'), {
      width,
      height,
      rotationFlag,
      grayscale: gray
        ? {
            is_rgba: true,
            is_shading: true,
            threshold: 254,
            is_svg: false,
          }
        : undefined,
      onComplete: (result) => {
        svgCanvas.setHref(newImage, result.pngBase64);
      },
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
