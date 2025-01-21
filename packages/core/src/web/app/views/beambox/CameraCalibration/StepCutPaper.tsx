import React, { useContext } from 'react';
import { Modal } from 'antd';

import useI18n from '@core/helpers/useI18n';
import { CalibrationContext } from '@core/app/contexts/CalibrationContext';
import { STEP_REFOCUS } from '@core/app/constants/camera-calibration-constants';

const StepPutPaper = (): JSX.Element => {
  const lang = useI18n().calibration;
  const { gotoNextStep, onClose } = useContext(CalibrationContext);

  const video = (
    <video className="video" autoPlay loop muted>
      <source src="video/put_paper.webm" type="video/webm" />
      <source src="video/put_paper.mp4" type="video/mp4" />
    </video>
  );

  return (
    <Modal
      width={400}
      open
      centered
      className="modal-camera-calibration"
      title={lang.camera_calibration}
      onCancel={() => onClose(false)}
      okText={lang.next}
      cancelText={lang.cancel}
      onOk={() => gotoNextStep(STEP_REFOCUS)}
    >
      {lang.please_place_paper}
      {video}
    </Modal>
  );
};

export default StepPutPaper;
