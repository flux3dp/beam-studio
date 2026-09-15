import { useEffect, useMemo, useState } from 'react';

import { galvoModules } from '@core/app/constants/layer-module/layer-modules';
import { useConfigPanelStore } from '@core/app/stores/configPanel';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import { getGalvoLimit, getPromarkLimit } from '@core/helpers/layer/layer-config-helper';

const usePromarkLimit = (): ReturnType<typeof getPromarkLimit> => {
  // promark info can change when document settings are saved
  const [infoVersion, setInfoVersion] = useState(0);
  // a galvo module head carries its own range, whichever machine it is fitted to
  const layerModule = useConfigPanelStore((state) => state.module.value);
  const limit = useMemo(
    () => (galvoModules.has(layerModule) ? getGalvoLimit(layerModule) : getPromarkLimit()),
    // eslint-disable-next-line hooks/exhaustive-deps
    [infoVersion, layerModule],
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
