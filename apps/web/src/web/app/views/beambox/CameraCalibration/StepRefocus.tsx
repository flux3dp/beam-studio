import React, { useState, useRef, useEffect, useContext } from 'react';
import { Modal, Segmented } from 'antd';

import Alert from 'app/actions/alert-caller';
import AlertConstants from 'app/constants/alert-constants';
import Browser from 'implementations/browser';
import CheckDeviceStatus from 'helpers/check-device-status';
import Constant from 'app/actions/beambox/constant';
import DeviceErrorHandler from 'helpers/device-error-handler';
import DeviceMaster from 'helpers/device-master';
import PreviewModeController from 'app/actions/beambox/preview-mode-controller';
import Progress from 'app/actions/progress-caller';
import useI18n from 'helpers/useI18n';
import VersionChecker from 'helpers/version-checker';
import { CalibrationContext } from 'app/contexts/CalibrationContext';
import { CameraConfig } from 'interfaces/Camera';
import { STEP_BEFORE_ANALYZE_PICTURE } from 'app/constants/camera-calibration-constants';
import { doGetOffsetFromPicture } from 'helpers/camera-calibration-helper';

const StepRefocus = (): JSX.Element => {
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
    if (tempCmdAvailable) await DeviceMaster.setFanTemp(100);
    else if (fanSpeed > 100) await DeviceMaster.setFan(100);

    if (laserPower !== 1) await DeviceMaster.setLaserPower(1);
    await DeviceMaster.runBeamboxCameraTest();
    if (laserPower !== 1) await DeviceMaster.setLaserPower(Number(laserPower));
    if (!tempCmdAvailable) await DeviceMaster.setFan(fanSpeed);
  };
  const doCaptureTask = async () => {
    let blobUrl;
    try {
      await PreviewModeController.start(device, () => console.log('camera fail. stop preview mode'));
      setLastConfig(PreviewModeController.getCameraOffsetStandard());
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
    const blobUrl = await doCaptureTask();
    await doGetOffsetFromPicture(
      blobUrl,
      (offset: CameraConfig) => {
        setCurrentOffset(offset);
      },
    );
    setImgBlobUrl(blobUrl);
  };

  const [isAutoFocus, setIsAutoFocus] = useState(false);
  const [isCutButtonDisabled, setIsCutButtonDisabled] = useState(false);
  const videoElem = useRef(null);
  useEffect(() => {
    if (videoElem.current) videoElem.current.load();
  }, [isAutoFocus]);

  let child = null;
  let message: string;
  if (device.model === 'fbm1') {
    child = (
      <div className="video-container">
        <div className="tab-container">
          <Segmented
            block
            options={[langCalibration.without_af, langCalibration.with_af]}
            onChange={(v) => setIsAutoFocus(v === langCalibration.with_af)}
          />
        </div>
        <video className="video" ref={videoElem} autoPlay loop muted>
          <source src={isAutoFocus ? 'video/autofocus.webm' : 'video/bm_focus.webm'} type="video/webm" />
          <source src={isAutoFocus ? 'video/autofocus.mp4' : 'video/bm_focus.mp4'} type="video/mp4" />
        </video>
      </div>
    );
    message = isAutoFocus ? langCalibration.please_refocus.beamo_af : langCalibration.please_refocus.beamo;
  } else if (device.model === 'fhexa1') {
    message = langCalibration.please_refocus.hexa;
    child = (
      <video className="video" ref={videoElem} autoPlay loop>
        <source src="video/bb2_focus.webm" type="video/webm" />
        <source src="video/bb2_focus.mp4" type="video/mp4" />
      </video>
    );
  } else {
    message = langCalibration.please_refocus.beambox;
    child = (
      <video className="video" ref={videoElem} autoPlay loop muted>
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
        setCalibratedMachines(
          [...calibratedMachines, device.uuid],
        );
      }
      gotoNextStep(STEP_BEFORE_ANALYZE_PICTURE);
    } catch (error) {
      setIsCutButtonDisabled(false);
      console.log(error);
      const errorMessage = error instanceof Error
        ? error.message : DeviceErrorHandler.translate(error);
      Alert.popUp({
        id: 'camera-cali-err',
        type: AlertConstants.SHOW_POPUP_ERROR,
        message: `#815 ${errorMessage || 'Fail to cut and capture'}`,
        buttonLabels: [langAlert.ok, langAlert.learn_more],
        callbacks: [
          async () => {
            const report = await DeviceMaster.getReport();
            device.st_id = report.st_id;
            await CheckDeviceStatus(device, false, true);
          },
          () => Browser.open(langCalibration.zendesk_link),
        ],
        primaryButtonIndex: 0,
      });
    }
  };

  return (
    <Modal
      width={400}
      open
      centered
      className="modal-camera-calibration"
      title={langCalibration.camera_calibration}
      onCancel={() => onClose(false)}
      cancelText={langCalibration.cancel}
      okText={langCalibration.start_engrave}
      onOk={onEngrave}
      okButtonProps={{ disabled: isCutButtonDisabled }}
    >
      {message}
      <br />
      {child}
    </Modal>
  );
};

export default StepRefocus;
