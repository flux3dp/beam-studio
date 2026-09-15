import { useEffect, useMemo, useState } from 'react';

import { galvoModules } from '@core/app/constants/layer-module/layer-modules';
import { useConfigPanelStore } from '@core/app/stores/configPanel';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import { getGalvoLimit, getPromarkLimit, isPromarkUV } from '@core/helpers/layer/layer-config-helper';

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
  // a galvo module head carries its own range, whichever machine it is fitted to
  const layerModule = useConfigPanelStore((state) => state.module.value);

  return useMemo(
    () => (galvoModules.has(layerModule) ? getGalvoLimit(layerModule) : getPromarkLimit()),
    // eslint-disable-next-line hooks/exhaustive-deps
    [infoVersion, layerModule],
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
