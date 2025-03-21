import beamboxPreference from '@core/app/actions/beambox/beambox-preference';
import constant from '@core/app/actions/beambox/constant';
import rotaryAxis from '@core/app/actions/canvas/rotary-axis';
import type { AddOnInfo } from '@core/app/constants/addOn';
import { getAddOnInfo } from '@core/app/constants/addOn';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import getRotaryRatio from '@core/helpers/device/get-rotary-ratio';

/**
 * get if auto feeder is enabled accroding to beambox preference, add-on info and borderless setting
 * @param addOnInfo add-on info object for current workarea, if not provided, using beambox preference to get workarea
 * @returns boolean
 */
export const getAutoFeeder = (addOnInfo?: AddOnInfo): boolean => {
  if (!addOnInfo) {
    addOnInfo = getAddOnInfo(beamboxPreference.read('workarea'));
  }

  if (!addOnInfo.autoFeeder) return false;

  if (!beamboxPreference.read('auto-feeder')) return false;

  return addOnInfo.openBottom ? beamboxPreference.read('borderless') : true;
};

/**
 * get if pass through is enabled accroding to beambox preference, add-on info and borderless setting
 * @param addOnInfo add-on info object for current workarea, if not provided, using beambox preference to get workarea
 * @returns boolean
 */
export const getPassThrough = (addOnInfo?: AddOnInfo): boolean => {
  if (!addOnInfo) {
    addOnInfo = getAddOnInfo(beamboxPreference.read('workarea'));
  }

  if (!addOnInfo.passThrough) return false;

  if (!beamboxPreference.read('pass-through')) return false;

  return addOnInfo.openBottom ? beamboxPreference.read('borderless') : true;
};

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
    y: rotaryAxis.getPosition(axisInMm) ?? 0,
    yRatio: getRotaryRatio(addOnInfo),
  };

  if (addOnInfo.rotary.split) {
    info!.ySplit = beamboxPreference.read('rotary-split');
    info!.yOverlap = beamboxPreference.read('rotary-overlap');
  }

  return info;
};
