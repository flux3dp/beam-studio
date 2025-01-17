import React, { useContext, useEffect, useRef, useState } from 'react';
import { Button, Space } from 'antd';
import { PauseCircleFilled, PlayCircleFilled, StopFilled } from '@ant-design/icons';

import DeviceConstants from 'app/constants/device-constants';
import MonitorStatus, { ButtonTypes } from 'helpers/monitor-status';
import { useIsMobile } from 'helpers/system-helper';
import { Mode } from 'app/constants/monitor-constants';
import { MonitorContext } from 'app/contexts/MonitorContext';
import useI18n from 'helpers/useI18n';

interface Props {
  isPromark: boolean;
  isFraming: boolean;
  setEstimateTaskTime: React.Dispatch<React.SetStateAction<number>>;
}

const MonitorControl = ({ isPromark, isFraming, setEstimateTaskTime }: Props): JSX.Element => {
  const { monitor: tMonitor } = useI18n();
  const isMobile = useIsMobile();
  const buttonShape = isMobile ? 'round' : 'default';
  const { taskTime, onPlay, onPause, onStop, mode, report } = useContext(MonitorContext);
  const estimateTaskTimeTimer = useRef<NodeJS.Timeout | null>(null);
  const [isOnPlaying, setIsOnPlaying] = useState(false);

  const triggerOnPlay = () => {
    setIsOnPlaying(true);
    onPlay(isPromark);
    clearInterval(estimateTaskTimeTimer.current as NodeJS.Timeout);
    estimateTaskTimeTimer.current = setInterval(() => {
      setEstimateTaskTime((time) => time - 1);
    }, 1000);
    setIsOnPlaying(false);
  };

  const mapButtonTypeToElement = (type: ButtonTypes): JSX.Element => {
    const enabled = type % 2 === 1;

    switch (type) {
      case ButtonTypes.PLAY:
      case ButtonTypes.DISABLED_PLAY:
        return (
          <Button
            key={type}
            disabled={!enabled}
            shape={buttonShape}
            type="primary"
            onClick={triggerOnPlay}
          >
            <PlayCircleFilled />
            {report.st_id !== DeviceConstants.status.PAUSED ? tMonitor.go : tMonitor.resume}
          </Button>
        );
      case ButtonTypes.PAUSE:
      case ButtonTypes.DISABLED_PAUSE:
        return (
          <Button
            key={type}
            disabled={!enabled}
            shape={buttonShape}
            type="primary"
            onClick={() => {
              onPause();
              clearInterval(estimateTaskTimeTimer.current as NodeJS.Timeout);
            }}
          >
            <PauseCircleFilled />
            {tMonitor.pause}
          </Button>
        );
      case ButtonTypes.STOP:
      case ButtonTypes.DISABLED_STOP:
        return (
          <Button
            key={type}
            disabled={!enabled}
            shape={buttonShape}
            onClick={() => {
              onStop();
              clearInterval(estimateTaskTimeTimer.current as NodeJS.Timeout);
              setEstimateTaskTime(taskTime);
            }}
          >
            <StopFilled />
            {tMonitor.stop}
          </Button>
        );
      default:
        return null;
    }
  };

  const canStart = report?.st_id === DeviceConstants.status.IDLE;

  useEffect(() => {
    if (report?.st_id === DeviceConstants.status.COMPLETED && !isOnPlaying) {
      clearInterval(estimateTaskTimeTimer.current as NodeJS.Timeout);
      setEstimateTaskTime(taskTime);
    }
  }, [report, isOnPlaying, setEstimateTaskTime, taskTime]);

  if (mode === Mode.PREVIEW || mode === Mode.FILE_PREVIEW || isFraming) {
    return (
      <Space>
        <Button disabled={!canStart} shape={buttonShape} type="primary" onClick={triggerOnPlay}>
          <PlayCircleFilled />
          {tMonitor.go}
        </Button>
      </Space>
    );
  }

  if (mode === Mode.WORKING) {
    return (
      <Space>
        {MonitorStatus.getControlButtonType(report).map((type) => mapButtonTypeToElement(type))}
      </Space>
    );
  }

  return null;
};

export default MonitorControl;
