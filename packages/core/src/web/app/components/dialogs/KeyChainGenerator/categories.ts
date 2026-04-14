import fontFuncs from '@core/app/actions/beambox/font-funcs';
import getDefaultFont from '@core/helpers/fonts/getDefaultFont';

import { BASE_RECTANGLE, HOTEL_KEY_CHAIN } from './constants/categoryShapes';
import { HOTEL_KEY_CHAIN_RIBBON_BAND } from './constants/decorations';
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
  shapeKey: '',
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
};

export const DEFAULT_CUSTOM_SHAPE: Omit<CustomShapeOptionValues, 'font'> = {
  element: { positionRef: 'rightCenter', shapeKey: '' },
  fontSize: 80,
  letterSpacing: 0,
  lineSpacing: 1,
  outlineOffset: 3,
  text: 'Awesome!',
};

export const KEYCHAIN_CATEGORIES: KeyChainCategory[] = [
  {
    defaultSize: { dimension: 'height', value: 58 },
    defaultViewBox: { height: 600, width: 300, x: 0, y: 0 },
    id: 'rectangle',
    nameKey: 'rectangle',
    options: {
      elements: [
        {
          bounds: { height: 120, width: 120, x: 90, y: 400 },
          defaults: DEFAULT_ELEMENT,
          id: '1',
        },
      ],
      holes: [
        {
          defaults: DEFAULT_HOLE,
          id: '1',
          startPositionRef: 'rightCenter',
        },
      ],
      texts: [
        {
          bounds: { height: 250, width: 240, x: 30, y: 100 },
          defaults: DEFAULT_TEXT,
          id: '1',
        },
      ],
    },
    svgContent: BASE_RECTANGLE,
    thumbnail: '',
  },
  {
    defaultSize: { dimension: 'height', value: 100 },
    defaultViewBox: { height: 1000, width: 1000, x: 0, y: 0 },
    id: 'hotel_key_chain',
    nameKey: 'hotel_key_chain',
    options: {
      decorationPaths: [
        {
          d: HOTEL_KEY_CHAIN_RIBBON_BAND,
          defaults: DEFAULT_DECORATION_PATH,
          id: '1',
          label: 'Ribbon Band',
        },
      ],
      elements: [
        {
          bounds: { height: 225, width: 225, x: 387.5, y: 263 },
          defaults: DEFAULT_ELEMENT,
          id: '1',
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
    svgContent: HOTEL_KEY_CHAIN,
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
