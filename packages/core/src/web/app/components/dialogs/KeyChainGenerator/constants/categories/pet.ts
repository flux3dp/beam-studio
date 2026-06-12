import type { KeyChainCategory } from '../../types';

import { CAT_1, CAT_2, CAT_3, DOG_1, DOG_2, DOG_3 } from './basePaths';
import { DEFAULT_HOLE, DEFAULT_TEXT } from './defaults';

export const pet: KeyChainCategory = {
  defaultSize: { dimension: 'width', value: 50 },
  defaultViewBox: { height: 1000, width: 1000, x: 0, y: 0 },
  id: 'pet',
  nameKey: 'pet',
  options: {
    variants: [
      {
        key: 'cat_1',
        options: {
          holes: [
            {
              defaults: DEFAULT_HOLE,
              id: '1',
              startPositionRef: 'topCenter',
            },
          ],
          texts: [
            {
              bounds: { height: 120, width: 500, x: 250, y: 490 },
              defaults: { ...DEFAULT_TEXT, fontSize: 140 },
              id: '1',
            },
          ],
        },
        svgContent: CAT_1,
      },
      {
        key: 'cat_2',
        options: {
          holes: [
            {
              defaults: DEFAULT_HOLE,
              fieldVisibility: { offset: ['ring'], position: ['ring'] },
              id: '1',
              positionOffset: 8,
              startPositionRef: 'topCenter',
            },
          ],
          texts: [
            {
              bounds: { height: 120, width: 500, x: 260, y: 550 },
              defaults: { ...DEFAULT_TEXT, fontSize: 140 },
              id: '1',
            },
          ],
        },
        svgContent: CAT_2,
      },
      {
        key: 'cat_3',
        options: {
          holes: [
            {
              baseOffset: 0.5,
              defaults: DEFAULT_HOLE,
              fieldVisibility: { offset: ['ring'], position: ['ring'] },
              id: '1',
              positionOffset: 7.5,
              startPositionRef: 'topCenter',
            },
          ],
          texts: [
            {
              bounds: { height: 120, width: 430, x: 333, y: 441 },
              defaults: { ...DEFAULT_TEXT, fontSize: 140 },
              id: '1',
            },
          ],
        },
        svgContent: CAT_3,
      },
      {
        key: 'dog_1',
        options: {
          holes: [
            {
              defaults: DEFAULT_HOLE,
              id: '1',
              positionOffset: 1.5,
              startPositionRef: 'topCenter',
            },
          ],
          texts: [
            {
              bounds: { height: 120, width: 500, x: 258, y: 504 },
              defaults: { ...DEFAULT_TEXT, fontSize: 140 },
              id: '1',
            },
          ],
        },
        svgContent: DOG_1,
      },
      {
        key: 'dog_2',
        options: {
          holes: [
            {
              baseOffset: 0.5,
              defaults: DEFAULT_HOLE,
              fieldVisibility: { offset: ['ring'], position: ['ring'] },
              id: '1',
              positionOffset: 6,
              startPositionRef: 'topLeft',
            },
          ],
          texts: [
            {
              bounds: { height: 120, width: 500, x: 290, y: 450 },
              defaults: { ...DEFAULT_TEXT, fontSize: 140 },
              id: '1',
            },
          ],
        },
        svgContent: DOG_2,
      },
      {
        key: 'dog_3',
        options: {
          holes: [
            {
              baseOffset: 0.5,
              defaults: DEFAULT_HOLE,
              fieldVisibility: { offset: ['ring'], position: ['ring'] },
              id: '1',
              positionOffset: -3,
              startPositionRef: 'topRight',
            },
          ],
          texts: [
            {
              bounds: { height: 120, width: 440, x: 255, y: 440 },
              defaults: { ...DEFAULT_TEXT, fontSize: 140 },
              id: '1',
            },
          ],
        },
        svgContent: DOG_3,
      },
    ],
  },
  svgContent: CAT_1,
  thumbnail: 'core-img/keychain-generator/pet.jpg',
};
