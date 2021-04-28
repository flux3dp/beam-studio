import PreviewModeBackgroundDrawer from './preview-mode-background-drawer';
import DeviceMaster from 'helpers/device-master';
import Alert from '../alert-caller';
import AlertConfig from 'helpers/api/alert-config';
import Progress from '../progress-caller';
import AlertConstants from '../../constants/alert-constants';
import ErrorConstants from '../../constants/error-constants';
import sprintf from 'helpers/sprintf';
import VersionChecker from 'helpers/version-checker';
import * as i18n from 'helpers/i18n';
import Constant from './constant';
import BeamboxPreference from './beambox-preference';
import BeamboxActions from '../beambox';

const LANG = i18n.lang;

class PreviewModeController {
    isDrawing: boolean;
    originalSpeed: number;
    storedDevice: any;
    isPreviewModeOn: boolean;
    isPreviewBlocked: boolean;
    isLineCheckEnabled: boolean;
    cameraOffset: any;
    lastPosition: number[];
    errorCallback: () => void;
    constructor() {
        this.isDrawing = false;
        this.originalSpeed = 1;
        this.storedDevice = null;
        this.isPreviewModeOn = false;
        this.isPreviewBlocked = false;
        this.isLineCheckEnabled = true;
        this.cameraOffset = null;
        this.lastPosition = [0, 0]; // in mm
        this.errorCallback = function(){};
    }

    //main functions

    async start(selectedDeivce, errCallback) {
        await this.reset();

        const res = await DeviceMaster.select(selectedDeivce);
        if (!res.success) {
            return;
        }

        try {
            Progress.openNonstopProgress({
                id: 'start-preview-mode',
                message: sprintf(LANG.message.connectingMachine, selectedDeivce.name),
                timeout: 30000,
            });
            await this.retrieveCameraOffset();

            Progress.update('start-preview-mode', { message: LANG.message.gettingLaserSpeed });
            const laserSpeed = await DeviceMaster.getLaserSpeed();

            if (Number(laserSpeed.value) !== 1) {
                this.originalSpeed = Number(laserSpeed.value);
                Progress.update('start-preview-mode', { message: LANG.message.settingLaserSpeed });
                await DeviceMaster.setLaserSpeed(1);
            }
            Progress.update('start-preview-mode', { message: LANG.message.enteringRawMode });
            await DeviceMaster.enterRawMode();
            Progress.update('start-preview-mode', { message: LANG.message.exitingRotaryMode });
            await DeviceMaster.rawSetRotary(false);
            Progress.update('start-preview-mode', { message: LANG.message.homing });
            await DeviceMaster.rawHome();
            const vc = VersionChecker(selectedDeivce.version);
            if (vc.meetRequirement('MAINTAIN_WITH_LINECHECK')) {
                await DeviceMaster.rawStartLineCheckMode();
                this.isLineCheckEnabled = true;
            } else {
                this.isLineCheckEnabled = false;
            }
            Progress.update('start-preview-mode', { message: LANG.message.turningOffFan });
            await DeviceMaster.rawSetFan(false);
            Progress.update('start-preview-mode', { message: LANG.message.turningOffAirPump });
            await DeviceMaster.rawSetAirPump(false);
            Progress.update('start-preview-mode', { message: LANG.message.connectingCamera });
            await DeviceMaster.rawSetWaterPump(false);
            await DeviceMaster.connectCamera();
            PreviewModeBackgroundDrawer.start(this.cameraOffset);
            PreviewModeBackgroundDrawer.drawBoundary();


            this.storedDevice = selectedDeivce;
            DeviceMaster.setDeviceControlReconnectOnClose(selectedDeivce);
            this.errorCallback = errCallback;
            this.isPreviewModeOn = true;
        } catch (error) {
            if (this.originalSpeed !== 1) {
                DeviceMaster.setLaserSpeed(this.originalSpeed);
                this.originalSpeed = 1;
            }
            if (this.isLineCheckEnabled) {
                DeviceMaster.rawEndLineCheckMode();
            }
            DeviceMaster.endRawMode();
            DeviceMaster.kick();
            throw error;
        } finally {
            Progress.popById('start-preview-mode');
        }
    }

    async end() {
        console.log('end of pmc');
        this.isPreviewModeOn = false;
        PreviewModeBackgroundDrawer.clearBoundary();
        PreviewModeBackgroundDrawer.end();
        const storedDevice = this.storedDevice;
        await this.reset();
        if (storedDevice) {
            DeviceMaster.setDeviceControlDefaultCloseListener(storedDevice);
            const res = await DeviceMaster.select(storedDevice);
            if (res.success) {
                if (DeviceMaster.currentControlMode !== 'raw') {
                    await DeviceMaster.enterRawMode();
                }
                if (this.isLineCheckEnabled) {
                    await DeviceMaster.rawEndLineCheckMode();
                }
                await DeviceMaster.rawLooseMotor();
                await DeviceMaster.endRawMode();
                if (this.originalSpeed !== 1) {
                    await DeviceMaster.setLaserSpeed(this.originalSpeed);
                    this.originalSpeed = 1;
                }
                DeviceMaster.kick();
            }
        }
    }

    async preview(x, y, last = false, callback = () => {}) {
        if (this.isPreviewBlocked) {
            return;
        }
        this.isDrawing = true;
        this.isPreviewBlocked = true;

        $('#workarea').css('cursor', 'wait');
        try {
            const constrainedXY = this.constrainPreviewXY(x, y);
            x = constrainedXY.x;
            y = constrainedXY.y;
            const imgUrl = await this.getPhotoAfterMove(x, y);
            const p = PreviewModeBackgroundDrawer.draw(imgUrl, x, y, last, callback);

            $('#workarea').css('cursor', 'url(img/camera-cursor.svg), cell');
                            this.isPreviewBlocked = false;
            if (last) {
                this.isDrawing = false;
            }
            return true;
        } catch (error) {
            if (this.isPreviewModeOn) {
                console.log(error);
                Alert.popUp({
                    type: AlertConstants.SHOW_POPUP_ERROR,
                    message: error.message || error.text,
                });
            }
            $('#workarea').css('cursor', 'auto');
            if (!PreviewModeBackgroundDrawer.isClean()) {
                BeamboxActions.endDrawingPreviewBlob();
                this.isDrawing = false;
            }
            this.end();
            callback();
        }
    }

    async previewRegion(x1, y1, x2, y2, callback = () => {}) {
        const points = (() => {
            const size = (() => {
                const h = Constant.camera.imgHeight;
                const a = this._getCameraOffset().angle;
                const s = this._getCameraOffset().scaleRatioY;
                const c = h / (Math.cos(a) + Math.sin(a));
                // overlap a little bit to fix empty area between pictures
                // (some machine will have it, maybe due to cameraOffset.angle).
                // it seems like something wrong handling image rotation.
                return c * s;
            })()

            const {left, right, top, bottom} = (() => {
                const l = Math.min(x1, x2) + size/2;
                const r = Math.max(x1, x2) - size/2;
                const t = Math.min(y1, y2) + size/2;
                const b = Math.max(y1, y2) - size/2;

                return {
                    left: this.constrainPreviewXY(l, 0).x,
                    right: this.constrainPreviewXY(r, 0).x,
                    top: this.constrainPreviewXY(0, t).y,
                    bottom: this.constrainPreviewXY(0, b).y
                };
            })();

            let pointsArray = [];
            let shouldRowReverse = false; // let camera 走Ｓ字型
            const step = 0.95 * size;
            for(let curY = top; curY < (bottom + size); curY += step) {

                const row = [];
                for(let curX = left; curX < (right + size); curX += step) {
                    row.push([curX, curY]);
                }

                if(shouldRowReverse) {
                    row.reverse();
                }
                pointsArray = pointsArray.concat(row);
                shouldRowReverse = !shouldRowReverse;
            }
            return pointsArray;
        })();

        for(let i=0; i<points.length; i++) {
            const result = await this.preview(points[i][0], points[i][1], (i === points.length - 1));

            if (!result) {
                BeamboxActions.endDrawingPreviewBlob();
                this.isDrawing = false;
                return
            }
        }
        callback();
    }

    // x, y in mm
    takePictureAfterMoveTo(movementX, movementY) {
        return this.getPhotoAfterMoveTo(movementX, movementY);
    }

    isPreviewMode() {
        return this.isPreviewModeOn;
    }

    getCameraOffset() {
        return this.cameraOffset;
    }

    //helper functions

    async retrieveCameraOffset() {
        // End linecheck mode if needed
        try {
            if (this.isLineCheckEnabled) {
                Progress.update('start-preview-mode', { message: LANG.message.endingLineCheckMode });
                await DeviceMaster.rawEndLineCheckMode();
            }
        } catch (error) {
            if (error.message === ErrorConstants.CONTROL_SOCKET_MODE_ERROR) {
                // Device control is not in raw mode
            } else if ( (error.status === 'error') && (error.error && error.error[0] === 'L_UNKNOWN_COMMAND') ) {
                // Ghost control socket is not in raw mode, unknown command M172
            } else {
                console.log('Unable to end line check mode', error);
            }
        }
        // cannot getDeviceSetting during RawMode. So we force to end it.
        try {
            Progress.update('start-preview-mode', { message: LANG.message.endingRawMode });
            await DeviceMaster.endRawMode();
        } catch (error) {
            if (error.status === 'error' && (error.error && error.error[0] === 'OPERATION_ERROR')) {
                // do nothing.
                console.log('Not in raw mode right now');
            } else if (error.status === 'error' && error.error === 'TIMEOUT') {
                console.log('Timeout has occur when end raw mode, reconnecting');
                await DeviceMaster.reconnect();
            } else {
                console.log(error);
            }
        }
        const borderless = BeamboxPreference.read('borderless') || false;
        const supportOpenBottom = Constant.addonsSupportList.openBottom.includes(BeamboxPreference.read('workarea'));
        const configName = (supportOpenBottom && borderless) ? 'camera_offset_borderless' : 'camera_offset';

        Progress.update('start-preview-mode', { message: LANG.message.retrievingCameraOffset });
        const resp = await DeviceMaster.getDeviceSetting(configName);
        console.log(`Reading ${configName}\nResp = ${resp.value}`);
        resp.value = ` ${resp.value}`;
        this.cameraOffset = {
            x:          Number(/ X:\s?(\-?\d+\.?\d+)/.exec(resp.value)[1]),
            y:          Number(/ Y:\s?(\-?\d+\.?\d+)/.exec(resp.value)[1]),
            angle:      Number(/R:\s?(\-?\d+\.?\d+)/.exec(resp.value)[1]),
            scaleRatioX: Number((/SX:\s?(\-?\d+\.?\d+)/.exec(resp.value) || /S:\s?(\-?\d+\.?\d+)/.exec(resp.value))[1]),
            scaleRatioY: Number((/SY:\s?(\-?\d+\.?\d+)/.exec(resp.value) || /S:\s?(\-?\d+\.?\d+)/.exec(resp.value))[1]),
        };
        if ((this.cameraOffset.x === 0) && (this.cameraOffset.y === 0)) {
            this.cameraOffset = {
                x: Constant.camera.offsetX_ideal,
                y: Constant.camera.offsetY_ideal,
                angle: 0,
                scaleRatioX: Constant.camera.scaleRatio_ideal,
                scaleRatioY: Constant.camera.scaleRatio_ideal,
            };
        }
        console.log(`Got ${configName}`, this.cameraOffset);
    }

    _getCameraOffset() {
        return this.cameraOffset;
    }

    async reset() {
        this.storedDevice = null;
        this.isPreviewModeOn = false;
        this.isPreviewBlocked = false;
        this.cameraOffset = null;
        this.lastPosition = [0, 0];
        DeviceMaster.disconnectCamera();
    }

    constrainPreviewXY(x, y) {
        const isDiodeEnabled = BeamboxPreference.read('enable-diode') && Constant.addonsSupportList.hybridLaser.includes(BeamboxPreference.read('workarea'));
        const isBorderlessEnabled = BeamboxPreference.read('borderless');
        let maxWidth = Constant.dimension.getWidth(BeamboxPreference.read('model'));
        let maxHeight = Constant.dimension.getHeight(BeamboxPreference.read('model'));
        if (isDiodeEnabled) {
            maxWidth -= Constant.diode.safeDistance.X * Constant.dpmm;
            maxHeight -= Constant.diode.safeDistance.Y * Constant.dpmm;
        } else if (isBorderlessEnabled) {
            maxWidth -= Constant.borderless.safeDistance.X * Constant.dpmm;
        }

        x = Math.max(x, this._getCameraOffset().x * Constant.dpmm);
        x = Math.min(x, maxWidth);
        y = Math.max(y, this._getCameraOffset().y * Constant.dpmm);
        y = Math.min(y, maxHeight);
        return {
            x: x,
            y: y
        };
    }

    //x, y in pixel
    getPhotoAfterMove(x, y) {
        const movementX = x / Constant.dpmm - this._getCameraOffset().x;
        const movementY = y / Constant.dpmm - this._getCameraOffset().y;

        return this.getPhotoAfterMoveTo(movementX, movementY);
    }

    //movementX, movementY in mm
    async getPhotoAfterMoveTo(movementX, movementY) {
        let feedrate = Math.min(Constant.camera.movementSpeed.x, Constant.camera.movementSpeed.y);
        const movement = {
            f: feedrate,
            x: movementX, // mm
            y: movementY  // mm
        };
        if (BeamboxPreference.read('enable-diode') && Constant.addonsSupportList.hybridLaser.includes(BeamboxPreference.read('workarea'))) {
            if (BeamboxPreference.read('preview_movement_speed_hl')) {
                feedrate = BeamboxPreference.read('preview_movement_speed_hl');
            } else {
                feedrate *= 0.6;
            }
        } else {
            if (BeamboxPreference.read('preview_movement_speed')) {
                feedrate = BeamboxPreference.read('preview_movement_speed');
            }
        }
        movement.f = feedrate// firmware will used limited x, y speed still

        const selectRes = await DeviceMaster.select(this.storedDevice);
        if (!selectRes.success) {
            return;
        }
        const moveRes = await DeviceMaster.rawMove(movement);
        if (moveRes) {
            console.log('Preview raw move respond: ', moveRes.text);
        }
        await this.waitUntilEstimatedMovementTime(movementX, movementY);

        const imgUrl = await this.getPhotoFromMachine();

        return imgUrl;
    }

    //movementX, movementY in mm
    async waitUntilEstimatedMovementTime(movementX, movementY) {
        let feedrate = Math.min(Constant.camera.movementSpeed.x, Constant.camera.movementSpeed.y);

        if (BeamboxPreference.read('enable-diode') && Constant.addonsSupportList.hybridLaser.includes(BeamboxPreference.read('workarea'))) {
            if (BeamboxPreference.read('preview_movement_speed_hl')) {
                feedrate = BeamboxPreference.read('preview_movement_speed_hl');
            } else {
                feedrate *= 0.6;
            }
        } else {
            if (BeamboxPreference.read('preview_movement_speed')) {
                feedrate = BeamboxPreference.read('preview_movement_speed');
            }
        }

        let timeToWait = (Math.hypot(this.lastPosition[0] - movementX, this.lastPosition[1] - movementY) / feedrate) * 60000; // min => ms
        // wait for moving camera to take a stable picture, this value need to be optimized
        timeToWait *= 1.2;
        timeToWait += 100;
        this.lastPosition = [movementX, movementY];
        await new Promise((resolve, reject) => { setTimeout(() => resolve(null), timeToWait)});
    }

    //just for getPhotoAfterMoveTo()
    async getPhotoFromMachine() {
        const { imgBlob, needCameraCableAlert } = await DeviceMaster.takeOnePicture();
        if (!imgBlob) {
            throw new Error(LANG.message.camera.ws_closed_unexpectly);
        } else if (needCameraCableAlert && !AlertConfig.read('skip_camera_cable_alert')) {
            const shouldContinue = await new Promise<boolean>((resolve) => {
                Alert.popUp({
                    id: 'camera_cable_alert',
                    message: LANG.message.camera.camera_cable_unstable,
                    type: AlertConstants.SHOW_POPUP_WARNING,
                    checkbox: {
                        text: LANG.beambox.popup.dont_show_again,
                        callbacks: () => AlertConfig.write('skip_camera_cable_alert', true),
                    },
                    buttonLabels: [LANG.message.camera.abort_preview, LANG.message.camera.continue_preview],
                    callbacks: [
                        () => resolve(false),
                        () => resolve(true),
                    ],
                    primaryButtonIndex: 1,
                });
            });
            if (!shouldContinue) {
                this.end();
                return;
            }
        }
        const imgUrl = URL.createObjectURL(imgBlob);
        return imgUrl;
    }
}

const instance = new PreviewModeController();

export default instance;
