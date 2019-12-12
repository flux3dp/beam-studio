/* eslint-disable react/no-multi-comp */
define([
    'jquery',
    'react',
    'reactPropTypes',
    'helpers/i18n',
    'app/actions/beambox/beambox-preference',
    'jsx!widgets/Modal',
    'jsx!widgets/Alert',
    'jsx!widgets/Unit-Input-v2',
    'helpers/device-master',
    'helpers/version-checker',
    'app/constants/device-constants',
    'app/actions/alert-actions',
    'helpers/check-device-status',
    'app/actions/progress-actions',
    'app/constants/progress-constants',
    'app/actions/beambox/preview-mode-controller',
    'helpers/api/camera-calibration',
    'helpers/sprintf',
    'app/actions/beambox/constant',
    'helpers/device-error-handler'
], function(
    $,
    React,
    PropTypes,
    i18n,
    BeamboxPreference,
    Modal,
    Alert,
    UnitInput,
    DeviceMaster,
    VersionChecker,
    DeviceConstants,
    AlertActions,
    CheckDeviceStatus,
    ProgressActions,
    ProgressConstants,
    PreviewModeController,
    CameraCalibration,
    sprintf,
    Constant,
    DeviceErrorHandler
) {
    const LANG = i18n.lang.camera_calibration;

    const cameraCalibrationWebSocket = CameraCalibration();

    //View render the following steps
    const STEP_REFOCUS = Symbol();
    const STEP_BEFORE_CUT = Symbol();
    const STEP_BEFORE_ANALYZE_PICTURE = Symbol();
    const STEP_FINISH = Symbol();

    let cameraOffset = {};

    class CameraCalibrationStateMachine extends React.Component {
        constructor(props) {
            super(props);

            this.state = {
                currentStep: STEP_REFOCUS,
                currentOffset: {X: 15, Y: 30, R: 0, SX: 1.625, SY: 1.625},
                imgBlobUrl: '',
                showHint: false
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
            DeviceMaster.setFan(this.origFanSpeed);
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
            this.setState({showHint: show});
        }

        render() {
            const stepsMap = {
                [STEP_REFOCUS]:
                    <StepRefocus
                        gotoNextStep={this.updateCurrentStep}
                        onClose={this.onClose}
                        model={this.props.model}
                    />,
                [STEP_BEFORE_CUT]:
                    <StepBeforeCut
                        gotoNextStep={this.updateCurrentStep}
                        onClose={this.onClose}
                        device={this.props.device}
                        updateImgBlobUrl={this.updateImgBlobUrl}
                        model={this.props.model}
                        updateOffsetDataCb={this.updateOffsetData.bind(this)}
                        self={this}
                    />,
                [STEP_BEFORE_ANALYZE_PICTURE]:
                    <StepBeforeAnalyzePicture
                        currentOffset={this.state.currentOffset}
                        gotoNextStep={this.updateCurrentStep}
                        onClose={this.onClose}
                        imgBlobUrl={this.state.imgBlobUrl}
                        updateOffsetDataCb={this.updateOffsetData.bind(this)}
                        showHint={this.state.showHint}
                        updateShowHint={this.updateShowHint.bind(this)}
                        self={this}

                    />,
                [STEP_FINISH]:
                    <StepFinish
                        onClose={this.onClose}
                    />
            };

            const currentStep = this.state.currentStep;
            const currentStepComponent = stepsMap[currentStep];
            return (
                <div className='always-top' ref='modal'>
                    <Modal className={{'modal-camera-calibration': true}} content={currentStepComponent} disabledEscapeOnBackground={false}/>
                </div>
            );
        }
    };

    const StepRefocus = ({gotoNextStep, onClose, model}) => (
        <Alert
            caption={LANG.camera_calibration}
            message={LANG.please_refocus[model]}
            buttons={
                [{
                    label: LANG.next,
                    className: 'btn-default btn-alone-right',
                    onClick: () => gotoNextStep(STEP_BEFORE_CUT)
                },
                {
                    label: LANG.cancel,
                    className: 'btn-default btn-alone-left',
                    onClick: onClose
                }]
            }
        />
    );

    const StepBeforeCut = ({device, updateImgBlobUrl, gotoNextStep, onClose, model, updateOffsetDataCb, self}) => {
        const cutThenCapture = async function(updateOffsetDataCb, self) {
            await _doCuttingTask(self);
            let blobUrl = await _doCaptureTask();
            await _doGetOffsetFromPicture(blobUrl, updateOffsetDataCb);
        };
        const _doCuttingTask = async function(self) {
            await DeviceMaster.select(device);
            const laserPower = Number((await DeviceMaster.getLaserPower()).value);
            const fanSpeed = Number((await DeviceMaster.getFan()).value);
            self.origFanSpeed = fanSpeed;

            if (fanSpeed > 100) {
                await DeviceMaster.setFan(100); // 10%
            }

            if (laserPower !== 1) {
                await DeviceMaster.setLaserPower(1);
            }

            await DeviceMaster.runBeamboxCameraTest();

            if (laserPower !== 1) {
                await DeviceMaster.setLaserPower(Number(laserPower));
            }
            await DeviceMaster.setFan(fanSpeed);
        };
        const _doCaptureTask = async () => {
            let blobUrl;
            try {
                await PreviewModeController.start(device, ()=>{console.log('camera fail. stop preview mode');});

                ProgressActions.open(ProgressConstants.NONSTOP, LANG.taking_picture);
                const movementX = Constant.camera.calibrationPicture.centerX - Constant.camera.offsetX_ideal;
                const movementY = Constant.camera.calibrationPicture.centerY - Constant.camera.offsetY_ideal;
                blobUrl = await PreviewModeController.takePictureAfterMoveTo(movementX, movementY);
                cameraOffset = PreviewModeController.getCameraOffset();
                updateImgBlobUrl(blobUrl);
            } catch (error) {
                throw error;
            } finally {
                ProgressActions.close();
                PreviewModeController.end();
            }
            return blobUrl;
        };
        return (
            <Alert
                caption={LANG.camera_calibration}
                message={LANG.please_place_paper[model]}
                buttons={
                    [{
                        label: LANG.start_engrave,
                        className: 'btn-default btn-alone-right',
                        onClick: async ()=>{
                            try {
                                await CheckDeviceStatus(device);
                                await cutThenCapture(updateOffsetDataCb, self);
                                gotoNextStep(STEP_BEFORE_ANALYZE_PICTURE);
                            } catch (error) {
                                console.log(error);
                                ProgressActions.close();
                                AlertActions.showPopupRetry('menu-item', error.message || DeviceErrorHandler.translate(error) || 'Fail to cut and capture');
                            }
                        }
                    },
                    {
                        label: LANG.cancel,
                        className: 'btn-default btn-alone-left',
                        onClick: onClose
                    }]
                }
            />
        );
    };

    const sendPictureThenSetConfig = async (result, imgBlobUrl, borderless) => {
        console.log("Setting camera_offset", borderless ? 'borderless' : '', result);
        if (result) {
            await _doSetConfigTask(result.X, result.Y, result.R, result.SX, result.SY, borderless);
        } else {
            throw new Error(LANG.analyze_result_fail);
        }
    };

    const _doSendPictureTask = async (url) => {
        const d = $.Deferred();
        if (url) { imgBlobUrl = url; }
        fetch(imgBlobUrl)
            .then(res => res.blob())
            .then((blob) => {
                var fileReader = new FileReader();
                fileReader.onloadend = (e) => {
                    cameraCalibrationWebSocket.upload(e.target.result)
                        .done((resp)=>{
                            d.resolve(resp);
                        })
                        .fail((resp)=>{
                            d.reject(resp.toString());
                        });
                };
                fileReader.readAsArrayBuffer(blob);
            })
            .catch((err) => {
                d.reject(err);
            });

        let resp = await d.promise();

        let result = null;;
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
                    width:img.width,
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
        const deviationX = x - blobImgSize.width/2; // pixel
        const deviationY = y - blobImgSize.height/2; // pixel

        const offsetX = -deviationX * scaleRatioX / Constant.dpmm + offsetX_ideal; //mm
        const offsetY = -deviationY * scaleRatioY / Constant.dpmm + offsetY_ideal; //mm

        if ((0.8 > scaleRatioX/scaleRatio_ideal) || (scaleRatioX/scaleRatio_ideal > 1.2)) {
            return false;
        }
        if ((0.8 > scaleRatioY/scaleRatio_ideal) || (scaleRatioY/scaleRatio_ideal > 1.2)) {
            return false;
        }
        if ((Math.abs(deviationX) > 400) || (Math.abs(deviationY) > 400)) {
            return false;
        }
        if (Math.abs(angle) > 10*Math.PI/180) {
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

    const _doGetOffsetFromPicture = async function(imgBlobUrl, updateOffsetCb) {
        let sdata = await _doSendPictureTask(imgBlobUrl);
        if (!sdata) {
            sdata = {
                X: 20,
                Y: 30,
                R: 0,
                SX: 1.625,
                SY: 1.625
            };
        }
        updateOffsetCb({currentOffset: sdata});
    };

    const _doSetConfigTask = async (X, Y, R, SX, SY, borderless) => {
        const parameterName = borderless ? 'camera_offset_borderless' : 'camera_offset';
        const deviceInfo = await DeviceMaster.getDeviceInfo();
        const vc = VersionChecker(deviceInfo.version);
        if(vc.meetRequirement('BEAMBOX_CAMERA_CALIBRATION_XY_RATIO')) {
            await DeviceMaster.setDeviceSetting(parameterName, `Y:${Y} X:${X} R:${R} S:${(SX+SY)/2} SX:${SX} SY:${SY}`);
        } else {
            await DeviceMaster.setDeviceSetting(parameterName, `Y:${Y} X:${X} R:${R} S:${(SX+SY)/2}`);
        }
    };

    const StepBeforeAnalyzePicture = ({currentOffset, updateOffsetDataCb, imgBlobUrl, gotoNextStep, onClose, showHint, updateShowHint, self}) => {
        const imageScale = 200 / 280;
        const mmToImage = 10 * imageScale;
        let imgBackground = {
            background: `url(${imgBlobUrl})`
        };
        let squareStyle = {
            width: 25 * mmToImage / currentOffset.SX, //px
            height: 25 * mmToImage / currentOffset.SY //px
        };

        squareStyle.left = 100 - squareStyle.width / 2 - (currentOffset.X - Constant.camera.offsetX_ideal) * mmToImage / currentOffset.SX;
        squareStyle.top = 100 - squareStyle.height / 2 - (currentOffset.Y - Constant.camera.offsetY_ideal) * mmToImage / currentOffset.SY;
        squareStyle.transform = `rotate(${-currentOffset.R * 180 / Math.PI}deg)`;
        console.log('SquareStyle', squareStyle);

        let handleValueChange = function (key, val) {
            console.log('Key', key , '=', val);
            currentOffset[key] = val;
            updateOffsetDataCb(currentOffset);
        };

        let hint_modal = showHint ? renderHintModal(updateShowHint) : null;
        let manual_calibration = (
            <div>
                <div className="img-center" style={imgBackground}>
                    <div className="virtual-square" style={squareStyle} />
                </div>
                <div className="hint-icon" onClick={()=>{updateShowHint(true)}}>
                    ?
                </div>
                <div className="controls">
                    <div className="control">
                        <label>{LANG.dx}</label>
                        <UnitInput
                            type={'number'}
                            min={-50}
                            max={50}
                            unit="mm"
                            defaultValue={currentOffset.X - 15}
                            getValue={(val) => handleValueChange('X', val + 15)}
                            decimal={1}
                            step={0.5}
                            isDoOnInput={true}
                        />
                    </div>

                    <div className="control">
                        <label>{LANG.dy}</label>
                        <UnitInput
                            type={'number'}
                            min={-50}
                            max={50}
                            unit="mm"
                            defaultValue={currentOffset.Y - 30}
                            getValue={(val) => handleValueChange('Y', val + 30)}
                            decimal={1}
                            step={0.5}
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
                        className: 'btn-default btn-alone-right-1',
                        onClick: async () => {
                            try {
                                await sendPictureThenSetConfig(currentOffset, imgBlobUrl, self.props.borderless);
                                gotoNextStep(STEP_FINISH);
                            } catch (error) {
                                console.log(error);
                                AlertActions.showPopupRetry('menu-item', error.toString().replace('Error: ', ''));
                                gotoNextStep(STEP_REFOCUS);
                            }
                        }
                    },
                    {
                        label: LANG.back,
                        className: 'btn-default btn-alone-right-2',
                        onClick: () => gotoNextStep(STEP_BEFORE_CUT)
                    },
                    {
                        label: LANG.cancel,
                        className: 'btn-default btn-alone-left',
                        onClick: onClose
                    }]
                }
            />
        );
    };

    const renderHintModal = (updateShowHint) => {
        const virtual_square = $('.modal-camera-calibration .virtual-square');
        let position1 = virtual_square.offset();
        position1.top += virtual_square.height() + 5;
        const controls = $('.modal-camera-calibration .controls');
        let position2 = controls.offset();
        position2.left += 30;
        position2.top -= 45;
        return (
            <div className="hint-modal-background" onClick={()=>{updateShowHint(false)}}>
                <div className="hint-box"  style={position1}>
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

    const StepFinish = ({onClose}) => (
        <Alert
            caption={LANG.camera_calibration}
            message={LANG.calibrate_done}
            buttons={
                [{
                    label: LANG.finish,
                    className: 'btn-default btn-alone-right',
                    onClick: () => {
                        BeamboxPreference.write('should_remind_calibrate_camera', false);
                        svgCanvas.toggleBorderless(true);
                        onClose();
                    }
                }]
            }
        />
    );

    return CameraCalibrationStateMachine;
});
