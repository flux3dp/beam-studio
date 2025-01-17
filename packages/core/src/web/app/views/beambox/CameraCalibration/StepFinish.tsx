import React, { useContext } from 'react';
import { Modal, Result } from 'antd';

import BeamboxPreference from 'app/actions/beambox/beambox-preference';
import useI18n from 'helpers/useI18n';
import { CalibrationContext } from 'app/contexts/CalibrationContext';
import { getSVGCanvas } from 'helpers/svg-editor-helper';

const StepFinish = (): JSX.Element => {
  const lang = useI18n().calibration;
  const { borderless, onClose } = useContext(CalibrationContext);
  return (
    <Modal
      width={400}
      open
      centered
      title={lang.camera_calibration}
      cancelButtonProps={{ style: { display: 'none' } }}
      onOk={() => {
        BeamboxPreference.write('should_remind_calibrate_camera', false);
        getSVGCanvas().toggleBorderless(borderless);
        onClose(true);
      }}
      className="modal-camera-calibration"
      okText={lang.finish}
    >
      <Result
        status="success"
        title={lang.calibrate_done}
      />
    </Modal>
  );
};

export default StepFinish;
