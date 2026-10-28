import { useEffect, useMemo, useState } from 'react';

import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import { getPromarkLimit, isPromarkUV } from '@core/helpers/layer/layer-config-helper';

/** Bumps whenever the promark info changes, which happens when document settings are saved. */
const usePromarkInfoVersion = (): number => {
  const [infoVersion, setInfoVersion] = useState(0);

  useEffect(() => {
    const canvasEvents = eventEmitterFactory.createEventEmitter('canvas');
    const bumpInfoVersion = () => setInfoVersion((cur) => cur + 1);

    canvasEvents.on('promark-info-changed', bumpInfoVersion);

    return () => {
      canvasEvents.off('promark-info-changed', bumpInfoVersion);
    };
  }, []);

  return infoVersion;
};

const usePromarkLimit = (): ReturnType<typeof getPromarkLimit> => {
  const infoVersion = usePromarkInfoVersion();

  return useMemo(
    () => getPromarkLimit(),
    // eslint-disable-next-line hooks/exhaustive-deps
    [infoVersion],
  );
};

/** Whether the document targets a Promark with a UV source, whose power is linked to its frequency. */
export const useIsPromarkUV = (): boolean => {
  const infoVersion = usePromarkInfoVersion();
  const workarea = useWorkarea();

  return useMemo(
    () => isPromarkUV(),
    // eslint-disable-next-line hooks/exhaustive-deps
    [infoVersion, workarea],
  );
};

export default usePromarkLimit;
