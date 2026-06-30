import { pipe } from 'remeda';

import type { ExportThumbnail } from '@core/app/components/FileThumbnail/getThumbnailsForExport';
import { getThumbnailsForExport } from '@core/app/components/FileThumbnail/getThumbnailsForExport';
import { isInteractionMode } from '@core/app/stores/interactionModeStore';
import findDefs from '@core/app/svgedit/utils/findDef';
import workareaManager from '@core/app/svgedit/workarea';
import beamFileHelper from '@core/helpers/beam-file-helper';
import svgStringToCanvas from '@core/helpers/image/svgStringToCanvas';
import { askToEditTargetLayers } from '@core/helpers/layer/templateTargetLayer';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import SymbolMaker from '@core/helpers/symbol-helper/symbolMaker';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

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
  const svgDefs = findDefs();
  const clonedSvgContent = svgContent.cloneNode(true) as SVGSVGElement;
  const useElements = clonedSvgContent.querySelectorAll('use');

  useElements.forEach((useElement) => SymbolMaker.switchImageSymbol(useElement, false));

  const svgString = `
    <svg
      width="${imageWidth}"
      height="${imageHeight}"
      viewBox="${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}"
      xmlns:svg="http://www.w3.org/2000/svg"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
    >
      ${svgDefs.outerHTML}
      ${clonedSvgContent.innerHTML}
    </svg>`;
  const canvas = await svgStringToCanvas(svgString, imageWidth, imageHeight);
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b!), 'image/png', 1.0);
  });

  return blob.arrayBuffer();
};

export const generateBeamBuffer = async ({
  fromAutoSave = false,
  templateMode,
}: { fromAutoSave?: boolean; templateMode?: boolean } = {}): Promise<Buffer> => {
  let thumbnailsList: ExportThumbnail[] = [];

  if (!isInteractionMode('editor')) {
    if (!fromAutoSave) {
      await askToEditTargetLayers();
    }

    thumbnailsList = await getThumbnailsForExport(!fromAutoSave);
  }

  const imageSource = await svgCanvas.getImageSource();
  const svgString = svgCanvas.getSvgString();
  const thumbnail = (await generateBeamThumbnail()) || undefined;

  return beamFileHelper.generateBeamBuffer(svgString, imageSource, thumbnail, thumbnailsList, templateMode);
};
