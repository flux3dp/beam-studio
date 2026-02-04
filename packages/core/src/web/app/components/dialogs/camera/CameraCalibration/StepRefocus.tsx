import React, { useContext, useEffect, useRef, useState } from 'react';

import { Segmented } from 'antd';

import Alert from '@core/app/actions/alert-caller';
import Constant from '@core/app/actions/beambox/constant';
import PreviewModeController from '@core/app/actions/beambox/preview-mode-controller';
import Progress from '@core/app/actions/progress-caller';
import AlertConstants from '@core/app/constants/alert-constants';
import { STEP_BEFORE_ANALYZE_PICTURE } from '@core/app/constants/cameraConstants';
import { CalibrationContext } from '@core/app/contexts/CalibrationContext';
import DraggableModal from '@core/app/widgets/DraggableModal';
import { doGetOffsetFromPicture } from '@core/helpers/camera-calibration-helper';
import CheckDeviceStatus from '@core/helpers/check-device-status';
import DeviceErrorHandler from '@core/helpers/device-error-handler';
import DeviceMaster from '@core/helpers/device-master';
import useI18n from '@core/helpers/useI18n';
import VersionChecker from '@core/helpers/version-checker';
import Browser from '@core/implementations/browser';
import type { CameraConfig } from '@core/interfaces/Camera';

const StepRefocus = (): React.JSX.Element => {
  const lang = useI18n();
  const langAlert = lang.alert;
  const langCalibration = lang.calibration;
  const context = useContext(CalibrationContext);
  const {
    calibratedMachines,
    device,
    gotoNextStep,
    onClose,
    setCalibratedMachines,
    setCameraPosition,
    setCurrentOffset,
    setImgBlobUrl,
    setLastConfig,
    setOriginFanSpeed,
  } = context;
  const doCuttingTask = async () => {
    const res = await DeviceMaster.select(device);

    if (!res.success) {
      throw new Error('Fail to select device');
    }

    const laserPower = Number((await DeviceMaster.getLaserPower()).value);
    const fanSpeed = Number((await DeviceMaster.getFan()).value);

    setOriginFanSpeed(fanSpeed);

    const tempCmdAvailable = VersionChecker(device.version).meetRequirement('TEMP_I2C_CMD');

    if (tempCmdAvailable) {
      await DeviceMaster.setFanTemp(100);
    } else if (fanSpeed > 100) {
      await DeviceMaster.setFan(100);
    }

    if (laserPower !== 1) {
      await DeviceMaster.setLaserPower(1);
    }

    await DeviceMaster.runBeamboxCameraTest();

    if (laserPower !== 1) {
      await DeviceMaster.setLaserPower(Number(laserPower));
    }

    if (!tempCmdAvailable) {
      await DeviceMaster.setFan(fanSpeed);
    }
  };
  const doCaptureTask = async () => {
    let blobUrl;

    try {
      await PreviewModeController.start(device);
      setLastConfig(PreviewModeController.getCameraOffsetStandard()!);
      Progress.openNonstopProgress({
        id: 'taking-picture',
        message: langCalibration.taking_picture,
        timeout: 30000,
      });

      const movementX = Constant.camera.calibrationPicture.centerX - Constant.camera.offsetX_ideal;
      const movementY = Constant.camera.calibrationPicture.centerY - Constant.camera.offsetY_ideal;

      blobUrl = await PreviewModeController.getPhotoAfterMoveTo(movementX, movementY);
      setCameraPosition({ x: movementX, y: movementY });
    } finally {
      Progress.popById('taking-picture');
    }

    return blobUrl;
  };
  const cutThenCapture = async () => {
    await doCuttingTask();

    const blobUrl = (await doCaptureTask()) as string;

    await doGetOffsetFromPicture(blobUrl, (offset: CameraConfig) => {
      setCurrentOffset(offset);
    });
    setImgBlobUrl(blobUrl);
  };

  const [isAutoFocus, setIsAutoFocus] = useState(false);
  const [isCutButtonDisabled, setIsCutButtonDisabled] = useState(false);
  const videoElem = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoElem.current) {
      videoElem.current.load();
    }
  }, [isAutoFocus]);

  let child = null;
  let message: string;

  if (device.model === 'fbm1') {
    child = (
      <div className="video-container">
        <div className="tab-container">
          <Segmented
            block
            onChange={(v) => setIsAutoFocus(v === langCalibration.with_af)}
            options={[langCalibration.without_af, langCalibration.with_af]}
          />
        </div>
        <video autoPlay className="video" loop muted ref={videoElem}>
          <source src={isAutoFocus ? 'video/autofocus.webm' : 'video/bm_focus.webm'} type="video/webm" />
          <source src={isAutoFocus ? 'video/autofocus.mp4' : 'video/bm_focus.mp4'} type="video/mp4" />
        </video>
      </div>
    );
    message = isAutoFocus ? langCalibration.please_refocus.beamo_af : langCalibration.please_refocus.beamo;
  } else if (device.model === 'fhexa1') {
    message = langCalibration.please_refocus.hexa;
    child = (
      <video autoPlay className="video" loop ref={videoElem}>
        <source src="video/bb2_focus.webm" type="video/webm" />
        <source src="video/bb2_focus.mp4" type="video/mp4" />
      </video>
    );
  } else {
    message = langCalibration.please_refocus.beambox;
    child = (
      <video autoPlay className="video" loop muted ref={videoElem}>
        <source src="video/bb_focus.webm" type="video/webm" />
        <source src="video/bb_focus.mp4" type="video/mp4" />
      </video>
    );
  }

  const onEngrave = async () => {
    if (isCutButtonDisabled) {
      return;
    }

    try {
      setIsCutButtonDisabled(true);
      await cutThenCapture();

      if (!calibratedMachines.includes(device.uuid)) {
        setCalibratedMachines([...calibratedMachines, device.uuid]);
      }

      gotoNextStep(STEP_BEFORE_ANALYZE_PICTURE);
    } catch (error) {
      setIsCutButtonDisabled(false);
      console.log(error);

      const errorMessage = error instanceof Error ? error.message : DeviceErrorHandler.translate(error as string);

      Alert.popUp({
        buttonLabels: [langAlert.ok, langAlert.learn_more],
        callbacks: [
          async () => {
            const report = await DeviceMaster.getReport();

            device.st_id = report.st_id;
            await CheckDeviceStatus(device, false, true);
          },
          () => Browser.open(langCalibration.zendesk_link),
        ],
        id: 'camera-cali-err',
        message: `#815 ${errorMessage || 'Fail to cut and capture'}`,
        primaryButtonIndex: 0,
        type: AlertConstants.SHOW_POPUP_ERROR,
      });
    }
  };

  return (
    <DraggableModal
      cancelText={langCalibration.cancel}
      className="modal-camera-calibration"
      okButtonProps={{ disabled: isCutButtonDisabled }}
      okText={langCalibration.start_engrave}
      onCancel={() => onClose(false)}
      onOk={onEngrave}
      open
      title={langCalibration.camera_calibration}
      width={400}
    >
      {message}
      <br />
      {child}
    </DraggableModal>
  );
};

export default StepRefocus;
