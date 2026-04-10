import React, { use, useState } from 'react';

import ExportFuncs from '@core/app/actions/beambox/export-funcs';
import { TimeEstimationButtonContext } from '@core/app/contexts/TimeEstimationButtonContext';
import FormatDuration from '@core/helpers/duration-formatter';
import useI18n from '@core/helpers/useI18n';
import webNeedConnectionWrapper from '@core/helpers/web-need-connection-helper';

import styles from './TimeEstimationButton.module.scss';

const TimeEstimationButton = (): React.JSX.Element => {
  const lang = useI18n();
  const { estimatedTime, setEstimatedTime } = use(TimeEstimationButtonContext);
  const [localTime, setLocalTime] = useState<null | number>(null);
  const displayTime = localTime !== null ? localTime : estimatedTime;

  const calculateEstimatedTime = async () => {
    webNeedConnectionWrapper(async () => {
      const estimateTime = await ExportFuncs.estimateTime();

      setLocalTime(estimateTime);

      if (typeof setEstimatedTime === 'function') setEstimatedTime(estimateTime);
    });
  };

  return (
    <div className={styles.timeDisplay} onClick={calculateEstimatedTime}>
      {typeof displayTime === 'number' ? FormatDuration(Math.max(displayTime, 1)) : lang.canvas_control.estimate_time}
    </div>
  );
};

export default TimeEstimationButton;
