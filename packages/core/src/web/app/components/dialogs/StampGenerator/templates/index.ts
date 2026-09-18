import type { StampSize, StampTemplate } from '../types';

// All templates live in a 150×150 space.
// Color roles: #E5400A filled = frame (rings, even-odd), #1890FF stroke = arc-text baseline. Slot boxes live below, not in the SVG.
import OVAL_COMPANY from './oval-company.svg?raw';
import RECT_COMPANY from './rect-company.svg?raw';
import RECT_RING_2X1 from './rect-ring-2x1.svg?raw';
import RECT_RING_3X1 from './rect-ring-3x1.svg?raw';
import RECT_RING_EU from './rect-ring-eu.svg?raw';
import ROUND_DOUBLE_RING from './round-double-ring.svg?raw';
import ROUND_RING from './round-ring.svg?raw';
import SQUARE_RING from './square-ring.svg?raw';

/**
 * 楷書 for Taiwan-style seals: 教育部標準楷書 (an S3 web font already in webFonts.ts), then the OS 標楷體
 * on macOS and Windows.
 */
const KAI_FONTS = ['TW-MOE-Std-Kai', 'DFKaiShu-SB-Estd-BF', 'DFKai-SB'];

/** 明朝体 for Japanese seals: Hiragino Mincho (macOS), Yu Mincho / MS Mincho (Windows). */
const JP_FONTS = ['HiraMinProN-W6', 'YuMincho-Regular', 'MS-Mincho'];

/** Western stamps: the bundled Montserrat Medium (always resolvable). */
const WESTERN_FONTS = ['Montserrat-Medium'];

const inch = (n: number) => Math.round(n * 25.4 * 10) / 10;

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
      { bounds: { height: 12.4, width: 12.4, x: 9, y: 68.8 }, id: 'logo_left' },
      { bounds: { height: 12.4, width: 12.4, x: 128.6, y: 68.8 }, id: 'logo_right' },
    ],
    id: 'oval_company',
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
    elements: [
      { bounds: { height: 12.4, width: 12.4, x: 19, y: 68.8 }, id: 'logo_left' },
      { bounds: { height: 12.4, width: 12.4, x: 118.6, y: 68.8 }, id: 'logo_right' },
    ],
    id: 'rect_company',
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
    elements: [],
    id: 'name_seal',
    nameKey: 'name_seal',
    preferredFonts: KAI_FONTS,
    sharedFont: true,
    sizes: SQUARE_SIZES,
    svgContent: SQUARE_RING,
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
    elements: [],
    id: 'square_seal_3col',
    nameKey: 'square_seal_3col',
    preferredFonts: KAI_FONTS,
    sharedFont: true,
    sizes: SQUARE_SIZES,
    svgContent: SQUARE_RING,
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
  // ---- Japan ----
  {
    elements: [],
    id: 'jp_personal_round',
    nameKey: 'jp_personal_round',
    preferredFonts: JP_FONTS,
    sharedFont: true,
    sizes: [10.5, 12, 13.5, 15, 16.5].map((widthMm) => ({ label: `${widthMm}mm`, widthMm })),
    svgContent: ROUND_RING,
    texts: [
      {
        bounds: { height: 76, width: 36, x: 57, y: 37 },
        fit: 'stretch',
        id: 'col_1',
        labelKey: 'name',
        placeholder: '山田',
        vertical: true,
      },
    ],
  },
  {
    elements: [],
    id: 'jp_corporate_round',
    nameKey: 'jp_corporate_round',
    preferredFonts: JP_FONTS,
    sharedFont: true,
    sizes: [{ label: '18mm', widthMm: 18 }],
    svgContent: ROUND_DOUBLE_RING,
    texts: [
      { baseline: 0, fontSize: 9, id: 'arc_top', labelKey: 'company_name', placeholder: '通量三維株式会社' },
      {
        bounds: { height: 58, width: 22, x: 64, y: 46 },
        fit: 'stretch',
        id: 'col_1',
        labelKey: 'title',
        placeholder: '代表取締役印',
        vertical: true,
      },
    ],
  },
  {
    elements: [],
    id: 'jp_corporate_square',
    nameKey: 'jp_corporate_square',
    preferredFonts: JP_FONTS,
    sharedFont: true,
    sizes: [15, 18, 21, 24].map((widthMm) => ({ label: `${widthMm}mm`, widthMm })),
    svgContent: SQUARE_RING,
    // Columns read right to left, like 角印.
    texts: [
      {
        bounds: { height: 86.7, width: 24, x: 94.3, y: 31.7 },
        fit: 'stretch',
        id: 'col_1',
        labelKey: 'column_1',
        placeholder: '通量三維',
        vertical: true,
      },
      {
        bounds: { height: 86.7, width: 24, x: 63.2, y: 31.7 },
        fit: 'stretch',
        id: 'col_2',
        labelKey: 'column_2',
        placeholder: '株式会社',
        vertical: true,
      },
      {
        bounds: { height: 86.7, width: 24, x: 32.1, y: 31.7 },
        fit: 'stretch',
        id: 'col_3',
        labelKey: 'column_3',
        placeholder: '之印',
        vertical: true,
      },
    ],
  },
  // ---- USA ----
  {
    elements: [],
    id: 'us_address',
    nameKey: 'us_address',
    preferredFonts: WESTERN_FONTS,
    sharedFont: true,
    sizes: [{ label: '1.5 × 3 in', widthMm: inch(3) }],
    svgContent: RECT_RING_2X1,
    texts: [
      {
        bounds: { height: 12, width: 120, x: 15, y: 46 },
        fit: 'center',
        fontSize: 10,
        id: 'line_1',
        labelKey: 'line_1',
        placeholder: 'FLUX Inc.',
      },
      {
        bounds: { height: 12, width: 120, x: 15, y: 60 },
        fit: 'center',
        fontSize: 10,
        id: 'line_2',
        labelKey: 'line_2',
        placeholder: '123 Main Street',
      },
      {
        bounds: { height: 12, width: 120, x: 15, y: 74 },
        fit: 'center',
        fontSize: 10,
        id: 'line_3',
        labelKey: 'line_3',
        placeholder: 'Springfield, IL 62701',
      },
      {
        bounds: { height: 12, width: 120, x: 15, y: 88 },
        fit: 'center',
        fontSize: 10,
        id: 'line_4',
        labelKey: 'line_4',
        placeholder: 'Tel (555) 123-4567',
      },
    ],
  },
  {
    elements: [],
    id: 'us_round_seal',
    nameKey: 'us_round_seal',
    preferredFonts: WESTERN_FONTS,
    sharedFont: true,
    sizes: [{ label: '1.6 in', widthMm: inch(1.6) }],
    svgContent: ROUND_DOUBLE_RING,
    texts: [
      { baseline: 0, fontSize: 9, id: 'arc_top', labelKey: 'company_name', placeholder: 'FLUX TECHNOLOGY INC.' },
      {
        bounds: { height: 12, width: 44, x: 53, y: 62 },
        fit: 'center',
        fontSize: 9,
        id: 'line_1',
        labelKey: 'line_1',
        placeholder: 'OFFICIAL',
      },
      {
        bounds: { height: 12, width: 44, x: 53, y: 76 },
        fit: 'center',
        fontSize: 9,
        id: 'line_2',
        labelKey: 'line_2',
        placeholder: 'SEAL',
      },
      { baseline: 1, fontSize: 9, id: 'arc_bottom', labelKey: 'city', placeholder: 'SPRINGFIELD, ILLINOIS' },
    ],
  },
  {
    elements: [],
    id: 'us_office',
    nameKey: 'us_office',
    preferredFonts: WESTERN_FONTS,
    sharedFont: true,
    sizes: [{ label: '0.5 × 1.5 in', widthMm: inch(1.5) }],
    svgContent: RECT_RING_3X1,
    texts: [
      {
        bounds: { height: 34, width: 122, x: 14, y: 58 },
        fit: 'stretch',
        id: 'line_1',
        labelKey: 'word',
        placeholder: 'PAID',
      },
    ],
  },
  // ---- Europe ----
  {
    elements: [],
    id: 'eu_address',
    nameKey: 'eu_address',
    preferredFonts: WESTERN_FONTS,
    sharedFont: true,
    sizes: [58, 47, 38].map((widthMm) => ({ label: `${widthMm} × ${Math.round((widthMm * 22) / 58)} mm`, widthMm })),
    svgContent: RECT_RING_EU,
    texts: [
      {
        bounds: { height: 10, width: 126, x: 12, y: 53 },
        fit: 'center',
        fontSize: 8,
        id: 'line_1',
        labelKey: 'line_1',
        placeholder: 'Musterfirma GmbH',
      },
      {
        bounds: { height: 10, width: 126, x: 12, y: 64.5 },
        fit: 'center',
        fontSize: 8,
        id: 'line_2',
        labelKey: 'line_2',
        placeholder: 'Musterstraße 12',
      },
      {
        bounds: { height: 10, width: 126, x: 12, y: 76 },
        fit: 'center',
        fontSize: 8,
        id: 'line_3',
        labelKey: 'line_3',
        placeholder: '10115 Berlin',
      },
      {
        bounds: { height: 10, width: 126, x: 12, y: 87.5 },
        fit: 'center',
        fontSize: 8,
        id: 'line_4',
        labelKey: 'line_4',
        placeholder: 'USt-IdNr. DE123456789',
      },
    ],
  },
  {
    elements: [],
    id: 'eu_round',
    nameKey: 'eu_round',
    preferredFonts: WESTERN_FONTS,
    sharedFont: true,
    sizes: [{ label: '40mm', widthMm: 40 }],
    svgContent: ROUND_DOUBLE_RING,
    texts: [
      { baseline: 0, fontSize: 9, id: 'arc_top', labelKey: 'company_name', placeholder: 'MUSTERFIRMA GMBH' },
      {
        bounds: { height: 12, width: 44, x: 53, y: 62 },
        fit: 'center',
        fontSize: 9,
        id: 'line_1',
        labelKey: 'line_1',
        placeholder: 'Geschäfts-',
      },
      {
        bounds: { height: 12, width: 44, x: 53, y: 76 },
        fit: 'center',
        fontSize: 9,
        id: 'line_2',
        labelKey: 'line_2',
        placeholder: 'führung',
      },
      { baseline: 1, fontSize: 9, id: 'arc_bottom', labelKey: 'city', placeholder: 'BERLIN' },
    ],
  },
];

export const getTemplateById = (id: string): StampTemplate | undefined => STAMP_TEMPLATES.find((t) => t.id === id);
