import fontFuncs from '@core/app/actions/beambox/font-funcs';
import getDefaultFont from '@core/helpers/fonts/getDefaultFont';

import {
  DEFAULT_CUSTOM_SHAPE_ELEMENT,
  DEFAULT_CUSTOM_SHAPE_TEXT,
  DEFAULT_OUTLINE_OFFSET,
  KEYCHAIN_CATEGORIES,
} from './constants/categories';
import type { KeyChainCategory, KeyChainState } from './types';

export {
  DEFAULT_CUSTOM_SHAPE_ELEMENT,
  DEFAULT_CUSTOM_SHAPE_TEXT,
  DEFAULT_DECORATION_PATH,
  DEFAULT_ELEMENT,
  DEFAULT_HOLE,
  DEFAULT_OUTLINE_OFFSET,
  DEFAULT_TEXT,
  KEYCHAIN_CATEGORIES,
} from './constants/categories';

export const resolveCategory = (category: KeyChainCategory, variantKey?: string): KeyChainCategory => {
  const { variants } = category.options;

  if (!variants || variants.length === 0) return category;

  const variant = variantKey ? (variants.find((v) => v.key === variantKey) ?? variants[0]) : variants[0];

  return {
    ...category,
    defaultSize: variant.defaultSize ?? category.defaultSize,
    defaultViewBox: variant.defaultViewBox ?? category.defaultViewBox,
    options: {
      ...category.options,
      ...variant.options,
    },
    svgContent: variant.svgContent,
  };
};

export const getDefaultCategory = (): KeyChainCategory => KEYCHAIN_CATEGORIES[0];

export const getCategoryById = (id: string): KeyChainCategory =>
  KEYCHAIN_CATEGORIES.find((c) => c.id === id) ?? getDefaultCategory();

export const getStateForCategory = (category: KeyChainCategory): KeyChainState => {
  const { font_family, font_postscriptName } = getDefaultFont();
  const fontObj = fontFuncs.getFontOfPostscriptName(font_postscriptName);

  const variantKey = category.options.variants?.[0]?.key ?? '';
  const resolved = resolveCategory(category, variantKey);
  const {
    options: {
      customShapeElement,
      customShapeText,
      decorationPaths: decorations = [],
      elements = [],
      holes = [],
      texts = [],
    },
  } = resolved;

  const result: KeyChainState = {
    categoryId: category.id,
    customShapeElement: customShapeElement ? { ...customShapeElement.defaults } : { ...DEFAULT_CUSTOM_SHAPE_ELEMENT },
    customShapeText: customShapeText
      ? {
          ...customShapeText.defaults,
          font: { family: font_family, postscriptName: font_postscriptName, style: fontObj?.style ?? 'Regular' },
        }
      : {
          ...DEFAULT_CUSTOM_SHAPE_TEXT,
          font: { family: font_family, postscriptName: font_postscriptName, style: fontObj?.style ?? 'Regular' },
        },
    decorationPaths: {},
    elements: {},
    holes: {},
    outlineOffset: DEFAULT_OUTLINE_OFFSET,
    size: { ...resolved.defaultSize },
    texts: {},
    variantKey,
  };

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

  return result;
};

export const getDefaultState = (): KeyChainState => {
  const category = getDefaultCategory();

  return getStateForCategory(category);
};
