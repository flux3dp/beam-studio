import React from 'react';

import classNames from 'classnames';

import Alert from '@core/app/actions/alert-caller';
import BeamboxPreference from '@core/app/actions/beambox/beambox-preference';
import Constant from '@core/app/actions/beambox/constant';
import PreviewModeController from '@core/app/actions/beambox/preview-mode-controller';
import Dialog from '@core/app/actions/dialog-caller';
import Progress from '@core/app/actions/progress-caller';
import AlertConstants from '@core/app/constants/alert-constants';
import AlertDialog from '@core/app/widgets/AlertDialog';
import DraggableModal from '@core/app/widgets/DraggableModal';
import UnitInput from '@core/app/widgets/Unit-Input-v2';
import CheckDeviceStatus from '@core/helpers/check-device-status';
import DeviceErrorHandler from '@core/helpers/device-error-handler';
import DeviceMaster from '@core/helpers/device-master';
import i18n from '@core/helpers/i18n';
import VersionChecker from '@core/helpers/version-checker';
import browser from '@core/implementations/browser';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

const LANG = i18n.lang.calibration;
const LANG_ALERT = i18n.lang.alert;

// View render the following steps
const STEP_ASK_READJUST = Symbol('STEP_ASK_READJUST');
const STEP_ALERT = Symbol('STEP_ALERT');
const STEP_CUT = Symbol('STEP_CUT');
const STEP_ANALYZE = Symbol('STEP_ANALYZE');
const STEP_FINISH = Symbol('STEP_FINISH');

let cameraOffset = {
  x: 0,
  y: 0,
};
const calibratedMachineUUIDs: string[] = [];

interface Props {
  device: IDeviceInfo;
  onClose: () => void;
}

interface State {
  cameraMovedX: number;
  cameraMovedY: number;
  currentStep: symbol;
  dx: number;
  dy: number;
  isCutButtonDisabled: boolean;
  showHint: boolean;
}

class DiodeCalibration extends React.Component<Props, State> {
  private imageScale: number;

  private origFanSpeed: number;

  private cameraOffset: {
    angle?: number;
    scaleRatioX?: number;
    scaleRatioY?: number;
    x: number;
    y: number;
  };

  private imageUrl: string;

  constructor(props: Props) {
    super(props);

    const { device } = props;
    const didCalibrate = calibratedMachineUUIDs.includes(device.uuid);

    this.imageScale = 0.5;
    this.state = {
      cameraMovedX: 0,
      cameraMovedY: 0,
      currentStep: didCalibrate ? STEP_ASK_READJUST : STEP_ALERT,
      dx: 0,
      dy: 0,
      isCutButtonDisabled: false,
      showHint: false,
    };
  }

  updateCurrentStep = (nextStep): void => {
    this.setState({
      currentStep: nextStep,
    });
  };

  onClose = async (): Promise<void> => {
    const { onClose } = this.props;

    onClose();
    await PreviewModeController.end({ shouldWaitForEnd: true });

    if (this.origFanSpeed) {
      await DeviceMaster.setFan(this.origFanSpeed);
    }
  };

  doCuttingTask = async (): Promise<void> => {
    const { device } = this.props;
    const res = await DeviceMaster.select(device);

    if (!res.success) {
      throw new Error('Fail to select device');
    }

    const laserPower = Number((await DeviceMaster.getLaserPower()).value);
    const fanSpeed = Number((await DeviceMaster.getFan()).value);

    this.origFanSpeed = fanSpeed;

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
  };

  doCaptureTask = async (): Promise<void> => {
    const { device } = this.props;
    let blobUrl;

    try {
      await PreviewModeController.start(device);
      Progress.openNonstopProgress({
        id: 'taking-picture',
        message: LANG.taking_picture,
        timeout: 30000,
      });
      cameraOffset = PreviewModeController.getCameraOffset();
      this.cameraOffset = cameraOffset;

      const { centerX, centerY } = Constant.diode.calibrationPicture;
      const movementX = centerX - this.cameraOffset.x;
      const movementY = centerY - this.cameraOffset.y;

      blobUrl = await PreviewModeController.getPhotoAfterMoveTo(movementX, movementY);
    } finally {
      Progress.popById('taking-picture');
    }
    this.imageUrl = blobUrl;
  };

  cropAndRotateImg = async (): Promise<string> => {
    const img = new Image();

    await new Promise((resolve) => {
      img.onload = () => {
        URL.revokeObjectURL(this.imageUrl);
        resolve(img);
      };
      img.src = this.imageUrl;
    });

    const { angle, scaleRatioX, scaleRatioY } = this.cameraOffset;

    const cvs = document.createElement('canvas');
    const ctx = cvs.getContext('2d');

    const a = angle;
    const w = img.width;
    const h = img.height;

    const l = (h * scaleRatioY) / (Math.cos(a) + Math.sin(a));

    cvs.width = l;
    cvs.height = l;
    this.imageScale = 200 / l; // 200 width of image display div
    ctx.translate(l / 2, l / 2);
    ctx.rotate(a);
    ctx.scale(scaleRatioX, scaleRatioY);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);

    return new Promise((resolve) => {
      cvs.toBlob((blob) => {
        const newImageUrl = URL.createObjectURL(blob);

        this.imageUrl = newImageUrl;
        resolve(newImageUrl);
      });
    });
  };

  moveAndRetakePicture = async (dir: string): Promise<void> => {
    try {
      Progress.openNonstopProgress({
        id: 'taking-picture',
        message: LANG.taking_picture,
        timeout: 30000,
      });

      let { cameraMovedX, cameraMovedY } = this.state;

      switch (dir) {
        case 'up':
          cameraMovedY -= 3;
          break;
        case 'down':
          cameraMovedY += 3;
          break;
        case 'left':
          cameraMovedX -= 3;
          break;
        case 'right':
          cameraMovedX += 3;
          break;
        default:
          break;
      }

      const { centerX, centerY } = Constant.diode.calibrationPicture;
      const movementX = centerX - this.cameraOffset.x + cameraMovedX;
      const movementY = centerY - this.cameraOffset.y + cameraMovedY;
      const blobUrl = await PreviewModeController.getPhotoAfterMoveTo(movementX, movementY);

      console.log(movementX, movementY);
      this.imageUrl = blobUrl;
      await this.cropAndRotateImg();
      this.setState({ cameraMovedX, cameraMovedY });
    } finally {
      Progress.popById('taking-picture');
    }
  };

  updateShowHint(show: boolean): void {
    this.setState({ showHint: show });
  }

  renderStepAskReadjust(): React.JSX.Element {
    const { device } = this.props;

    return (
      <AlertDialog
        buttons={[
          {
            className: 'btn-default pull-left',
            label: LANG.cancel,
            onClick: () => this.onClose(),
          },
          {
            className: 'btn-default pull-right primary',
            label: LANG.skip,
            onClick: async () => {
              try {
                await CheckDeviceStatus(device);
                await this.doCaptureTask();
                await this.cropAndRotateImg();
                this.updateCurrentStep(STEP_ANALYZE);
              } catch (error) {
                console.log(error);

                const errorMessage = error instanceof Error ? error.message : DeviceErrorHandler.translate(error);

                Alert.popUp({
                  buttonLabels: [LANG_ALERT.ok, LANG_ALERT.learn_more],
                  callbacks: [
                    async () => {
                      const report = await DeviceMaster.getReport();

                      device.st_id = report.st_id;
                      await CheckDeviceStatus(device, false, true);
                    },
                    () => browser.open(LANG.zendesk_link),
                  ],
                  id: 'diode-cali-err',
                  message: `#815 ${errorMessage || 'Fail to capture'}`,
                  primaryButtonIndex: 0,
                  type: AlertConstants.SHOW_POPUP_ERROR,
                });
              } finally {
                Progress.popById('taking-picture');
              }
            },
          },
          {
            className: 'btn-default pull-right',
            label: LANG.do_engraving,
            onClick: () => this.updateCurrentStep(STEP_ALERT),
          },
        ]}
        caption={LANG.diode_calibration}
        message={LANG.ask_for_readjust}
      />
    );
  }

  renderStepAlert(): React.JSX.Element {
    const { device } = this.props;
    const model = device.model === 'fbm1' ? 'beamo' : 'beambox';

    return (
      <AlertDialog
        buttons={[
          {
            className: 'btn-default pull-right primary',
            label: LANG.next,
            onClick: () => this.updateCurrentStep(STEP_CUT),
          },
          {
            className: 'btn-default pull-left',
            label: LANG.cancel,
            onClick: () => this.onClose(),
          },
        ]}
        caption={LANG.diode_calibration}
        message={LANG.please_do_camera_calibration_and_focus[model]}
      />
    );
  }

  // Cut and Take Picture
  renderStepCut(): React.JSX.Element {
    const { device } = this.props;
    const { isCutButtonDisabled } = this.state;

    return (
      <AlertDialog
        buttons={[
          {
            className: classNames('btn-default pull-right primary', {
              disabled: isCutButtonDisabled,
            }),
            label: LANG.start_engrave,
            onClick: async () => {
              if (isCutButtonDisabled) {
                return;
              }

              try {
                this.setState({ isCutButtonDisabled: true });
                await CheckDeviceStatus(device);
                await this.doCuttingTask();
                await this.doCaptureTask();
                await this.cropAndRotateImg();

                if (!calibratedMachineUUIDs.includes(device.uuid)) {
                  calibratedMachineUUIDs.push(device.uuid);
                }

                this.updateCurrentStep(STEP_ANALYZE);
              } catch (error) {
                this.setState({ isCutButtonDisabled: false });
                console.log(error);

                const errorMessage = error instanceof Error ? error.message : DeviceErrorHandler.translate(error);

                Alert.popUp({
                  buttonLabels: [LANG_ALERT.ok, LANG_ALERT.learn_more],
                  callbacks: [
                    async () => {
                      const report = await DeviceMaster.getReport();

                      device.st_id = report.st_id;
                      await CheckDeviceStatus(device, false, true);
                    },
                    () => browser.open(LANG.zendesk_link),
                  ],
                  id: 'diode-cali-err',
                  message: `#815 ${errorMessage || 'Fail to cut and capture'}`,
                  primaryButtonIndex: 0,
                  type: AlertConstants.SHOW_POPUP_ERROR,
                });
              }
            },
          },
          {
            className: 'btn-default pull-left',
            label: LANG.cancel,
            onClick: () => this.onClose(),
          },
        ]}
        caption={LANG.diode_calibration}
        message={LANG.please_place_paper}
      />
    );
  }

  renderStepAnalyze(): React.JSX.Element {
    const { cameraMovedX, cameraMovedY, dx, dy } = this.state;

    const imgBackground = {
      background: `url(${this.imageUrl})`,
    };
    const squareSize = Constant.camera.calibrationPicture.size * Constant.dpmm * this.imageScale;

    const squareStyle = {
      height: squareSize, // px
      left: 100 - squareSize / 2 + (dx - cameraMovedX) * Constant.dpmm * this.imageScale,
      top: 100 - squareSize / 2 + (dy - cameraMovedY) * Constant.dpmm * this.imageScale,
      width: squareSize, // px
    };
    const manualCalibration = (
      <div>
        <div className="img-center" style={imgBackground}>
          <div className="virtual-square" style={squareStyle} />
          <div className="camera-control up" onClick={() => this.moveAndRetakePicture('up')} />
          <div className="camera-control down" onClick={() => this.moveAndRetakePicture('down')} />
          <div className="camera-control left" onClick={() => this.moveAndRetakePicture('left')} />
          <div className="camera-control right" onClick={() => this.moveAndRetakePicture('right')} />
        </div>
        <div className="hint-icon" onClick={() => this.setState({ showHint: true })}>
          ?
        </div>
        <div className="controls">
          <div className="control">
            <label>{LANG.dx}</label>
            <UnitInput
              decimal={2}
              defaultValue={dx}
              getValue={(val) => this.setState({ dx: val })}
              isDoOnInput
              max={20}
              min={-20}
              step={0.5}
              type="number"
              unit="mm"
            />
          </div>
          <div className="control">
            <label>{LANG.dy}</label>
            <UnitInput
              decimal={2}
              defaultValue={dy}
              getValue={(val) => this.setState({ dy: val })}
              isDoOnInput
              max={20}
              min={-10}
              step={0.5}
              type="number"
              unit="mm"
            />
          </div>
        </div>
        {this.renderHintModal()}
      </div>
    );

    return (
      <AlertDialog
        buttons={[
          {
            className: 'btn-default pull-right primary',
            label: LANG.next,
            onClick: () => {
              const offsetX = Constant.diode.calibrationPicture.offsetX + dx;
              const offsetY = Constant.diode.calibrationPicture.offsetY + dy;

              console.log(offsetX, offsetY);
              BeamboxPreference.write('diode_offset_x', offsetX);
              BeamboxPreference.write('diode_offset_y', offsetY);
              this.updateCurrentStep(STEP_FINISH);
            },
          },
          {
            className: 'btn-default pull-left',
            label: LANG.cancel,
            onClick: () => this.onClose(),
          },
        ]}
        caption={LANG.diode_calibration}
        message={manualCalibration}
      />
    );
  }

  renderHintModal = (): React.JSX.Element => {
    const { showHint } = this.state;

    if (!showHint) {
      return null;
    }

    const virtualSquare = $('.modal-diode-calibration .virtual-square');
    const position1 = virtualSquare.offset();

    position1.top += virtualSquare.height() + 5;

    const controls = $('.modal-diode-calibration .controls');
    const position2 = controls.offset();

    position2.left += 30;
    position2.top -= 45;

    return (
      <div className="hint-modal-background" onClick={() => this.setState({ showHint: false })}>
        <div className="hint-box" style={position1}>
          <div className="arrowup" />
          <div className="hint-body">{LANG.hint_red_square}</div>
        </div>
        <div className="hint-box" style={position2}>
          <div className="hint-body">{LANG.hint_adjust_parameters}</div>
          <div className="arrowdown" />
        </div>
      </div>
    );
  };

  renderStepFinish(): React.JSX.Element {
    return (
      <AlertDialog
        buttons={[
          {
            className: 'btn-default pull-right primary',
            label: LANG.finish,
            onClick: () => this.onClose(),
          },
        ]}
        caption={LANG.diode_calibration}
        message={LANG.calibrate_done_diode}
      />
    );
  }

  render(): React.JSX.Element {
    const { currentStep } = this.state;
    let content;

    switch (currentStep) {
      case STEP_ASK_READJUST:
        content = this.renderStepAskReadjust();
        break;
      case STEP_ALERT:
        content = this.renderStepAlert();
        break;
      case STEP_CUT:
        content = this.renderStepCut();
        break;
      case STEP_ANALYZE:
        content = this.renderStepAnalyze();
        break;
      case STEP_FINISH:
        content = this.renderStepFinish();
        break;
      default:
        break;
    }

    return <div className="modal-diode-calibration">{content}</div>;
  }
}

export default DiodeCalibration;

// Not putting this in dialog-caller to avoid circular import because DeviceMaster imports dialog
export const showDiodeCalibration = (device: IDeviceInfo): void => {
  if (Dialog.isIdExist('diode-cali')) {
    return;
  }

  Dialog.addDialogComponent(
    'diode-cali',
    <DraggableModal>
      <DiodeCalibration device={device} onClose={() => Dialog.popDialogById('diode-cali')} />
    </DraggableModal>,
  );
};
