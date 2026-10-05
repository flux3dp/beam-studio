import jsPDF from 'jspdf';

import { dpmm } from '@core/app/actions/beambox/constant';
import i18n from '@core/helpers/i18n';
import { isMac } from '@core/helpers/system-helper';
import dialog from '@core/implementations/dialog';

import { MARK_BASE_DIAMETER_MM, MARK_DIAMETER_MM, PRINT_MARGIN_MM } from '../constants';
import { computeMarkPositions, getContentBBox } from '../utils/layout';
import type { Point } from '../utils/rigidTransform';

import { BOX_SIZE_MM, getPrintedScaleLabels, getScaleSegments } from './layout';

/** Printed line width, in mm: thin enough to read against the 1 mm pitch, thick enough for any printer */
const LINE_WIDTH_MM = 0.15;

/**
 * Export the calibration sheet as a vector PDF: the four alignment marks
 * around the box plus the two printed scales, on a 'fit' sized page. The
 * sheet is laid out around a box at the canvas origin: every point is mapped
 * relative to the paper, so the box's position on the bed is irrelevant here.
 * @returns whether the pdf was saved
 */
export const exportCalibrationPdf = async (): Promise<boolean> => {
  const t = i18n.lang.topmenu.file;
  const bbox = { height: BOX_SIZE_MM * dpmm, width: BOX_SIZE_MM * dpmm, x: 0, y: 0 };
  const fileName = i18n.lang.topbar.menu.calibrate_print_and_cut;
  const marks = computeMarkPositions(bbox);
  const contentBBox = getContentBBox(bbox, marks);
  const margin = PRINT_MARGIN_MM * dpmm;
  const paperOrigin = { x: contentBBox.x - margin, y: contentBBox.y - margin };
  const widthMm = (contentBBox.width + 2 * margin) / dpmm;
  const heightMm = (contentBBox.height + 2 * margin) / dpmm;
  const mm = ({ x, y }: Point): [number, number] => [(x - paperOrigin.x) / dpmm, (y - paperOrigin.y) / dpmm];
  const pdf = new jsPDF({
    format: [widthMm, heightMm],
    orientation: widthMm > heightMm ? 'landscape' : 'portrait',
    unit: 'mm',
  });

  marks.forEach(({ cx, cy }) => {
    const [x, y] = mm({ x: cx, y: cy });

    pdf.setFillColor(255, 255, 255);
    pdf.circle(x, y, MARK_BASE_DIAMETER_MM / 2, 'F');
    pdf.setFillColor(0, 0, 0);
    pdf.circle(x, y, MARK_DIAMETER_MM / 2, 'F');
  });

  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(LINE_WIDTH_MM);
  getScaleSegments(bbox, 'printed').forEach(({ from, to }) => pdf.line(...mm(from), ...mm(to)));

  pdf.setFontSize(6);
  getPrintedScaleLabels(bbox).forEach(({ index, x, y }) => {
    pdf.text(String(index), ...mm(x), { align: 'center', baseline: 'top' });
    pdf.text(String(index), ...mm(y), { align: 'left', baseline: 'middle' });
  });

  const getContent = () => new Blob([pdf.output('blob')], { type: 'application/pdf' });
  const filePath = await dialog.writeFileDialog(getContent, t.save_pdf, fileName, [
    { extensions: ['pdf'], name: isMac() ? 'PDF (*.pdf)' : 'PDF' },
    { extensions: ['*'], name: t.all_files },
  ]);

  return Boolean(filePath);
};
