import type { EngraveDpiOption } from '@core/app/constants/resolutions';
import { defaultEngraveDpiOptions } from '@core/app/constants/resolutions';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import workareaConstants from '@core/app/constants/workarea-constants';

export const regulateEngraveDpiOption = (model: WorkAreaModel, dpiOption: EngraveDpiOption): EngraveDpiOption => {
  const { engraveDpiOptions = defaultEngraveDpiOptions } = workareaConstants[model] ?? {};

  if (engraveDpiOptions.includes(dpiOption)) {
    return dpiOption;
  }

  // Return the highest available dpi option
  return engraveDpiOptions[engraveDpiOptions.length - 1];
};
