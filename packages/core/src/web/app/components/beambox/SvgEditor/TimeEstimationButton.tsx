import React, { use } from 'react';

import { Tooltip } from 'antd';

import ExportFuncs from '@core/app/actions/beambox/export-funcs';
import { TimeEstimationButtonContext } from '@core/app/contexts/TimeEstimationButtonContext';
import WorkareaIcons from '@core/app/icons/workarea/WorkareaIcons';
import FormatDuration from '@core/helpers/duration-formatter';
import useI18n from '@core/helpers/useI18n';
import webNeedConnectionWrapper from '@core/helpers/web-need-connection-helper';

import styles from './TimeEstimationButton.module.scss';

const TimeEstimationButton = (): React.JSX.Element => {
  const { estimatedTime, setEstimatedTime } = use(TimeEstimationButtonContext);
  const lang = useI18n().beambox.time_est_button;

  const calculateEstimatedTime = async () => {
    webNeedConnectionWrapper(async () => {
      const estimateTime = await ExportFuncs.estimateTime();

      setEstimatedTime(estimateTime);
    });
  };

  const renderButton = () => (
    <Tooltip title={lang.calculate}>
      <div className={styles.btn} onClick={calculateEstimatedTime}>
        <WorkareaIcons.Time />
      </div>
    </Tooltip>
  );

  const renderResult = () => (
    <div className={styles.result}>
      {lang.estimate_time} {FormatDuration(Math.max(estimatedTime ?? 1, 1))}
    </div>
  );

  return typeof estimatedTime === 'number' ? renderResult() : renderButton();
};

export default TimeEstimationButton;
