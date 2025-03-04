import { useEffect, useState } from 'react';

import type { BeamboxPreferenceKey } from '@core/app/actions/beambox/beambox-preference';
import beamboxPreference from '@core/app/actions/beambox/beambox-preference';

import eventEmitterFactory from '../eventEmitterFactory';

const eventEmitter = eventEmitterFactory.createEventEmitter('beambox-preference');

export const useBeamboxPreference = <Key extends BeamboxPreferenceKey>(key: Key) => {
  const [value, setValue] = useState(beamboxPreference.read(key));

  useEffect(() => {
    eventEmitter.on(key, setValue);

    return () => {
      eventEmitter.removeListener(key, setValue);
    };
  }, [key]);

  return value;
};

export default useBeamboxPreference;
