import fontFuncs from '@core/app/actions/beambox/font-funcs';
import getDefaultFont from '@core/helpers/fonts/getDefaultFont';

import { BASE_RECTANGLE } from './constants';
import type {
  CustomShapeOptionValues,
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

export const DEFAULT_CUSTOM_SHAPE: Omit<CustomShapeOptionValues, 'font'> = {
  element: { positionRef: 'rightCenter', shapeKey: '' },
  fontSize: 80,
  letterSpacing: 0,
  lineSpacing: 1,
  outlineOffset: 3,
  text: 'Never\nGonna\nGive You Up',
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
          startPositionRef: 'topCenter',
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
    elements: {},
    holes: {},
    size: { ...category.defaultSize },
    texts: {},
  };

  const { font_family, font_postscriptName } = getDefaultFont();
  const fontObj = fontFuncs.getFontOfPostscriptName(font_postscriptName);
  const {
    options: { customShape, elements = [], holes = [], texts = [] },
  } = category;

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
