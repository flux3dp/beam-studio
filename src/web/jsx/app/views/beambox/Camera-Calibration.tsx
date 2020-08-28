/* eslint-disable react/no-multi-comp */
define(['jquery', 'reactPropTypes', 'helpers/i18n', 'app/actions/beambox/beambox-preference', 'jsx!widgets/Modal', 'jsx!widgets/AlertDialog', 'jsx!widgets/Unit-Input-v2', 'helpers/device-master', 'helpers/version-checker', 'app/constants/device-constants', 'app/contexts/AlertCaller', 'app/actions/alert-actions', 'app/constants/alert-constants', 'helpers/check-device-status', 'app/actions/progress-actions', 'app/constants/progress-constants', 'app/actions/beambox/preview-mode-controller', 'helpers/api/camera-calibration', 'helpers/sprintf', 'app/actions/beambox/constant', 'helpers/device-error-handler'], function ($, PropTypes, i18n, BeamboxPreference, Modal, AlertDialog, UnitInput, DeviceMaster, VersionChecker, DeviceConstants, Alert, AlertActions, AlertConstants, CheckDeviceStatus, ProgressActions, ProgressConstants, PreviewModeController, CameraCalibration, sprintf, Constant, DeviceErrorHandler) {
  const React = require('react');

  const classNames = require('classnames');

  const LANG = i18n.lang.camera_calibration;
  const cameraCalibrationWebSocket = CameraCalibration(); //View render the following steps

  const STEP_REFOCUS = Symbol();
  const STEP_BEFORE_CUT = Symbol();
  const STEP_BEFORE_ANALYZE_PICTURE = Symbol();
  const STEP_FINISH = Symbol();
  let cameraPosition = {};

  class CameraCalibrationStateMachine extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        currentStep: STEP_REFOCUS,
        currentOffset: {
          X: 15,
          Y: 30,
          R: 0,
          SX: 1.625,
          SY: 1.625
        },
        imgBlobUrl: '',
        showHint: false,
        shouldShowLastConfig: true
      };
      this.updateCurrentStep = this.updateCurrentStep.bind(this);
      this.onClose = this.onClose.bind(this);
      this.updateImgBlobUrl = this.updateImgBlobUrl.bind(this);
    }

    updateCurrentStep(nextStep) {
      this.setState({
        currentStep: nextStep
      });
    }

    onClose() {
      this.props.onClose();
      PreviewModeController.end(); //DeviceMaster.setFan(this.origFanSpeed);
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

    updateShowHint(show) {
      this.setState({
        showHint: show
      });
    }

    toggleShowLastConfig() {
      this.setState({
        shouldShowLastConfig: !this.state.shouldShowLastConfig
      });
    }

    render() {
      const stepsMap = {
        [STEP_REFOCUS]: /*#__PURE__*/React.createElement(StepRefocus, {
          gotoNextStep: this.updateCurrentStep,
          onClose: this.onClose,
          model: this.props.model
        }),
        [STEP_BEFORE_CUT]: /*#__PURE__*/React.createElement(StepBeforeCut, {
          gotoNextStep: this.updateCurrentStep,
          onClose: this.onClose,
          device: this.props.device,
          updateImgBlobUrl: this.updateImgBlobUrl,
          model: this.props.model,
          updateOffsetDataCb: this.updateOffsetData.bind(this),
          parent: this
        }),
        [STEP_BEFORE_ANALYZE_PICTURE]: /*#__PURE__*/React.createElement(StepBeforeAnalyzePicture, {
          currentOffset: this.state.currentOffset,
          gotoNextStep: this.updateCurrentStep,
          onClose: this.onClose,
          imgBlobUrl: this.state.imgBlobUrl,
          updateImgBlobUrl: this.updateImgBlobUrl,
          updateOffsetDataCb: this.updateOffsetData.bind(this),
          showHint: this.state.showHint,
          updateShowHint: this.updateShowHint.bind(this),
          parent: this
        }),
        [STEP_FINISH]: /*#__PURE__*/React.createElement(StepFinish, {
          parent: this,
          onClose: this.onClose
        })
      };
      const currentStep = this.state.currentStep;
      const currentStepComponent = stepsMap[currentStep];
      return /*#__PURE__*/React.createElement("div", {
        className: "always-top",
        ref: "modal"
      }, /*#__PURE__*/React.createElement(Modal, {
        className: {
          'modal-camera-calibration': true
        },
        content: currentStepComponent,
        disabledEscapeOnBackground: false
      }));
    }

  }

  ;

  const StepRefocus = ({
    gotoNextStep,
    onClose,
    model
  }) => /*#__PURE__*/React.createElement(AlertDialog, {
    caption: LANG.camera_calibration,
    message: LANG.please_refocus[model],
    buttons: [{
      label: LANG.next,
      className: 'btn-default btn-alone-right',
      onClick: () => gotoNextStep(STEP_BEFORE_CUT)
    }, {
      label: LANG.cancel,
      className: 'btn-default btn-alone-left',
      onClick: onClose
    }]
  });

  const StepBeforeCut = ({
    device,
    updateImgBlobUrl,
    gotoNextStep,
    onClose,
    model,
    updateOffsetDataCb,
    parent
  }) => {
    const [isCutButtonDisabled, setCutButtonDisabled] = React.useState(false);

    const cutThenCapture = async function (updateOffsetDataCb, parent) {
      await _doCuttingTask(parent);
      let blobUrl = await _doCaptureTask(true);
      await _doGetOffsetFromPicture(blobUrl, updateOffsetDataCb);
      updateImgBlobUrl(blobUrl);
      return;
    };

    const _doCuttingTask = async function (parent) {
      await DeviceMaster.select(device);
      const laserPower = Number((await DeviceMaster.getLaserPower()).value);
      const fanSpeed = Number((await DeviceMaster.getFan()).value);
      parent.origFanSpeed = fanSpeed;
      const deviceInfo = await DeviceMaster.getDeviceInfo();
      const vc = VersionChecker(deviceInfo.version);
      const tempCmdAvailable = vc.meetRequirement('TEMP_I2C_CMD');

      if (tempCmdAvailable) {
        await DeviceMaster.setFanTemp(100);
      } else {
        if (fanSpeed > 100) {
          await DeviceMaster.setFan(100); // 10%
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

    const _doCaptureTask = async () => {
      let blobUrl;

      try {
        await PreviewModeController.start(device, () => {
          console.log('camera fail. stop preview mode');
        });
        parent.lastConfig = PreviewModeController._getCameraOffset();
        ProgressActions.open(ProgressConstants.NONSTOP, LANG.taking_picture);
        const movementX = Constant.camera.calibrationPicture.centerX - Constant.camera.offsetX_ideal;
        const movementY = Constant.camera.calibrationPicture.centerY - Constant.camera.offsetY_ideal;
        blobUrl = await PreviewModeController.takePictureAfterMoveTo(movementX, movementY);
        cameraPosition = {
          x: movementX,
          y: movementY
        };
      } catch (error) {
        throw error;
      } finally {
        ProgressActions.close();
      }

      return blobUrl;
    };

    return /*#__PURE__*/React.createElement(AlertDialog, {
      caption: LANG.camera_calibration,
      message: LANG.please_place_paper[model],
      buttons: [{
        label: LANG.start_engrave,
        className: classNames('btn-default btn-alone-right', {
          'disabled': isCutButtonDisabled
        }),
        onClick: async () => {
          if (isCutButtonDisabled) {
            return;
          }

          try {
            setCutButtonDisabled(true);
            await cutThenCapture(updateOffsetDataCb, parent);
            gotoNextStep(STEP_BEFORE_ANALYZE_PICTURE);
          } catch (error) {
            setCutButtonDisabled(false);
            console.log(error);
            ProgressActions.close();
            Alert.popUp({
              id: 'menu-item',
              type: AlertConstants.SHOW_POPUP_ERROR,
              message: '#815 ' + (error.message || DeviceErrorHandler.translate(error.error) || 'Fail to cut and capture'),
              callbacks: async () => {
                const report = await DeviceMaster.getReport();
                device.st_id = report.st_id;
                await CheckDeviceStatus(device, false, true);
              }
            });
          }
        }
      }, {
        label: LANG.cancel,
        className: 'btn-default btn-alone-left',
        onClick: onClose
      }]
    });
  };

  const sendPictureThenSetConfig = async (result, imgBlobUrl, borderless) => {
    console.log("Setting camera_offset", borderless ? 'borderless' : '', result);

    if (result) {
      await _doSetConfigTask(result.X, result.Y, result.R, result.SX, result.SY, borderless);
    } else {
      throw new Error(LANG.analyze_result_fail);
    }
  };

  const _doSendPictureTask = async url => {
    const d = $.Deferred();

    if (url) {
      imgBlobUrl = url;
    }

    fetch(imgBlobUrl).then(res => res.blob()).then(blob => {
      var fileReader = new FileReader();

      fileReader.onloadend = e => {
        cameraCalibrationWebSocket.upload(e.target.result).done(resp => {
          d.resolve(resp);
        }).fail(resp => {
          d.reject(resp.toString());
        });
      };

      fileReader.readAsArrayBuffer(blob);
    }).catch(err => {
      d.reject(err);
    });
    let resp = await d.promise();
    let result = null;
    ;

    switch (resp.status) {
      case 'ok':
        result = await _doAnalyzeResult(resp.x, resp.y, resp.angle, resp.width, resp.height);
        break;

      case 'fail':
      case 'none':
      default:
        break;
    }

    return result;
  };

  const _doAnalyzeResult = async (x, y, angle, squareWidth, squareHeight) => {
    const blobImgSize = await new Promise(resolve => {
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

    const scaleRatioX = square_size * Constant.dpmm / squareWidth;
    const scaleRatioY = square_size * Constant.dpmm / squareHeight;
    const deviationX = x - blobImgSize.width / 2; // pixel

    const deviationY = y - blobImgSize.height / 2; // pixel

    const offsetX = -deviationX * scaleRatioX / Constant.dpmm + offsetX_ideal; //mm

    const offsetY = -deviationY * scaleRatioY / Constant.dpmm + offsetY_ideal; //mm

    if (0.8 > scaleRatioX / scaleRatio_ideal || scaleRatioX / scaleRatio_ideal > 1.2) {
      return false;
    }

    if (0.8 > scaleRatioY / scaleRatio_ideal || scaleRatioY / scaleRatio_ideal > 1.2) {
      return false;
    }

    if (Math.abs(deviationX) > 400 || Math.abs(deviationY) > 400) {
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

  const _doGetOffsetFromPicture = async function (imgBlobUrl, updateOffsetCb) {
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

    updateOffsetCb({
      currentOffset: sdata
    });
    return hadGotOffsetFromPicture;
  };

  const _doSetConfigTask = async (X, Y, R, SX, SY, borderless) => {
    const parameterName = borderless ? 'camera_offset_borderless' : 'camera_offset';
    const deviceInfo = await DeviceMaster.getDeviceInfo();
    const vc = VersionChecker(deviceInfo.version);

    if (vc.meetRequirement('BEAMBOX_CAMERA_CALIBRATION_XY_RATIO')) {
      await DeviceMaster.setDeviceSetting(parameterName, `Y:${Y} X:${X} R:${R} S:${(SX + SY) / 2} SX:${SX} SY:${SY}`);
    } else {
      await DeviceMaster.setDeviceSetting(parameterName, `Y:${Y} X:${X} R:${R} S:${(SX + SY) / 2}`);
    }
  };

  const StepBeforeAnalyzePicture = ({
    currentOffset,
    updateOffsetDataCb,
    updateImgBlobUrl,
    imgBlobUrl,
    gotoNextStep,
    onClose,
    showHint,
    updateShowHint,
    parent
  }) => {
    const imageScale = 200 / 280;
    const mmToImage = 10 * imageScale;
    let imgBackground = {
      background: `url(${imgBlobUrl})`
    };
    let squareStyle = {
      width: 25 * mmToImage / currentOffset.SX,
      //px
      height: 25 * mmToImage / currentOffset.SY //px

    };
    squareStyle.left = 100 - squareStyle.width / 2 - (currentOffset.X - Constant.camera.calibrationPicture.centerX + cameraPosition.x) * mmToImage / currentOffset.SX;
    squareStyle.top = 100 - squareStyle.height / 2 - (currentOffset.Y - Constant.camera.calibrationPicture.centerY + cameraPosition.y) * mmToImage / currentOffset.SY;
    squareStyle.transform = `rotate(${-currentOffset.R * 180 / Math.PI}deg)`;
    console.log('SquareStyle', squareStyle);
    let lastConfigSquareStyle = {
      width: 25 * mmToImage / parent.lastConfig.scaleRatioX,
      //px
      height: 25 * mmToImage / parent.lastConfig.scaleRatioY //px

    };
    lastConfigSquareStyle.left = 100 - lastConfigSquareStyle.width / 2 - (parent.lastConfig.x - Constant.camera.calibrationPicture.centerX + cameraPosition.x) * mmToImage / parent.lastConfig.scaleRatioX;
    lastConfigSquareStyle.top = 100 - lastConfigSquareStyle.height / 2 - (parent.lastConfig.y - Constant.camera.calibrationPicture.centerY + cameraPosition.y) * mmToImage / parent.lastConfig.scaleRatioY;
    lastConfigSquareStyle.transform = `rotate(${-parent.lastConfig.angle * 180 / Math.PI}deg)`;

    let handleValueChange = function (key, val) {
      console.log('Key', key, '=', val);
      currentOffset[key] = val;
      updateOffsetDataCb(currentOffset);
    };

    const hint_modal = showHint ? renderHintModal(updateShowHint) : null;
    const lastConfigSquare = parent.state.shouldShowLastConfig ? /*#__PURE__*/React.createElement("div", {
      className: "virtual-square last-config",
      style: lastConfigSquareStyle
    }) : null;
    let manual_calibration = /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "img-center",
      style: imgBackground
    }, /*#__PURE__*/React.createElement("div", {
      className: "virtual-square",
      style: squareStyle
    }), lastConfigSquare, /*#__PURE__*/React.createElement("div", {
      className: "camera-control up",
      onClick: () => moveAndRetakePicture('up', updateImgBlobUrl)
    }), /*#__PURE__*/React.createElement("div", {
      className: "camera-control down",
      onClick: () => moveAndRetakePicture('down', updateImgBlobUrl)
    }), /*#__PURE__*/React.createElement("div", {
      className: "camera-control left",
      onClick: () => moveAndRetakePicture('left', updateImgBlobUrl)
    }), /*#__PURE__*/React.createElement("div", {
      className: "camera-control right",
      onClick: () => moveAndRetakePicture('right', updateImgBlobUrl)
    })), /*#__PURE__*/React.createElement("div", {
      className: "hint-icon",
      onClick: () => updateShowHint(true)
    }, "?"), /*#__PURE__*/React.createElement("div", {
      className: "controls"
    }, /*#__PURE__*/React.createElement("div", {
      className: "control"
    }, /*#__PURE__*/React.createElement("label", null, LANG.dx), /*#__PURE__*/React.createElement(UnitInput, {
      type: 'number',
      min: -50,
      max: 50,
      unit: "mm",
      defaultValue: currentOffset.X - 15,
      getValue: val => handleValueChange('X', val + 15),
      decimal: 1,
      step: 0.5,
      isDoOnInput: true
    })), /*#__PURE__*/React.createElement("div", {
      className: "control"
    }, /*#__PURE__*/React.createElement("label", null, LANG.dy), /*#__PURE__*/React.createElement(UnitInput, {
      type: 'number',
      min: -50,
      max: 50,
      unit: "mm",
      defaultValue: currentOffset.Y - 30,
      getValue: val => handleValueChange('Y', val + 30),
      decimal: 1,
      step: 0.5,
      isDoOnInput: true
    })), /*#__PURE__*/React.createElement("div", {
      className: "control"
    }, /*#__PURE__*/React.createElement("label", null, LANG.rotation_angle), /*#__PURE__*/React.createElement(UnitInput, {
      type: 'number',
      min: -180,
      max: 180,
      unit: "deg",
      defaultValue: currentOffset.R * 180 / Math.PI,
      getValue: val => handleValueChange('R', val * Math.PI / 180),
      decimal: 1,
      step: 0.1,
      isDoOnInput: true
    })), /*#__PURE__*/React.createElement("div", {
      className: "control"
    }, /*#__PURE__*/React.createElement("label", null, LANG.x_ratio), /*#__PURE__*/React.createElement(UnitInput, {
      type: 'number',
      min: 10,
      max: 200,
      unit: "%",
      defaultValue: 100 * (3.25 - currentOffset.SX) / 1.625,
      getValue: val => handleValueChange('SX', (200 - val) * 1.625 / 100),
      decimal: 1,
      step: 0.5,
      isDoOnInput: true
    })), /*#__PURE__*/React.createElement("div", {
      className: "control"
    }, /*#__PURE__*/React.createElement("label", null, LANG.y_ratio), /*#__PURE__*/React.createElement(UnitInput, {
      type: 'number',
      min: 10,
      max: 200,
      unit: "%",
      defaultValue: 100 * (3.25 - currentOffset.SY) / 1.625,
      getValue: val => handleValueChange('SY', (200 - val) * 1.625 / 100),
      decimal: 1,
      step: 0.5,
      isDoOnInput: true
    })), /*#__PURE__*/React.createElement("button", {
      className: classNames('btn', 'btn-default', 'btn-last-config', {
        primary: !parent.state.shouldShowLastConfig
      }),
      onClick: () => {
        parent.toggleShowLastConfig();
      }
    }, parent.state.shouldShowLastConfig ? LANG.hide_last_config : LANG.show_last_config)), hint_modal);
    return /*#__PURE__*/React.createElement(AlertDialog, {
      caption: LANG.camera_calibration,
      message: manual_calibration,
      buttons: [{
        label: LANG.next,
        className: 'btn-default btn-alone-right-1',
        onClick: async () => {
          try {
            await PreviewModeController.end();
            await sendPictureThenSetConfig(currentOffset, imgBlobUrl, parent.props.borderless);
            gotoNextStep(STEP_FINISH);
          } catch (error) {
            console.log(error);
            Alert.popUp({
              id: 'menu-item',
              type: AlertConstants.SHOW_POPUP_ERROR,
              message: '#816 ' + error.toString().replace('Error: ', ''),
              callbacks: () => {
                gotoNextStep(STEP_REFOCUS);
              }
            });
          }
        }
      }, {
        label: LANG.back,
        className: 'btn-default btn-alone-right-2',
        onClick: () => gotoNextStep(STEP_BEFORE_CUT)
      }, {
        label: LANG.cancel,
        className: 'btn-default btn-alone-left',
        onClick: onClose
      }]
    });
  };

  const moveAndRetakePicture = async (dir, updateImgBlobUrl) => {
    try {
      ProgressActions.open(ProgressConstants.NONSTOP, LANG.taking_picture);
      let {
        x,
        y
      } = cameraPosition;

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
      cameraPosition = {
        x,
        y
      };
      updateImgBlobUrl(blobUrl);
    } catch (error) {
      throw error;
    } finally {
      ProgressActions.close();
    }
  };

  const renderHintModal = updateShowHint => {
    const virtual_square = $('.modal-camera-calibration .virtual-square');
    let position1 = virtual_square.offset();
    position1.top += virtual_square.height() + 5;
    const controls = $('.modal-camera-calibration .controls');
    let position2 = controls.offset();
    position2.left += 30;
    position2.top -= 45;
    return /*#__PURE__*/React.createElement("div", {
      className: "hint-modal-background",
      onClick: () => {
        updateShowHint(false);
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "hint-box",
      style: position1
    }, /*#__PURE__*/React.createElement("div", {
      className: "arrowup"
    }), /*#__PURE__*/React.createElement("div", {
      className: "hint-body"
    }, LANG.hint_red_square)), /*#__PURE__*/React.createElement("div", {
      className: "hint-box",
      style: position2
    }, /*#__PURE__*/React.createElement("div", {
      className: "hint-body"
    }, LANG.hint_adjust_parameters), /*#__PURE__*/React.createElement("div", {
      className: "arrowdown"
    })));
  };

  const StepFinish = ({
    parent,
    onClose
  }) => /*#__PURE__*/React.createElement(AlertDialog, {
    caption: LANG.camera_calibration,
    message: LANG.calibrate_done,
    buttons: [{
      label: LANG.finish,
      className: 'btn-default btn-alone-right',
      onClick: () => {
        BeamboxPreference.write('should_remind_calibrate_camera', false);
        svgCanvas.toggleBorderless(parent.props.borderless);
        onClose();
      }
    }]
  });

  return CameraCalibrationStateMachine;
});