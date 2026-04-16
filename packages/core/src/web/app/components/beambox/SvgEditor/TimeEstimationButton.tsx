import type { ReactNode } from 'react';
import React, { use } from 'react';

import ExportFuncs from '@core/app/actions/beambox/export-funcs';
import { TimeEstimationButtonContext } from '@core/app/contexts/TimeEstimationButtonContext';
import FormatDuration from '@core/helpers/duration-formatter';
import useI18n from '@core/helpers/useI18n';
import webNeedConnectionWrapper from '@core/helpers/web-need-connection-helper';

import styles from './TimeEstimationButton.module.scss';

const TimeEstimationButton = (): ReactNode => {
  const lang = useI18n().canvas_control;
  const { estimatedTime, setEstimatedTime } = use(TimeEstimationButtonContext);

  const calculateEstimatedTime = async () => {
    webNeedConnectionWrapper(async () => {
      const estimateTime = await ExportFuncs.estimateTime();

      setEstimatedTime(estimateTime);
    });
  };

  return (
    <div className={styles.timeDisplay} onClick={calculateEstimatedTime}>
      {estimatedTime === null ? lang.calculate : FormatDuration(Math.max(estimatedTime, 1))}
    </div>
  );
};

export default TimeEstimationButton;
