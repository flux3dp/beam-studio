import React, { useEffect, useMemo, useState } from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Button, Checkbox, Modal, Tooltip } from 'antd';

import { underlineInputTheme } from '@core/app/constants/antd-config';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import UnitInput from '@core/app/widgets/UnitInput';
import getDevice from '@core/helpers/device/get-device';
import deviceMaster from '@core/helpers/device-master';
import useI18n from '@core/helpers/useI18n';

import storage from '@app/implementations/storage';

import styles from './PreviewHeight.module.scss';

enum Step {
  ADJUST = 1,
  ASK_FOCUS = 0,
}

interface Props {
  initValue?: number;
  onClose: () => void;
  onOk: (val: null | number) => void;
}

const getProbeHeight = async () => {
  try {
    if (!deviceMaster.currentDevice) {
      await getDevice();
    }

    const device = deviceMaster.currentDevice;

    if (device.control.getMode() !== 'raw') {
      deviceMaster.enterRawMode();
    }

    const { didAf, z } = await deviceMaster.rawGetProbePos();

    if (!didAf) {
      return null;
    }

    const { deep } = getWorkarea(device.info.model as WorkAreaModel, 'ado1');

    return Math.round((deep - z) * 100) / 100;
  } catch (err) {
    console.log(err);

    return null;
  }
};

// TODO: add test
const PreviewHeight = ({ initValue, onClose, onOk }: Props): React.JSX.Element => {
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
        centered
        closable={false}
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
            disabled={value === undefined || value === null}
            key="ok"
            onClick={() => {
              onOk(value);
              onClose();
            }}
            type="primary"
          >
            {lang.global.apply}
          </Button>,
        ]}
        maskClosable={false}
        open
        title={lang.message.preview.auto_focus}
      >
        <div className={styles.text}>{lang.message.preview.auto_focus_instruction}</div>
        <video autoPlay className={styles.video} loop muted>
          <source src="video/ador-preview-af.webm" type="video/webm" />
          <source src="video/ador-preview-af.mp4" type="video/mp4" />
        </video>
      </Modal>
    );
  }

  return (
    <Modal
      centered
      closable={false}
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
          key="ok"
          onClick={() => {
            onOk(value);
            onClose();
          }}
          type="primary"
        >
          {lang.global.apply}
        </Button>,
      ]}
      maskClosable={false}
      open
      title={lang.message.preview.camera_preview}
    >
      <div className={styles.text}>
        {hasInitValue ? lang.message.preview.already_performed_auto_focus : lang.message.preview.please_enter_height}
        {hasInitValue && (
          <Tooltip className={styles.tooltip} title={lang.message.preview.adjust_height_tooltip} trigger="hover">
            <QuestionCircleOutlined />
          </Tooltip>
        )}
      </div>
      <div className={styles.inputs}>
        <UnitInput
          disabled={!adjustChecked}
          isInch={isInch}
          onChange={(val) => setValue(val)}
          precision={isInch ? 3 : 2}
          step={isInch ? 0.254 : 0.1}
          theme={underlineInputTheme}
          underline
          unit={unit}
          value={value}
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
