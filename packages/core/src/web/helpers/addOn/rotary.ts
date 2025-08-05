import beamboxPreference from '@core/app/actions/beambox/beambox-preference';
import constant from '@core/app/actions/beambox/constant';
import rotaryAxis from '@core/app/actions/canvas/rotary-axis';
import { getAddOnInfo } from '@core/app/constants/addOn';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import getRotaryRatio from '@core/helpers/device/get-rotary-ratio';

export type RotaryInfo = null | {
  useAAxis: boolean;
  y: number;
  yOverlap?: number;
  yRatio: number;
  ySplit?: number;
};

export const getRotaryInfo = (workarea?: WorkAreaModel, axisInMm = false): RotaryInfo => {
  if (!workarea) {
    workarea = beamboxPreference.read('workarea');
  }

  const addOnInfo = getAddOnInfo(workarea);

  if (!addOnInfo.rotary) return null;

  if (!beamboxPreference.read('rotary_mode')) return null;

  const info: RotaryInfo = {
    useAAxis: constant.fcodeV2Models.has(workarea),
    y: rotaryAxis.getPosition(axisInMm),
    yRatio: getRotaryRatio(addOnInfo),
  };

  if (addOnInfo.rotary.split) {
    info!.ySplit = beamboxPreference.read('rotary-split');
    info!.yOverlap = beamboxPreference.read('rotary-overlap');
  }

  return info;
};
