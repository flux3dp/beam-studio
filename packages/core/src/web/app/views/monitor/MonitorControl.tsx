import React, { useContext, useEffect, useRef, useState } from 'react';

import { PauseCircleFilled, PlayCircleFilled, StopFilled } from '@ant-design/icons';
import { Button, Space } from 'antd';

import DeviceConstants from '@core/app/constants/device-constants';
import { Mode } from '@core/app/constants/monitor-constants';
import { MonitorContext } from '@core/app/contexts/MonitorContext';
import MonitorStatus, { ButtonTypes } from '@core/helpers/monitor-status';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

interface Props {
  isFraming: boolean;
  isPromark: boolean;
  setEstimateTaskTime: React.Dispatch<React.SetStateAction<number>>;
}

const MonitorControl = ({ isFraming, isPromark, setEstimateTaskTime }: Props): React.JSX.Element => {
  const { monitor: tMonitor } = useI18n();
  const isMobile = useIsMobile();
  const buttonShape = isMobile ? 'round' : 'default';
  const { mode, onPause, onPlay, onStop, report, taskTime } = useContext(MonitorContext);
  const estimateTaskTimeTimer = useRef<NodeJS.Timeout | null>(null);
  const [isOnPlaying, setIsOnPlaying] = useState(false);

  const triggerOnPlay = () => {
    setIsOnPlaying(true);
    // force resend framing and normal task after abortion in Promark
    onPlay(isPromark && report.st_id !== DeviceConstants.status.PAUSED_FROM_RUNNING);
    clearInterval(estimateTaskTimeTimer.current as NodeJS.Timeout);
    estimateTaskTimeTimer.current = setInterval(() => {
      setEstimateTaskTime((time) => time - 1);
    }, 1000);
    setIsOnPlaying(false);
  };

  const mapButtonTypeToElement = (type: ButtonTypes): React.JSX.Element => {
    const enabled = type % 2 === 1;

    switch (type) {
      case ButtonTypes.PLAY:
      case ButtonTypes.DISABLED_PLAY:
        return (
          <Button disabled={!enabled} key={type} onClick={triggerOnPlay} shape={buttonShape} type="primary">
            <PlayCircleFilled />
            {tMonitor.go}
          </Button>
        );
      case ButtonTypes.RESUME:
      case ButtonTypes.DISABLED_RESUME:
        return (
          <Button disabled={!enabled} key={type} onClick={triggerOnPlay} shape={buttonShape} type="primary">
            <PlayCircleFilled />
            {tMonitor.resume}
          </Button>
        );
      case ButtonTypes.PAUSE:
      case ButtonTypes.DISABLED_PAUSE:
        return (
          <Button
            disabled={!enabled}
            key={type}
            onClick={() => {
              onPause();
              clearInterval(estimateTaskTimeTimer.current as NodeJS.Timeout);
            }}
            shape={buttonShape}
            type="primary"
          >
            <PauseCircleFilled />
            {tMonitor.pause}
          </Button>
        );
      case ButtonTypes.STOP:
      case ButtonTypes.DISABLED_STOP:
        return (
          <Button
            disabled={!enabled}
            key={type}
            onClick={() => {
              onStop();
              clearInterval(estimateTaskTimeTimer.current as NodeJS.Timeout);
              setEstimateTaskTime(taskTime);
            }}
            shape={buttonShape}
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
        <Button disabled={!canStart} onClick={triggerOnPlay} shape={buttonShape} type="primary">
          <PlayCircleFilled />
          {tMonitor.go}
        </Button>
      </Space>
    );
  }

  if (mode === Mode.WORKING) {
    return <Space>{MonitorStatus.getControlButtonType(report).map((type) => mapButtonTypeToElement(type))}</Space>;
  }

  return null;
};

export default MonitorControl;
