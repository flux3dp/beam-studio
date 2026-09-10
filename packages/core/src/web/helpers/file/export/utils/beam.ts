import { pipe } from 'remeda';

import workareaManager from '@core/app/svgedit/workarea';
import beamFileHelper from '@core/helpers/beam-file-helper';
import { rasterizeStandaloneSvg } from '@core/helpers/image/standaloneSvg';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import SymbolMaker from '@core/helpers/symbol-helper/symbolMaker';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { getCanvasContent } from './canvasContent';
import { getSvgContentActualBBox } from './getBBox';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const generateBeamThumbnail = async (): Promise<ArrayBuffer | null> => {
  const { maxY, minY, width } = workareaManager;
  const svgContent = document.getElementById('svgcontent') as unknown as SVGSVGElement;
  const bbox = await getSvgContentActualBBox();
  const right = Math.min(bbox.x + bbox.width, width);
  const bottom = Math.min(bbox.y + bbox.height, maxY);

  bbox.x = Math.max(bbox.x, 0);
  bbox.y = Math.max(bbox.y, minY);
  bbox.width = right - bbox.x;
  bbox.height = bottom - bbox.y;

  if (bbox.width <= 0 || bbox.height <= 0) {
    return null;
  }

  const [imageWidth, imageHeight] = pipe(
    // calculate down ratio
    300 / Math.max(bbox.width, bbox.height),
    // calculate image width and height
    (downRatio) => [Math.ceil(bbox.width * downRatio), Math.ceil(bbox.height * downRatio)],
  );
  const clonedSvgContent = svgContent.cloneNode(true) as SVGSVGElement;
  const useElements = clonedSvgContent.querySelectorAll('use');

  useElements.forEach((useElement) => SymbolMaker.switchImageSymbol(useElement, false));

  const canvas = await rasterizeStandaloneSvg({
    content: [clonedSvgContent.innerHTML],
    size: { height: imageHeight, width: imageWidth },
    viewBox: bbox,
  });
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b!), 'image/png', 1.0);
  });

  return blob.arrayBuffer();
};

export const generateBeamBuffer = async (): Promise<Buffer> =>
  pipe(
    {
      imageSource: await svgCanvas.getImageSource(),
      svgString: await getCanvasContent('beam'),
      thumbnail: (await generateBeamThumbnail()) || undefined,
    },
    ({ imageSource, svgString, thumbnail }) => beamFileHelper.generateBeamBuffer(svgString, imageSource, thumbnail),
  );
