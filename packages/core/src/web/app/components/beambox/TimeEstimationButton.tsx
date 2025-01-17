import React, { useContext } from 'react';
import { Tooltip } from 'antd';

import ExportFuncs from 'app/actions/beambox/export-funcs';
import FormatDuration from 'helpers/duration-formatter';
import useI18n from 'helpers/useI18n';
import webNeedConnectionWrapper from 'helpers/web-need-connection-helper';
import WorkareaIcons from 'app/icons/workarea/WorkareaIcons';
import { CanvasContext } from 'app/contexts/CanvasContext';
import { CanvasMode } from 'app/constants/canvasMode';
import { TimeEstimationButtonContext } from 'app/contexts/TimeEstimationButtonContext';

import styles from './TimeEstimationButton.module.scss';

const TimeEstimationButton = (): JSX.Element => {
  const { estimatedTime, setEstimatedTime } = useContext(TimeEstimationButtonContext);
  const { mode } = useContext(CanvasContext);
  const lang = useI18n().beambox.time_est_button;

  if (mode === CanvasMode.PathPreview) return <div />;

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
      {lang.estimate_time} {FormatDuration(Math.max(estimatedTime, 1))}
    </div>
  );

  return typeof estimatedTime === 'number' ? renderResult() : renderButton();
};

export default TimeEstimationButton;
