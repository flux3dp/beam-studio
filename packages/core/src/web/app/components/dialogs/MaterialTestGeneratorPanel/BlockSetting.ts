export const blockSettingScopes = ['column', 'row'] as const;
export const blockSettingParams = ['count', 'size', 'spacing'] as const;
export const blockSettingValues = ['value', 'min', 'max'] as const;

export type BlockInfo = Record<
  (typeof blockSettingParams)[number],
  Record<(typeof blockSettingValues)[number], number>
>;
export type BlockSetting = Record<(typeof blockSettingScopes)[number], BlockInfo>;

const getBlockInfo = (): BlockInfo => ({
  count: { max: 20, min: 1, value: 10 },
  size: { max: Number.MAX_SAFE_INTEGER, min: 1, value: 10 },
  spacing: { max: Number.MAX_SAFE_INTEGER, min: 1, value: 5 },
});

export const getBlockSetting = (): BlockSetting => ({
  column: getBlockInfo(),
  row: getBlockInfo(),
});
