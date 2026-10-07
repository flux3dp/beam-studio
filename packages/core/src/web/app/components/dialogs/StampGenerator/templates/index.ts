import i18n from '@core/helpers/i18n';

import type { StampSize, StampTemplate } from '../types';

import { CATALOG_TEMPLATES } from './catalog';
import { KAI_FONTS } from './fonts';
// All templates live in a 150×150 space.
// Color roles: #E5400A filled = frame (rings, even-odd), #1890FF stroke = arc-text baseline. Slot boxes live below, not in the SVG.
import OVAL_COMPANY from './oval-company.svg?raw';
import RECT_COMPANY from './rect-company.svg?raw';

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
    category: 'tw_company',
    elements: [
      { bounds: { height: 12.4, width: 12.4, x: 9, y: 68.8 }, id: 'logo_left' },
      { bounds: { height: 12.4, width: 12.4, x: 128.6, y: 68.8 }, id: 'logo_right' },
    ],
    id: 'oval_company',
    locales: ['zh-tw'],
    nameKey: 'oval_company',
    preferredFonts: KAI_FONTS,
    sizes: [{ widthMm: 51 }],
    svgContent: OVAL_COMPANY,
    texts: [
      {
        baseline: 0,
        fontSize: 12,
        id: 'arc_top',
        labelKey: 'company_name',
        offset: 5,
        placeholder: '通量三維股份有限公司',
      },
      { bounds: { height: 11, width: 60, x: 45, y: 51 }, id: 'line_1', placeholder: '免用統一發票' },
      {
        bounds: { height: 15, width: 90, x: 30, y: 66 },
        fit: 'stretch',
        fontSize: 18,
        id: 'line_2',
        labelKey: 'tax_id',
        placeholder: '42642569',
      },
      {
        bounds: { height: 10, width: 70, x: 40, y: 85 },
        id: 'line_3',
        labelKey: 'phone',
        placeholder: 'TEL:(02)26513171',
      },
      {
        baseline: 1,
        fontSize: 12,
        id: 'arc_bottom',
        labelKey: 'address',
        offset: 6,
        placeholder: '台北市南港區忠孝東路六段467號9樓',
      },
    ],
  },
  {
    category: 'tw_company',
    elements: [
      { bounds: { height: 12.4, width: 12.4, x: 19, y: 68.8 }, id: 'logo_left' },
      { bounds: { height: 12.4, width: 12.4, x: 118.6, y: 68.8 }, id: 'logo_right' },
    ],
    id: 'rect_company',
    locales: ['zh-tw'],
    nameKey: 'rect_company',
    preferredFonts: KAI_FONTS,
    sizes: [{ widthMm: 41 }],
    svgContent: RECT_COMPANY,
    texts: [
      {
        baseline: 0,
        fontSize: 11,
        id: 'arc_top',
        labelKey: 'company_name',
        offset: 5,
        placeholder: '通量三維股份有限公司',
      },
      {
        bounds: { height: 11, width: 75, x: 37.5, y: 47 },
        id: 'line_1',
        placeholder: '統一發票專用章',
      },
      {
        bounds: { height: 11, width: 45, x: 52.5, y: 59 },
        id: 'line_2',
        placeholder: '統一編號',
      },
      {
        bounds: { height: 13, width: 80, x: 35, y: 71 },
        fit: 'stretch',
        fontPostscriptName: 'Montserrat-Medium',
        id: 'line_3',
        labelKey: 'tax_id',
        placeholder: '42642569',
      },
      {
        // Two-line contact block (phone + owner); centered, no letter-spacing fit. Height = 2 lines × 10 × 1.2.
        bounds: { height: 24, width: 85, x: 32.5, y: 84 },
        fit: 'center',
        fontSize: 9,
        id: 'line_4',
        labelKey: 'contact',
        placeholder: 'TEL:(02)26513171\n負責人：XXX',
      },
      {
        baseline: 1,
        fontSize: 11,
        id: 'arc_bottom',
        labelKey: 'address',
        offset: 3,
        placeholder: '台北市南港區忠孝東路六段467號9樓',
      },
    ],
  },
  {
    // 公司小章 frame: 100 px box, corner radius 1/10 of the side, ring 1/30 (0.4 mm at 四分, 1 mm at 一吋).
    // Line only: the characters fill the box, a decorative frame would sit on them.
    border: { bounds: { height: 100, width: 100, x: 25, y: 25 }, lineWidth: 100 / 30, radius: 10, styles: false },
    category: 'square',
    elements: [],
    id: 'name_seal',
    locales: ['zh-tw'],
    nameKey: 'name_seal',
    preferredFonts: KAI_FONTS,
    sharedFont: true,
    sizes: SQUARE_SIZES,
    texts: [
      {
        bounds: { height: 83.3, width: 37.5, x: 79.7, y: 33.8 },
        fit: 'stretch',
        id: 'col_1',
        labelKey: 'surname',
        placeholder: '王',
        vertical: true,
      },
      {
        bounds: { height: 83.3, width: 37.5, x: 33.8, y: 33.8 },
        fit: 'stretch',
        id: 'col_2',
        labelKey: 'given_name',
        placeholder: '大明',
        vertical: true,
      },
    ],
  },
  {
    border: { bounds: { height: 100, width: 100, x: 25, y: 25 }, lineWidth: 100 / 30, radius: 10, styles: false },
    category: 'square',
    elements: [],
    id: 'square_seal_3col',
    locales: ['zh-tw'],
    nameKey: 'square_seal_3col',
    preferredFonts: KAI_FONTS,
    sharedFont: true,
    sizes: SQUARE_SIZES,
    texts: [
      {
        bounds: { height: 86.7, width: 24, x: 94.3, y: 31.7 },
        fit: 'stretch',
        id: 'col_1',
        labelKey: 'column_1',
        placeholder: '心心股',
        vertical: true,
      },
      {
        bounds: { height: 86.7, width: 24, x: 63.2, y: 31.7 },
        fit: 'stretch',
        id: 'col_2',
        labelKey: 'column_2',
        placeholder: '份有限',
        vertical: true,
      },
      {
        bounds: { height: 86.7, width: 24, x: 32.1, y: 31.7 },
        fit: 'stretch',
        id: 'col_3',
        labelKey: 'column_3',
        placeholder: '公司',
        vertical: true,
      },
    ],
  },
  ...CATALOG_TEMPLATES,
];

/** Templates offered in the active UI language (a template with `locales` is listed only in those). */
export const getVisibleTemplates = (): StampTemplate[] =>
  STAMP_TEMPLATES.filter((template) => !template.locales || template.locales.includes(i18n.getActiveLang()));

export const getTemplateById = (id: string): StampTemplate | undefined => STAMP_TEMPLATES.find((t) => t.id === id);
