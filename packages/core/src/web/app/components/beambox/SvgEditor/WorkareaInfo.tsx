import React, { memo, useEffect, useMemo } from 'react';

import { funnel } from 'remeda';

import { promarkModels } from '@core/app/actions/beambox/constant';
import { LaserType } from '@core/app/constants/promark-constants';
import { workareaOptions } from '@core/app/constants/workarea-constants';
import { getPromarkInfo } from '@core/helpers/device/promark/promark-info';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import useForceUpdate from '@core/helpers/use-force-update';

const eventEmitter = eventEmitterFactory.createEventEmitter('workarea');

const WorkareaInfo = memo(() => {
  const forceUpdate = useForceUpdate();
  const workarea = useWorkarea();
  const isPromark = useMemo(() => promarkModels.has(workarea), [workarea]);
  const promarkInfo = getPromarkInfo();

  useEffect(() => {
    const throttledRerender = funnel(() => forceUpdate(), { minQuietPeriodMs: 1000, triggerAt: 'end' });

    const onUpdate = () => throttledRerender.call();

    eventEmitter.on('UPDATE_PROMARK_INFO', onUpdate);

    return () => {
      eventEmitter.off('UPDATE_PROMARK_INFO', onUpdate);
    };
  }, [forceUpdate]);

  return (
    <div>
      <div>Workarea: {workareaOptions.find((option) => option.value === workarea)?.label ?? workarea}</div>
      {isPromark && (
        <>
          <div>Laser Type: {LaserType[promarkInfo.laserType]}</div>
          <div>Watt: {promarkInfo.watt}</div>
        </>
      )}
    </div>
  );
});

export default WorkareaInfo;
