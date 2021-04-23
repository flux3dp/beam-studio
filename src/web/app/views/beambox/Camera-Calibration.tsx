/* eslint-disable react/no-multi-comp */
import $ from 'jquery';
import BeamboxPreference from 'app/actions/beambox/beambox-preference';
import Constant from 'app/actions/beambox/constant';
import PreviewModeController from 'app/actions/beambox/preview-mode-controller';
import alertConstants from 'app/constants/alert-constants';
import alert from 'app/actions/alert-caller';
import dialog from 'app/actions/dialog-caller';
import progress from 'app/actions/progress-caller';
import Alert from 'app/widgets/Alert';
import Modal from 'app/widgets/Modal';
import UnitInput from 'app/widgets/Unit-Input-v2';
import Config from 'helpers/api/config';
import CameraCalibration from 'helpers/api/camera-calibration';
import CheckDeviceStatus from 'helpers/check-device-status';
import DeviceErrorHandler from 'helpers/device-error-handler';
import DeviceMaster from 'helpers/device-master';
import * as i18n from 'helpers/i18n';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import VersionChecker from 'helpers/version-checker';
let svgCanvas;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const classNames = requireNode('classnames');
const React = requireNode('react');
const { useState, useEffect, useRef } = React;
const LANG = i18n.lang.camera_calibration;

const cameraCalibrationWebSocket = CameraCalibration();

//View render the following steps
const STEP_ASK_READJUST = Symbol();
const STEP_REFOCUS = Symbol();
const STEP_PUT_PAPER = Symbol();
const STEP_BEFORE_ANALYZE_PICTURE = Symbol();
const STEP_FINISH = Symbol();

let cameraPosition = {
  x: 0,
  y: 0
};
const calibratedMachineUUIDs = [];

class CameraCalibrationComponent extends React.Component {
  private props: any
  private state: any
  private setState: (newState) => void
  private unit: string

  constructor(props) {
    super(props);
    const didCalibrate = calibratedMachineUUIDs.includes(props.device.uuid);

    this.state = {
      currentStep: didCalibrate ? STEP_ASK_READJUST : STEP_PUT_PAPER,
      currentOffset: { X: 15, Y: 30, R: 0, SX: 1.625, SY: 1.625 },
      imgBlobUrl: '',
    };
    this.unit = Config().read('default-units') as string || 'mm';
    this.updateCurrentStep = this.updateCurrentStep.bind(this);
    this.onClose = this.onClose.bind(this);
    this.updateImgBlobUrl = this.updateImgBlobUrl.bind(this);
  }

  updateCurrentStep(nextStep) {
    this.setState({
      currentStep: nextStep
    });
  }

  async onClose(completed: boolean = false) {
    this.props.onClose(completed);
    await PreviewModeController.end();
    if (this.origFanSpeed) {
      await DeviceMaster.setFan(this.origFanSpeed);
    }
  }

  updateImgBlobUrl(val) {
    URL.revokeObjectURL(this.state.imgBlobUrl);
    this.setState({
      imgBlobUrl: val
    });
  }

  updateOffsetData(data) {
    this.setState(data);
  }

  render() {
    const { device } = this.props;
    const model = device.model === 'fbm1' ? 'beamo' : 'beambox';
    const stepsMap = {
      [STEP_ASK_READJUST]:
        <StepAskReadjust
          device={device}
          parent={this}
          updateImgBlobUrl={this.updateImgBlobUrl}
          updateOffsetDataCb={this.updateOffsetData.bind(this)}
          gotoNextStep={this.updateCurrentStep}
          onClose={this.onClose}
        />,
      [STEP_PUT_PAPER]:
        <StepPutPaper
          gotoNextStep={this.updateCurrentStep}
          onClose={this.onClose}
        />,
      [STEP_REFOCUS]:
        <StepRefocus
          parent={this}
          device={device}
          model={model}
          gotoNextStep={this.updateCurrentStep}
          onClose={this.onClose}
          updateImgBlobUrl={this.updateImgBlobUrl}
          updateOffsetDataCb={this.updateOffsetData.bind(this)}
        />,
      [STEP_BEFORE_ANALYZE_PICTURE]:
        <StepBeforeAnalyzePicture
          currentOffset={this.state.currentOffset}
          gotoNextStep={this.updateCurrentStep}
          onClose={this.onClose}
          imgBlobUrl={this.state.imgBlobUrl}
          updateImgBlobUrl={this.updateImgBlobUrl}
          updateOffsetDataCb={this.updateOffsetData.bind(this)}
          device={this.props.device}
          unit={this.unit}
          parent={this}
        />,
      [STEP_FINISH]:
        <StepFinish
          parent={this}
          onClose={this.onClose}
        />
    };

    const currentStep = this.state.currentStep;
    const currentStepComponent = stepsMap[currentStep];
    return (
      <div className='always-top' ref='modal'>
        <Modal className={{ 'modal-camera-calibration': true }} content={currentStepComponent} disabledEscapeOnBackground={false} />
      </div>
    );
  }
};

const StepAskReadjust = ({ device, parent, gotoNextStep, updateImgBlobUrl, updateOffsetDataCb, onClose }) => {
  return (
    <Alert
      caption={LANG.camera_calibration}
      message={LANG.ask_for_readjust}
      buttons={
        [{
          label: LANG.cancel,
          className: 'btn-default pull-left',
          onClick: onClose
        },
        {
          label: LANG.skip,
          className: 'btn-default pull-right primary',
          onClick: async () => {
            try {
              let blobUrl;
              await PreviewModeController.start(device, () => { console.log('camera fail. stop preview mode'); });
              parent.lastConfig = PreviewModeController._getCameraOffset();
              progress.openNonstopProgress({
                id: 'taking-picture',
                message: LANG.taking_picture,
                timeout: 30000,
              });
              const movementX = Constant.camera.calibrationPicture.centerX - Constant.camera.offsetX_ideal;
              const movementY = Constant.camera.calibrationPicture.centerY - Constant.camera.offsetY_ideal;
              blobUrl = await PreviewModeController.takePictureAfterMoveTo(movementX, movementY);
              cameraPosition = { x: movementX, y: movementY };
              await doGetOffsetFromPicture(blobUrl, updateOffsetDataCb);
              updateImgBlobUrl(blobUrl);
              gotoNextStep(STEP_BEFORE_ANALYZE_PICTURE);
            } catch (error) {
              console.log(error);
              alert.popUp({
                id: 'menu-item',
                type: alertConstants.SHOW_POPUP_ERROR,
                message: '#815 ' + (error.message || DeviceErrorHandler.translate(error) || 'Fail to cut and capture'),
                callbacks: async () => {
                  const report = await DeviceMaster.getReport();
                  device.st_id = report.st_id;
                  await CheckDeviceStatus(device, false, true);
                }
              });
            } finally {
              progress.popById('taking-picture');
            }
          }
        },
        {
          label: LANG.do_engraving,
          className: 'btn-default pull-right',
          onClick: () => gotoNextStep(STEP_PUT_PAPER)
        }]
      }
    />
  );
};

const StepPutPaper = ({ gotoNextStep, onClose }) => {
  // TODO: Update video
  const video = (
    <video className='video' autoPlay loop>
      <source src="video/put_paper.webm" type="video/webm" />
    </video>
  );

  return (
    <Alert
      caption={LANG.camera_calibration}
      message={LANG.please_place_paper}
      children={video}
      buttons={
        [{
          label: LANG.next,
          className: 'btn-default pull-right primary',
          onClick: () => gotoNextStep(STEP_REFOCUS)
        },
        {
          label: LANG.cancel,
          className: 'btn-default pull-left',
          onClick: onClose
        }]
      }
    />
  );
};

const StepRefocus = ({ parent, device, model, gotoNextStep, onClose, updateImgBlobUrl, updateOffsetDataCb }) => {
  const cutThenCapture = async function () {
    await doCuttingTask();
    let blobUrl = await doCaptureTask();
    await doGetOffsetFromPicture(blobUrl, updateOffsetDataCb);
    updateImgBlobUrl(blobUrl);
    return;
  };
  const doCuttingTask = async function () {
    const res = await DeviceMaster.select(device);
    if (!res.success) {
      throw 'Fail to select device';
    }
    const laserPower = Number((await DeviceMaster.getLaserPower()).value);
    const fanSpeed = Number((await DeviceMaster.getFan()).value);
    parent.origFanSpeed = fanSpeed;
    const vc = VersionChecker(device.version);
    const tempCmdAvailable = vc.meetRequirement('TEMP_I2C_CMD');
    if (tempCmdAvailable) {
      await DeviceMaster.setFanTemp(100);
    } else {
      if (fanSpeed > 100) {
        await DeviceMaster.setFan(100);
      }
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
      await PreviewModeController.start(device, () => console.log('camera fail. stop preview mode'));
      parent.lastConfig = PreviewModeController._getCameraOffset();
      progress.openNonstopProgress({
        id: 'taking-picture',
        message: LANG.taking_picture,
        timeout: 30000,
      });
      const movementX = Constant.camera.calibrationPicture.centerX - Constant.camera.offsetX_ideal;
      const movementY = Constant.camera.calibrationPicture.centerY - Constant.camera.offsetY_ideal;
      blobUrl = await PreviewModeController.takePictureAfterMoveTo(movementX, movementY);
      cameraPosition = { x: movementX, y: movementY }
    } catch (error) {
      throw error;
    } finally {
      progress.popById('taking-picture');
    }
    return blobUrl;
  };

  const [isAutoFocus, setIsAutoFocus] = useState(false);
  const [isCutButtonDisabled, setIsCutButtonDisabled] = useState(false);
  const videoElem = useRef(null);
  useEffect(() => {
    if (videoElem.current) {
      videoElem.current.load();
    }
  }, [isAutoFocus]);

  let child = null;
  let message = LANG.please_refocus.beambox;
  if (model === 'beamo') {
    child = (
      <div className="video-container">
        <div className="tab-container">
          <div className={classNames('tab', 'left', { selected: !isAutoFocus })} onClick={() => setIsAutoFocus(false)}>{LANG.without_af}</div>
          <div className={classNames('tab', 'right', { selected: isAutoFocus })} onClick={() => setIsAutoFocus(true)}>{LANG.with_af}</div>
        </div>
        <video className="video" ref={videoElem} autoPlay loop>
          <source src={isAutoFocus ? 'video/autofocus.webm' : 'video/bm_focus.webm'} type="video/webm" />
        </video>
      </div>
    );
    message = isAutoFocus ? LANG.please_refocus.beamo_af : LANG.please_refocus.beamo;
  } else {
    child = (
      <video className="video" ref={videoElem} autoPlay loop>
        <source src='video/bb_focus.webm' type="video/webm" />
      </video>
    );
  }
  return (
    <Alert
      caption={LANG.camera_calibration}
      message={message}
      children={child}
      buttons={
        [{
          label: LANG.start_engrave,
          className: classNames('btn-default pull-right primary', { 'disabled': isCutButtonDisabled }),
          onClick: async () => {
            if (isCutButtonDisabled) {
              return;
            }
            try {
              setIsCutButtonDisabled(true);
              await cutThenCapture();
              if (!calibratedMachineUUIDs.includes(device.uuid)) {
                calibratedMachineUUIDs.push(device.uuid);
              }
              gotoNextStep(STEP_BEFORE_ANALYZE_PICTURE);
            } catch (error) {
              setIsCutButtonDisabled(false);
              console.log(error);
              alert.popUp({
                id: 'menu-item',
                type: alertConstants.SHOW_POPUP_ERROR,
                message: '#815 ' + (error.message || DeviceErrorHandler.translate(error) || 'Fail to cut and capture'),
                callbacks: async () => {
                  const report = await DeviceMaster.getReport();
                  device.st_id = report.st_id;
                  await CheckDeviceStatus(device, false, true);
                }
              });
            }
          }
        },
        {
          label: LANG.cancel,
          className: 'btn-default pull-left',
          onClick: onClose
        }]
      }
    />
  );
};

const sendPictureThenSetConfig = async (result, device, borderless) => {
  result.X = Math.round(result.X * 10) / 10;
  result.Y = Math.round(result.Y * 10) / 10;
  console.log("Setting camera_offset", borderless ? 'borderless' : '', result);
  if (result) {
    await _doSetConfigTask(device, result.X, result.Y, result.R, result.SX, result.SY, borderless);
  } else {
    throw new Error(LANG.analyze_result_fail);
  }
};

const _doSendPictureTask = async (imgBlobUrl: string) => {
  const d = $.Deferred();
  fetch(imgBlobUrl)
    .then(res => res.blob())
    .then((blob) => {
      var fileReader = new FileReader();
      fileReader.onloadend = (e) => {
        cameraCalibrationWebSocket.upload(e.target.result)
          .done((resp) => {
            d.resolve(resp);
          })
          .fail((resp) => {
            d.reject(resp.toString());
          });
      };
      fileReader.readAsArrayBuffer(blob);
    })
    .catch((err) => {
      d.reject(err);
    });

  let resp = await d.promise();

  let result = null;
  switch (resp.status) {
    case 'ok':
      result = await _doAnalyzeResult(imgBlobUrl, resp.x, resp.y, resp.angle, resp.width, resp.height);
      break;
    case 'fail':
    case 'none':
    default:
      break;
  }
  return result;
};

const _doAnalyzeResult = async (imgBlobUrl, x, y, angle, squareWidth, squareHeight) => {
  const blobImgSize = await new Promise<{ width: number, height: number }>(resolve => {
    const img = new Image();
    img.src = imgBlobUrl;
    img.onload = () => {
      console.log("Blob size", img.width, img.height);
      resolve({
        width: img.width,
        height: img.height
      });
    };
  });

  const offsetX_ideal = Constant.camera.offsetX_ideal; // mm
  const offsetY_ideal = Constant.camera.offsetY_ideal; // mm
  const scaleRatio_ideal = Constant.camera.scaleRatio_ideal;
  const square_size = Constant.camera.calibrationPicture.size; // mm

  const scaleRatioX = (square_size * Constant.dpmm) / squareWidth;
  const scaleRatioY = (square_size * Constant.dpmm) / squareHeight;
  const deviationX = x - blobImgSize.width / 2; // pixel
  const deviationY = y - blobImgSize.height / 2; // pixel

  const offsetX = -deviationX * scaleRatioX / Constant.dpmm + offsetX_ideal; //mm
  const offsetY = -deviationY * scaleRatioY / Constant.dpmm + offsetY_ideal; //mm

  if ((0.8 > scaleRatioX / scaleRatio_ideal) || (scaleRatioX / scaleRatio_ideal > 1.2)) {
    return false;
  }
  if ((0.8 > scaleRatioY / scaleRatio_ideal) || (scaleRatioY / scaleRatio_ideal > 1.2)) {
    return false;
  }
  if ((Math.abs(deviationX) > 400) || (Math.abs(deviationY) > 400)) {
    return false;
  }
  if (Math.abs(angle) > 10 * Math.PI / 180) {
    return false;
  }
  return {
    X: offsetX,
    Y: offsetY,
    R: -angle,
    SX: scaleRatioX,
    SY: scaleRatioY
  };
};

const doGetOffsetFromPicture = async function (imgBlobUrl, updateOffsetCb) {
  let sdata = await _doSendPictureTask(imgBlobUrl);
  let hadGotOffsetFromPicture = true;
  if (!sdata) {
    sdata = {
      X: 20,
      Y: 30,
      R: 0,
      SX: 1.625,
      SY: 1.625
    };
    hadGotOffsetFromPicture = false;
  }
  updateOffsetCb({ currentOffset: sdata });
  return hadGotOffsetFromPicture;
};

const _doSetConfigTask = async (device, X, Y, R, SX, SY, borderless) => {
  const parameterName = borderless ? 'camera_offset_borderless' : 'camera_offset';
  const vc = VersionChecker(device.version);
  if (vc.meetRequirement('BEAMBOX_CAMERA_CALIBRATION_XY_RATIO')) {
    await DeviceMaster.setDeviceSetting(parameterName, `Y:${Y} X:${X} R:${R} S:${(SX + SY) / 2} SX:${SX} SY:${SY}`);
  } else {
    await DeviceMaster.setDeviceSetting(parameterName, `Y:${Y} X:${X} R:${R} S:${(SX + SY) / 2}`);
  }
};

const StepBeforeAnalyzePicture = ({ currentOffset, updateOffsetDataCb, updateImgBlobUrl, imgBlobUrl, gotoNextStep, onClose, unit, device, parent }) => {
  const [showHint, setShowHint] = useState(false);
  const [showLastConfig, setShowLastConfig] = useState(false);

  useEffect(() => {
    setShowHint(true);
  }, [])

  const imageScale = 200 / 280;
  const mmToImage = 10 * imageScale;
  let imgBackground = {
    background: `url(${imgBlobUrl})`
  };
  const squareWidth = 25 * mmToImage / currentOffset.SX; //px
  const squareHeight = 25 * mmToImage / currentOffset.SY; //px

  let squareStyle = {
    width: squareWidth,
    height: squareHeight,
    left: 100 - squareWidth / 2 - (currentOffset.X - Constant.camera.calibrationPicture.centerX + cameraPosition.x) * mmToImage / currentOffset.SX,
    top: 100 - squareHeight / 2 - (currentOffset.Y - Constant.camera.calibrationPicture.centerY + cameraPosition.y) * mmToImage / currentOffset.SY,
    transform: `rotate(${-currentOffset.R * 180 / Math.PI}deg)`
  };

  console.log('SquareStyle', squareStyle);
  const lastSquareWidth = 25 * mmToImage / parent.lastConfig.scaleRatioX; //px
  const lastSquareHeight = 25 * mmToImage / parent.lastConfig.scaleRatioY; //px
  let lastConfigSquareStyle = {
    width: lastSquareWidth,
    height: lastSquareHeight,
    left: 100 - lastSquareWidth / 2 - (parent.lastConfig.x - Constant.camera.calibrationPicture.centerX + cameraPosition.x) * mmToImage / parent.lastConfig.scaleRatioX,
    top: 100 - lastSquareHeight / 2 - (parent.lastConfig.y - Constant.camera.calibrationPicture.centerY + cameraPosition.y) * mmToImage / parent.lastConfig.scaleRatioY,
    transform: `rotate(${-parent.lastConfig.angle * 180 / Math.PI}deg)`
  };
  let handleValueChange = function (key, val) {
    console.log('Key', key, '=', val);
    currentOffset[key] = val;
    updateOffsetDataCb(currentOffset);
  };

  const hint_modal = showHint ? renderHintModal(setShowHint) : null;
  const lastConfigSquare = showLastConfig ? <div className="virtual-square last-config" style={lastConfigSquareStyle} /> : null;
  const manual_calibration = (
    <div>
      <div className="img-center" style={imgBackground}>
        <div className="virtual-square" style={squareStyle} />
        {lastConfigSquare}
        <div className="camera-control up" onClick={() => moveAndRetakePicture('up', updateImgBlobUrl)} />
        <div className="camera-control down" onClick={() => moveAndRetakePicture('down', updateImgBlobUrl)} />
        <div className="camera-control left" onClick={() => moveAndRetakePicture('left', updateImgBlobUrl)} />
        <div className="camera-control right" onClick={() => moveAndRetakePicture('right', updateImgBlobUrl)} />
      </div>
      <div className="hint-icon" onClick={() => setShowHint(true)}>
        ?
            </div>
      <div className="controls">
        <div className="control">
          <label>{LANG.dx}</label>
          <UnitInput
            type={'number'}
            min={-50}
            max={50}
            unit={'mm'}
            defaultValue={currentOffset.X - 15}
            getValue={(val) => handleValueChange('X', val + 15)}
            decimal={unit === 'inches' ? 3 : 1}
            step={unit === 'inches' ? 0.005 : 0.1}
            isDoOnInput={true}
          />
        </div>

        <div className="control">
          <label>{LANG.dy}</label>
          <UnitInput
            type={'number'}
            min={-50}
            max={50}
            unit={'mm'}
            defaultValue={currentOffset.Y - 30}
            getValue={(val) => handleValueChange('Y', val + 30)}
            decimal={unit === 'inches' ? 3 : 1}
            step={unit === 'inches' ? 0.005 : 0.1}
            isDoOnInput={true}
          />
        </div>

        <div className="control">
          <label>{LANG.rotation_angle}</label>
          <UnitInput
            type={'number'}
            min={-180}
            max={180}
            unit="deg"
            defaultValue={currentOffset.R * 180 / Math.PI}
            getValue={(val) => handleValueChange('R', val * Math.PI / 180)}
            decimal={1}
            step={0.1}
            isDoOnInput={true}
          />
        </div>

        <div className="control">
          <label>{LANG.x_ratio}</label>
          <UnitInput
            type={'number'}
            min={10}
            max={200}
            unit="%"
            defaultValue={100 * (3.25 - currentOffset.SX) / 1.625}
            getValue={(val) => handleValueChange('SX', (200 - val) * 1.625 / 100)}
            decimal={1}
            step={0.5}
            isDoOnInput={true}
          />
        </div>

        <div className="control">
          <label>{LANG.y_ratio}</label>
          <UnitInput
            type={'number'}
            min={10}
            max={200}
            unit="%"
            defaultValue={100 * (3.25 - currentOffset.SY) / 1.625}
            getValue={(val) => handleValueChange('SY', (200 - val) * 1.625 / 100)}
            decimal={1}
            step={0.5}
            isDoOnInput={true}
          />
        </div>
        <div className='checkbox-container' onClick={() => { setShowLastConfig(!showLastConfig) }}>
          <input type="checkbox" checked={showLastConfig} onChange={() => { }} />
          <div className='title'>{LANG.show_last_config}</div>
        </div>
      </div>
      {hint_modal}
    </div>
  );

  return (
    <Alert
      caption={LANG.camera_calibration}
      message={manual_calibration}
      buttons={
        [{
          label: LANG.next,
          className: 'btn-default btn-right primary',
          onClick: async () => {
            try {
              await PreviewModeController.end();
              await sendPictureThenSetConfig(currentOffset, device, parent.props.borderless);
              gotoNextStep(STEP_FINISH);
            } catch (error) {
              console.log(error);
              alert.popUp({
                id: 'menu-item',
                type: alertConstants.SHOW_POPUP_ERROR,
                message: '#816 ' + error.toString().replace('Error: ', ''),
                callbacks: () => { gotoNextStep(STEP_REFOCUS) }
              });
            }
          }
        },
        {
          label: LANG.back,
          className: 'btn-default btn-right',
          onClick: async () => {
            await PreviewModeController.end();
            gotoNextStep(STEP_REFOCUS);
          }
        },
        {
          label: LANG.cancel,
          className: 'btn-default pull-left',
          onClick: onClose
        }]
      }
    />
  );
};

const moveAndRetakePicture = async (dir: string, updateImgBlobUrl: Function) => {
  try {
    progress.openNonstopProgress({
      id: 'taking-picture',
      message: LANG.taking_picture,
      timeout: 30000,
    });
    let { x, y } = cameraPosition;
    switch (dir) {
      case 'up':
        y -= 3;
        break;
      case 'down':
        y += 3;
        break;
      case 'left':
        x -= 3;
        break;
      case 'right':
        x += 3;
        break;
    }
    let blobUrl = await PreviewModeController.takePictureAfterMoveTo(x, y);
    console.log(x, y);
    cameraPosition = { x, y }
    updateImgBlobUrl(blobUrl);
  } catch (error) {
    throw error;
  } finally {
    progress.popById('taking-picture');
  }
}

const renderHintModal = (setShowHint: (showHint :boolean) => void) => {
  const virtual_square = $('.modal-camera-calibration .virtual-square');
  let position1 = virtual_square.offset();
  position1.top += virtual_square.height() + 5;
  const controls = $('.modal-camera-calibration .controls');
  let position2 = controls.offset();
  position2.left += 30;
  position2.top -= 45;
  return (
    <div className="hint-modal-background" onClick={() => { setShowHint(false) }}>
      <div className="hint-box" style={position1}>
        <div className="arrowup"></div>
        <div className="hint-body">
          {LANG.hint_red_square}
        </div>
      </div>
      <div className="hint-box" style={position2}>
        <div className="hint-body">
          {LANG.hint_adjust_parameters}
        </div>
        <div className="arrowdown"></div>
      </div>
    </div>
  );
};

const StepFinish = ({ parent, onClose }) => (
  <Alert
    caption={LANG.camera_calibration}
    message={LANG.calibrate_done}
    buttons={
      [{
        label: LANG.finish,
        className: 'btn-default pull-right primary',
        onClick: () => {
          BeamboxPreference.write('should_remind_calibrate_camera', false);
          svgCanvas.toggleBorderless(parent.props.borderless);
          onClose(true);
        }
      }]
    }
  />
);

export default CameraCalibrationComponent;

// Not putting this in dialog-caller to avoid circular import because DeviceMaster imports dialog
export const showCameraCalibration = (device, isBorderless: boolean) => {
  if (dialog.isIdExist('camera-cali')) return;
  return new Promise<boolean>((resolve) => {
    console.log(device);
    dialog.addDialogComponent('camera-cali',
      <CameraCalibrationComponent
        device={device}
        borderless={isBorderless}
        onClose={(completed: boolean = false) => {
          dialog.popDialogById('camera-cali');
          resolve(completed);
        }}
      />
    );
  });
};
