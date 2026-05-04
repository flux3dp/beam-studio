import fontFuncs from '@core/app/actions/beambox/font-funcs';
import getDefaultFont from '@core/helpers/fonts/getDefaultFont';

import { CAPSULE, OVAL, ROUND_ARCH, SURFING_BOARD, TAG } from './constants/categoryShapes';
import { OVAL_TEXT_PATH_BOTTOM, OVAL_TEXT_PATH_TOP } from './constants/decorations';
import { DEFAULT_ELEMENT_OPTIONS } from './constants/elementOptions';
import type {
  CustomShapeOptionValues,
  DecorationOptionValues,
  ElementOptionValues,
  HoleOptionValues,
  KeyChainCategory,
  KeyChainState,
  TextOptionValues,
} from './types';

export const DEFAULT_HOLE: HoleOptionValues = {
  diameter: 3,
  enabled: true,
  offset: 0,
  position: 0,
  thickness: 2,
  type: 'ring',
};

export const DEFAULT_ELEMENT: ElementOptionValues = {
  emboss: false,
  enabled: true,
  shapeKey: DEFAULT_ELEMENT_OPTIONS[0],
};

export const DEFAULT_TEXT: Omit<TextOptionValues, 'font'> = {
  emboss: false,
  enabled: true,
  fontSize: 40,
  letterSpacing: 0,
  lineSpacing: 1.2,
  text: 'Key Chain',
};

export const DEFAULT_DECORATION_PATH: DecorationOptionValues = {
  emboss: false,
  enabled: true,
  selectedKey: '',
};

export const DEFAULT_CUSTOM_SHAPE: Omit<CustomShapeOptionValues, 'font'> = {
  element: { enabled: true, positionRef: 'rightCenter', shapeKey: DEFAULT_ELEMENT_OPTIONS[0] },
  fontSize: 80,
  letterSpacing: 0,
  lineSpacing: 1,
  outlineOffset: 3,
  text: 'Awesome!',
};

export const KEYCHAIN_CATEGORIES: KeyChainCategory[] = [
  {
    defaultSize: { dimension: 'height', value: 80 },
    defaultViewBox: { height: 1000, width: 1000, x: 0, y: 0 },
    id: 'surfing_board',
    nameKey: 'surfing_board',
    options: {
      decorationPaths: [
        {
          defaults: { ...DEFAULT_DECORATION_PATH, selectedKey: 'ribbon_band' },
          id: '1',
          options: ['ribbon_band'],
        },
      ],
      elements: [
        {
          bounds: { height: 225, width: 225, x: 387.5, y: 263 },
          defaults: DEFAULT_ELEMENT,
          id: '1',
          options: DEFAULT_ELEMENT_OPTIONS,
        },
      ],
      holes: [
        {
          defaults: { ...DEFAULT_HOLE, type: 'punch' },
          id: '1',
          startPositionRef: 'topCenter',
        },
      ],
      texts: [
        {
          bounds: { height: 125, width: 330, x: 335, y: 512 },
          defaults: { ...DEFAULT_TEXT, fontSize: 90, text: 'Jack' },
          id: '1',
        },
        {
          bounds: { height: 125, width: 240, x: 380, y: 661 },
          defaults: { ...DEFAULT_TEXT, fontSize: 24, text: 'A small object to\nHold Big Memories' },
          id: '2',
        },
      ],
    },
    svgContent: SURFING_BOARD,
    thumbnail: '',
  },
  {
    defaultSize: { dimension: 'height', value: 50 },
    defaultViewBox: { height: 1000, width: 1000, x: 0, y: 0 },
    id: 'capsule',
    nameKey: 'capsule',
    options: {
      elements: [
        {
          bounds: { height: 250, width: 250, x: 375, y: 394 },
          defaults: DEFAULT_ELEMENT,
          id: '1',
          options: DEFAULT_ELEMENT_OPTIONS,
        },
      ],
      holes: [
        {
          defaults: { ...DEFAULT_HOLE, type: 'punch' },
          id: '1',
          startPositionRef: 'topCenter',
        },
      ],
      texts: [
        {
          bounds: { height: 100, width: 400, x: 300, y: 255 },
          defaults: { ...DEFAULT_TEXT, fontSize: 70, text: 'Jack' },
          id: '1',
        },
        {
          bounds: { height: 129, width: 334, x: 333, y: 685 },
          defaults: { ...DEFAULT_TEXT, fontSize: 35, text: 'A small object to\nHold Big Memories' },
          id: '2',
        },
      ],
    },
    svgContent: CAPSULE,
    thumbnail: '',
  },
  {
    defaultSize: { dimension: 'width', value: 50 },
    defaultViewBox: { height: 1000, width: 1000, x: 0, y: 0 },
    id: 'oval',
    nameKey: 'oval',
    options: {
      holes: [
        {
          defaults: { ...DEFAULT_HOLE, offset: -3, type: 'punch' },
          id: '1',
          startPositionRef: 'leftCenter',
        },
      ],
      texts: [
        {
          bounds: { height: 160, width: 620, x: 215, y: 420 },
          defaults: { ...DEFAULT_TEXT, fontSize: 120, text: 'Jack' },
          id: '1',
        },
        {
          defaults: { ...DEFAULT_TEXT, fontSize: 40, text: 'A small object to hold Big Memories' },
          id: '2',
          path: OVAL_TEXT_PATH_TOP,
        },
        {
          defaults: { ...DEFAULT_TEXT, fontSize: 40, text: 'A small object to hold Big Memories' },
          id: '3',
          path: OVAL_TEXT_PATH_BOTTOM,
        },
      ],
    },
    svgContent: OVAL,
    thumbnail: '',
  },
  {
    defaultSize: { dimension: 'height', value: 50 },
    defaultViewBox: { height: 1000, width: 1000, x: 0, y: 0 },
    id: 'round_arch',
    nameKey: 'round_arch',
    options: {
      elements: [
        {
          bounds: { height: 308, width: 308, x: 346, y: 272 },
          defaults: DEFAULT_ELEMENT,
          id: '1',
          options: DEFAULT_ELEMENT_OPTIONS,
        },
      ],
      holes: [
        {
          defaults: { ...DEFAULT_HOLE, type: 'punch' },
          id: '1',
          startPositionRef: 'topCenter',
        },
      ],
      texts: [
        {
          bounds: { height: 100, width: 420, x: 290, y: 625 },
          defaults: { ...DEFAULT_TEXT, fontSize: 110, text: 'Jack' },
          id: '1',
        },
        {
          bounds: { height: 85, width: 420, x: 290, y: 770 },
          defaults: { ...DEFAULT_TEXT, fontSize: 35, text: 'A small object to\nHold Big Memories' },
          id: '2',
        },
      ],
    },
    svgContent: ROUND_ARCH,
    thumbnail: '',
  },
  {
    defaultSize: { dimension: 'height', value: 50 },
    defaultViewBox: { height: 1000, width: 1000, x: 0, y: 0 },
    id: 'tag',
    nameKey: 'tag',
    options: {
      elements: [
        {
          bounds: { height: 308, width: 308, x: 346, y: 317 },
          defaults: DEFAULT_ELEMENT,
          id: '1',
          options: DEFAULT_ELEMENT_OPTIONS,
        },
      ],
      holes: [
        {
          defaults: { ...DEFAULT_HOLE, type: 'punch' },
          id: '1',
          startPositionRef: 'topCenter',
        },
      ],
      texts: [
        {
          bounds: { height: 100, width: 374, x: 313, y: 668 },
          defaults: { ...DEFAULT_TEXT, fontSize: 110, text: 'Jack' },
          id: '1',
        },
        {
          bounds: { height: 20, width: 374, x: 313, y: 787 },
          defaults: { ...DEFAULT_TEXT, fontSize: 35, text: 'A small object to\nHold Big Memories' },
          id: '2',
        },
      ],
    },
    svgContent: TAG,
    thumbnail: '',
  },
  {
    defaultSize: { dimension: 'width', value: 100 },
    defaultViewBox: { height: 0, width: 0, x: 0, y: 0 },
    id: 'text',
    isCustomShape: true,
    nameKey: 'text',
    options: {
      customShape: {
        defaults: DEFAULT_CUSTOM_SHAPE,
        elementOptions: DEFAULT_ELEMENT_OPTIONS,
      },
      holes: [
        {
          defaults: DEFAULT_HOLE,
          id: '1',
          startPositionRef: 'leftCenter',
        },
      ],
    },
    svgContent: '',
    thumbnail: '',
  },
];

export const getDefaultCategory = (): KeyChainCategory => KEYCHAIN_CATEGORIES[0];

export const getCategoryById = (id: string): KeyChainCategory =>
  KEYCHAIN_CATEGORIES.find((c) => c.id === id) ?? getDefaultCategory();

export const getStateForCategory = (category: KeyChainCategory): KeyChainState => {
  const result: KeyChainState = {
    categoryId: category.id,
    customShape: {} as any,
    decorationPaths: {},
    elements: {},
    holes: {},
    size: { ...category.defaultSize },
    texts: {},
  };

  const { font_family, font_postscriptName } = getDefaultFont();
  const fontObj = fontFuncs.getFontOfPostscriptName(font_postscriptName);
  const {
    options: { customShape, decorationPaths: decorations = [], elements = [], holes = [], texts = [] },
  } = category;

  for (const decorationDef of decorations) {
    result.decorationPaths[decorationDef.id] = { ...decorationDef.defaults };
  }

  for (const holeDefs of holes) {
    result.holes[holeDefs.id] = { ...holeDefs.defaults };
  }

  for (const textDef of texts) {
    result.texts[textDef.id] = {
      ...textDef.defaults,
      font: { family: font_family, postscriptName: font_postscriptName, style: fontObj?.style ?? 'Regular' },
    };
  }

  for (const elementDef of elements) {
    result.elements[elementDef.id] = { ...elementDef.defaults };
  }

  if (customShape) {
    const shapeDef = customShape;

    result.customShape = {
      ...shapeDef.defaults,
      font: { family: font_family, postscriptName: font_postscriptName, style: fontObj?.style ?? 'Regular' },
    };
  }

  return result;
};

export const getDefaultState = (): KeyChainState => {
  const category = getDefaultCategory();

  return getStateForCategory(category);
};
