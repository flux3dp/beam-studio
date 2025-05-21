import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { ClockCircleOutlined, FileOutlined, LoadingOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Progress, Row, Spin } from 'antd';

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
  /* for Promark framing */
  const options = useMemo(() => getFramingOptions(device), [device]);
  const manager = useRef<FramingTaskManager | null>(null);
  const [isFraming, setIsFraming] = useState<boolean>(false);
  const [isFramingButtonDisabled, setIsFramingButtonDisabled] = useState<boolean>(false);
  const [type, setType] = useState<TFramingType>(options[0]);
  const [estimateTaskTime, setEstimateTaskTime] = useState<number>(totalTaskTime);
  /* for Promark framing */

  const getJobTime = (time = totalTaskTime, byReport = true): null | string => {
    const isWorking = mode === Mode.WORKING;

    if (isFraming) {
      return `${FormatDuration(Math.max(totalTaskTime, 1))}` || null;
    }

    if (isWorking && byReport && report?.prog) {
      return `${FormatDuration(Math.max(time * (1 - report.prog), 1))} ${tMonitor.left}`;
    }

    return time ? `${FormatDuration(Math.max(time, 1))} ${isWorking ? tMonitor.left : ''}` : null;
  };

  /* for Promark framing */
  const handleFramingStop = useCallback(async () => {
    setIsFramingButtonDisabled(true);
    await manager.current?.stopFraming();
    await manager.current?.resetPromarkParams();
  }, []);

  const handleFramingStart = useCallback(
    (forceType?: TFramingType) => manager.current?.startFraming(forceType ?? type, { lowPower: 0 }),
    [type],
  );

  const renderIcon = useCallback(
    (parentType: TFramingType) => {
      if (isFraming && parentType === type) {
        return <Spin className={styles['icon-framing']} indicator={<LoadingOutlined spin />} />;
      }

      return renderFramingIcon(parentType, styles['icon-framing']);
    },
    [isFraming, type],
  );

  const renderPromarkFramingButton = (): React.ReactNode => {
    if (!isPromark) return null;

    return (
      <Flex gap={8}>
        {options.map((option) => (
          <Button
            disabled={isFramingButtonDisabled}
            icon={renderIcon(option)}
            key={`monitor-framing-${option}`}
            onClick={async () => {
              if (isFraming) {
                await handleFramingStop();
                await new Promise((resolve) => setTimeout(resolve, 500));
              }

              if (!isFraming || option !== type) {
                setType(option);
                setIsFraming(true);
                handleFramingStart(option);
              }
            }}
          >
            {options.length === 1 && tFraming[framingOptions[option].title]}
          </Button>
        ))}
      </Flex>
    );
  };
  /* for Promark framing */

  const renderProgress = (): React.ReactNode => {
    if (isFraming) {
      return renderPromarkFramingButton();
    }

    if (uploadProgress !== null) {
      return (
        <Progress percent={Number(uploadProgress)} status="active" strokeColor={{ from: '#108ee9', to: '#87d068' }} />
      );
    }

    if (!report) {
      if (isPromark) {
        return renderPromarkFramingButton();
      }

      return null;
    }

    if (report?.st_id === DeviceConstants.status.COMPLETED) {
      if (isPromark) {
        return renderPromarkFramingButton();
      }

      return <Progress percent={100} />;
    }

    if (!report?.prog) {
      if (isPromark) {
        return renderPromarkFramingButton();
      }

      return null;
    }

    // for task prog is below 1, for framing prog a big number
    const percentage = Number.parseInt((report.prog * 100).toFixed(1), 10);
    const estimatePercentage = Math.round(((totalTaskTime - estimateTaskTime) / totalTaskTime) * 100);
    const displayPercentage = Math.min(isPromark ? estimatePercentage : percentage, 99);

    if (report.st_id === DeviceConstants.status.ABORTED) {
      return <Progress percent={displayPercentage} status="exception" />;
    }

    if (isPromark && report.prog >= 1) {
      return renderPromarkFramingButton();
    }

    return <Progress percent={displayPercentage} status="active" strokeColor={{ from: '#108ee9', to: '#87d068' }} />;
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
          setIsFramingButtonDisabled(false);
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
              <div className={styles['right-text']}>
                <ClockCircleOutlined />
                &nbsp;
                {isPromark ? getJobTime(estimateTaskTime, false) : getJobTime()}
              </div>
            </Col>
          </Row>
        </div>
      </div>
      <Row>
        <Col md={12} span={24}>
          {renderProgress()}
        </Col>
        <Col md={12} span={24}>
          <div className={styles['control-buttons']}>
            <MonitorControl
              handleFramingStop={handleFramingStop}
              isFraming={isFraming}
              isPromark={isPromark}
              setEstimateTaskTime={setEstimateTaskTime}
            />
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default MonitorTask;
