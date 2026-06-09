import type { KeyChainCategory } from '../../types';
import { OVAL_TEXT_PATH_BOTTOM, OVAL_TEXT_PATH_TOP } from '../decorations';
import { DEFAULT_ELEMENT_OPTIONS } from '../elementOptions';

import {
  CAPSULE,
  OVAL,
  POLYGONAL_1,
  POLYGONAL_2,
  POLYGONAL_3,
  POLYGONAL_4,
  POLYGONAL_5,
  POLYGONAL_6,
  POLYGONAL_7,
  POLYGONAL_8,
  QUAD_1,
  QUAD_2,
  QUAD_3,
  QUAD_4,
  ROUND_ARCH,
  ROUNDED_1,
  ROUNDED_2,
  ROUNDED_3,
  ROUNDED_4,
  ROUNDED_5,
  ROUNDED_6,
  SURFING_BOARD,
  TAG,
} from './basePaths';
import { DEFAULT_DECORATION_PATH, DEFAULT_ELEMENT, DEFAULT_HOLE, DEFAULT_TEXT } from './defaults';

export const surfingBoard: KeyChainCategory = {
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
        defaults: DEFAULT_HOLE,
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
  thumbnail: 'core-img/keychain-generator/surfing-board.jpg',
};

export const capsule: KeyChainCategory = {
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
        defaults: DEFAULT_HOLE,
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
  thumbnail: 'core-img/keychain-generator/capsule.jpg',
};

export const oval: KeyChainCategory = {
  defaultSize: { dimension: 'width', value: 50 },
  defaultViewBox: { height: 1000, width: 1000, x: 0, y: 0 },
  id: 'oval',
  nameKey: 'oval',
  options: {
    holes: [
      {
        defaults: { ...DEFAULT_HOLE, offset: -3 },
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
  thumbnail: 'core-img/keychain-generator/oval.jpg',
};

export const roundArch: KeyChainCategory = {
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
        defaults: DEFAULT_HOLE,
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
  thumbnail: 'core-img/keychain-generator/round-arch.jpg',
};

export const tag: KeyChainCategory = {
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
        defaults: DEFAULT_HOLE,
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
        defaults: { ...DEFAULT_TEXT, fontSize: 35, text: 'A small object to hold Big Memories' },
        id: '2',
      },
    ],
  },
  svgContent: TAG,
  thumbnail: 'core-img/keychain-generator/tag.jpg',
};

export const rounded: KeyChainCategory = {
  defaultSize: { dimension: 'width', value: 50 },
  defaultViewBox: { height: 1000, width: 1000, x: 0, y: 0 },
  id: 'rounded',
  nameKey: 'rounded',
  options: {
    holes: [{ defaults: DEFAULT_HOLE, id: '1', startPositionRef: 'topCenter' }],
    texts: [
      {
        bounds: { height: 280, width: 520, x: 240, y: 360 },
        defaults: { ...DEFAULT_TEXT, fontSize: 140, text: 'Jack' },
        id: '1',
      },
    ],
    variants: [
      {
        key: 'rounded_1',
        svgContent: ROUNDED_1,
      },
      {
        key: 'rounded_2',
        options: {
          texts: [
            {
              bounds: { height: 240, width: 520, x: 240, y: 475 },
              defaults: { ...DEFAULT_TEXT, fontSize: 100, text: 'Jack' },
              id: '1',
            },
          ],
        },
        svgContent: ROUNDED_2,
      },
      {
        key: 'rounded_3',
        svgContent: ROUNDED_3,
      },
      {
        key: 'rounded_4',
        svgContent: ROUNDED_4,
      },
      {
        key: 'rounded_5',
        svgContent: ROUNDED_5,
      },
      {
        key: 'rounded_6',
        svgContent: ROUNDED_6,
      },
    ],
  },
  svgContent: ROUNDED_1,
  thumbnail: '',
};

export const polygonal: KeyChainCategory = {
  defaultSize: { dimension: 'width', value: 50 },
  defaultViewBox: { height: 1000, width: 1000, x: 0, y: 0 },
  id: 'polygonal',
  nameKey: 'polygonal',
  options: {
    holes: [{ defaults: DEFAULT_HOLE, id: '1', startPositionRef: 'topCenter' }],
    variants: [
      {
        key: 'polygonal_1',
        options: {
          texts: [
            {
              bounds: { height: 140, width: 520, x: 240, y: 635 },
              defaults: { ...DEFAULT_TEXT, fontSize: 140, text: 'Jack' },
              id: '1',
            },
          ],
        },
        svgContent: POLYGONAL_1,
      },
      {
        key: 'polygonal_2',
        options: {
          texts: [
            {
              bounds: { height: 260, width: 520, x: 240, y: 400 },
              defaults: { ...DEFAULT_TEXT, fontSize: 100, text: 'Jack' },
              id: '1',
            },
          ],
        },
        svgContent: POLYGONAL_2,
      },
      {
        key: 'polygonal_3',
        options: {
          texts: [
            {
              bounds: { height: 280, width: 580, x: 210, y: 360 },
              defaults: { ...DEFAULT_TEXT, fontSize: 100, text: 'Jack' },
              id: '1',
            },
          ],
        },
        svgContent: POLYGONAL_3,
      },
      {
        key: 'polygonal_4',
        options: {
          texts: [
            {
              bounds: { height: 280, width: 580, x: 210, y: 360 },
              defaults: { ...DEFAULT_TEXT, fontSize: 100, text: 'Jack' },
              id: '1',
            },
          ],
        },
        svgContent: POLYGONAL_4,
      },
      {
        key: 'polygonal_5',
        options: {
          texts: [
            {
              bounds: { height: 160, width: 300, x: 350, y: 445 },
              defaults: { ...DEFAULT_TEXT, fontSize: 100, text: 'Jack' },
              id: '1',
            },
          ],
        },
        svgContent: POLYGONAL_5,
      },
      {
        key: 'polygonal_6',
        options: {
          texts: [
            {
              bounds: { height: 120, width: 440, x: 280, y: 440 },
              defaults: { ...DEFAULT_TEXT, fontSize: 110, text: 'Jack' },
              id: '1',
            },
          ],
        },
        svgContent: POLYGONAL_6,
      },
      {
        key: 'polygonal_7',
        options: {
          texts: [
            {
              bounds: { height: 250, width: 500, x: 250, y: 375 },
              defaults: { ...DEFAULT_TEXT, fontSize: 110, text: 'Jack' },
              id: '1',
            },
          ],
        },
        svgContent: POLYGONAL_7,
      },
      {
        key: 'polygonal_8',
        options: {
          texts: [
            {
              bounds: { height: 240, width: 500, x: 250, y: 380 },
              defaults: { ...DEFAULT_TEXT, fontSize: 110, text: 'Jack' },
              id: '1',
            },
          ],
        },
        svgContent: POLYGONAL_8,
      },
    ],
  },
  svgContent: POLYGONAL_1,
  thumbnail: '',
};

export const quadrilateral: KeyChainCategory = {
  defaultSize: { dimension: 'width', value: 50 },
  defaultViewBox: { height: 1000, width: 1000, x: 0, y: 0 },
  id: 'quadrilateral',
  nameKey: 'quadrilateral',
  options: {
    holes: [{ defaults: DEFAULT_HOLE, id: '1', startPositionRef: 'topCenter' }],
    texts: [
      {
        bounds: { height: 280, width: 520, x: 240, y: 360 },
        defaults: { ...DEFAULT_TEXT, fontSize: 140, text: 'Jack' },
        id: '1',
      },
    ],
    variants: [
      {
        key: 'quad_1',
        svgContent: QUAD_1,
      },
      {
        key: 'quad_2',
        options: {
          texts: [
            {
              bounds: { height: 280, width: 520, x: 240, y: 360 },
              defaults: { ...DEFAULT_TEXT, fontSize: 140, text: 'Jack' },
              id: '1',
            },
          ],
        },
        svgContent: QUAD_2,
      },
      {
        key: 'quad_3',
        svgContent: QUAD_3,
      },
      {
        key: 'quad_4',
        svgContent: QUAD_4,
      },
    ],
  },
  svgContent: QUAD_1,
  thumbnail: '',
};
