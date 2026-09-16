import type { StampSize, StampTemplate } from '../types';

// All templates live in a 150×150 space.
// Color roles: #E5400A filled = frame (rings, even-odd), #1890FF stroke = arc-text baseline. Slot boxes live below, not in the SVG.
import OVAL_COMPANY from './oval-company.svg?raw';
import RECT_COMPANY from './rect-company.svg?raw';
import SQUARE_RING from './square-ring.svg?raw';

/** 台灣公司小章 standard sizes, 四分 to 一吋 (1 分 = 0.3 cm). */
const SQUARE_SIZES: StampSize[] = [
  { label: '四分', widthMm: 12 },
  { label: '五分', widthMm: 15 },
  { label: '六分', widthMm: 18 },
  { label: '七分', widthMm: 21 },
  { label: '八分', widthMm: 24 },
  { label: '九分', widthMm: 27 },
  { label: '一吋', widthMm: 30 },
];

export const STAMP_TEMPLATES: StampTemplate[] = [
  {
    elements: [
      { bounds: { height: 13, width: 13, x: 9, y: 68.5 }, id: 'logo_left' },
      { bounds: { height: 13, width: 13, x: 129, y: 68.5 }, id: 'logo_right' },
    ],
    id: 'oval_company',
    nameKey: 'oval_company',
    sizes: [{ widthMm: 51 }],
    svgContent: OVAL_COMPANY,
    texts: [
      { baseline: 0, id: 'arc_top', placeholder: '通量三維股份有限公司' },
      { bounds: { height: 11, width: 60, x: 45, y: 51 }, id: 'line_1', placeholder: '免用統一發票' },
      { bounds: { height: 15, width: 90, x: 30, y: 66 }, id: 'line_2', placeholder: '42642569' },
      { bounds: { height: 10, width: 70, x: 40, y: 85 }, id: 'line_3', placeholder: 'TEL:(02)26513171' },
      { baseline: 1, id: 'arc_bottom', placeholder: '台北市南港區忠孝東路六段467號9樓' },
    ],
  },
  {
    elements: [
      { bounds: { height: 13, width: 13, x: 19, y: 68.5 }, id: 'logo_left' },
      { bounds: { height: 13, width: 13, x: 118, y: 68.5 }, id: 'logo_right' },
    ],
    id: 'rect_company',
    nameKey: 'rect_company',
    sizes: [{ widthMm: 41 }],
    svgContent: RECT_COMPANY,
    texts: [
      { baseline: 0, id: 'arc_top', placeholder: '達寶三維股份有限公司' },
      { bounds: { height: 11, width: 75, x: 37.5, y: 47 }, id: 'line_1', placeholder: '統一發票專用章' },
      { bounds: { height: 11, width: 45, x: 52.5, y: 59 }, id: 'line_2', placeholder: '統一編號' },
      { bounds: { height: 15, width: 85, x: 32.5, y: 70 }, id: 'line_3', placeholder: '42642569' },
      { bounds: { height: 8, width: 60, x: 45, y: 95 }, id: 'line_4', placeholder: 'TEL:(02)26513171' },
      { baseline: 1, id: 'arc_bottom', placeholder: '台北市南港區忠孝東路六段467號9樓' },
    ],
  },
  {
    elements: [],
    id: 'name_seal',
    nameKey: 'name_seal',
    sizes: SQUARE_SIZES,
    svgContent: SQUARE_RING,
    texts: [
      { bounds: { height: 83.3, width: 37.5, x: 33.8, y: 33.8 }, id: 'col_1', placeholder: '大明', vertical: true },
      { bounds: { height: 83.3, width: 37.5, x: 79.7, y: 33.8 }, id: 'col_2', placeholder: '王', vertical: true },
    ],
  },
  {
    elements: [],
    id: 'square_seal_3col',
    nameKey: 'square_seal_3col',
    sizes: SQUARE_SIZES,
    svgContent: SQUARE_RING,
    texts: [
      { bounds: { height: 86.7, width: 24, x: 32.1, y: 31.7 }, id: 'col_1', placeholder: '有限公司', vertical: true },
      { bounds: { height: 86.7, width: 24, x: 63.2, y: 31.7 }, id: 'col_2', placeholder: '心心股份', vertical: true },
      { bounds: { height: 86.7, width: 24, x: 94.3, y: 31.7 }, id: 'col_3', placeholder: '', vertical: true },
    ],
  },
];

export const getTemplateById = (id: string): StampTemplate | undefined => STAMP_TEMPLATES.find((t) => t.id === id);
