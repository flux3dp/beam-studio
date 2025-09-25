import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { ClockCircleOutlined, FileOutlined, LoadingOutlined } from '@ant-design/icons';
import type { ProgressProps } from 'antd';
import { Button, Col, Progress, Row } from 'antd';

import { promarkModels } from '@core/app/actions/beambox/constant';
import DeviceConstants from '@core/app/constants/device-constants';
import { Mode } from '@core/app/constants/monitor-constants';
import { MonitorContext } from '@core/app/contexts/MonitorContext';
import { renderFramingIcon } from '@core/app/icons/framing/FramingIcons';
import type { TFramingType } from '@core/helpers/device/framing';
import FramingTaskManager, { framingOptions, getFramingOptions } from '@core/helpers/device/framing';
import FormatDuration from '@core/helpers/duration-formatter';
import useI18n from '@core/helpers/useI18n';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

import MonitorControl from './MonitorControl';
import styles from './MonitorTask.module.scss';

const defaultImage = 'core-img/ph_l.png';

interface Props {
  device: IDeviceInfo;
}

const MonitorTask = ({ device }: Props): React.JSX.Element => {
  const { framing: tFraming, monitor: tMonitor } = useI18n();
  const { fileInfo, mode, previewTask, report, taskImageURL, totalTaskTime, uploadProgress } =
    useContext(MonitorContext);
  const isPromark = useMemo(() => promarkModels.has(device.model), [device.model]);
  const [isOnPlaying, setIsOnPlaying] = useState(false);
  /* for Promark framing */
  const options = useMemo(() => getFramingOptions(device), [device]);
  const manager = useRef<FramingTaskManager | null>(null);
  const [isFraming, setIsFraming] = useState(false);
  const [isFramingTask, setIsFramingTask] = useState(false);
  const [isStoppingFraming, setIsStoppingFraming] = useState(false);
  const [type, setType] = useState(options[0]);
  const isInWorkingState = useMemo(
    () =>
      !isFramingTask &&
      [
        DeviceConstants.status.PAUSED_FROM_RUNNING,
        DeviceConstants.status.RECONNECTING,
        DeviceConstants.status.RUNNING,
      ].includes(report.st_id),
    [isFramingTask, report.st_id],
  );
  const shouldDisableFraming = useMemo(
    () => isStoppingFraming || isOnPlaying || isInWorkingState,
    [isInWorkingState, isOnPlaying, isStoppingFraming],
  );
  /* for Promark framing */

  const getJobTime = (): React.ReactNode => {
    const isWorking = mode === Mode.WORKING;
    let jobTimeStr: string | undefined = undefined;

    if (isFramingTask) {
      jobTimeStr = `${FormatDuration(Math.max(totalTaskTime, 1))}`;
    } else if (isWorking && report?.prog && totalTaskTime) {
      jobTimeStr = `${FormatDuration(Math.max(totalTaskTime * (1 - report.prog), 1))} ${tMonitor.left}`;
    } else if (totalTaskTime) {
      jobTimeStr = `${FormatDuration(Math.max(totalTaskTime, 1))} ${isWorking ? tMonitor.left : ''}`;
    }

    return jobTimeStr ? (
      <div className={styles['right-text']}>
        <ClockCircleOutlined />
        &nbsp;
        {jobTimeStr}
      </div>
    ) : null;
  };

  /* for Promark framing */
  const handleFramingStop = useCallback(async () => {
    setIsStoppingFraming(true);
    await manager.current?.stopFraming();
    await manager.current?.resetPromarkParams();
  }, []);

  const handleFramingStart = useCallback(
    async (forceType: TFramingType) => {
      setType(forceType);

      const res = await manager.current?.startFraming(forceType, { lowPower: 0 });

      if (!res) {
        setType(type);
      }
    },
    [type],
  );

  const renderIcon = useCallback(
    (parentType: TFramingType) => {
      if (isFraming && isFramingTask && parentType === type) {
        return <LoadingOutlined className={styles['icon-framing']} spin />;
      }

      return renderFramingIcon(parentType, styles['icon-framing']);
    },
    [isFraming, isFramingTask, type],
  );

  const renderPromarkFramingButton = (): React.ReactNode => {
    if (!isPromark) return null;

    return (
      <div className={styles['framing-buttons']}>
        <div className={styles.label}>{tFraming.framing}:</div>
        {options.map((option) => (
          <Button
            disabled={shouldDisableFraming}
            icon={renderIcon(option)}
            key={option}
            onClick={async () => {
              if (isFraming) {
                await handleFramingStop();
                await new Promise((resolve) => setTimeout(resolve, 500));
              }

              if (!isFraming || option !== type) {
                setIsFramingTask(true);
                setIsFraming(true);
                handleFramingStart(option);
              }
            }}
          >
            {tFraming[framingOptions[option].title]}
          </Button>
        ))}
      </div>
    );
  };
  /* for Promark framing */

  const renderProgress = (): React.ReactNode => {
    let percent: ProgressProps['percent'] = undefined;
    let status: ProgressProps['status'] = undefined;

    if (isFramingTask || isOnPlaying) {
      // Show empty progress bar
    } else if (uploadProgress !== null) {
      percent = Number(uploadProgress);
    } else if (report && report.st_id !== DeviceConstants.status.IDLE) {
      percent = Math.min(Number.parseInt((report.prog * 100).toFixed(1), 10), 99);

      if (report.st_id === DeviceConstants.status.COMPLETED) {
        percent = 100;
        status = 'success';
      } else if (report.st_id === DeviceConstants.status.ABORTED) {
        status = 'exception';
      }
    }

    return percent === undefined ? (
      <Progress showInfo={false} />
    ) : (
      <Progress
        percent={percent}
        status={status ?? 'active'}
        strokeColor={status ? undefined : { from: '#108ee9', to: '#87d068' }}
      />
    );
  };

  const renderFileInfo = (): React.JSX.Element => {
    const fileName = fileInfo ? fileInfo[0] : previewTask?.fileName;

    return (
      <div className={styles['left-text']}>
        <FileOutlined />
        &nbsp;
        {fileName || tMonitor.task.BEAMBOX}
      </div>
    );
  };

  useEffect(() => {
    let managerIsFraming = false;

    manager.current = new FramingTaskManager(device, 'monitor.framing');
    manager.current.on('status-change', (status: boolean) => {
      if (status) {
        managerIsFraming = true;
        setIsFraming(true);
      } else {
        managerIsFraming = false;
        setTimeout(() => {
          setIsFraming(managerIsFraming);
          setIsStoppingFraming(false);
        }, 1500);
      }
    });

    return () => {
      manager.current?.destroy();
    };
  }, [device, manager, setIsFraming]);

  return (
    <div className={styles.task}>
      <div className={styles['info-container']}>
        <img src={taskImageURL || defaultImage} />
        <div className={styles['info-bar']}>
          <Row>
            <Col md={12} span={24}>
              {renderFileInfo()}
            </Col>
            <Col md={12} span={24}>
              {getJobTime()}
            </Col>
          </Row>
        </div>
      </div>
      {taskImageURL || isInWorkingState ? (
        <>
          {renderPromarkFramingButton()}
          <Row>
            <Col md={12} span={24}>
              {renderProgress()}
            </Col>
            <Col md={12} span={24}>
              <div className={styles['control-buttons']}>
                <MonitorControl
                  handleFramingStop={handleFramingStop}
                  isFraming={isFraming}
                  isFramingTask={isFramingTask}
                  isOnPlaying={isOnPlaying}
                  isPromark={isPromark}
                  setIsFramingTask={setIsFramingTask}
                  setIsOnPlaying={setIsOnPlaying}
                />
              </div>
            </Col>
          </Row>
        </>
      ) : (
        <div>{tMonitor.no_task_info}</div>
      )}
    </div>
  );
};

export default MonitorTask;
