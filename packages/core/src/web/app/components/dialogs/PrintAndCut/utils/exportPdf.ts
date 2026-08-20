import jsPDF from 'jspdf';

import { dpmm } from '@core/app/actions/beambox/constant';
import layerManager from '@core/app/svgedit/layer/layerManager';
import { findDefs } from '@core/app/svgedit/utils/findDef';
import { getDefaultFileName, switchSymbolWrapper } from '@core/helpers/file/export/utils/common';
import i18n from '@core/helpers/i18n';
import { getOriginalImageHrefs, restoreOriginalColors } from '@core/helpers/image/originalColors';
import { svgStringToCanvas } from '@core/helpers/image/svgStringToCanvas';
import { buildWebFontFaceCss } from '@core/helpers/image/webFontFaceCss';
import { isMac } from '@core/helpers/system-helper';
import { convertVariableText } from '@core/helpers/variableText';
import dialog from '@core/implementations/dialog';

import { markBaseRadiusPx, markRadiusPx, PDF_DPI } from '../constants';
import { usePrintAndCutStore } from '../store';

import { getContentsLayers } from './contentsLayers';
import { getContentBBoxFromState, getGridOffsets, getPaperDimensionsMm, getPaperRect } from './layout';

interface RenderedContent {
  base64: string;
  heightMm: number;
  widthMm: number;
  /** Position of the content image on the paper, in mm from the paper's top-left */
  xMm: number;
  yMm: number;
}

/**
 * Render only the content area (design + marks) on a transparent background.
 */
const renderContentBase64 = async (imageHrefs: Map<string, string>): Promise<null | RenderedContent> => {
  const state = usePrintAndCutStore.getState();
  const paperRect = getPaperRect(state);
  const contentBBox = getContentBBoxFromState(state);

  if (!paperRect || !contentBBox) return null;

  // 1mm padding so strokes on the content edge are not clipped
  const pad = dpmm;
  const contentRect = {
    height: contentBBox.height + 2 * pad,
    width: contentBBox.width + 2 * pad,
    x: contentBBox.x - pad,
    y: contentBBox.y - pad,
  };
  const widthMm = contentRect.width / dpmm;
  const heightMm = contentRect.height / dpmm;
  const canvasWidth = Math.round((widthMm / 25.4) * PDF_DPI);
  const canvasHeight = Math.round((heightMm / 25.4) * PDF_DPI);
  // in layer mode, the selected cut layer is not printed: it is for the laser cutter
  const contourLayerElement =
    state.contourSource === 'layer' && state.contourLayerName
      ? layerManager.getLayerElementByName(state.contourLayerName)
      : null;
  const contentsLayers = getContentsLayers(contourLayerElement);
  const layersHtml = contentsLayers
    .map((layer) => {
      const clone = layer.cloneNode(true) as SVGGElement;

      clone.removeAttribute('clip-path');
      // print the artwork with its original colors, not the layer color
      restoreOriginalColors(clone, imageHrefs);

      return clone.outerHTML;
    })
    .join('');
  const fontFaceCss = await buildWebFontFaceCss(contentsLayers);
  const defsClone = findDefs().cloneNode(true) as SVGDefsElement;

  restoreOriginalColors(defsClone, imageHrefs);

  // the white base disc keeps the mark detectable on transparent material over
  // a dark bed (white-ink printers print it; others print nothing there)
  const marksHtml = state.markPositions
    .map(
      ({ cx, cy }) =>
        (state.whiteMarkBase ? `<circle cx="${cx}" cy="${cy}" r="${markBaseRadiusPx}" fill="#fff"/>` : '') +
        `<circle cx="${cx}" cy="${cy}" r="${markRadiusPx}" fill="#000"/>`,
    )
    .join('');
  // the design renders once and each additional grid copy references it
  const copiesHtml = getGridOffsets(state)
    .filter(({ dx, dy }) => dx !== 0 || dy !== 0)
    .map(({ dx, dy }) => `<use href="#print-and-cut-pdf-design" transform="translate(${dx}, ${dy})"/>`)
    .join('');
  const svgString = `
    <svg
      width="${canvasWidth}"
      height="${canvasHeight}"
      viewBox="${contentRect.x} ${contentRect.y} ${contentRect.width} ${contentRect.height}"
      xmlns:svg="http://www.w3.org/2000/svg"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
    >
      ${fontFaceCss}
      ${defsClone.outerHTML}
      <g id="print-and-cut-pdf-design">${layersHtml}</g>
      ${copiesHtml}
      ${marksHtml}
    </svg>`;
  const canvas = await svgStringToCanvas(svgString, canvasWidth, canvasHeight);

  return {
    base64: canvas.toDataURL('image/png'),
    heightMm,
    widthMm,
    xMm: (contentRect.x - paperRect.x) / dpmm,
    yMm: (contentRect.y - paperRect.y) / dpmm,
  };
};

/**
 * Export the design and the alignment marks as a printable PDF.
 * The offset cut paths are not included: they are only used by the laser cutter.
 * @returns whether the pdf was saved
 */
export const exportPrintAndCutPdf = async (): Promise<boolean> => {
  const {
    topmenu: { file: langFile },
  } = i18n.lang;

  const imageHrefs = await getOriginalImageHrefs();
  // text is not converted to paths: the render inlines the webfont bytes (see buildWebFontFaceCss) and
  // resolves local fonts exactly like the canvas does, so what prints matches the contour to be cut
  const variableTextRevert = await convertVariableText();
  const content = await switchSymbolWrapper(() => renderContentBase64(imageHrefs));

  variableTextRevert?.();

  if (!content) return false;

  const state = usePrintAndCutStore.getState();
  const { heightMm, widthMm } = getPaperDimensionsMm(state);

  // jsPDF swaps the format dimensions when they disagree with the orientation,
  // so derive it from the computed dimensions ('fit' ignores state.orientation)
  const orientation = widthMm > heightMm ? 'landscape' : 'portrait';
  const pdf = new jsPDF({ format: [widthMm, heightMm], orientation, unit: 'mm' });

  pdf.addImage(content.base64, 'PNG', content.xMm, content.yMm, content.widthMm, content.heightMm);

  const getContent = () => new Blob([pdf.output('blob')], { type: 'application/pdf' });
  const filePath = await dialog.writeFileDialog(getContent, langFile.save_pdf, getDefaultFileName(), [
    { extensions: ['pdf'], name: isMac() ? 'PDF (*.pdf)' : 'PDF' },
    { extensions: ['*'], name: langFile.all_files },
  ]);

  return Boolean(filePath);
};
