import beamboxPreference from '@core/app/actions/beambox/beambox-preference';
import type { AddOnInfo } from '@core/app/constants/add-on';
import { getSupportInfo } from '@core/app/constants/add-on';

/**
 * get if auto feeder is enabled accroding to beambox preference, support info and borderless setting
 * @param supportInfo support info object for current workarea, if not provided, using beambox preference to get workarea
 * @returns boolean
 */
export const getAutoFeeder = (supportInfo?: AddOnInfo): boolean => {
  if (!supportInfo) {
    supportInfo = getSupportInfo(beamboxPreference.read('workarea'));
  }

  if (!supportInfo.autoFeeder) return false;

  if (!beamboxPreference.read('auto-feeder')) return false;

  return supportInfo.openBottom ? beamboxPreference.read('borderless') : true;
};

/**
 * get if pass through is enabled accroding to beambox preference, support info and borderless setting
 * @param supportInfo support info object for current workarea, if not provided, using beambox preference to get workarea
 * @returns boolean
 */
export const getPassThrough = (supportInfo?: AddOnInfo): boolean => {
  if (!supportInfo) {
    supportInfo = getSupportInfo(beamboxPreference.read('workarea'));
  }

  if (!supportInfo.passThrough) return false;

  if (!beamboxPreference.read('pass-through')) return false;

  return supportInfo.openBottom ? beamboxPreference.read('borderless') : true;
};
