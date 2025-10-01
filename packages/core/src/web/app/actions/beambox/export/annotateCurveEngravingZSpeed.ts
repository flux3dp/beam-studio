import { getAddOnInfo } from '@core/app/constants/addOn';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { getData } from '@core/helpers/layer/layer-config-helper';
import { getAllLayers } from '@core/helpers/layer/layer-helper';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

export const annotateCurveEngravingZSpeed = (device: IDeviceInfo | null) => {
  const model = device?.model || useDocumentStore.getState().workarea;

  removeCurveEngravingZSpeedAnnotation();

  const addOnInfo = getAddOnInfo(model);
  const { curveSpeedLimit: { zHighSpeed = 0, zRegular } = {} } = getWorkarea(model);

  if (!addOnInfo.curveEngraving || !zRegular) return;

  const allLayers = getAllLayers();

  allLayers.forEach((layer) => {
    const speedLimit = getData(layer, 'ceZHighSpeed') ? zHighSpeed : zRegular!;

    layer.setAttribute('data-ceZSpeedLimit', speedLimit.toString());
  });
};

export const removeCurveEngravingZSpeedAnnotation = () => {
  const allLayers = getAllLayers();

  allLayers.forEach((layer) => layer.removeAttribute('data-ceZSpeedLimit'));
};
