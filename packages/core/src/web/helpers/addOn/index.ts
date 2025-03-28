import { useEffect, useState } from 'react';

import beamboxPreference from '@core/app/actions/beambox/beambox-preference';
import type { AddOnInfo } from '@core/app/constants/addOn';
import { getAddOnInfo } from '@core/app/constants/addOn';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';

import eventEmitterFactory from '../eventEmitterFactory';
import useBeamboxPreference from '../hooks/useBeamboxPreference';

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

export const useAutoFeeder = (addOnInfo?: AddOnInfo): boolean => {
  const [stateAddOnInfo, setStateAddOnInfo] = useState(addOnInfo ?? getAddOnInfo(beamboxPreference.read('workarea')));

  useEffect(() => {
    const eventEmitter = eventEmitterFactory.createEventEmitter('beambox-preference');
    const handler = (workarea: WorkAreaModel) => setStateAddOnInfo(getAddOnInfo(workarea));

    if (!addOnInfo) eventEmitter.on('workarea', handler);

    return () => {
      if (!addOnInfo) eventEmitter.removeListener('workarea', handler);
    };
  }, [addOnInfo]);

  const autoFeeder = useBeamboxPreference('auto-feeder');
  const borderless = useBeamboxPreference('borderless');

  return getAutoFeeder(stateAddOnInfo, { autoFeeder, borderless });
};

/**
 * get if pass through is enabled according to beambox preference, add-on info and borderless setting
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
