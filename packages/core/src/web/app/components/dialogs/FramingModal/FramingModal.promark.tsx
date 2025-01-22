import React, { useCallback, useEffect, useRef, useState } from 'react';

import { LoadingOutlined } from '@ant-design/icons';
import { Button, Divider, Flex, Modal, Spin } from 'antd';
import classNames from 'classnames';

import { handleExportClick } from '@core/app/actions/beambox/export/GoButton/handleExportClick';
import MessageCaller, { MessageLevel } from '@core/app/actions/message-caller';
import FramingIcons from '@core/app/icons/framing/FramingIcons';
import icons from '@core/app/icons/icons';
import FramingTaskManager, { FramingType } from '@core/helpers/device/framing';
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
  const options = [FramingType.Framing] as const;
  const [isFraming, setIsFraming] = useState<boolean>(false);
  const [type, setType] = useState<FramingType>(options[0]);
  const manager = useRef<FramingTaskManager>(null);
  const shortcutHandler = useRef<() => void>(null);

  const handleStart = useCallback(
    (forceType?: FramingType) => manager.current?.startFraming(forceType ?? type, { lowPower: 0 }),
    [type],
  );

  const handleStop = useCallback(() => {
    manager.current?.stopFraming();
  }, []);

  const renderIcon = useCallback(
    (parentType: FramingType) => {
      if (isFraming && parentType === type) {
        return <Spin className={styles['icon-spin']} indicator={<LoadingOutlined spin />} />;
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
      width={360}
    >
      <div className={styles.container}>
        <Flex>
          {options.map((option) => (
            <Button
              className={styles['icon-text-button']}
              key={`framing-${option}`}
              onClick={
                isFraming
                  ? handleStop
                  : () => {
                      setType(option);
                      handleStart(option);
                    }
              }
            >
              <div className={styles['icon-text-container']}>
                {renderIcon(option)}
                <span className={styles.text}>{tFraming.framing}</span>
              </div>
            </Button>
          ))}
        </Flex>
        <div className={styles.desc}>
          <div className={styles.content}>{tFraming.framing_desc}</div>
          <Divider />
          <div className={styles.content}>{tFraming.start_task_description}</div>
        </div>
      </div>
    </Modal>
  );
};

export default PromarkFramingModal;
