import React, { useEffect, useRef, useState } from 'react';
import { Button, Modal, Segmented } from 'antd';

import useI18n from 'helpers/useI18n';

import styles from './StepElevate.module.scss';

interface Props {
  onNext: () => void;
  onBack: () => void;
  onClose?: (done?: boolean) => void;
}

const StepElevate = ({ onNext, onBack, onClose }: Props): JSX.Element => {
  const lang = useI18n().calibration;
  const [withPrismLift, setWithPrismLift] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    videoRef.current?.load();
  }, [withPrismLift]);

  return (
    <Modal
      width={400}
      open
      centered
      maskClosable={false}
      title={lang.elevate_and_cut}
      className={styles.container}
      closable={!!onClose}
      onCancel={() => onClose?.(false)}
      footer={[
        <Button key="back" onClick={onBack}>
          {lang.back}
        </Button>,
        <Button key="next" type="primary" onClick={onNext}>
          {lang.start_engrave}
        </Button>,
      ]}
    >
      <div className={styles.tab}>
        <Segmented
          block
          options={[{ value: 0, label: lang.without_prism_lift }, { value: 1, label: lang.with_prism_lift }]}
          onChange={(v) => setWithPrismLift(v === 1)}
        />
      </div>
      <ol className={styles.steps}>
        <li>{withPrismLift ? lang.elevate_and_cut_step_1_prism_lift : lang.elevate_and_cut_step_1}</li>
        <li>{lang.put_paper_step3}</li>
      </ol>
      <video className={styles.video} ref={videoRef} autoPlay loop muted>
      <source  src={`video/ador-calibration-2/${withPrismLift ? 'prism-lift' : 'wood'}.webm`} type="video/webm" />
      <source  src={`video/ador-calibration-2/${withPrismLift ? 'prism-lift' : 'wood'}.mp4`} type="video/mp4" />
      </video>
    </Modal>
  );
};

export default StepElevate;
