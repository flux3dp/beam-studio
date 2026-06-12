import type { KeyChainCategory } from '../../types';
import { GEOMETRY_14_TEXT_PATH } from '../decorations';

import {
  GEOMETRY_1,
  GEOMETRY_2,
  GEOMETRY_3,
  GEOMETRY_4,
  GEOMETRY_5,
  GEOMETRY_6,
  GEOMETRY_7,
  GEOMETRY_8,
  GEOMETRY_9,
  GEOMETRY_10,
  GEOMETRY_11,
  GEOMETRY_12,
  GEOMETRY_13,
  GEOMETRY_14,
} from './basePaths';
import { DEFAULT_HOLE, DEFAULT_TEXT } from './defaults';

export const geometry: KeyChainCategory = {
  defaultSize: { dimension: 'width', value: 50 },
  defaultViewBox: { height: 1000, width: 1000, x: 0, y: 0 },
  id: 'geometry',
  nameKey: 'geometry',
  options: {
    holes: [{ defaults: DEFAULT_HOLE, id: '1', startPositionRef: 'topCenter' }],
    variants: [
      {
        key: 'geometry_1',
        options: {
          texts: [
            {
              bounds: { height: 150, width: 440, x: 280, y: 390 },
              defaults: { ...DEFAULT_TEXT, fontSize: 130, text: 'Jack' },
              id: '1',
            },
          ],
        },
        svgContent: GEOMETRY_1,
      },
      {
        key: 'geometry_2',
        options: {
          texts: [
            {
              bounds: { height: 120, width: 600, x: 200, y: 440 },
              defaults: { ...DEFAULT_TEXT, fontSize: 110, text: 'Jack' },
              id: '1',
            },
          ],
        },
        svgContent: GEOMETRY_2,
      },
      {
        key: 'geometry_3',
        options: {
          holes: [
            {
              defaults: DEFAULT_HOLE,
              fieldVisibility: { offset: ['ring'], position: ['ring'] },
              id: '1',
              positionOffset: 5,
              startPositionRef: 'topCenter',
            },
          ],
          texts: [
            {
              bounds: { height: 120, width: 600, x: 175, y: 465 },
              defaults: { ...DEFAULT_TEXT, fontSize: 120, text: 'Jack' },
              id: '1',
            },
          ],
        },
        svgContent: GEOMETRY_3,
      },
      {
        key: 'geometry_4',
        options: {
          holes: [
            {
              defaults: DEFAULT_HOLE,
              fieldVisibility: { offset: ['ring'], position: ['ring'] },
              id: '1',
              positionOffset: -1,
              startPositionRef: 'topCenter',
            },
          ],
          texts: [
            {
              bounds: { height: 120, width: 600, x: 200, y: 530 },
              defaults: { ...DEFAULT_TEXT, fontSize: 120, text: 'Jack' },
              id: '1',
            },
          ],
        },
        svgContent: GEOMETRY_4,
      },
      {
        key: 'geometry_5',
        options: {
          texts: [
            {
              bounds: { height: 120, width: 666, x: 167, y: 530 },
              defaults: { ...DEFAULT_TEXT, fontSize: 120, text: 'Jack' },
              id: '1',
            },
          ],
        },
        svgContent: GEOMETRY_5,
      },
      {
        key: 'geometry_6',
        options: {
          holes: [
            {
              defaults: DEFAULT_HOLE,
              fieldVisibility: { offset: ['ring'], position: ['ring'] },
              id: '1',
              startPositionRef: 'topRight',
            },
          ],
          texts: [
            {
              bounds: { height: 120, width: 490, x: 240, y: 630 },
              defaults: { ...DEFAULT_TEXT, fontSize: 110, text: 'Jack' },
              id: '1',
            },
          ],
        },
        svgContent: GEOMETRY_6,
      },
      {
        key: 'geometry_7',
        options: {
          holes: [
            {
              defaults: DEFAULT_HOLE,
              fieldVisibility: { offset: ['ring'], position: ['ring'] },
              id: '1',
              positionOffset: -3,
              startPositionRef: 'topRight',
            },
          ],
          texts: [
            {
              bounds: { height: 90, width: 700, x: 150, y: 455 },
              defaults: { ...DEFAULT_TEXT, fontSize: 110, text: 'Jack' },
              id: '1',
            },
          ],
        },
        svgContent: GEOMETRY_7,
      },
      {
        key: 'geometry_8',
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
              bounds: { height: 200, width: 590, x: 250, y: 550 },
              defaults: { ...DEFAULT_TEXT, fontSize: 110, text: 'Jack' },
              id: '1',
            },
          ],
        },
        svgContent: GEOMETRY_8,
      },
      {
        key: 'geometry_9',
        options: {
          holes: [
            {
              defaults: DEFAULT_HOLE,
              fieldVisibility: { offset: ['ring'], position: ['ring'] },
              id: '1',
              positionOffset: 4,
              startPositionRef: 'topLeft',
            },
          ],
          texts: [
            {
              bounds: { height: 250, width: 590, x: 230, y: 450 },
              defaults: { ...DEFAULT_TEXT, fontSize: 120, text: 'Jack' },
              id: '1',
            },
          ],
        },
        svgContent: GEOMETRY_9,
      },
      {
        key: 'geometry_10',
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
              bounds: { height: 120, width: 480, x: 260, y: 650 },
              defaults: { ...DEFAULT_TEXT, fontSize: 100, text: 'Jack' },
              id: '1',
            },
          ],
        },
        svgContent: GEOMETRY_10,
      },
      {
        key: 'geometry_11',
        options: {
          holes: [
            {
              defaults: DEFAULT_HOLE,
              fieldVisibility: { offset: ['ring'], position: ['ring'] },
              id: '1',
              startPositionRef: 'topRight',
            },
          ],
          texts: [
            {
              bounds: { height: 120, width: 550, x: 200, y: 650 },
              defaults: { ...DEFAULT_TEXT, fontSize: 100, text: 'Jack' },
              id: '1',
            },
          ],
        },
        svgContent: GEOMETRY_11,
      },
      {
        key: 'geometry_12',
        options: {
          holes: [
            {
              defaults: DEFAULT_HOLE,
              fieldVisibility: { offset: ['ring'], position: ['ring'] },
              id: '1',
              startPositionRef: 'topRight',
            },
          ],
          texts: [
            {
              bounds: { height: 120, width: 533, x: 225, y: 450 },
              defaults: { ...DEFAULT_TEXT, fontSize: 120, text: 'Jack' },
              id: '1',
            },
          ],
        },
        svgContent: GEOMETRY_12,
      },
      {
        key: 'geometry_13',
        options: {
          holes: [
            {
              baseOffset: 2,
              defaults: DEFAULT_HOLE,
              fieldVisibility: { offset: ['ring'], position: ['ring'] },
              id: '1',
              positionOffset: 1,
              startPositionRef: 'leftCenter',
            },
          ],
          texts: [
            {
              bounds: { height: 90, width: 650, x: 200, y: 480 },
              defaults: { ...DEFAULT_TEXT, fontSize: 80, text: 'Jack' },
              id: '1',
            },
          ],
        },
        svgContent: GEOMETRY_13,
      },
      {
        key: 'geometry_14',
        options: {
          holes: [
            {
              baseOffset: 1,
              defaults: DEFAULT_HOLE,
              fieldVisibility: { offset: ['ring'], position: ['ring'] },
              id: '1',
              positionOffset: 4,
              startPositionRef: 'bottomLeft',
            },
          ],
          texts: [
            {
              defaults: { ...DEFAULT_TEXT, fontSize: 80, text: 'Jack' },
              id: '1',
              path: GEOMETRY_14_TEXT_PATH,
            },
          ],
        },
        svgContent: GEOMETRY_14,
      },
    ],
  },
  svgContent: GEOMETRY_1,
  thumbnail: 'core-img/keychain-generator/geometry.jpg',
};
