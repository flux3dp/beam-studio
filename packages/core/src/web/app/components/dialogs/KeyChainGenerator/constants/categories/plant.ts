import type { KeyChainCategory } from '../../types';

import {
  PLANT_1,
  PLANT_2,
  PLANT_3,
  PLANT_4,
  PLANT_5,
  PLANT_6,
  PLANT_7,
  PLANT_8,
  PLANT_9,
  PLANT_10,
  PLANT_11,
} from './basePaths';
import { DEFAULT_HOLE, DEFAULT_TEXT } from './defaults';

export const plant: KeyChainCategory = {
  defaultSize: { dimension: 'width', value: 50 },
  defaultViewBox: { height: 1000, width: 1000, x: 0, y: 0 },
  id: 'plant',
  nameKey: 'plant',
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
        bounds: { height: 120, width: 420, x: 290, y: 440 },
        defaults: { ...DEFAULT_TEXT, fontSize: 110 },
        id: '1',
      },
    ],
    variants: [
      {
        key: 'plant_1',
        svgContent: PLANT_1,
      },
      {
        key: 'plant_2',
        options: {
          holes: [
            {
              defaults: DEFAULT_HOLE,
              fieldVisibility: { offset: ['ring'], position: ['ring'] },
              id: '1',
              positionOffset: -0.5,
              startPositionRef: 'topCenter',
            },
          ],
          texts: [
            {
              bounds: { height: 120, width: 400, x: 300, y: 430 },
              defaults: { ...DEFAULT_TEXT, fontSize: 100 },
              id: '1',
            },
          ],
        },
        svgContent: PLANT_2,
      },
      {
        key: 'plant_3',
        options: {
          texts: [
            {
              bounds: { height: 300, width: 420, x: 290, y: 350 },
              defaults: { ...DEFAULT_TEXT, fontSize: 110 },
              id: '1',
            },
          ],
        },
        svgContent: PLANT_3,
      },
      {
        key: 'plant_4',
        options: {
          texts: [
            {
              bounds: { height: 200, width: 420, x: 290, y: 400 },
              defaults: { ...DEFAULT_TEXT, fontSize: 110 },
              id: '1',
            },
          ],
        },
        svgContent: PLANT_4,
      },
      {
        key: 'plant_5',
        options: {
          texts: [
            {
              bounds: { height: 200, width: 600, x: 200, y: 400 },
              defaults: { ...DEFAULT_TEXT, fontSize: 110 },
              id: '1',
            },
          ],
        },
        svgContent: PLANT_5,
      },
      {
        key: 'plant_6',
        options: {
          holes: [
            {
              defaults: DEFAULT_HOLE,
              fieldVisibility: { offset: ['ring'], position: ['ring'] },
              id: '1',
              positionOffset: -5,
              startPositionRef: 'topRight',
            },
          ],
          texts: [
            {
              bounds: { height: 120, width: 480, x: 290, y: 440 },
              defaults: { ...DEFAULT_TEXT, fontSize: 100 },
              id: '1',
            },
          ],
        },
        svgContent: PLANT_6,
      },
      {
        key: 'plant_7',
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
              bounds: { height: 300, width: 450, x: 275, y: 350 },
              defaults: { ...DEFAULT_TEXT, fontSize: 100 },
              id: '1',
            },
          ],
        },
        svgContent: PLANT_7,
      },
      {
        key: 'plant_8',
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
              bounds: { height: 180, width: 450, x: 275, y: 410 },
              defaults: { ...DEFAULT_TEXT, fontSize: 100 },
              id: '1',
            },
          ],
        },
        svgContent: PLANT_8,
      },
      {
        key: 'plant_9',
        options: {
          texts: [
            {
              bounds: { height: 200, width: 465, x: 250, y: 400 },
              defaults: { ...DEFAULT_TEXT, fontSize: 100 },
              id: '1',
            },
          ],
        },
        svgContent: PLANT_9,
      },
      {
        key: 'plant_10',
        options: {
          holes: [
            {
              defaults: DEFAULT_HOLE,
              fieldVisibility: { offset: ['ring'], position: ['ring'] },
              id: '1',
              positionOffset: 4,
              startPositionRef: 'topCenter',
            },
          ],
          texts: [
            {
              bounds: { height: 120, width: 372, x: 378, y: 375 },
              defaults: { ...DEFAULT_TEXT, fontSize: 100 },
              id: '1',
            },
          ],
        },
        svgContent: PLANT_10,
      },
      {
        key: 'plant_11',
        options: {
          texts: [
            {
              bounds: { height: 280, width: 370, x: 315, y: 400 },
              defaults: { ...DEFAULT_TEXT, fontSize: 100 },
              id: '1',
            },
          ],
        },
        svgContent: PLANT_11,
      },
    ],
  },
  svgContent: PLANT_1,
  thumbnail: 'core-img/keychain-generator/plant.jpg',
};
