import { BASE_RECTANGLE } from './constants';
import type {
  HoleOptionDef,
  HoleOptionValues,
  KeyChainCategory,
  KeyChainState,
  TextOptionDef,
  TextOptionValues,
} from './types';

const DEFAULT_HOLE: HoleOptionValues = {
  diameter: 3,
  enabled: true,
  offset: 0,
  position: 0,
  thickness: 1,
};

const DEFAULT_TEXT: TextOptionValues = {
  content: '',
  enabled: true,
  fontSize: 40,
  letterSpacing: 0,
  lineSpacing: 1.2,
};

export const KEYCHAIN_CATEGORIES: KeyChainCategory[] = [
  {
    defaultViewBox: { height: 600, width: 300, x: 0, y: 0 },
    id: 'rectangle',
    nameKey: 'rectangle',
    options: [
      {
        defaults: DEFAULT_HOLE,
        id: '1',
        startPositionRef: 'topCenter',
        type: 'hole',
      },
      {
        bounds: { height: 400, width: 240, x: 30, y: 100 },
        defaults: DEFAULT_TEXT,
        id: 'text-1',
        type: 'text',
      },
    ],
    svgContent: BASE_RECTANGLE,
    thumbnail: '',
  },
];

export const getDefaultCategory = (): KeyChainCategory => KEYCHAIN_CATEGORIES[0];

export const getCategoryById = (id: string): KeyChainCategory =>
  KEYCHAIN_CATEGORIES.find((c) => c.id === id) ?? getDefaultCategory();

export const getStateForCategory = (category: KeyChainCategory): KeyChainState => {
  const result: KeyChainState = {
    categoryId: category.id,
    holes: {},
    texts: {},
  };

  for (const option of category.options) {
    if (option.type === 'hole') {
      const holeDef = option as HoleOptionDef;

      result.holes[holeDef.id] = { ...holeDef.defaults };
    } else if (option.type === 'text') {
      const textDef = option as TextOptionDef;

      result.texts[textDef.id] = { ...textDef.defaults };
    }
  }

  return result;
};

export const getDefaultState = (): KeyChainState => {
  const category = getDefaultCategory();

  return getStateForCategory(category);
};
