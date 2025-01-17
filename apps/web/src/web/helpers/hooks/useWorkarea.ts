import { useEffect, useState } from 'react';

import beamboxPreference from 'app/actions/beambox/beambox-preference';
import eventEmitterFactory from 'helpers/eventEmitterFactory';
import { WorkAreaModel } from 'app/constants/workarea-constants';

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
