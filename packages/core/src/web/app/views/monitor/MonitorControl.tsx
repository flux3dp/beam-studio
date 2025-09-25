import type { ReactNode } from 'react';
import React, { useContext, useEffect, useRef } from 'react';

import { CloseCircleFilled, LoadingOutlined, PauseCircleFilled, PlayCircleFilled } from '@ant-design/icons';
import { Button, Space } from 'antd';

import DeviceConstants from '@core/app/constants/device-constants';
import { Mode } from '@core/app/constants/monitor-constants';
import { MonitorContext } from '@core/app/contexts/MonitorContext';
import MonitorStatus, { ButtonTypes } from '@core/helpers/monitor-status';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

interface Props {
  handleFramingStop: () => Promise<void>;
  isFraming: boolean;
  isFramingTask: boolean;
  isOnPlaying: boolean;
  isPromark: boolean;
  setIsFramingTask: React.Dispatch<React.SetStateAction<boolean>>;
  setIsOnPlaying: React.Dispatch<React.SetStateAction<boolean>>;
}

const MonitorControl = ({
  handleFramingStop,
  isFraming,
  isFramingTask,
  isOnPlaying,
  isPromark,
  setIsFramingTask,
  setIsOnPlaying,
}: Props): ReactNode => {
  const { monitor: tMonitor } = useI18n();
  const isMobile = useIsMobile();
  const buttonShape = isMobile ? 'round' : 'default';
  const { mode, onPause, onPlay, onStop, report, totalTaskTime } = useContext(MonitorContext);
  const onPlayingTimer = useRef<NodeJS.Timeout | null>(null);

  const triggerOnPlay = async () => {
    setIsOnPlaying(true);
    setIsFramingTask(false);

    if (isFraming) {
      await handleFramingStop();
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    await onPlay(isPromark);

    onPlayingTimer.current = setTimeout(
      () => {
        setIsOnPlaying(false);
      },
      totalTaskTime < 3 ? 2000 : 5000,
    );
  };

  const mapButtonTypeToElement = (type: ButtonTypes): ReactNode => {
    const enabled = type % 2 === 1;

    switch (type) {
      case ButtonTypes.PLAY:
      case ButtonTypes.DISABLED_PLAY:
        return (
          <Button
            disabled={!enabled || isOnPlaying}
            key={type}
            onClick={triggerOnPlay}
            shape={buttonShape}
            type="primary"
          >
            {isOnPlaying ? <LoadingOutlined spin /> : <PlayCircleFilled />}
            {tMonitor.go}
          </Button>
        );
      case ButtonTypes.RESUME:
      case ButtonTypes.DISABLED_RESUME:
        return (
          <Button
            disabled={!enabled || isOnPlaying}
            key={type}
            onClick={() => onPlay()}
            shape={buttonShape}
            type="primary"
          >
            <PlayCircleFilled />
            {tMonitor.resume}
          </Button>
        );
      case ButtonTypes.PAUSE:
      case ButtonTypes.DISABLED_PAUSE:
        return (
          <Button disabled={!enabled} key={type} onClick={() => onPause()} shape={buttonShape} type="primary">
            <PauseCircleFilled />
            {tMonitor.pause}
          </Button>
        );
      case ButtonTypes.STOP:
      case ButtonTypes.DISABLED_STOP:
        return (
          <Button disabled={!enabled} key={type} onClick={() => onStop()} shape={buttonShape}>
            <CloseCircleFilled />
            {tMonitor.stop}
          </Button>
        );
      default:
        return null;
    }
  };

  const canStart = report?.st_id === DeviceConstants.status.IDLE || isFramingTask;

  useEffect(() => {
    // Fixme: when task code is too long, Promark working status may not updated in time
    if (!isFraming && isOnPlaying && report?.st_id === DeviceConstants.status.RUNNING) {
      setIsOnPlaying(false);

      if (onPlayingTimer.current) {
        clearTimeout(onPlayingTimer.current);
      }
    }
  }, [isOnPlaying, report, isFraming, setIsOnPlaying]);

  if (mode === Mode.PREVIEW || mode === Mode.FILE_PREVIEW || isFramingTask || isOnPlaying) {
    return (
      <Space>
        <Button disabled={!canStart || isOnPlaying} onClick={triggerOnPlay} shape={buttonShape} type="primary">
          {isOnPlaying ? <LoadingOutlined spin /> : <PlayCircleFilled />}
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
