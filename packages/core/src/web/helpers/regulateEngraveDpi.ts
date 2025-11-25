import type { EngraveDpiOption, WorkAreaModel } from '@core/app/constants/workarea-constants';
import workareaConstants, { defaultEngraveDpiOptions } from '@core/app/constants/workarea-constants';
import { useDocumentStore } from '@core/app/stores/documentStore';

export const regulateEngraveDpiOption = (model: WorkAreaModel, dpiOption: EngraveDpiOption): EngraveDpiOption => {
  const { engraveDpiOptions = defaultEngraveDpiOptions } = workareaConstants[model] ?? {};

  if (engraveDpiOptions.includes(dpiOption)) {
    return dpiOption;
  }

  // Return the highest available dpi option
  return engraveDpiOptions[engraveDpiOptions.length - 1];
};

useDocumentStore.subscribe(
  (state) => state.workarea,
  (workarea) => {
    const { engrave_dpi } = useDocumentStore.getState();
    const regulatedDpi = regulateEngraveDpiOption(workarea, engrave_dpi);

    if (regulatedDpi !== engrave_dpi) useDocumentStore.getState().set('engrave_dpi', regulatedDpi);
  },
);
