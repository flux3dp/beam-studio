import type { KeyChainCategory } from '../../types';

import { DIALOG_BOX_1, DIALOG_BOX_2, DIALOG_BOX_3, DIALOG_BOX_4, DIALOG_BOX_5 } from './basePaths';
import { DEFAULT_HOLE, DEFAULT_TEXT } from './defaults';

export const dialogBox: KeyChainCategory = {
  defaultSize: { dimension: 'width', value: 50 },
  defaultViewBox: { height: 1000, width: 1000, x: 0, y: 0 },
  id: 'dialog_box',
  nameKey: 'dialog_box',
  options: {
    holes: [
      {
        defaults: DEFAULT_HOLE,
        fieldVisibility: { offset: ['ring'], position: ['ring'] },
        id: '1',
        startPositionRef: 'topLeft',
      },
    ],
    variants: [
      {
        key: 'dialog_box_1',
        options: {
          texts: [
            {
              bounds: { height: 300, width: 600, x: 200, y: 310 },
              defaults: { ...DEFAULT_TEXT, fontSize: 140 },
              id: '1',
            },
          ],
        },
        svgContent: DIALOG_BOX_1,
      },
      {
        key: 'dialog_box_2',
        options: {
          texts: [
            {
              bounds: { height: 300, width: 600, x: 225, y: 310 },
              defaults: { ...DEFAULT_TEXT, fontSize: 140 },
              id: '1',
            },
          ],
        },
        svgContent: DIALOG_BOX_2,
      },
      {
        key: 'dialog_box_3',
        options: {
          texts: [
            {
              bounds: { height: 250, width: 600, x: 200, y: 335 },
              defaults: { ...DEFAULT_TEXT, fontSize: 140 },
              id: '1',
            },
          ],
        },
        svgContent: DIALOG_BOX_3,
      },
      {
        key: 'dialog_box_4',
        options: {
          holes: [
            {
              defaults: DEFAULT_HOLE,
              fieldVisibility: { offset: ['ring'], position: ['ring'] },
              id: '1',
              positionOffset: 2,
              startPositionRef: 'topLeft',
            },
          ],
          texts: [
            {
              bounds: { height: 280, width: 600, x: 200, y: 360 },
              defaults: { ...DEFAULT_TEXT, fontSize: 140 },
              id: '1',
            },
          ],
        },
        svgContent: DIALOG_BOX_4,
      },
      {
        key: 'dialog_box_5',
        options: {
          texts: [
            {
              bounds: { height: 260, width: 600, x: 200, y: 350 },
              defaults: { ...DEFAULT_TEXT, fontSize: 140 },
              id: '1',
            },
          ],
        },
        svgContent: DIALOG_BOX_5,
      },
    ],
  },
  svgContent: DIALOG_BOX_1,
  thumbnail: 'core-img/keychain-generator/dialog_box.jpg',
};
