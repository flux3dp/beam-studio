import type { ReactNode } from 'react';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';

import { PauseCircleFilled, PlayCircleFilled, StopFilled } from '@ant-design/icons';
import { Button, Space } from 'antd';

import DeviceConstants from '@core/app/constants/device-constants';
import { Mode } from '@core/app/constants/monitor-constants';
import { MonitorContext } from '@core/app/contexts/MonitorContext';
import MonitorStatus, { ButtonTypes } from '@core/helpers/monitor-status';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

interface Props {
  handleFramingStop?: () => Promise<void>;
  isFraming: boolean;
  isPromark: boolean;
  setEstimateTaskTime: React.Dispatch<React.SetStateAction<number>>;
}

const MonitorControl = ({ handleFramingStop, isFraming, isPromark, setEstimateTaskTime }: Props): ReactNode => {
  const { monitor: tMonitor } = useI18n();
  const isMobile = useIsMobile();
  const buttonShape = isMobile ? 'round' : 'default';
  const { mode, onPause, onPlay, onStop, report, totalTaskTime } = useContext(MonitorContext);
  const estimateTaskTimeTimer = useRef<NodeJS.Timeout | null>(null);
  const onPlayingTimer = useRef<NodeJS.Timeout | null>(null);
  const [isOnPlaying, setIsOnPlaying] = useState(false);

  const stopCountDown = () => {
    if (estimateTaskTimeTimer.current) {
      clearInterval(estimateTaskTimeTimer.current);
      estimateTaskTimeTimer.current = null;
    }
  };

  const startCountDown = useCallback(() => {
    stopCountDown();
    estimateTaskTimeTimer.current = setInterval(() => {
      setEstimateTaskTime((time) => time - 1);
    }, 1000);
  }, [setEstimateTaskTime]);

  const triggerOnPlay = async () => {
    setIsOnPlaying(true);

    if (isFraming) {
      await handleFramingStop?.();
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // force resend framing and normal task after abortion in Promark
    const resend = isPromark && report.st_id !== DeviceConstants.status.PAUSED_FROM_RUNNING;
    const actualTaskTime = await onPlay(resend);

    if (resend && actualTaskTime !== null) {
      setEstimateTaskTime(actualTaskTime);
    }

    startCountDown();
    onPlayingTimer.current = setTimeout(() => {
      setIsOnPlaying(false);
    }, 5000);
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
            <PlayCircleFilled />
            {tMonitor.go}
          </Button>
        );
      case ButtonTypes.RESUME:
      case ButtonTypes.DISABLED_RESUME:
        return (
          <Button
            disabled={!enabled || isOnPlaying}
            key={type}
            onClick={triggerOnPlay}
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
          <Button
            disabled={!enabled}
            key={type}
            onClick={() => {
              onPause();
              stopCountDown();
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
              stopCountDown();
              setEstimateTaskTime(totalTaskTime);
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

  const canStart = report?.st_id === DeviceConstants.status.IDLE || isFraming;

  useEffect(() => {
    // Fixme: when task code is too long, Promark working status may not updated in time
    if (!isFraming && isOnPlaying && report?.st_id === DeviceConstants.status.RUNNING) {
      setIsOnPlaying(false);

      if (onPlayingTimer.current) {
        clearTimeout(onPlayingTimer.current);
      }
    }
  }, [isOnPlaying, report, isFraming]);

  useEffect(() => {
    if (!isPromark) return;

    if (report?.st_id === DeviceConstants.status.COMPLETED && !isOnPlaying) {
      stopCountDown();
      setEstimateTaskTime(totalTaskTime);
    } else if (
      report?.st_id === DeviceConstants.status.PAUSED_FROM_RUNNING ||
      report?.st_id === DeviceConstants.status.RECONNECTING
    ) {
      stopCountDown();
    } else if (report?.st_id === DeviceConstants.status.RUNNING && !estimateTaskTimeTimer.current) {
      startCountDown();
    } else if (report?.st_id === DeviceConstants.status.ABORTED) {
      stopCountDown();
      setEstimateTaskTime(totalTaskTime);
    }
  }, [report, isOnPlaying, setEstimateTaskTime, totalTaskTime, startCountDown, isPromark]);

  if (mode === Mode.PREVIEW || mode === Mode.FILE_PREVIEW || isFraming) {
    return (
      <Space>
        <Button disabled={!canStart || isOnPlaying} onClick={triggerOnPlay} shape={buttonShape} type="primary">
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
