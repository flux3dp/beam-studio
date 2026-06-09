import type {
  CustomShapeElementValues,
  CustomShapeTextValues,
  DecorationOptionValues,
  ElementOptionValues,
  HoleOptionValues,
  TextOptionValues,
} from '../../types';
import { DEFAULT_ELEMENT_OPTIONS } from '../elementOptions';

export const DEFAULT_HOLE: HoleOptionValues = {
  diameter: 3,
  enabled: true,
  offset: 0,
  position: 0,
  thickness: 2,
  type: 'punch',
};

export const DEFAULT_ELEMENT: ElementOptionValues = {
  emboss: false,
  enabled: true,
  shapeKey: DEFAULT_ELEMENT_OPTIONS[0],
};

export const DEFAULT_TEXT: Omit<TextOptionValues, 'font'> = {
  emboss: false,
  enabled: true,
  fontSize: 40,
  letterSpacing: 0,
  lineSpacing: 1.2,
  text: 'Key Chain',
};

export const DEFAULT_DECORATION_PATH: DecorationOptionValues = {
  emboss: false,
  enabled: true,
  selectedKey: '',
};

export const DEFAULT_CUSTOM_SHAPE_TEXT: Omit<CustomShapeTextValues, 'font'> = {
  fontSize: 80,
  letterSpacing: 0,
  lineSpacing: 1,
  text: 'Awesome!',
};

export const DEFAULT_CUSTOM_SHAPE_ELEMENT: CustomShapeElementValues = {
  enabled: true,
  shapeKey: DEFAULT_ELEMENT_OPTIONS[0],
  size: 100,
};

export const DEFAULT_OUTLINE_OFFSET = 3;
