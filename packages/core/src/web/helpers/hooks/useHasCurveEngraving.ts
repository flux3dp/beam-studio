import { useMemo, useState } from 'react';

import curveEngravingModeController from '@core/app/actions/canvas/curveEngravingModeController';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';

const useHasCurveEngraving = (): boolean => {
  const [hasCurveEngraving, setHasCurveEngraving] = useState(curveEngravingModeController.hasArea());

  const canvasEventEmitter = useMemo(() => eventEmitterFactory.createEventEmitter('canvas'), []);

  useMemo(() => {
    canvasEventEmitter.on('CURVE_ENGRAVING_AREA_SET', () => {
      setHasCurveEngraving(curveEngravingModeController.hasArea());
    });

    return () => {
      canvasEventEmitter.removeListener('CURVE_ENGRAVING_AREA_SET', () => {
        setHasCurveEngraving(curveEngravingModeController.hasArea());
      });
    };
  }, [canvasEventEmitter]);

  return hasCurveEngraving;
};

export default useHasCurveEngraving;
