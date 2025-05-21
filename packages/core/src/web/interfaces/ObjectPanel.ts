import type { VerticalAlign } from '@core/app/actions/beambox/textPathEdit';
import type { ConfigItem } from '@core/interfaces/ILayerConfig';

// Dimensions
export type PositionKey = 'cx' | 'cy' | 'x1' | 'x2' | 'x' | 'y1' | 'y2' | 'y';
export const positionKeys = new Set<PositionKey>(['x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy']);
export const isPositionKey = (key: string): key is PositionKey => positionKeys.has(key as PositionKey);

export type SizeKeyShort = 'h' | 'rx' | 'ry' | 'w';
export const sizeKeys = new Set<SizeKeyShort>(['w', 'h', 'rx', 'ry']);
export const isSizeKeyShort = (key: string): key is SizeKeyShort => sizeKeys.has(key as SizeKeyShort);
export type SizeKey = 'height' | 'rx' | 'ry' | 'width';

export type DimensionKeyShort = PositionKey | SizeKeyShort;
export type DimensionKeyNumber = 'rotation' | PositionKey | SizeKey;
export type DimensionKeyBoolean = 'isRatioFixed';
export type DimensionKey = DimensionKeyBoolean | DimensionKeyNumber;

/**
 * Object dimension attribute key-value pairs in ObjectPanelContext
 */
export type DimensionValues = { [key in DimensionKeyBoolean]?: boolean } & { [key in DimensionKeyNumber]?: number };

/**
 * Object dimension attribute orders displayed in DimensionPanel
 */
export type DimensionOrderMap = {
  [key: string]: Array<'lock' | 'rot' | DimensionKeyShort>;
};

// Text Options
export interface TextOption {
  fontFamily: string;
  fontSize: number;
  fontStyle: any;
  id: string;
  isVerti: boolean;
  letterSpacing: number;
  lineSpacing: number;
  startOffset: number;
  verticalAlign: VerticalAlign;
}

export type TextConfig = {
  [key in keyof TextOption]: ConfigItem<TextOption[key]>;
};

// Variable Text
/* eslint-disable perfectionist/sort-enums */
export const enum VariableTextType {
  NONE = 0,
  NUMBER = 1,
  TIME = 2,
  CSV = 3,
}
/* eslint-enable perfectionist/sort-enums */

export interface VariableTextOption {
  id: string;
  offset: number;
  type: VariableTextType;
}

export type VariableTextConfig = {
  [key in keyof VariableTextOption]: ConfigItem<VariableTextOption[key]>;
};
