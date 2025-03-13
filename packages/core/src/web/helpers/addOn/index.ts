import beamboxPreference from '@core/app/actions/beambox/beambox-preference';
import type { SupportInfo } from '@core/app/constants/add-on';
import { getSupportInfo } from '@core/app/constants/add-on';

export const getAutoFeeder = (supportInfo?: SupportInfo): boolean => {
  if (!supportInfo) {
    supportInfo = getSupportInfo(beamboxPreference.read('workarea'));
  }

  if (!supportInfo.autoFeeder) return false;

  if (!beamboxPreference.read('auto-feeder')) return false;

  return supportInfo.openBottom ? beamboxPreference.read('borderless') : true;
};

export const getPassThrough = (supportInfo?: SupportInfo): boolean => {
  if (!supportInfo) {
    supportInfo = getSupportInfo(beamboxPreference.read('workarea'));
  }

  if (!supportInfo.passThrough) return false;

  if (!beamboxPreference.read('pass-through')) return false;

  return supportInfo.openBottom ? beamboxPreference.read('borderless') : true;
};
