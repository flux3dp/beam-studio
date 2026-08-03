import { PrintingColors } from '@core/app/constants/color-constants';
import NS from '@core/app/constants/namespaces';
import findDefs from '@core/app/svgedit/utils/findDef';

const printingColorMap = {
  c: PrintingColors.CYAN,
  m: PrintingColors.MAGENTA,
  y: PrintingColors.YELLOW,
} as const;

type PrintingColorKey = keyof typeof printingColorMap;

const getFilterId = (colorKey: PrintingColorKey): string => `printing-color-filter-${colorKey}`;

const ensurePrintingColorFilter = (colorKey: PrintingColorKey): string => {
  const filterId = getFilterId(colorKey);
  const defs = findDefs();

  if (!defs.querySelector(`#${filterId}`)) {
    const color = printingColorMap[colorKey];
    const r = Number.parseInt(color.slice(1, 3), 16);
    const g = Number.parseInt(color.slice(3, 5), 16);
    const b = Number.parseInt(color.slice(5, 7), 16);
    const filter = document.createElementNS(NS.SVG, 'filter');
    const colorMatrix = document.createElementNS(NS.SVG, 'feColorMatrix');

    filter.setAttribute('id', filterId);
    filter.setAttribute('filterUnits', 'objectBoundingBox');
    filter.setAttribute('primitiveUnits', 'userSpaceOnUse');
    filter.setAttribute('color-interpolation-filters', 'sRGB');
    colorMatrix.setAttribute('type', 'matrix');
    colorMatrix.setAttribute('values', `1 0 0 0 ${r / 255}, 0 1 0 0 ${g / 255}, 0 0 1 0 ${b / 255}, 0 0 0 1 0`);
    filter.appendChild(colorMatrix);
    defs.appendChild(filter);
  }

  return filterId;
};

/**
 * Tints split 4C printing images (data-color c/m/y) with the corresponding ink color for display,
 * using global filters in svg defs; removes the filter attribute for other images.
 */
export const updatePrintingColorFilter = (image: Element): void => {
  const colorKey = image.getAttribute('data-color') as null | PrintingColorKey;

  if (colorKey && printingColorMap[colorKey]) {
    image.setAttribute('filter', `url(#${ensurePrintingColorFilter(colorKey)})`);
  } else {
    image.removeAttribute('filter');
  }
};

export default updatePrintingColorFilter;
