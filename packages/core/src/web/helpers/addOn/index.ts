import beamboxPreference from '@core/app/actions/beambox/beambox-preference';
import type { AddOnInfo } from '@core/app/constants/addOn';
import { getAddOnInfo } from '@core/app/constants/addOn';

/**
 * get if auto feeder is enabled according to beambox preference, add-on info and borderless setting
 * @param addOnInfo add-on info object for current workarea, if not provided, using beambox preference to get workarea
 * @param values provided values to avoid reading from beambox preference
 * @returns boolean
 */
export const getAutoFeeder = (
  addOnInfo?: AddOnInfo,
  values: { autoFeeder?: boolean; borderless?: boolean } = {},
): boolean => {
  if (!addOnInfo) {
    addOnInfo = getAddOnInfo(beamboxPreference.read('workarea'));
  }

  if (!addOnInfo.autoFeeder) return false;

  const { autoFeeder, borderless } = values;

  if (!(autoFeeder ?? beamboxPreference.read('auto-feeder'))) return false;

  return addOnInfo.openBottom ? (borderless ?? beamboxPreference.read('borderless')) : true;
};

/**
 * get if pass through is enabled according to beambox preference, add-on info and borderless setting
 * @param addOnInfo add-on info object for current workarea, if not provided, using beambox preference to get workarea
 * @param values provided values to avoid reading from beambox preference
 * @returns boolean
 */
export const getPassThrough = (
  addOnInfo?: AddOnInfo,
  values: { borderless?: boolean; passThrough?: boolean } = {},
): boolean => {
  if (!addOnInfo) {
    addOnInfo = getAddOnInfo(beamboxPreference.read('workarea'));
  }

  if (!addOnInfo.passThrough) return false;

  const { borderless, passThrough } = values;

  if (!(passThrough ?? beamboxPreference.read('pass-through'))) return false;

  return addOnInfo.openBottom ? (borderless ?? beamboxPreference.read('borderless')) : true;
};
