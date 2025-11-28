/* eslint-disable reactRefresh/only-export-components */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { LoadingOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { Button, Checkbox, InputNumber, Segmented, Spin, Tooltip } from 'antd';

import { promarkModels } from '@core/app/actions/beambox/constant';
import previewModeController from '@core/app/actions/beambox/preview-mode-controller';
import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import { getAddOnInfo } from '@core/app/constants/addOn';
import { renderFramingIcon } from '@core/app/icons/framing/FramingIcons';
import icons from '@core/app/icons/icons';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import DraggableModal from '@core/app/widgets/DraggableModal';
import type { TFramingType } from '@core/helpers/device/framing';
import FramingTaskManager, { framingOptions, FramingType, getFramingOptions } from '@core/helpers/device/framing';
import getDevice from '@core/helpers/device/get-device';
import { isCanvasEmpty } from '@core/helpers/layer/checkContent';
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
  const options = useMemo(() => getFramingOptions(device), [device]);
  const [isFraming, setIsFraming] = useState<boolean>(false);
  const [loop, setLoop] = useState(false);
  const [lowLaser, setLowLaser] = useState<number>(useGlobalPreferenceStore.getState()['low_power'] ?? 10);
  const [type, setType] = useState<TFramingType>(FramingType.Framing);
  const manager = useRef<FramingTaskManager | null>(null);
  const shortcutHandler = useRef<(() => void) | null>(null);

  const addOnInfo = useMemo(() => getAddOnInfo(device.model), [device]);

  const handleStart = useCallback(() => {
    manager.current?.startFraming(type, { loop, lowPower: addOnInfo.framingLowLaser ? lowLaser : 0 });
  }, [type, lowLaser, addOnInfo.framingLowLaser, loop]);

  const handleStop = useCallback(() => {
    manager.current?.stopFraming();
  }, []);

  useEffect(() => {
    manager.current = new FramingTaskManager(device, 'framing.default');
    manager.current.on('status-change', setIsFraming);

    return () => {
      manager.current?.destroy();
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
    <DraggableModal
      footer={
        <div className={styles.footer}>
          <Checkbox
            checked={loop}
            className={styles.checkbox}
            disabled={isFraming}
            onChange={(e) => setLoop(e.target.checked)}
          >
            {tFraming.continuously}
          </Checkbox>
          <Button className={styles.button} onClick={onClose}>
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
              onChange={(val) => {
                if (val === null) return;

                setLowLaser(val);
              }}
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
                {renderFramingIcon(opt)}
                <div>{tFraming[framingOptions[opt].title]}</div>
              </div>
            ),
            value: opt,
          }))}
          value={type}
        />
        <div className={styles.desc}>
          <div className={styles.title}>{tFraming[framingOptions[type].title]}</div>
          <div className={styles.content}>{tFraming[framingOptions[type].description]}</div>
        </div>
      </div>
    </DraggableModal>
  );
};

export default FramingModal;

export const showFramingModal = async (): Promise<void> => {
  if (isCanvasEmpty()) return;

  const { device } = await getDevice();

  if (!device || isIdExist('framing-modal')) {
    return;
  }

  if (previewModeController.isPreviewMode) previewModeController.end();

  addDialogComponent(
    'framing-modal',
    promarkModels.has(device.model) ? (
      <PromarkFramingModal device={device} onClose={() => popDialogById('framing-modal')} startOnOpen />
    ) : (
      <FramingModal device={device} onClose={() => popDialogById('framing-modal')} />
    ),
  );
};
