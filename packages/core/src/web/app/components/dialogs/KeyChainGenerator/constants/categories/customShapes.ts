import type { KeyChainCategory } from '../../types';
import { DEFAULT_ELEMENT_OPTIONS, ZODIAC_ELEMENT_OPTIONS } from '../elementOptions';

import { DEFAULT_CUSTOM_SHAPE_ELEMENT, DEFAULT_CUSTOM_SHAPE_TEXT, DEFAULT_HOLE } from './defaults';

export const text: KeyChainCategory = {
  defaultSize: { dimension: 'width', value: 100 },
  defaultViewBox: { height: 0, width: 0, x: 0, y: 0 },
  id: 'text',
  isCustomShape: true,
  nameKey: 'text',
  options: {
    customShapeText: {
      defaults: DEFAULT_CUSTOM_SHAPE_TEXT,
    },
    holes: [
      {
        defaults: { ...DEFAULT_HOLE, type: 'ring' },
        id: '1',
        startPositionRef: 'topLeft',
      },
    ],
  },
  svgContent: '',
  thumbnail: 'core-img/keychain-generator/text.jpg',
};

export const zodiacText: KeyChainCategory = {
  defaultSize: { dimension: 'width', value: 50 },
  defaultViewBox: { height: 0, width: 0, x: 0, y: 0 },
  id: 'zodiac-text',
  isCustomShape: true,
  nameKey: 'zodiac',
  options: {
    customShapeElement: {
      defaults: { ...DEFAULT_CUSTOM_SHAPE_ELEMENT, shapeKey: ZODIAC_ELEMENT_OPTIONS[0] },
      options: ZODIAC_ELEMENT_OPTIONS,
      positionRef: 'topCenter',
    },
    customShapeText: {
      defaults: { ...DEFAULT_CUSTOM_SHAPE_TEXT, text: 'ZODIAC' },
    },
    holes: [
      {
        defaults: { ...DEFAULT_HOLE, type: 'ring' },
        id: '1',
        startPositionRef: 'topCenter',
      },
    ],
  },
  svgContent: '',
  thumbnail: 'core-img/keychain-generator/zodiac-text.jpg',
};

export const iconTextLeft: KeyChainCategory = {
  defaultSize: { dimension: 'width', value: 100 },
  defaultViewBox: { height: 0, width: 0, x: 0, y: 0 },
  id: 'icon-text-left',
  isCustomShape: true,
  nameKey: 'text',
  options: {
    customShapeElement: {
      defaults: DEFAULT_CUSTOM_SHAPE_ELEMENT,
      options: DEFAULT_ELEMENT_OPTIONS,
      positionRef: 'leftCenter',
    },
    customShapeText: {
      defaults: DEFAULT_CUSTOM_SHAPE_TEXT,
    },
    holes: [
      {
        defaults: { ...DEFAULT_HOLE, type: 'ring' },
        id: '1',
        startPositionRef: 'topLeft',
      },
    ],
  },
  svgContent: '',
  thumbnail: 'core-img/keychain-generator/icon-text-left.jpg',
};
