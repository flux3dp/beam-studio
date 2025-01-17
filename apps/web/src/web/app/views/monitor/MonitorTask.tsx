/* eslint-disable @typescript-eslint/no-shadow */
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Col, Flex, Progress, Row, Spin } from 'antd';
import { ClockCircleOutlined, FileOutlined, LoadingOutlined } from '@ant-design/icons';

import DeviceConstants from 'app/constants/device-constants';
import FormatDuration from 'helpers/duration-formatter';
import { Mode } from 'app/constants/monitor-constants';
import { MonitorContext } from 'app/contexts/MonitorContext';

import useI18n from 'helpers/useI18n';
import { IDeviceInfo } from 'interfaces/IDevice';
import { promarkModels } from 'app/actions/beambox/constant';
import FramingTaskManager, { FramingType } from 'helpers/device/framing';
import FramingIcons from 'app/icons/framing/FramingIcons';
import MessageCaller, { MessageLevel } from 'app/actions/message-caller';
import MonitorControl from './MonitorControl';
import styles from './MonitorTask.module.scss';

const defaultImage = 'core-img/ph_l.png';

interface Props {
  device: IDeviceInfo;
}

const MonitorTask = ({ device }: Props): JSX.Element => {
  const { monitor: tMonitor, framing: tFraming } = useI18n();
  const { taskTime, mode, report, uploadProgress, taskImageURL, fileInfo, previewTask } =
    useContext(MonitorContext);
  const isPromark = useMemo(() => promarkModels.has(device.model), [device.model]);
  /* for Promark framing */
  const options = [FramingType.Framing] as const;
  const manager = useRef<FramingTaskManager>(null);
  const [isFraming, setIsFraming] = useState<boolean>(false);
  const [isFramingButtonDisabled, setIsFramingButtonDisabled] = useState<boolean>(false);
  const [type, setType] = useState<FramingType>(options[0]);
  const [estimateTaskTime, setEstimateTaskTime] = useState<number>(taskTime);
  /* for Promark framing */

  const getJobTime = (time = taskTime, byReport = true): string => {
    const isWorking = mode === Mode.WORKING;

    if (isFraming) {
      return `${FormatDuration(Math.max(taskTime, 1))}` || null;
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
  }, []);

  const handleFramingStart = useCallback(
    (forceType?: FramingType) => manager.current?.startFraming(forceType ?? type, { lowPower: 0 }),
    [type]
  );

  const renderIcon = useCallback(
    (parentType: FramingType) => {
      if (isFraming && parentType === type) {
        return <Spin indicator={<LoadingOutlined spin />} />;
      }

      switch (parentType) {
        case FramingType.Framing:
          return <FramingIcons.Framing className={styles['icon-framing']} />;
        case FramingType.Hull:
          return <FramingIcons.Hull className={styles['icon-framing']} />;
        case FramingType.AreaCheck:
          return <FramingIcons.AreaCheck className={styles['icon-framing']} />;
        default:
          return null;
      }
    },
    [isFraming, type]
  );

  const renderPromarkFramingButton = (): JSX.Element => {
    if (!isPromark) {
      return null;
    }

    return (
      <Flex>
        {options.map((option) => (
          <Button
            key={`monitor-framing-${option}`}
            disabled={isFramingButtonDisabled}
            onClick={
              isFraming
                ? handleFramingStop
                : () => {
                    setType(option);
                    setIsFraming(true);
                    handleFramingStart(option);
                  }
            }
            icon={renderIcon(option)}
          >
            {tFraming.framing}
          </Button>
        ))}
      </Flex>
    );
  };
  /* for Promark framing */

  const renderProgress = (): JSX.Element => {
    if (isFraming) {
      return renderPromarkFramingButton();
    }

    if (uploadProgress !== null) {
      return (
        <Progress
          percent={Number(uploadProgress)}
          status="active"
          strokeColor={{ from: '#108ee9', to: '#87d068' }}
        />
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
    const estimatePercentage = Math.round(((taskTime - estimateTaskTime) / taskTime) * 100);
    const displayPercentage = Math.min(isPromark ? estimatePercentage : percentage, 99);

    if (report.st_id === DeviceConstants.status.ABORTED) {
      return <Progress percent={displayPercentage} status="exception" />;
    }

    if (isPromark && report.prog >= 1) {
      return renderPromarkFramingButton();
    }

    return (
      <Progress
        percent={displayPercentage}
        status="active"
        strokeColor={{ from: '#108ee9', to: '#87d068' }}
      />
    );
  };

  const renderFileInfo = (): JSX.Element => {
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
    const key = 'monitor.framing';

    manager.current = new FramingTaskManager(device);
    manager.current.on('status-change', (status: boolean) => {
      if (status) {
        setIsFraming(true);
      } else {
        setTimeout(() => {
          setIsFraming(false);
          setIsFramingButtonDisabled(false);
        }, 1500);
      }
    });
    manager.current.on('close-message', () => MessageCaller.closeMessage(key));
    manager.current.on('message', (content: string) => {
      MessageCaller.openMessage({ key, level: MessageLevel.LOADING, content });
    });

    return () => {
      manager.current?.stopFraming();
      MessageCaller.closeMessage(key);
    };
  }, [device, manager, setIsFraming]);

  return (
    <div className={styles.task}>
      <div className={styles['info-container']}>
        <img src={taskImageURL || defaultImage} />
        <div className={styles['info-bar']}>
          <Row>
            <Col span={24} md={12}>
              {renderFileInfo()}
            </Col>
            <Col span={24} md={12}>
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
        <Col span={24} md={12}>
          {renderProgress()}
        </Col>
        <Col span={24} md={12}>
          <div className={styles['control-buttons']}>
            <MonitorControl
              isPromark={isPromark}
              isFraming={isFraming}
              setEstimateTaskTime={setEstimateTaskTime}
            />
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default MonitorTask;
