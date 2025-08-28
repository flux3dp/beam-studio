import { useMemo } from 'react';

import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getSupportedModules } from '@core/app/constants/workarea-constants';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';

export const useSupportedModules = (workarea: WorkAreaModel): LayerModuleType[] => {
  const isUvPrintEnabled = useGlobalPreferenceStore((state) => state['enable-uv-print-file']);
  const is4CEnabled = useDocumentStore((state) => state['enable-4c']);
  const is1064Enabled = useDocumentStore((state) => state['enable-1064']);

  return useMemo(
    () => getSupportedModules(workarea, { is4CEnabled, is1064Enabled, isUvPrintEnabled }),
    [workarea, isUvPrintEnabled, is4CEnabled, is1064Enabled],
  );
};
