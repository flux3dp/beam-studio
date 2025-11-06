import type { ReactNode } from 'react';
import React, { useCallback, useRef, useState } from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import classNames from 'classnames';

import Alert from '@core/app/actions/alert-caller';
import Constant from '@core/app/actions/beambox/constant';
import PreviewModeController from '@core/app/actions/beambox/preview-mode-controller';
import progressCaller from '@core/app/actions/progress-caller';
import AlertConstants from '@core/app/constants/alert-constants';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import { useStorageStore } from '@core/app/stores/storageStore';
import DraggableModal from '@core/app/widgets/DraggableModal';
import UnitInput from '@core/app/widgets/UnitInput';
import CheckDeviceStatus from '@core/helpers/check-device-status';
import DeviceErrorHandler from '@core/helpers/device-error-handler';
import DeviceMaster from '@core/helpers/device-master';
import useI18n from '@core/helpers/useI18n';
import VersionChecker from '@core/helpers/version-checker';
import browser from '@core/implementations/browser';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

import styles from './Component.module.scss';

// View render the following steps
const STEP_ASK_READJUST = Symbol('STEP_ASK_READJUST');
const STEP_ALERT = Symbol('STEP_ALERT');
const STEP_CUT = Symbol('STEP_CUT');
const STEP_ANALYZE = Symbol('STEP_ANALYZE');
const STEP_FINISH = Symbol('STEP_FINISH');

const calibratedMachineUUIDs: string[] = [];

interface Props {
  device: IDeviceInfo;
  onClose: () => void;
}

const DiodeCalibration = ({ device, onClose }: Props): ReactNode => {
  const { alert: langAlert, calibration: lang } = useI18n();
  const didCalibrate = calibratedMachineUUIDs.includes(device.uuid);
  const [cameraMovedX, setCameraMovedX] = useState(0);
  const [cameraMovedY, setCameraMovedY] = useState(0);
  const [currentStep, setCurrentStep] = useState<symbol>(didCalibrate ? STEP_ASK_READJUST : STEP_ALERT);
  const [dx, setDx] = useState(0);
  const [dy, setDy] = useState(0);
  const [isCutButtonDisabled, setIsCutButtonDisabled] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const isInch = useStorageStore((state) => state.isInch);

  const imageScaleRef = useRef(0.5);
  const origFanSpeedRef = useRef<null | number>(null);
  const cameraOffsetRef = useRef<{
    angle?: number;
    scaleRatioX?: number;
    scaleRatioY?: number;
    x: number;
    y: number;
  }>({ x: 0, y: 0 });
  const imageUrlRef = useRef<string>('');
  const virtualSquareRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(async (): Promise<void> => {
    onClose();
    await PreviewModeController.end({ shouldWaitForEnd: true });

    if (origFanSpeedRef.current) {
      await DeviceMaster.setFan(origFanSpeedRef.current);
    }
  }, [onClose]);

  const doCuttingTask = useCallback(async (): Promise<void> => {
    const res = await DeviceMaster.select(device);

    if (!res.success) {
      throw new Error('Fail to select device');
    }

    const laserPower = Number((await DeviceMaster.getLaserPower()).value);
    const fanSpeed = Number((await DeviceMaster.getFan()).value);

    origFanSpeedRef.current = fanSpeed;

    const vc = VersionChecker(device.version);
    const tempCmdAvailable = vc.meetRequirement('TEMP_I2C_CMD');

    if (tempCmdAvailable) {
      await DeviceMaster.setFanTemp(100);
    } else if (fanSpeed > 100) {
      await DeviceMaster.setFan(100); // 10%
    }

    if (laserPower !== 1) {
      await DeviceMaster.setLaserPower(1);
    }

    await DeviceMaster.doDiodeCalibrationCut();

    if (laserPower !== 1) {
      await DeviceMaster.setLaserPower(Number(laserPower));
    }

    if (!tempCmdAvailable) {
      await DeviceMaster.setFan(fanSpeed);
    }
  }, [device]);

  const doCaptureTask = useCallback(async (): Promise<void> => {
    try {
      await PreviewModeController.start(device);
      progressCaller.openNonstopProgress({
        id: 'taking-picture',
        message: lang.taking_picture,
        timeout: 30000,
      });
      cameraOffsetRef.current = PreviewModeController.getCameraOffset()!;

      const { centerX, centerY } = Constant.diode.calibrationPicture;
      const movementX = centerX - cameraOffsetRef.current.x;
      const movementY = centerY - cameraOffsetRef.current.y;

      const blobUrl = await PreviewModeController.getPhotoAfterMoveTo(movementX, movementY);

      imageUrlRef.current = blobUrl!;
    } finally {
      progressCaller.popById('taking-picture');
    }
  }, [device, lang]);

  const cropAndRotateImg = useCallback(async (): Promise<string> => {
    const img = new Image();

    await new Promise((resolve) => {
      img.onload = () => {
        URL.revokeObjectURL(imageUrlRef.current);
        resolve(img);
      };
      img.src = imageUrlRef.current;
    });

    const { angle, scaleRatioX, scaleRatioY } = cameraOffsetRef.current!;

    const cvs = document.createElement('canvas');
    const ctx = cvs.getContext('2d')!;

    const a = angle!;
    const w = img.width;
    const h = img.height;

    const l = (h * scaleRatioY!) / (Math.cos(a) + Math.sin(a));

    cvs.width = l;
    cvs.height = l;
    imageScaleRef.current = 200 / l; // 200 width of image display div
    ctx.translate(l / 2, l / 2);
    ctx.rotate(a);
    ctx.scale(scaleRatioX!, scaleRatioY!);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);

    return new Promise((resolve) => {
      cvs.toBlob((blob) => {
        const newImageUrl = URL.createObjectURL(blob!);

        imageUrlRef.current = newImageUrl;
        resolve(newImageUrl);
      });
    });
  }, []);

  const moveAndRetakePicture = useCallback(
    async (dir: string): Promise<void> => {
      try {
        progressCaller.openNonstopProgress({
          id: 'taking-picture',
          message: lang.taking_picture,
          timeout: 30000,
        });

        let newCameraMovedX = cameraMovedX;
        let newCameraMovedY = cameraMovedY;

        switch (dir) {
          case 'up':
            newCameraMovedY -= 3;
            break;
          case 'down':
            newCameraMovedY += 3;
            break;
          case 'left':
            newCameraMovedX -= 3;
            break;
          case 'right':
            newCameraMovedX += 3;
            break;
          default:
            break;
        }

        const { centerX, centerY } = Constant.diode.calibrationPicture;
        const movementX = centerX - cameraOffsetRef.current.x + newCameraMovedX;
        const movementY = centerY - cameraOffsetRef.current.y + newCameraMovedY;
        const blobUrl = await PreviewModeController.getPhotoAfterMoveTo(movementX, movementY);

        console.log(movementX, movementY);
        imageUrlRef.current = blobUrl!;
        await cropAndRotateImg();
        setCameraMovedX(newCameraMovedX);
        setCameraMovedY(newCameraMovedY);
      } finally {
        progressCaller.popById('taking-picture');
      }
    },
    [cameraMovedX, cameraMovedY, cropAndRotateImg, lang],
  );

  const renderStepAskReadjust = useCallback((): React.JSX.Element => {
    return (
      <DraggableModal
        closable={false}
        footer={
          <>
            <Button onClick={handleClose}>{lang.cancel}</Button>
            <Button onClick={() => setCurrentStep(STEP_ALERT)}>{lang.do_engraving}</Button>
            <Button
              onClick={async () => {
                try {
                  await CheckDeviceStatus(device);
                  await doCaptureTask();
                  await cropAndRotateImg();
                  setCurrentStep(STEP_ANALYZE);
                } catch (error) {
                  console.log(error);

                  const errorMessage =
                    error instanceof Error ? error.message : DeviceErrorHandler.translate(error as string[]);

                  Alert.popUp({
                    buttonLabels: [langAlert.ok, langAlert.learn_more],
                    callbacks: [
                      async () => {
                        const report = await DeviceMaster.getReport();

                        device.st_id = report.st_id;
                        await CheckDeviceStatus(device, false, true);
                      },
                      () => browser.open(lang.zendesk_link),
                    ],
                    id: 'diode-cali-err',
                    message: `#815 ${errorMessage || 'Fail to capture'}`,
                    primaryButtonIndex: 0,
                    type: AlertConstants.SHOW_POPUP_ERROR,
                  });
                } finally {
                  progressCaller.popById('taking-picture');
                }
              }}
              type="primary"
            >
              {lang.skip}
            </Button>
          </>
        }
        maskClosable={false}
        open
        title={lang.diode_calibration}
        width={400}
      >
        <div>{lang.ask_for_skip_engraving_task}</div>
      </DraggableModal>
    );
  }, [device, handleClose, doCaptureTask, cropAndRotateImg, lang, langAlert]);

  const renderStepAlert = useCallback((): React.JSX.Element => {
    const model = device.model === 'fbm1' ? 'beamo' : 'beambox';

    return (
      <DraggableModal
        closable={false}
        footer={
          <>
            <Button onClick={handleClose}>{lang.cancel}</Button>
            <Button onClick={() => setCurrentStep(STEP_CUT)} type="primary">
              {lang.next}
            </Button>
          </>
        }
        maskClosable={false}
        open
        title={lang.diode_calibration}
        width={400}
      >
        <div>{lang.please_do_camera_calibration_and_focus[model]}</div>
      </DraggableModal>
    );
  }, [device, handleClose, lang]);

  const renderStepCut = useCallback((): React.JSX.Element => {
    return (
      <DraggableModal
        closable={false}
        footer={
          <>
            <Button onClick={handleClose}>{lang.cancel}</Button>
            <Button
              disabled={isCutButtonDisabled}
              onClick={async () => {
                if (isCutButtonDisabled) {
                  return;
                }

                try {
                  setIsCutButtonDisabled(true);
                  await CheckDeviceStatus(device);
                  await doCuttingTask();
                  await doCaptureTask();
                  await cropAndRotateImg();

                  if (!calibratedMachineUUIDs.includes(device.uuid)) {
                    calibratedMachineUUIDs.push(device.uuid);
                  }

                  setCurrentStep(STEP_ANALYZE);
                } catch (error) {
                  setIsCutButtonDisabled(false);
                  console.log(error);

                  const errorMessage =
                    error instanceof Error ? error.message : DeviceErrorHandler.translate(error as string[]);

                  Alert.popUp({
                    buttonLabels: [langAlert.ok, langAlert.learn_more],
                    callbacks: [
                      async () => {
                        const report = await DeviceMaster.getReport();

                        device.st_id = report.st_id;
                        await CheckDeviceStatus(device, false, true);
                      },
                      () => browser.open(lang.zendesk_link),
                    ],
                    id: 'diode-cali-err',
                    message: `#815 ${errorMessage || 'Fail to cut and capture'}`,
                    primaryButtonIndex: 0,
                    type: AlertConstants.SHOW_POPUP_ERROR,
                  });
                }
              }}
              type="primary"
            >
              {lang.start_engrave}
            </Button>
          </>
        }
        maskClosable={false}
        open
        title={lang.diode_calibration}
        width={400}
      >
        <div>{lang.please_place_paper}</div>
      </DraggableModal>
    );
  }, [device, handleClose, isCutButtonDisabled, doCuttingTask, doCaptureTask, cropAndRotateImg, lang, langAlert]);

  const renderStepAnalyze = useCallback((): React.JSX.Element => {
    const imgBackground = {
      background: `url(${imageUrlRef.current})`,
    };
    const squareSize = Constant.camera.calibrationPicture.size * Constant.dpmm * imageScaleRef.current;

    const squareStyle = {
      height: squareSize, // px
      left: 100 - squareSize / 2 + (dx - cameraMovedX) * Constant.dpmm * imageScaleRef.current,
      top: 100 - squareSize / 2 + (dy - cameraMovedY) * Constant.dpmm * imageScaleRef.current,
      width: squareSize, // px
    };
    const manualCalibration = (
      <div className={styles.wrapper}>
        <div className={styles.imgCenter} style={imgBackground}>
          <Tooltip
            onOpenChange={(visible) => {
              if (!visible) setShowHint(visible);
            }}
            open={showHint}
            placement="bottom"
            title={lang.hint_red_square}
          >
            <div className={styles.virtualSquare} ref={virtualSquareRef} style={squareStyle} />
          </Tooltip>
          <div className={classNames(styles.cameraControl, styles.up)} onClick={() => moveAndRetakePicture('up')} />
          <div className={classNames(styles.cameraControl, styles.down)} onClick={() => moveAndRetakePicture('down')} />
          <div className={classNames(styles.cameraControl, styles.left)} onClick={() => moveAndRetakePicture('left')} />
          <div
            className={classNames(styles.cameraControl, styles.right)}
            onClick={() => moveAndRetakePicture('right')}
          />
        </div>
        <div
          className={styles.hintIcon}
          onClick={() => setShowHint(!showHint)}
          onMouseLeave={() => setShowHint(false)}
          onMouseOut={() => setShowHint(false)}
        >
          <QuestionCircleOutlined />
        </div>
        <div className={styles.controls}>
          <Tooltip
            className={styles.tooltip}
            onOpenChange={(visible) => {
              if (!visible) setShowHint(visible);
            }}
            open={showHint}
            placement="topRight"
            title={lang.hint_adjust_parameters}
          />
          <label htmlFor="diode-calibration-dx-input">{lang.dx}</label>
          <UnitInput
            className={styles.input}
            controls={false}
            id="diode-calibration-dx-input"
            isInch={isInch}
            max={20}
            min={-20}
            onChange={(val) => {
              if (val !== null) setDx(val);
            }}
            precision={isInch ? 4 : 2}
            step={isInch ? 0.254 : 0.5}
            type="number"
            unit={isInch ? 'in' : 'mm'}
            unitClassName={styles.unit}
            value={dx}
          />
          <label htmlFor="diode-calibration-dy-input">{lang.dy}</label>
          <UnitInput
            className={styles.input}
            controls={false}
            id="diode-calibration-dy-input"
            isInch={isInch}
            max={20}
            min={-20}
            onChange={(val) => {
              if (val !== null) setDy(val);
            }}
            precision={isInch ? 4 : 2}
            step={isInch ? 0.254 : 0.5}
            type="number"
            unit={isInch ? 'in' : 'mm'}
            unitClassName={styles.unit}
            value={dy}
          />
        </div>
      </div>
    );

    return (
      <DraggableModal
        closable={false}
        footer={
          <>
            <Button onClick={handleClose}>{lang.cancel}</Button>
            <Button
              onClick={() => {
                const offsetX = Constant.diode.calibrationPicture.offsetX + dx;
                const offsetY = Constant.diode.calibrationPicture.offsetY + dy;

                console.log(offsetX, offsetY);
                useGlobalPreferenceStore.getState().update({
                  diode_offset_x: offsetX,
                  diode_offset_y: offsetY,
                });
                setCurrentStep(STEP_FINISH);
              }}
              type="primary"
            >
              {lang.next}
            </Button>
          </>
        }
        maskClosable={false}
        open
        title={lang.diode_calibration}
        width={400}
      >
        {manualCalibration}
      </DraggableModal>
    );
  }, [cameraMovedX, cameraMovedY, dx, dy, handleClose, moveAndRetakePicture, lang, showHint, isInch]);

  const renderStepFinish = useCallback((): React.JSX.Element => {
    return (
      <DraggableModal
        closable={false}
        footer={
          <Button onClick={handleClose} type="primary">
            {lang.finish}
          </Button>
        }
        maskClosable={false}
        open
        title={lang.diode_calibration}
        width={400}
      >
        <div>{lang.calibrate_done_diode}</div>
      </DraggableModal>
    );
  }, [handleClose, lang]);

  switch (currentStep) {
    case STEP_ASK_READJUST:
      return renderStepAskReadjust();
    case STEP_ALERT:
      return renderStepAlert();
    case STEP_CUT:
      return renderStepCut();
    case STEP_ANALYZE:
      return renderStepAnalyze();
    case STEP_FINISH:
      return renderStepFinish();
    default:
      break;
  }

  return null;
};

export default DiodeCalibration;
