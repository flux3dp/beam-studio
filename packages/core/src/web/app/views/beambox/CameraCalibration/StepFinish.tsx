import React, { useContext } from 'react';

import { Modal, Result } from 'antd';

import BeamboxPreference from '@core/app/actions/beambox/beambox-preference';
import { CalibrationContext } from '@core/app/contexts/CalibrationContext';
import { getSVGCanvas } from '@core/helpers/svg-editor-helper';
import useI18n from '@core/helpers/useI18n';

const StepFinish = (): React.JSX.Element => {
  const lang = useI18n().calibration;
  const { borderless, onClose } = useContext(CalibrationContext);

  return (
    <Modal
      cancelButtonProps={{ style: { display: 'none' } }}
      centered
      className="modal-camera-calibration"
      okText={lang.finish}
      onOk={() => {
        BeamboxPreference.write('should_remind_calibrate_camera', false);
        getSVGCanvas().toggleBorderless(borderless);
        onClose(true);
      }}
      open
      title={lang.camera_calibration}
      width={400}
    >
      <Result status="success" title={lang.calibrate_done} />
    </Modal>
  );
};

export default StepFinish;
