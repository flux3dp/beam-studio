/* eslint-disable @typescript-eslint/no-shadow */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Divider, Flex, Modal, Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

import FramingIcons from 'app/icons/framing/FramingIcons';
import FramingTaskManager, { FramingType } from 'helpers/device/framing';
import icons from 'app/icons/icons';
import MessageCaller, { MessageLevel } from 'app/actions/message-caller';
import shortcuts from 'helpers/shortcuts';
import useI18n from 'helpers/useI18n';
import { IDeviceInfo } from 'interfaces/IDevice';

import classNames from 'classnames';
import { handleExportClick } from 'app/actions/beambox/export/GoButton/handleExportClick';
import styles from './index.module.scss';

interface Props {
  device: IDeviceInfo;
  onClose: () => void;
  startOnOpen?: boolean;
}

// TODO: add unit test
const PromarkFramingModal = ({ device, onClose, startOnOpen = false }: Props): JSX.Element => {
  const lang = useI18n();
  const { framing: tFraming } = lang;
  const options = [FramingType.Framing] as const;
  const [isFraming, setIsFraming] = useState<boolean>(false);
  const [type, setType] = useState<FramingType>(options[0]);
  const manager = useRef<FramingTaskManager>(null);
  const shortcutHandler = useRef<() => void>(null);

  const handleStart = useCallback(
    (forceType?: FramingType) => manager.current?.startFraming(forceType ?? type, { lowPower: 0 }),
    [type]
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
    [isFraming, type]
  );

  useEffect(() => {
    const key = 'framing.promark';

    manager.current = new FramingTaskManager(device);

    manager.current.on('status-change', setIsFraming);
    manager.current.on('close-message', () => MessageCaller.closeMessage(key));
    manager.current.on('message', (content: string) => {
      MessageCaller.openMessage({ key, level: MessageLevel.LOADING, content });
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
            onClick={() => {
              handleStop();
              setTimeout(() => {
                handleExportClick(lang)();
                onClose();
              }, 500);
            }}
            type="primary"
            icon={<icons.Play className={styles.icon} />}
            iconPosition="end"
          >
            {tFraming.start_task}
          </Button>
        </div>
      }
    >
      <div className={styles.container}>
        <Flex>
          {options.map((option) => (
            <Button
              key={`framing-${option}`}
              onClick={
                isFraming
                  ? handleStop
                  : () => {
                      setType(option);
                      handleStart(option);
                    }
              }
              className={styles['icon-text-button']}
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
