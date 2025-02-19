import { useEffect, useState } from 'react';

import beamboxPreference from '@core/app/actions/beambox/beambox-preference';

import eventEmitterFactory from '../eventEmitterFactory';

const eventEmitter = eventEmitterFactory.createEventEmitter('beambox-preference');

export const useBeamboxPreference = <T = unknown>(key: string) => {
  const [value, setValue] = useState<T>(beamboxPreference.read(key));

  useEffect(() => {
    eventEmitter.on(key, setValue);

    return () => {
      eventEmitter.removeListener(key, setValue);
    };
  }, [key]);

  return value;
};

export default useBeamboxPreference;
