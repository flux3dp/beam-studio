import React, { useEffect, useRef, useState } from 'react';

import { Button, Segmented } from 'antd';

import DraggableModal from '@core/app/widgets/DraggableModal';
import useI18n from '@core/helpers/useI18n';

import styles from './StepElevate.module.scss';

interface Props {
  onBack: () => void;
  onClose?: (done?: boolean) => void;
  onNext: () => void;
}

const StepElevate = ({ onBack, onClose, onNext }: Props): React.JSX.Element => {
  const lang = useI18n().calibration;
  const [withPrismLift, setWithPrismLift] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    videoRef.current?.load();
  }, [withPrismLift]);

  return (
    <DraggableModal
      centered
      className={styles.container}
      closable={!!onClose}
      footer={[
        <Button key="back" onClick={onBack}>
          {lang.back}
        </Button>,
        <Button key="next" onClick={onNext} type="primary">
          {lang.start_engrave}
        </Button>,
      ]}
      maskClosable={false}
      onCancel={() => onClose?.(false)}
      open
      title={lang.elevate_and_cut}
      width={400}
    >
      <div className={styles.tab}>
        <Segmented
          block
          onChange={(v) => setWithPrismLift(v === 1)}
          options={[
            { label: lang.without_prism_lift, value: 0 },
            { label: lang.with_prism_lift, value: 1 },
          ]}
        />
      </div>
      <ol className={styles.steps}>
        <li>{withPrismLift ? lang.elevate_and_cut_step_1_prism_lift : lang.elevate_and_cut_step_1}</li>
        <li>{lang.put_paper_step3}</li>
      </ol>
      <video autoPlay className={styles.video} loop muted ref={videoRef}>
        <source src={`video/ador-calibration-2/${withPrismLift ? 'prism-lift' : 'wood'}.webm`} type="video/webm" />
        <source src={`video/ador-calibration-2/${withPrismLift ? 'prism-lift' : 'wood'}.mp4`} type="video/mp4" />
      </video>
    </DraggableModal>
  );
};

export default StepElevate;
