/* eslint-disable react/no-multi-comp */
define([
    'jquery',
    'helpers/i18n',
    'app/actions/beambox/beambox-preference',
    'jsx!widgets/AlertDialog',
    'jsx!widgets/Unit-Input-v2',
    'helpers/device-master',
    'helpers/version-checker',
    'app/contexts/AlertCaller',
    'app/constants/alert-constants',
    'helpers/check-device-status',
    'app/contexts/ProgressCaller',
    'app/actions/beambox/preview-mode-controller',
    'helpers/api/camera-calibration',
    'app/actions/beambox/constant',
    'helpers/device-error-handler'
], function(
    $,
    i18n,
    BeamboxPreference,
    AlertDialog,
    UnitInput,
    DeviceMaster,
    VersionChecker,
    Alert,
    AlertConstants,
    CheckDeviceStatus,
    Progress,
    PreviewModeController,
    CameraCalibration,
    Constant,
    DeviceErrorHandler
) {
    const React = require('react');
    const classNames = require('classnames');
    const LANG = i18n.lang.diode_calibration;

    //View render the following steps
    const STEP_ALERT = Symbol();
    const STEP_CUT = Symbol();
    const STEP_ANALYZE = Symbol();
    const STEP_FINISH = Symbol();

    let cameraOffset = {};

    class DiodeCalibration extends React.Component {
        constructor(props) {
            super(props);

            this.imageScale = 0.5;
            this.state = {
                currentStep: STEP_ALERT,
                showHint: false,
                dx: 0,
                dy: 0,
                cameraMovedX: 0,
                cameraMovedY: 0,
                isCutButtonDisabled: false
            };
        }

        updateCurrentStep = (nextStep) => {
            this.setState({
                currentStep: nextStep
            });
        }

        onClose = async () => {
            this.props.onClose();
            await PreviewModeController.end();
            await DeviceMaster.setFan(this.origFanSpeed);
        }

        updateShowHint(show) {
            this.setState({showHint: show});
        }

        render() {
            const { currentStep } = this.state;
            let content;
            switch (currentStep) {
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
            }
            return (
                <div className='modal-diode-calibration'>
                    {content}
                </div>
            );
        }

        renderStepAlert() {
            const { model } = this.props;
            return (
                <AlertDialog
                    caption={LANG.diode_calibration}
                    message={LANG.please_do_camera_calibration_and_focus[model]}
                    buttons={
                        [{
                            label: LANG.next,
                            className: 'btn-default btn-alone-right primary',
                            onClick: () => this.updateCurrentStep(STEP_CUT)
                        },
                        {
                            label: LANG.cancel,
                            className: 'btn-default btn-alone-left',
                            onClick: () => this.onClose()
                        }]
                    }
                />
            );
        }
        // Cut and Take Picture
        renderStepCut() {
            const { model, device } = this.props;
            const { isCutButtonDisabled } = this.state;
            return (
                <AlertDialog
                    caption={LANG.diode_calibration}
                    message={LANG.please_place_paper[model]}
                    buttons={
                        [{
                            label: LANG.start_engrave,
                            className: classNames('btn-default btn-alone-right primary', {'disabled': isCutButtonDisabled}),
                            onClick: async ()=>{
                                if (isCutButtonDisabled) {
                                    return;
                                }
                                try {
                                    this.setState({isCutButtonDisabled: true});
                                    await CheckDeviceStatus(device);
                                    await this.doCuttingTask();
                                    await this.doCaptureTask();
                                    await this.cropAndRotateImg();
                                    this.updateCurrentStep(STEP_ANALYZE);
                                } catch (error) {
                                    this.setState({isCutButtonDisabled: false});
                                    console.log(error);
                                    Alert.popUp({
                                        id: 'menu-item',
                                        type: AlertConstants.SHOW_POPUP_ERROR,
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
                            className: 'btn-default btn-alone-left',
                            onClick: () => this.onClose()
                        }]
                    }
                />
            );
        }

        doCuttingTask = async () => {
            const { device } = this.props;
            await DeviceMaster.select(device);
            const laserPower = Number((await DeviceMaster.getLaserPower()).value);
            const fanSpeed = Number((await DeviceMaster.getFan()).value);
            this.origFanSpeed = fanSpeed;

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

            await DeviceMaster.doDiodeCalibrationCut();

            if (laserPower !== 1) {
                await DeviceMaster.setLaserPower(Number(laserPower));
            }

            if (!tempCmdAvailable) {
                await DeviceMaster.setFan(fanSpeed);
            }
        }

        doCaptureTask = async () => {
            const { device } = this.props;
            let blobUrl;
            try {
                await PreviewModeController.start(device, ()=>{console.log('camera fail. stop preview mode');});
                Progress.openNonstopProgress({
                    id: 'taking-picture',
                    message: LANG.taking_picture,
                    timeout: 30000,
                });
                cameraOffset = PreviewModeController.getCameraOffset();
                this.cameraOffset = cameraOffset;
                const movementX = Constant.camera.calibrationPicture.centerX + Constant.diode.defaultOffsetX - cameraOffset.x;
                const movementY = Constant.camera.calibrationPicture.centerY + Constant.diode.defaultOffsetY - cameraOffset.y;
                blobUrl = await PreviewModeController.takePictureAfterMoveTo(movementX, movementY);
            } catch (error) {
                throw error;
            } finally {
                Progress.popById('taking-picture');
            }
            this.imageUrl = blobUrl;
        }

        cropAndRotateImg = async () => {
            const img = new Image();
            
            await new Promise((resolve) => {
                img.onload = () => {
                    URL.revokeObjectURL(this.imageUrl);
                    resolve(img);
                };
                img.src = this.imageUrl;
            });

            const {
                angle,
                scaleRatioX,
                scaleRatioY
            } = this.cameraOffset;

            const cvs = document.createElement('canvas');
            const ctx = cvs.getContext('2d');

            const a = angle;
            const w = img.width;
            const h = img.height;

            const l = h * scaleRatioY / (Math.cos(a) + Math.sin(a));
            cvs.width = cvs.height = l;
            this.imageScale = 200 / l; // 200 width of image display div
            ctx.translate(l/2, l/2);
            ctx.rotate(a);
            ctx.scale(scaleRatioX, scaleRatioY);
            ctx.drawImage(img, -w/2, -h/2, w, h);

            return new Promise((resolve) => {
                cvs.toBlob((blob) => {
                    const newImageUrl = URL.createObjectURL(blob);
                    this.imageUrl = newImageUrl;
                    resolve(newImageUrl);
                });
            });
        }

        renderStepAnalyze() {
            const { dx, dy, cameraMovedX, cameraMovedY } = this.state; 

            let imgBackground = {
                background: `url(${this.imageUrl})`
            };
            const squareSize = Constant.camera.calibrationPicture.size * Constant.dpmm * this.imageScale;

            let squareStyle = {
                width: squareSize, //px
                height: squareSize //px
            };
    
            squareStyle.left = 100 - squareSize / 2 + (dx - cameraMovedX) * Constant.dpmm * this.imageScale;
            squareStyle.top = 100 - squareSize / 2 + (dy - cameraMovedY) * Constant.dpmm * this.imageScale;
            let manual_calibration = (
                <div>
                    <div className="img-center" style={imgBackground}>
                        <div className="virtual-square" style={squareStyle} />
                        <div className="camera-control up" onClick={() => this.moveAndRetakePicture('up')}/>
                        <div className="camera-control down" onClick={() => this.moveAndRetakePicture('down')}/>
                        <div className="camera-control left" onClick={() => this.moveAndRetakePicture('left')}/>
                        <div className="camera-control right" onClick={() => this.moveAndRetakePicture('right')}/>
                    </div>
                    <div className="hint-icon" onClick={()=>{this.setState({showHint: true})}}>
                        ?
                    </div>
                    <div className="controls">
                        <div className="control">
                            <label>{LANG.dx}</label>
                            <UnitInput
                                type={'number'}
                                min={-20}
                                max={20}
                                unit="mm"
                                defaultValue={dx}
                                getValue={(dx) => {this.setState({dx})}}
                                decimal={2}
                                step={0.5}
                                isDoOnInput={true}
                            />
                        </div>
                        <div className="control">
                            <label>{LANG.dy}</label>
                            <UnitInput
                                type={'number'}
                                min={-20}
                                max={20}
                                unit="mm"
                                defaultValue={dy}
                                getValue={(dy) => {this.setState({dy})}}
                                decimal={2}
                                step={0.5}
                                isDoOnInput={true}
                            />
                        </div>
                    </div>
                    {this.renderHintModal()}
                </div>
            );

            return (
                <AlertDialog
                    caption={LANG.diode_calibration}
                    message={manual_calibration}
                    buttons={
                        [{
                            label: LANG.next,
                            className: 'btn-default btn-alone-right primary',
                            onClick: () => {
                                const offsetX = Constant.diode.defaultOffsetX + dx;
                                const offsetY = Constant.diode.defaultOffsetY + dy;
                                console.log(offsetX, offsetY);
                                BeamboxPreference.write('diode_offset_x', offsetX);
                                BeamboxPreference.write('diode_offset_y', offsetY);
                                this.updateCurrentStep(STEP_FINISH);
                            }
                        },
                        {
                            label: LANG.cancel,
                            className: 'btn-default btn-alone-left',
                            onClick: () => this.onClose()
                        }]
                    }
                />
            );
        }

        renderHintModal = () => {
            if (!this.state.showHint) {
                return null;
            }
            const virtual_square = $('.modal-diode-calibration .virtual-square');
            let position1 = virtual_square.offset();
            position1.top += virtual_square.height() + 5;
            const controls = $('.modal-diode-calibration .controls');
            let position2 = controls.offset();
            position2.left += 30;
            position2.top -= 45;
            return (
                <div className="hint-modal-background" onClick={()=>{this.setState({showHint: false})}}>
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

        moveAndRetakePicture = async (dir) => {
            try {
                Progress.openNonstopProgress({
                    id: 'taking-picture',
                    message: LANG.taking_picture,
                    timeout: 30000,
                });
                let {cameraMovedX, cameraMovedY} = this.state;
                switch(dir) {
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
                }
                const movementX = Constant.camera.calibrationPicture.centerX + Constant.diode.defaultOffsetX - this.cameraOffset.x + cameraMovedX;
                const movementY = Constant.camera.calibrationPicture.centerY + Constant.diode.defaultOffsetY - this.cameraOffset.y + cameraMovedY;
                let blobUrl = await PreviewModeController.takePictureAfterMoveTo(movementX, movementY);
                console.log(movementX, movementY);
                this.imageUrl = blobUrl;
                await this.cropAndRotateImg();
                this.setState({cameraMovedX, cameraMovedY});
            } catch (error) {
                throw error;
            } finally {
                Progress.popById('taking-picture');
            }
        }

        renderStepFinish() {
            return (
                <AlertDialog
                    caption={LANG.diode_calibration}
                    message={LANG.calibrate_done}
                    buttons={
                        [{
                            label: LANG.finish,
                            className: 'btn-default btn-alone-right primary',
                            onClick: () => this.onClose()
                        }]
                    }
                />
            );
        }
    };

    return DiodeCalibration;
});
