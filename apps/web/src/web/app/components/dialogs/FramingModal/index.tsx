import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, InputNumber, Modal, Segmented, Spin, Tooltip } from 'antd';
import { LoadingOutlined, QuestionCircleOutlined } from '@ant-design/icons';

import beamboxPreference from 'app/actions/beambox/beambox-preference';
import FramingIcons from 'app/icons/framing/FramingIcons';
import FramingTaskManager, { FramingType } from 'helpers/device/framing';
import getDevice from 'helpers/device/get-device';
import icons from 'app/icons/icons';
import MessageCaller, { MessageLevel } from 'app/actions/message-caller';
import shortcuts from 'helpers/shortcuts';
import useI18n from 'helpers/useI18n';
import { addDialogComponent, isIdExist, popDialogById } from 'app/actions/dialog-controller';
import { getSupportInfo } from 'app/constants/add-on';
import { IDeviceInfo } from 'interfaces/IDevice';
import { promarkModels } from 'app/actions/beambox/constant';

import classNames from 'classnames';
import styles from './index.module.scss';
import PromarkFramingModal from './FramingModal.promark';

interface Props {
  device: IDeviceInfo;
  onClose: () => void;
  startOnOpen?: boolean;
}

// TODO: add unit test
const FramingModal = ({ device, onClose, startOnOpen = false }: Props): JSX.Element => {
  const lang = useI18n();
  const { framing: tFraming } = lang;
  const options = [FramingType.Framing, FramingType.Hull, FramingType.AreaCheck];
  const [isFraming, setIsFraming] = useState<boolean>(false);
  const [lowLaser, setLowLaser] = useState<number>(beamboxPreference.read('low_power') ?? 10);
  const [type, setType] = useState<FramingType>(FramingType.Framing);
  const manager = useRef<FramingTaskManager>(null);
  const shortcutHandler = useRef<() => void>(null);

  const supportInfo = useMemo(() => getSupportInfo(device.model), [device]);

  const handleStart = useCallback(() => {
    manager.current?.startFraming(type, { lowPower: supportInfo.framingLowLaser ? lowLaser : 0 });
  }, [type, lowLaser, supportInfo.framingLowLaser]);

  const handleStop = useCallback(() => {
    manager.current?.stopFraming();
  }, []);

  useEffect(() => {
    const key = 'framing.default';

    manager.current = new FramingTaskManager(device);

    manager.current.on('status-change', (status: boolean) => setIsFraming(status));
    manager.current.on('close-message', () => MessageCaller.closeMessage(key));
    manager.current.on('message', (message: string) => {
      MessageCaller.closeMessage(key);
      MessageCaller.openMessage({ key, level: MessageLevel.LOADING, content: message });
    });

    return () => {
      manager.current?.stopFraming();
      MessageCaller.closeMessage(key);
    };
  }, [device]);

  useEffect(() => {
    shortcutHandler.current = isFraming ? handleStop : handleStart;
  }, [isFraming, handleStop, handleStart]);

  useEffect(() => {
    if (startOnOpen) {
      handleStart();
    }

    return shortcuts.on(['F1'], () => shortcutHandler.current?.(), { isBlocking: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Modal
      open
      centered
      width={360}
      title={tFraming.framing}
      maskClosable={false}
      onCancel={onClose}
      footer={
        <div className={styles.footer}>
          <Button className={classNames(styles.button, styles['mr-8'])} onClick={onClose}>
            {lang.alert.cancel}
          </Button>
          <Button
            className={styles.button}
            onClick={isFraming ? handleStop : handleStart}
            type="primary"
          >
            {isFraming ? lang.alert.stop : lang.device.start}
            {isFraming ? (
              <Spin indicator={<LoadingOutlined className={styles.icon} spin />} />
            ) : (
              <icons.Play className={styles.icon} />
            )}
          </Button>
        </div>
      }
    >
      <div className={styles.container}>
        {supportInfo.framingLowLaser && (
          <div className={styles['low-laser']}>
            <div className={styles.left}>
              <Tooltip title={tFraming.low_laser_desc}>
                <QuestionCircleOutlined className={styles.icon} />
              </Tooltip>
              {tFraming.low_laser}:
            </div>
            <InputNumber
              className={styles.input}
              min={0}
              max={20}
              value={lowLaser}
              onChange={(val) => setLowLaser(val)}
              addonAfter="%"
              controls={false}
              precision={0}
            />
          </div>
        )}
        <Segmented
          className={styles.segmented}
          value={type}
          onChange={setType}
          options={options.map((opt) => ({
            label: (
              <div className={styles.seg}>
                {
                  {
                    [FramingType.Framing]: <FramingIcons.Framing />,
                    [FramingType.Hull]: <FramingIcons.Hull />,
                    [FramingType.AreaCheck]: <FramingIcons.AreaCheck />,
                  }[opt]
                }
                <div>
                  {
                    {
                      [FramingType.Framing]: tFraming.framing,
                      [FramingType.Hull]: tFraming.hull,
                      [FramingType.AreaCheck]: tFraming.area_check,
                    }[opt]
                  }
                </div>
              </div>
            ),
            value: opt,
          }))}
        />
        <div className={styles.desc}>
          <div className={styles.title}>
            {{
              [FramingType.Framing]: tFraming.framing,
              [FramingType.Hull]: tFraming.hull,
              [FramingType.AreaCheck]: tFraming.area_check,
            }[type] ?? tFraming.framing}
          </div>
          <div className={styles.content}>
            {{
              [FramingType.Framing]: tFraming.framing_desc,
              [FramingType.Hull]: tFraming.hull_desc,
              [FramingType.AreaCheck]: tFraming.areacheck_desc,
            }[type] ?? tFraming.framing_desc}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default FramingModal;

export const showFramingModal = async (): Promise<void> => {
  const { device } = await getDevice();

  if (!device || isIdExist('framing-modal')) {
    return;
  }

  addDialogComponent(
    'framing-modal',
    promarkModels.has(device.model) ? (
      <PromarkFramingModal
        device={device}
        onClose={() => popDialogById('framing-modal')}
        startOnOpen
      />
    ) : (
      <FramingModal device={device} onClose={() => popDialogById('framing-modal')} />
    )
  );
};
