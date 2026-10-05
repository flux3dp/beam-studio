export const blockSettingScopes = ['column', 'row'] as const;
export const blockSettingParams = ['count', 'size', 'spacing'] as const;
export const blockSettingValues = ['value', 'min', 'max'] as const;

export type BlockInfo = Record<
  (typeof blockSettingParams)[number],
  Record<(typeof blockSettingValues)[number], number>
>;
export type BlockSetting = Record<(typeof blockSettingScopes)[number], BlockInfo>;

/**
 * Room left between the size cap and the galvo field itself, in mm. The field is what one galvo
 * position covers in theory; where the exporter actually cuts the grid depends on the block
 * displacement and the module offset, so a block sized to the last millimetre can still land across
 * a seam.
 */
const FIELD_MARGIN_MM = 2;

/** Smallest half block that still reads as a patch by eye and under a depth scan, in mm. */
const MIN_HALF_BLOCK_MM = 3;

const getBlockInfo = (maxSize = Number.MAX_SAFE_INTEGER, minSize = 1): BlockInfo => ({
  count: { max: 20, min: 1, value: 10 },
  size: { max: maxSize, min: minSize, value: Math.min(Math.max(10, minSize), maxSize) },
  spacing: { max: Number.MAX_SAFE_INTEGER, min: 1, value: 5 },
});

interface BlockSettingOptions {
  /**
   * Galvo field in mm, when the test has to stay inside one. A comparison block is two half blocks
   * side by side, so the sizes here are one half: the row size is its width and must leave the pair
   * inside the field, the column size is its height.
   */
  fieldSize?: number;
}

export const getBlockSetting = ({ fieldSize }: BlockSettingOptions = {}): BlockSetting => {
  if (!fieldSize) {
    return { column: getBlockInfo(), row: getBlockInfo() };
  }

  const limit = Math.max(fieldSize - FIELD_MARGIN_MM, MIN_HALF_BLOCK_MM * 2);

  return {
    column: getBlockInfo(limit, MIN_HALF_BLOCK_MM),
    row: getBlockInfo(limit / 2, MIN_HALF_BLOCK_MM),
  };
};
