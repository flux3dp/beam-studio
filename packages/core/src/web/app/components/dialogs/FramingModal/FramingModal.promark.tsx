import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { InfoCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { Button, Divider, Flex, Modal, Spin, Tooltip } from 'antd';
import classNames from 'classnames';

import { handleExportClick } from '@core/app/actions/beambox/export/GoButton/handleExportClick';
import MessageCaller, { MessageLevel } from '@core/app/actions/message-caller';
import { renderFramingIcon } from '@core/app/icons/framing/FramingIcons';
import icons from '@core/app/icons/icons';
import { FramingType } from '@core/helpers/device/framing';
import FramingTaskManager, { framingOptions, getFramingOptions } from '@core/helpers/device/framing';
import shortcuts from '@core/helpers/shortcuts';
import useI18n from '@core/helpers/useI18n';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

import styles from './index.module.scss';

interface Props {
  device: IDeviceInfo;
  onClose: () => void;
  startOnOpen?: boolean;
}

// TODO: add unit test
const PromarkFramingModal = ({ device, onClose, startOnOpen = false }: Props): React.JSX.Element => {
  const lang = useI18n();
  const { framing: tFraming } = lang;
  const options = useMemo(() => getFramingOptions(device), [device]);
  const [isFraming, setIsFraming] = useState<boolean>(false);
  const [type, setType] = useState<FramingType>(options[0]);
  const manager = useRef<FramingTaskManager>(null);
  const shortcutHandler = useRef<() => void>(null);

  const handleStart = useCallback(
    (forceType?: FramingType) => manager.current?.startFraming(forceType ?? type, { lowPower: 0 }),
    [type],
  );

  const handleStop = useCallback(async () => {
    await manager.current?.stopFraming();
  }, []);

  const renderIcon = useCallback(
    (parentType: FramingType) => {
      if (isFraming && parentType === type) {
        return <Spin className={styles['icon-spin']} indicator={<LoadingOutlined spin />} />;
      }

      return renderFramingIcon(parentType, styles['icon-framing']);
    },
    [isFraming, type],
  );

  useEffect(() => {
    const key = 'framing.promark';

    manager.current = new FramingTaskManager(device);

    manager.current.on('status-change', setIsFraming);
    manager.current.on('close-message', () => MessageCaller.closeMessage(key));
    manager.current.on('message', (content: string) => {
      MessageCaller.openMessage({ content, key, level: MessageLevel.LOADING });
    });

    return () => {
      manager.current?.stopFraming();
      MessageCaller.closeMessage(key);
    };
  }, [device, manager, setIsFraming]);

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
          <Button
            className={styles.button}
            icon={<icons.Play className={styles.icon} />}
            iconPosition="end"
            onClick={() => {
              handleStop();
              setTimeout(() => {
                handleExportClick(lang)();
                onClose();
              }, 500);
            }}
            type="primary"
          >
            {tFraming.start_task}
          </Button>
        </div>
      }
      maskClosable={false}
      onCancel={onClose}
      open
      title={tFraming.framing}
      width={options.length > 1 ? 480 : 360}
    >
      <div className={styles.container}>
        <Flex gap={16}>
          {options.map((option) => (
            <Button
              className={styles['icon-text-button']}
              key={`framing-${option}`}
              onClick={async () => {
                if (isFraming) {
                  await handleStop();
                  await new Promise((resolve) => setTimeout(resolve, 500));
                }

                if (!isFraming || option !== type) {
                  setType(option);
                  handleStart(option);
                }
              }}
            >
              <div className={styles['icon-text-container']}>
                {renderIcon(option)}
                <span className={styles.text}>{tFraming[framingOptions[option].title]}</span>
              </div>
            </Button>
          ))}
        </Flex>
        <div className={styles.desc}>
          <div className={styles.content}>
            {tFraming[framingOptions[type].description]}
            {type === FramingType.RotateFraming && (
              <Tooltip title={tFraming.rotation_frame_warning}>
                <InfoCircleOutlined className={styles.hint} />
              </Tooltip>
            )}
          </div>
          <Divider />
          <div className={styles.content}>{tFraming.start_task_description}</div>
        </div>
      </div>
    </Modal>
  );
};

export default PromarkFramingModal;
