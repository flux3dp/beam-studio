import React, { use } from 'react';

import { Result } from 'antd';

import { CalibrationContext } from '@core/app/contexts/CalibrationContext';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import DraggableModal from '@core/app/widgets/DraggableModal';
import useI18n from '@core/helpers/useI18n';

const StepFinish = (): React.JSX.Element => {
  const lang = useI18n().calibration;
  const { borderless, onClose } = use(CalibrationContext);

  return (
    <DraggableModal
      cancelButtonProps={{ style: { display: 'none' } }}
      className="modal-camera-calibration"
      okText={lang.finish}
      onOk={() => {
        useGlobalPreferenceStore.getState().set('should_remind_calibrate_camera', false);
        useDocumentStore.getState().set('borderless', borderless);
        onClose(true);
      }}
      open
      title={lang.camera_calibration}
      width={400}
    >
      <Result status="success" title={lang.calibrate_done} />
    </DraggableModal>
  );
};

export default StepFinish;
