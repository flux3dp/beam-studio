import { useEffect, useMemo, useState } from 'react';

import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import { getPromarkLimit } from '@core/helpers/layer/layer-config-helper';

const usePromarkLimit = (): ReturnType<typeof getPromarkLimit> => {
  // promark info can change when document settings are saved
  const [infoVersion, setInfoVersion] = useState(0);
  const limit = useMemo(
    () => getPromarkLimit(),
    // eslint-disable-next-line hooks/exhaustive-deps
    [infoVersion],
  );

  useEffect(() => {
    const canvasEvents = eventEmitterFactory.createEventEmitter('canvas');
    const bumpInfoVersion = () => setInfoVersion((cur) => cur + 1);

    canvasEvents.on('promark-info-changed', bumpInfoVersion);

    return () => {
      canvasEvents.off('promark-info-changed', bumpInfoVersion);
    };
  }, []);

  return limit;
};

export default usePromarkLimit;
