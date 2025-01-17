/* eslint-disable no-console */
import React, { useContext } from 'react';
import { Button, Modal } from 'antd';

import PreviewModeController from 'app/actions/beambox/preview-mode-controller';
import Progress from 'app/actions/progress-caller';
import Alert from 'app/actions/alert-caller';
import AlertConstants from 'app/constants/alert-constants';
import DeviceErrorHandler from 'helpers/device-error-handler';
import DeviceMaster from 'helpers/device-master';
import Browser from 'implementations/browser';
import CheckDeviceStatus from 'helpers/check-device-status';
import useI18n from 'helpers/useI18n';
import {
  CALIBRATION_PARAMS,
  STEP_BEFORE_ANALYZE_PICTURE,
  STEP_PUT_PAPER,
} from 'app/constants/camera-calibration-constants';
import { doGetOffsetFromPicture } from 'helpers/camera-calibration-helper';
import { CalibrationContext } from 'app/contexts/CalibrationContext';


const StepAskReadjust = (): JSX.Element => {
  const lang = useI18n();
  const langCalibration = lang.calibration;
  const langAlert = lang.alert;
  const context = useContext(CalibrationContext);
  const {
    device,
    setLastConfig,
    setImgBlobUrl,
    gotoNextStep,
    setCurrentOffset,
    setCameraPosition,
    onClose,
  } = context;

  const onSkip = async () => {
    try {
      await PreviewModeController.start(device, () =>
        console.log('camera fail. stop preview mode')
      );
      setLastConfig(PreviewModeController.getCameraOffsetStandard());
      Progress.openNonstopProgress({
        id: 'taking-picture',
        message: langCalibration.taking_picture,
        timeout: 30000,
      });
      const x = CALIBRATION_PARAMS.centerX - CALIBRATION_PARAMS.idealOffsetX;
      const y = CALIBRATION_PARAMS.centerY - CALIBRATION_PARAMS.idealOffsetY;
      const blobUrl = await PreviewModeController.getPhotoAfterMoveTo(x, y);
      setCameraPosition({ x, y });
      await doGetOffsetFromPicture(blobUrl, setCurrentOffset);
      setImgBlobUrl(blobUrl);
      gotoNextStep(STEP_BEFORE_ANALYZE_PICTURE);
    } catch (error) {
      console.log(error);
      const errorMessage =
        error instanceof Error ? error.message : DeviceErrorHandler.translate(error);
      Alert.popUp({
        id: 'camera-cali-err',
        type: AlertConstants.SHOW_POPUP_ERROR,
        message: `#815 ${errorMessage || 'Fail to capture'}`,
        buttonLabels: [langAlert.ok, langAlert.learn_more],
        callbacks: [
          async () => {
            const report = await DeviceMaster.getReport();
            await CheckDeviceStatus(
              {
                ...device,
                st_id: report.st_id,
              },
              false,
              true
            );
          },
          () => Browser.open(langCalibration.zendesk_link),
        ],
        primaryButtonIndex: 0,
      });
    } finally {
      Progress.popById('taking-picture');
    }
  };
  return (
    <Modal
      width={400}
      open
      centered
      title={langCalibration.camera_calibration}
      onCancel={() => onClose(false)}
      className="modal-camera-calibration"
      footer={[
        <Button onClick={() => onClose(false)}>{langCalibration.cancel}</Button>,
        <Button onClick={onSkip}>{langCalibration.skip}</Button>,
        <Button type="primary" onClick={() => gotoNextStep(STEP_PUT_PAPER)}>
          {langCalibration.do_engraving}
        </Button>,
      ]}
    >
      {langCalibration.ask_for_readjust}
    </Modal>
  );
};

export default StepAskReadjust;
