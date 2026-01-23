import type { EngraveDpiOption, WorkAreaModel } from '@core/app/constants/workarea-constants';
import workareaConstants, { defaultEngraveDpiOptions } from '@core/app/constants/workarea-constants';

export const regulateEngraveDpiOption = (model: WorkAreaModel, dpiOption: EngraveDpiOption): EngraveDpiOption => {
  const { engraveDpiOptions = defaultEngraveDpiOptions } = workareaConstants[model] ?? {};

  if (engraveDpiOptions.includes(dpiOption)) {
    return dpiOption;
  }

  // Return the highest available dpi option
  return engraveDpiOptions[engraveDpiOptions.length - 1];
};
