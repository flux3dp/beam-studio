import { dpmm } from '@core/app/actions/beambox/constant';
import { CanvasElements } from '@core/app/constants/canvasElements';

export const PRINT_AND_CUT_DIALOG_ID = 'print-and-cut';

export const printAndCutSteps = ['setup', 'paper', 'export', 'align'] as const;

export type PrintAndCutStep = (typeof printAndCutSteps)[number];

export interface PaperSize {
  heightMm: number;
  label: string;
  widthMm: number;
}

/**
 * Minimum gap between the content (design + marks) and the paper edge, in mm.
 * Printers have an unprintable border (~3-5mm, up to 6.35mm on some lasers)
 * that clips marks, shifting their detected centroid and misplacing the cut.
 */
export const PRINT_MARGIN_MM = 10;

export const paperSizes = {
  a3: { heightMm: 420, label: 'A3', widthMm: 297 },
  a4: { heightMm: 297, label: 'A4', widthMm: 210 },
  a5: { heightMm: 210, label: 'A5', widthMm: 148 },
  legal: { heightMm: 356, label: 'Legal', widthMm: 216 },
  letter: { heightMm: 279, label: 'Letter', widthMm: 216 },
} as const satisfies Record<string, PaperSize>;

export type PaperSizeKey = keyof typeof paperSizes;

/** Selected output size: a standard paper size, or 'fit' to wrap the content plus print margins */
export type PaperSelection = 'fit' | PaperSizeKey;

/** Diameter of the printed alignment mark circles, in mm */
export const MARK_DIAMETER_MM = 6;
/**
 * Diameter of the white base disc printed under each mark, in mm: keeps the
 * black mark detectable when printing on transparent material cut over a dark
 * bed. Printers without white ink simply print nothing there, so the base is
 * harmless on ordinary paper.
 */
export const MARK_BASE_DIAMETER_MM = 12;

export const markRadiusPx = (MARK_DIAMETER_MM / 2) * dpmm;
export const markBaseRadiusPx = (MARK_BASE_DIAMETER_MM / 2) * dpmm;

/**
 * Side length of the background patch kept from a mark-centered retake, 2× the
 * mark diameter: the rest of the retaken tile is rolled back so its imprecise
 * edges never overwrite neighboring marks or the surrounding image
 */
export const REFINE_PATCH_SIZE_PX = 2 * MARK_DIAMETER_MM * dpmm;

/** Maximum rms fit error between transformed expected marks and detected blobs, in canvas units (px) */
export const MATCH_TOLERANCE = 2 * dpmm;

/**
 * The smart mark sweep assumes the sheet is placed with little rotation;
 * hypotheses and fits implying more than this are rejected there (the full
 * sweep + correspondence-free search still handles larger rotations)
 */
export const MAX_SMART_ANGLE_RAD = (60 * Math.PI) / 180;

export const PDF_DPI = 300;

/** Color of the cut lines: the generated cutting layer and its previews */
export const CUT_COLOR = '#f5222d';

/**
 * Marker attribute on the generated cutting layer group. Lets a repeat run
 * replace the previous cut layer instead of stacking a new one, and lets the
 * resume preview exclude it so the clean printed design is shown.
 */
export const PRINT_AND_CUT_LAYER_ATTR = 'data-pnc-cut';

/**
 * Elements a cutting layer can cut along: anything with vector geometry
 * (text is converted to path at export time; use references vector symbols)
 */
export const CONTOUR_ELEMENT_SELECTOR = [...CanvasElements.basicPaths, 'use'].join(', ');
