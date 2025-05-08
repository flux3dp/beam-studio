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
