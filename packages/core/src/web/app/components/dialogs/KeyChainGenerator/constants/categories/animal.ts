import type { KeyChainCategory } from '../../types';

import {
  ANIMAL_1,
  ANIMAL_2,
  ANIMAL_3,
  ANIMAL_4,
  ANIMAL_5,
  ANIMAL_6,
  ANIMAL_7,
  ANIMAL_8,
  ANIMAL_9,
  ANIMAL_10,
  ANIMAL_11,
  ANIMAL_12,
  ANIMAL_13,
  ANIMAL_14,
  ANIMAL_15,
  ANIMAL_16,
  ANIMAL_17,
  ANIMAL_18,
} from './basePaths';
import { DEFAULT_HOLE, DEFAULT_TEXT } from './defaults';

export const animal: KeyChainCategory = {
  defaultSize: { dimension: 'width', value: 50 },
  defaultViewBox: { height: 1000, width: 1000, x: 0, y: 0 },
  id: 'animal',
  nameKey: 'animal',
  options: {
    holes: [
      {
        defaults: DEFAULT_HOLE,
        fieldVisibility: { offset: ['ring'], position: ['ring'] },
        id: '1',
        startPositionRef: 'topLeft',
      },
    ],
    texts: [
      {
        bounds: { height: 120, width: 400, x: 300, y: 480 },
        defaults: { ...DEFAULT_TEXT, fontSize: 100, text: 'Jack' },
        id: '1',
      },
    ],
    variants: [
      {
        key: 'animal_1',
        options: {
          holes: [
            {
              baseOffset: 0.5,
              defaults: DEFAULT_HOLE,
              fieldVisibility: { offset: ['ring'], position: ['ring'] },
              id: '1',
              startPositionRef: 'topLeft',
            },
          ],
          texts: [
            {
              bounds: { height: 120, width: 430, x: 310, y: 390 },
              defaults: { ...DEFAULT_TEXT, fontSize: 100, text: 'Jack' },
              id: '1',
            },
          ],
        },
        svgContent: ANIMAL_1,
      },
      {
        key: 'animal_2',
        options: {
          texts: [
            {
              bounds: { height: 180, width: 490, x: 310, y: 335 },
              defaults: { ...DEFAULT_TEXT, fontSize: 100, text: 'Jack' },
              id: '1',
            },
          ],
        },
        svgContent: ANIMAL_2,
      },
      {
        key: 'animal_3',
        options: {
          holes: [
            {
              baseOffset: 1.5,
              defaults: DEFAULT_HOLE,
              fieldVisibility: { offset: ['ring'], position: ['ring'] },
              id: '1',
              positionOffset: -4,
              startPositionRef: 'topLeft',
            },
          ],
          texts: [
            {
              bounds: { height: 170, width: 600, x: 300, y: 340 },
              defaults: { ...DEFAULT_TEXT, fontSize: 100, text: 'Jack' },
              id: '1',
            },
          ],
        },
        svgContent: ANIMAL_3,
      },
      {
        key: 'animal_4',
        options: {
          holes: [
            {
              baseOffset: 1.5,
              defaults: DEFAULT_HOLE,
              fieldVisibility: { offset: ['ring'], position: ['ring'] },
              id: '1',
              startPositionRef: 'topLeft',
            },
          ],
          texts: [
            {
              bounds: { height: 120, width: 430, x: 234, y: 415 },
              defaults: { ...DEFAULT_TEXT, fontSize: 100, text: 'Jack' },
              id: '1',
            },
          ],
        },
        svgContent: ANIMAL_4,
      },
      {
        key: 'animal_5',
        options: {
          texts: [
            {
              bounds: { height: 140, width: 550, x: 200, y: 405 },
              defaults: { ...DEFAULT_TEXT, fontSize: 100, text: 'Jack' },
              id: '1',
            },
          ],
        },
        svgContent: ANIMAL_5,
      },
      {
        key: 'animal_6',
        options: {
          holes: [
            {
              defaults: DEFAULT_HOLE,
              fieldVisibility: { offset: ['ring'], position: ['ring'] },
              id: '1',
              positionOffset: 1,
              startPositionRef: 'topLeft',
            },
          ],
          texts: [
            {
              bounds: { height: 160, width: 460, x: 400, y: 340 },
              defaults: { ...DEFAULT_TEXT, fontSize: 100, text: 'Jack' },
              id: '1',
            },
          ],
        },
        svgContent: ANIMAL_6,
      },
      {
        key: 'animal_7',
        options: {
          holes: [
            {
              baseOffset: 1.5,
              defaults: DEFAULT_HOLE,
              fieldVisibility: { offset: ['ring'], position: ['ring'] },
              id: '1',
              startPositionRef: 'topLeft',
            },
          ],
          texts: [
            {
              bounds: { height: 100, width: 370, x: 400, y: 465 },
              defaults: { ...DEFAULT_TEXT, fontSize: 100, text: 'Jack' },
              id: '1',
            },
          ],
        },
        svgContent: ANIMAL_7,
      },
      {
        key: 'animal_8',
        options: {
          holes: [
            {
              defaults: DEFAULT_HOLE,
              fieldVisibility: { offset: ['ring'], position: ['ring'] },
              id: '1',
              startPositionRef: 'topCenter',
            },
          ],
          texts: [
            {
              bounds: { height: 90, width: 330, x: 335, y: 410 },
              defaults: { ...DEFAULT_TEXT, fontSize: 100, text: 'Jack' },
              id: '1',
            },
          ],
        },
        svgContent: ANIMAL_8,
      },
      {
        key: 'animal_9',
        options: {
          holes: [
            {
              defaults: DEFAULT_HOLE,
              fieldVisibility: { offset: ['ring'], position: ['ring'] },
              id: '1',
              positionOffset: 1,
              startPositionRef: 'topLeft',
            },
          ],
          texts: [
            {
              bounds: { height: 180, width: 550, x: 300, y: 370 },
              defaults: { ...DEFAULT_TEXT, fontSize: 100, text: 'Jack' },
              id: '1',
            },
          ],
        },
        svgContent: ANIMAL_9,
      },
      {
        key: 'animal_10',
        options: {
          holes: [
            {
              baseOffset: 1.5,
              defaults: DEFAULT_HOLE,
              fieldVisibility: { offset: ['ring'], position: ['ring'] },
              id: '1',
              startPositionRef: 'topLeft',
            },
          ],
          texts: [
            {
              bounds: { height: 130, width: 470, x: 270, y: 400 },
              defaults: { ...DEFAULT_TEXT, fontSize: 100, text: 'Jack' },
              id: '1',
            },
          ],
        },
        svgContent: ANIMAL_10,
      },
      {
        key: 'animal_11',
        options: {
          texts: [
            {
              bounds: { height: 110, width: 400, x: 260, y: 470 },
              defaults: { ...DEFAULT_TEXT, fontSize: 100, text: 'Jack' },
              id: '1',
            },
          ],
        },
        svgContent: ANIMAL_11,
      },
      {
        key: 'animal_12',
        options: {
          holes: [
            {
              defaults: DEFAULT_HOLE,
              fieldVisibility: { offset: ['ring'], position: ['ring'] },
              id: '1',
              positionOffset: 14,
              startPositionRef: 'topLeft',
            },
          ],
          texts: [
            {
              bounds: { height: 110, width: 390, x: 340, y: 525 },
              defaults: { ...DEFAULT_TEXT, fontSize: 100, text: 'Jack' },
              id: '1',
            },
          ],
        },
        svgContent: ANIMAL_12,
      },
      {
        key: 'animal_13',
        options: {
          holes: [
            {
              defaults: DEFAULT_HOLE,
              fieldVisibility: { offset: ['ring'], position: ['ring'] },
              id: '1',
              positionOffset: 3,
              startPositionRef: 'topLeft',
            },
          ],
          texts: [
            {
              bounds: { height: 150, width: 520, x: 310, y: 400 },
              defaults: { ...DEFAULT_TEXT, fontSize: 100, text: 'Jack' },
              id: '1',
            },
          ],
        },
        svgContent: ANIMAL_13,
      },
      {
        key: 'animal_14',
        options: {
          holes: [
            {
              defaults: DEFAULT_HOLE,
              fieldVisibility: { offset: ['ring'], position: ['ring'] },
              id: '1',
              positionOffset: 1.5,
              startPositionRef: 'topLeft',
            },
          ],
          texts: [
            {
              bounds: { height: 170, width: 500, x: 300, y: 400 },
              defaults: { ...DEFAULT_TEXT, fontSize: 100, text: 'Jack' },
              id: '1',
            },
          ],
        },
        svgContent: ANIMAL_14,
      },
      {
        key: 'animal_15',
        options: {
          texts: [
            {
              bounds: { height: 120, width: 470, x: 325, y: 405 },
              defaults: { ...DEFAULT_TEXT, fontSize: 100, text: 'Jack' },
              id: '1',
            },
          ],
        },
        svgContent: ANIMAL_15,
      },
      {
        key: 'animal_16',
        options: {
          holes: [
            {
              defaults: DEFAULT_HOLE,
              fieldVisibility: { offset: ['ring'], position: ['ring'] },
              id: '1',
              positionOffset: -6.5,
              startPositionRef: 'topRight',
            },
          ],
          texts: [
            {
              bounds: { height: 150, width: 370, x: 320, y: 425 },
              defaults: { ...DEFAULT_TEXT, fontSize: 100, text: 'Jack' },
              id: '1',
            },
          ],
        },
        svgContent: ANIMAL_16,
      },
      {
        key: 'animal_17',
        options: {
          holes: [
            {
              defaults: DEFAULT_HOLE,
              fieldVisibility: { offset: ['ring'], position: ['ring'] },
              id: '1',
              positionOffset: 11.5,
              startPositionRef: 'topLeft',
            },
          ],
          texts: [
            {
              bounds: { height: 80, width: 270, x: 380, y: 460 },
              defaults: { ...DEFAULT_TEXT, fontSize: 100, text: 'Jack' },
              id: '1',
            },
          ],
        },
        svgContent: ANIMAL_17,
      },
      {
        key: 'animal_18',
        options: {
          holes: [
            {
              defaults: DEFAULT_HOLE,
              fieldVisibility: { offset: ['ring'], position: ['ring'] },
              id: '1',
              positionOffset: -4.5,
              startPositionRef: 'topLeft',
            },
          ],
          texts: [
            {
              bounds: { height: 130, width: 325, x: 360, y: 485 },
              defaults: { ...DEFAULT_TEXT, fontSize: 100, text: 'Jack' },
              id: '1',
            },
          ],
        },
        svgContent: ANIMAL_18,
      },
    ],
  },
  svgContent: ANIMAL_1,
  thumbnail: 'core-img/keychain-generator/animal.jpg',
};
