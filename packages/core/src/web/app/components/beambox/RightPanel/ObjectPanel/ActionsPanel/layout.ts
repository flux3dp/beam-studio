import type { CanvasNodeCategory } from '@core/app/stores/element/interface';
import { isRetailDev } from '@core/helpers/is-dev';

import type { ActionKey } from './actions';

type Requirement = 'canChildrenConvertToPath' | 'hasChildPathsOnly' | 'hasChildTextAndPath' | 'hasChildTextsOnly';

export interface SectionConfig {
  keys: Array<ActionKey | { key: ActionKey; requirement?: Requirement }>;
  title?: string;
}

const layouts: {
  [key in CanvasNodeCategory]?: SectionConfig[];
} = {
  g: [
    { keys: ['offset', 'array'], title: 'ACTIONS' },
    { keys: ['convertToImage'], title: 'CONVERSIONS' },
    { keys: ['smartNest', 'autoFit'], title: 'OPTIMIZATIONS' },
  ],
  image: [
    {
      keys: ['replaceWith', 'offset', 'array', 'imageEditPanel', 'crop', 'sharpen', 'invert', 'grading'],
      title: 'ACTIONS',
    },
    { keys: ['trace', 'potrace', 'potraceAndOffset'], title: 'CONVERSIONS' },
    { keys: ['stampMakerPanel', 'bgRemoval', 'trapezoid'], title: 'OPTIMIZATIONS' },
  ],
  multi_select: [
    {
      keys: [
        'offset',
        'array',
        { key: 'createTextpath', requirement: 'hasChildTextAndPath' },
        { key: 'weldText', requirement: 'hasChildTextsOnly' },
      ],
      title: 'ACTIONS',
    },
    {
      keys: [{ key: 'convertToPath', requirement: 'canChildrenConvertToPath' }, 'convertToImage'],
      title: 'CONVERSIONS',
    },
    { keys: [{ key: 'simplify', requirement: 'hasChildPathsOnly' }, 'smartNest', 'autoFit'], title: 'OPTIMIZATIONS' },
  ],
  path: [
    { keys: ['offset', 'array', 'editSvgPath', 'decomposePath'], title: 'ACTIONS' },
    { keys: ['convertToImage'], title: 'CONVERSIONS' },
    { keys: ['simplify', 'smartNest', 'autoFit', 'tab'], title: 'OPTIMIZATIONS' },
  ],
  shape: [
    { keys: ['offset', 'array'], title: 'ACTIONS' },
    { keys: ['convertToPath', 'convertToImage'], title: 'CONVERSIONS' },
    { keys: ['smartNest', 'autoFit', 'tab'], title: 'OPTIMIZATIONS' },
  ],
  text: [
    { keys: ['offset', 'array', 'weldText'], title: 'ACTIONS' },
    { keys: ['convertToPath', 'convertToImage'], title: 'CONVERSIONS' },
    { keys: ['smartNest', 'autoFit', 'tab'], title: 'OPTIMIZATIONS' },
  ],
  text_path: [
    { keys: ['editTextPath', 'detachPath', 'array'], title: 'ACTIONS' },
    { keys: ['convertToPath', 'convertToImage'], title: 'CONVERSIONS' },
    { keys: ['smartNest', 'autoFit'], title: 'OPTIMIZATIONS' },
  ],
  use: [
    { keys: ['offset', 'array', 'disassembleUse'], title: 'ACTIONS' },
    { keys: ['convertToImage'], title: 'CONVERSIONS' },
    { keys: ['smartNest', 'autoFit', 'tab'], title: 'OPTIMIZATIONS' },
  ],
};

const getDevAll = (): SectionConfig[] => {
  return [
    {
      keys: [
        'array',
        'crop',
        'decomposePath',
        'detachPath',
        'disassembleUse',
        'editSvgPath',
        'editTextPath',
        'grading',
        'imageEditPanel',
        'invert',
        'offset',
        'replaceWith',
        'sharpen',
      ],
      title: 'ACTIONS',
    },
    {
      keys: ['convertToImage', 'convertToPath', 'createTextpath', 'potrace', 'trace', 'potraceAndOffset'],
      title: 'CONVERSIONS',
    },
    {
      keys: ['autoFit', 'bgRemoval', 'simplify', 'smartNest', 'stampMakerPanel', 'tab', 'trapezoid', 'weldText'],
      title: 'OPTIMIZATIONS',
    },
  ];
};

export const getBasicLayoutConfig = (category: CanvasNodeCategory) =>
  isRetailDev() ? getDevAll() : (layouts[category] ?? null);
