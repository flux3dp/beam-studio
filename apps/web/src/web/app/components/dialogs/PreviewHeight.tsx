import React, { useEffect, useMemo, useState } from 'react';
import { Button, Checkbox, Modal, Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';

import deviceMaster from 'helpers/device-master';
import getDevice from 'helpers/device/get-device';
import storage from 'implementations/storage';
import UnitInput from 'app/widgets/UnitInput';
import useI18n from 'helpers/useI18n';
import { getWorkarea, WorkAreaModel } from 'app/constants/workarea-constants';
import { underlineInputTheme } from 'app/constants/antd-config';

import styles from './PreviewHeight.module.scss';

enum Step {
  ASK_FOCUS = 0,
  ADJUST = 1,
}

interface Props {
  initValue?: number;
  onOk: (val: number | null) => void;
  onClose: () => void;
}

const getProbeHeight = async () => {
  try {
    if (!deviceMaster.currentDevice) await getDevice();
    const device = deviceMaster.currentDevice;
    if (device.control.getMode() !== 'raw') deviceMaster.enterRawMode();
    const { didAf, z } = await deviceMaster.rawGetProbePos();
    if (!didAf) return null;
    const { deep } = getWorkarea(device.info.model as WorkAreaModel, 'ado1');
    return Math.round((deep - z) * 100) / 100;
  } catch (err) {
    console.log(err);
    return null;
  }
};

// TODO: add test
const PreviewHeight = ({ initValue, onOk, onClose }: Props): JSX.Element => {
  const lang = useI18n();
  const hasInitValue = useMemo(() => typeof initValue === 'number', [initValue]);
  const [adjustChecked, setAdjustChecked] = useState(!hasInitValue);
  const [step, setStep] = useState(hasInitValue ? Step.ADJUST : Step.ASK_FOCUS);
  const [value, setValue] = useState(initValue);
  const unit = useMemo(() => (storage.get('default-units') === 'inches' ? 'in' : 'mm'), []);
  const isInch = useMemo(() => unit === 'in', [unit]);

  useEffect(() => {
    let effectEnded = false;
    let timeout: NodeJS.Timeout;
    if (step === Step.ASK_FOCUS && (value === undefined || value === null)) {
      const checkHeight = async () => {
        const probeHeight = await getProbeHeight();
        if (probeHeight !== null) {
          setValue(probeHeight);
        } else if (!effectEnded) {
          timeout = setTimeout(checkHeight, 1000);
        }
      };
      checkHeight();
    }
    return () => {
      effectEnded = true;
      clearTimeout(timeout);
    };
  }, [step, value]);

  if (step === Step.ASK_FOCUS) {
    return (
      <Modal
        open
        centered
        closable={false}
        maskClosable={false}
        title={lang.message.preview.auto_focus}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              onOk(null);
              onClose();
            }}
          >
            {lang.alert.cancel}
          </Button>,
          <Button
            key="enter_manually"
            onClick={() => {
              setValue(0);
              setStep(Step.ADJUST);
            }}
          >
            {lang.message.preview.enter_manually}
          </Button>,
          <Button
            type="primary"
            key="ok"
            disabled={value === undefined || value === null}
            onClick={() => {
              onOk(value);
              onClose();
            }}
          >
            {lang.global.apply}
          </Button>,
        ]}
      >
        <div className={styles.text}>{lang.message.preview.auto_focus_instruction}</div>
        <video className={styles.video} autoPlay loop muted>
          <source src="video/ador-preview-af.webm" type="video/webm" />
          <source src="video/ador-preview-af.mp4" type="video/mp4" />
        </video>
      </Modal>
    );
  }

  return (
    <Modal
      open
      centered
      closable={false}
      maskClosable={false}
      title={lang.message.preview.camera_preview}
      footer={[
        <Button
          key="cancel"
          onClick={() => {
            onOk(null);
            onClose();
          }}
        >
          {lang.alert.cancel}
        </Button>,
        <Button
          type="primary"
          key="ok"
          onClick={() => {
            onOk(value);
            onClose();
          }}
        >
          {lang.global.apply}
        </Button>,
      ]}
    >
      <div className={styles.text}>
        {hasInitValue
          ? lang.message.preview.already_performed_auto_focus
          : lang.message.preview.please_enter_height}
        {hasInitValue && (
          <Tooltip
            className={styles.tooltip}
            trigger="hover"
            title={lang.message.preview.adjust_height_tooltip}
          >
            <QuestionCircleOutlined />
          </Tooltip>
        )}
      </div>
      <div className={styles.inputs}>
        <UnitInput
          unit={unit}
          isInch={isInch}
          value={value}
          precision={isInch ? 3 : 2}
          step={isInch ? 0.254 : 0.1}
          disabled={!adjustChecked}
          onChange={(val) => setValue(val)}
          theme={underlineInputTheme}
          underline
        />
        {hasInitValue && (
          <Checkbox checked={adjustChecked} onChange={(e) => setAdjustChecked(e.target.checked)}>
            {lang.message.preview.adjust}
          </Checkbox>
        )}
      </div>
    </Modal>
  );
};

export default PreviewHeight;
