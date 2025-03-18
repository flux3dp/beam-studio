import beamboxPreference from '@core/app/actions/beambox/beambox-preference';
import type { AddOnInfo } from '@core/app/constants/addOn';
import { getAddOnInfo } from '@core/app/constants/addOn';

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
