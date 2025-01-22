import { useEffect, useState } from 'react';

import beamboxPreference from '@core/app/actions/beambox/beambox-preference';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';

const canvasEvents = eventEmitterFactory.createEventEmitter('canvas');
const useWorkarea = (): WorkAreaModel => {
  const [workarea, setWorkarea] = useState(beamboxPreference.read('workarea'));

  useEffect(() => {
    const handler = () => {
      setWorkarea(beamboxPreference.read('workarea'));
    };

    canvasEvents.on('model-changed', handler);

    return () => {
      canvasEvents.off('model-changed', handler);
    };
  }, []);

  return workarea;
};

export default useWorkarea;
