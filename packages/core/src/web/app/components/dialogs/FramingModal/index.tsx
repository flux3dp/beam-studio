import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { LoadingOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { Button, InputNumber, Modal, Segmented, Spin, Tooltip } from 'antd';
import classNames from 'classnames';

import beamboxPreference from '@core/app/actions/beambox/beambox-preference';
import { promarkModels } from '@core/app/actions/beambox/constant';
import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import MessageCaller, { MessageLevel } from '@core/app/actions/message-caller';
import { getAddOnInfo } from '@core/app/constants/add-on';
import FramingIcons from '@core/app/icons/framing/FramingIcons';
import icons from '@core/app/icons/icons';
import FramingTaskManager, { FramingType } from '@core/helpers/device/framing';
import getDevice from '@core/helpers/device/get-device';
import shortcuts from '@core/helpers/shortcuts';
import useI18n from '@core/helpers/useI18n';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

import PromarkFramingModal from './FramingModal.promark';
import styles from './index.module.scss';

interface Props {
  device: IDeviceInfo;
  onClose: () => void;
  startOnOpen?: boolean;
}

// TODO: add unit test
const FramingModal = ({ device, onClose, startOnOpen = false }: Props): React.JSX.Element => {
  const lang = useI18n();
  const { framing: tFraming } = lang;
  const options = [FramingType.Framing, FramingType.Hull, FramingType.AreaCheck];
  const [isFraming, setIsFraming] = useState<boolean>(false);
  const [lowLaser, setLowLaser] = useState<number>(beamboxPreference.read('low_power') ?? 10);
  const [type, setType] = useState<FramingType>(FramingType.Framing);
  const manager = useRef<FramingTaskManager>(null);
  const shortcutHandler = useRef<() => void>(null);

  const addOnInfo = useMemo(() => getAddOnInfo(device.model), [device]);

  const handleStart = useCallback(() => {
    manager.current?.startFraming(type, { lowPower: addOnInfo.framingLowLaser ? lowLaser : 0 });
  }, [type, lowLaser, addOnInfo.framingLowLaser]);

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
      MessageCaller.openMessage({ content: message, key, level: MessageLevel.LOADING });
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
    // eslint-disable-next-line hooks/exhaustive-deps
  }, []);

  return (
    <Modal
      centered
      footer={
        <div className={styles.footer}>
          <Button className={classNames(styles.button, styles['mr-8'])} onClick={onClose}>
            {lang.alert.cancel}
          </Button>
          <Button className={styles.button} onClick={isFraming ? handleStop : handleStart} type="primary">
            {isFraming ? lang.alert.stop : lang.device.start}
            {isFraming ? (
              <Spin indicator={<LoadingOutlined className={styles.icon} spin />} />
            ) : (
              <icons.Play className={styles.icon} />
            )}
          </Button>
        </div>
      }
      maskClosable={false}
      onCancel={onClose}
      open
      title={tFraming.framing}
      width={360}
    >
      <div className={styles.container}>
        {addOnInfo.framingLowLaser && (
          <div className={styles['low-laser']}>
            <div className={styles.left}>
              <Tooltip title={tFraming.low_laser_desc}>
                <QuestionCircleOutlined className={styles.icon} />
              </Tooltip>
              {tFraming.low_laser}:
            </div>
            <InputNumber
              addonAfter="%"
              className={styles.input}
              controls={false}
              max={20}
              min={0}
              onChange={(val) => setLowLaser(val)}
              precision={0}
              value={lowLaser}
            />
          </div>
        )}
        <Segmented
          className={styles.segmented}
          onChange={setType}
          options={options.map((opt) => ({
            label: (
              <div className={styles.seg}>
                {
                  {
                    [FramingType.AreaCheck]: <FramingIcons.AreaCheck />,
                    [FramingType.Framing]: <FramingIcons.Framing />,
                    [FramingType.Hull]: <FramingIcons.Hull />,
                  }[opt]
                }
                <div>
                  {
                    {
                      [FramingType.AreaCheck]: tFraming.area_check,
                      [FramingType.Framing]: tFraming.framing,
                      [FramingType.Hull]: tFraming.hull,
                    }[opt]
                  }
                </div>
              </div>
            ),
            value: opt,
          }))}
          value={type}
        />
        <div className={styles.desc}>
          <div className={styles.title}>
            {{
              [FramingType.AreaCheck]: tFraming.area_check,
              [FramingType.Framing]: tFraming.framing,
              [FramingType.Hull]: tFraming.hull,
            }[type] ?? tFraming.framing}
          </div>
          <div className={styles.content}>
            {{
              [FramingType.AreaCheck]: tFraming.areacheck_desc,
              [FramingType.Framing]: tFraming.framing_desc,
              [FramingType.Hull]: tFraming.hull_desc,
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
      <PromarkFramingModal device={device} onClose={() => popDialogById('framing-modal')} startOnOpen />
    ) : (
      <FramingModal device={device} onClose={() => popDialogById('framing-modal')} />
    ),
  );
};
