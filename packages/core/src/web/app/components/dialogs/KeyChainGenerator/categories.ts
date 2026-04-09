import fontFuncs from '@core/app/actions/beambox/font-funcs';
import getDefaultFont from '@core/helpers/fonts/getDefaultFont';

import { BASE_RECTANGLE } from './constants';
import type {
  ElementOptionDef,
  ElementOptionValues,
  HoleOptionDef,
  HoleOptionValues,
  KeyChainCategory,
  KeyChainState,
  ShapeTextOptionDef,
  ShapeTextOptionValues,
  TextOptionDef,
  TextOptionValues,
} from './types';

export const DEFAULT_HOLE: HoleOptionValues = {
  diameter: 3,
  enabled: true,
  offset: 0,
  position: 0,
  thickness: 1,
  type: 'ring',
};

export const DEFAULT_ELEMENT: ElementOptionValues = {
  enabled: true,
  shapeKey: '',
};

export const DEFAULT_TEXT: Omit<TextOptionValues, 'font'> = {
  content: 'Key Chain',
  enabled: true,
  fontSize: 40,
  letterSpacing: 0,
  lineSpacing: 1.2,
};

export const DEFAULT_SHAPE_TEXT: Omit<ShapeTextOptionValues, 'font'> = {
  fontSize: 80,
  outlineOffset: 3,
  text: 'Awesome!',
};

export const KEYCHAIN_CATEGORIES: KeyChainCategory[] = [
  {
    defaultViewBox: { height: 600, width: 300, x: 0, y: 0 },
    id: 'rectangle',
    nameKey: 'rectangle',
    options: [
      {
        bounds: { height: 120, width: 120, x: 90, y: 400 },
        defaults: DEFAULT_ELEMENT,
        id: '1',
        type: 'element',
      },
      {
        defaults: DEFAULT_HOLE,
        id: '1',
        startPositionRef: 'topCenter',
        type: 'hole',
      },
      {
        bounds: { height: 400, width: 240, x: 30, y: 100 },
        defaults: DEFAULT_TEXT,
        id: '1',
        type: 'text',
      },
    ],
    svgContent: BASE_RECTANGLE,
    thumbnail: '',
  },
  {
    defaultViewBox: { height: 0, width: 0, x: 0, y: 0 },
    id: 'text',
    nameKey: 'text',
    options: [
      {
        defaults: DEFAULT_SHAPE_TEXT,
        id: '1',
        type: 'shapeText',
      },
      {
        defaults: DEFAULT_HOLE,
        id: '1',
        startPositionRef: 'leftCenter',
        type: 'hole',
      },
    ],
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
    elements: {},
    holes: {},
    shapeTexts: {},
    texts: {},
  };

  const { font_family, font_postscriptName } = getDefaultFont();
  const fontObj = fontFuncs.getFontOfPostscriptName(font_postscriptName);

  for (const option of category.options) {
    if (option.type === 'hole') {
      const holeDef = option as HoleOptionDef;

      result.holes[holeDef.id] = { ...holeDef.defaults };
    } else if (option.type === 'text') {
      const textDef = option as TextOptionDef;

      result.texts[textDef.id] = {
        ...textDef.defaults,
        font: { family: font_family, postscriptName: font_postscriptName, style: fontObj?.style ?? 'Regular' },
      };
    } else if (option.type === 'element') {
      const elementDef = option as ElementOptionDef;

      result.elements[elementDef.id] = { ...elementDef.defaults };
    } else if (option.type === 'shapeText') {
      const shapeTextDef = option as ShapeTextOptionDef;

      result.shapeTexts[shapeTextDef.id] = {
        ...shapeTextDef.defaults,
        font: { family: font_family, postscriptName: font_postscriptName, style: fontObj?.style ?? 'Regular' },
      };
    }
  }

  return result;
};

export const getDefaultState = (): KeyChainState => {
  const category = getDefaultCategory();

  return getStateForCategory(category);
};
