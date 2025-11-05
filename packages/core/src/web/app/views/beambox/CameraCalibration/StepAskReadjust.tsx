import React, { useContext } from 'react';

import { Button } from 'antd';

import Alert from '@core/app/actions/alert-caller';
import PreviewModeController from '@core/app/actions/beambox/preview-mode-controller';
import Progress from '@core/app/actions/progress-caller';
import AlertConstants from '@core/app/constants/alert-constants';
import { CALIBRATION_PARAMS, STEP_BEFORE_ANALYZE_PICTURE, STEP_PUT_PAPER } from '@core/app/constants/cameraConstants';
import { CalibrationContext } from '@core/app/contexts/CalibrationContext';
import DraggableModal from '@core/app/widgets/DraggableModal';
import { doGetOffsetFromPicture } from '@core/helpers/camera-calibration-helper';
import CheckDeviceStatus from '@core/helpers/check-device-status';
import DeviceErrorHandler from '@core/helpers/device-error-handler';
import DeviceMaster from '@core/helpers/device-master';
import useI18n from '@core/helpers/useI18n';
import Browser from '@core/implementations/browser';

const StepAskReadjust = (): React.JSX.Element => {
  const lang = useI18n();
  const langCalibration = lang.calibration;
  const langAlert = lang.alert;
  const context = useContext(CalibrationContext);
  const { device, gotoNextStep, onClose, setCameraPosition, setCurrentOffset, setImgBlobUrl, setLastConfig } = context;

  const onSkip = async () => {
    try {
      await PreviewModeController.start(device);
      setLastConfig(PreviewModeController.getCameraOffsetStandard()!);
      Progress.openNonstopProgress({ id: 'taking-picture', message: langCalibration.taking_picture, timeout: 30000 });

      const x = CALIBRATION_PARAMS.centerX - CALIBRATION_PARAMS.idealOffsetX;
      const y = CALIBRATION_PARAMS.centerY - CALIBRATION_PARAMS.idealOffsetY;
      const blobUrl = await PreviewModeController.getPhotoAfterMoveTo(x, y);

      setCameraPosition({ x, y });
      await doGetOffsetFromPicture(blobUrl!, setCurrentOffset);
      setImgBlobUrl(blobUrl!);
      gotoNextStep(STEP_BEFORE_ANALYZE_PICTURE);
    } catch (error) {
      console.log(error);

      const errorMessage = error instanceof Error ? error.message : DeviceErrorHandler.translate(error as string);

      Alert.popUp({
        buttonLabels: [langAlert.ok, langAlert.learn_more],
        callbacks: [
          async () => {
            const report = await DeviceMaster.getReport();

            await CheckDeviceStatus({ ...device, st_id: report.st_id }, false, true);
          },
          () => Browser.open(langCalibration.zendesk_link),
        ],
        id: 'camera-cali-err',
        message: `#815 ${errorMessage || 'Fail to capture'}`,
        primaryButtonIndex: 0,
        type: AlertConstants.SHOW_POPUP_ERROR,
      });
    } finally {
      Progress.popById('taking-picture');
    }
  };

  return (
    <DraggableModal
      className="modal-camera-calibration"
      footer={[
        <Button onClick={() => onClose(false)}>{langCalibration.cancel}</Button>,
        <Button onClick={onSkip}>{langCalibration.skip}</Button>,
        <Button onClick={() => gotoNextStep(STEP_PUT_PAPER)} type="primary">
          {langCalibration.do_engraving}
        </Button>,
      ]}
      onCancel={() => onClose(false)}
      open
      title={langCalibration.camera_calibration}
      width={400}
    >
      {langCalibration.ask_for_skip_engraving_task}
    </DraggableModal>
  );
};

export default StepAskReadjust;
