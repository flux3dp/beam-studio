import { useDocumentStore } from 'packages/core/src/__mocks__/@core/app/stores/documentStore';

import { laserModules, LayerModule } from '@core/app/constants/layer-module/layer-modules';
import { getEngraveDpmm } from '@core/app/constants/resolutions';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import layerManager from '@core/app/svgedit/layer/layerManager';
import { getData } from '@core/helpers/layer/layer-config-helper';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

/**
 * Set data-dpmm attribute to laser layers for backend
 * detailed dpi may have different dpmm on different workarea
 * no need to revert since every export action will re-annotate, and the value won't be used elsewhere
 * @param device The device info, if null, use workarea from document store
 */
export const annotateLayerDpmm = (device: IDeviceInfo | null) => {
  const workarea = device?.model || useDocumentStore.getState().workarea;
  const allLayers = layerManager.getAllLayers();
  const defaultDpi = useGlobalPreferenceStore.getState().engrave_dpi;

  allLayers.forEach((layerObject) => {
    const layerElement = layerObject.getGroup();

    if (!laserModules.has(getData(layerElement, 'module') || LayerModule.LASER_UNIVERSAL)) return;

    const dpi = getData(layerElement, 'dpi') || defaultDpi;
    const dpmm = getEngraveDpmm(dpi, workarea);

    layerElement.setAttribute('data-dpmm', dpmm.toString());
  });
};
