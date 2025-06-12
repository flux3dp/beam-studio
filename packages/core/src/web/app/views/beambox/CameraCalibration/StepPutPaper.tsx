import React, { useContext } from 'react';

import { STEP_REFOCUS } from '@core/app/constants/cameraConstants';
import { CalibrationContext } from '@core/app/contexts/CalibrationContext';
import DraggableModal from '@core/app/widgets/DraggableModal';
import useI18n from '@core/helpers/useI18n';

const StepPutPaper = (): React.JSX.Element => {
  const lang = useI18n().calibration;
  const { gotoNextStep, onClose } = useContext(CalibrationContext);

  const video = (
    <video autoPlay className="video" loop muted>
      <source src="video/put_paper.webm" type="video/webm" />
      <source src="video/put_paper.mp4" type="video/mp4" />
    </video>
  );

  return (
    <DraggableModal
      cancelText={lang.cancel}
      className="modal-camera-calibration"
      okText={lang.next}
      onCancel={() => onClose(false)}
      onOk={() => gotoNextStep(STEP_REFOCUS)}
      open
      title={lang.camera_calibration}
      width={400}
    >
      {lang.please_place_paper}
      {video}
    </DraggableModal>
  );
};

export default StepPutPaper;
