import { useMemo } from 'react';

import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getSupportedModules } from '@core/app/constants/workarea-constants';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';

export const useSupportedModules = (workarea: WorkAreaModel): LayerModuleType[] => {
  const isUvPrintFileEnabled = useGlobalPreferenceStore((state) => state['enable-uv-print-file']);

  return useMemo(() => getSupportedModules(workarea, isUvPrintFileEnabled), [workarea, isUvPrintFileEnabled]);
};
