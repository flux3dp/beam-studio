// @ts-expect-error
import Rx = require('Rx');
import PreviewModeBackgroundDrawer from './preview-mode-background-drawer';
import DeviceMaster from '../../../helpers/device-master';
import Alert from '../../contexts/AlertCaller';
import AlertConstants from '../../constants/alert-constants';
import Progress from '../../contexts/ProgressCaller';
import sprintf from '../../../helpers/sprintf';
import * as i18n from '../../../helpers/i18n';
import Constant from './constant';
import BeamboxPreference from './beambox-preference';
import BeamboxActions from '../beambox';

class PreviewModeController {
    isDrawing: boolean;
    originalSpeed: number;
    storedPrinter: any;
    isPreviewModeOn: boolean;
    isPreviewBlocked: boolean;
    cameraOffset: any;
    lastPosition: number[];
    errorCallback: () => void;
    constructor() {
        this.isDrawing = false;
        this.originalSpeed = 1;
        this.storedPrinter = null;
        this.isPreviewModeOn = false;
        this.isPreviewBlocked = false;
        this.cameraOffset = null;
        this.lastPosition = [0, 0]; // in mm
        this.errorCallback = function(){};
    }

    //main functions

    async start(selectedPrinter, errCallback) {
        await this._reset();

        const res = await DeviceMaster.select(selectedPrinter);
        if (!res.success) {
            return;
        }

        try {
            Progress.openNonstopProgress({
                id: 'start-preview-mode',
                message: sprintf(i18n.lang.message.connectingMachine, selectedPrinter.name),
                timeout: 30000,
            });
            await this._retrieveCameraOffset();
            const laserSpeed = await DeviceMaster.getLaserSpeed();

            if (Number(laserSpeed.value) !== 1) {
                this.originalSpeed = Number(laserSpeed.value);
                await DeviceMaster.setLaserSpeed(1);
            }
            let res = await DeviceMaster.enterRawMode();
            res = await DeviceMaster.rawSetRotary(false); // Disable Rotary
            res = await DeviceMaster.rawHome();
            await DeviceMaster.connectCamera(selectedPrinter);
            PreviewModeBackgroundDrawer.start(this.cameraOffset);
            PreviewModeBackgroundDrawer.drawBoundary();

            this.storedPrinter = selectedPrinter;
            this.errorCallback = errCallback;
            this.isPreviewModeOn = true;
        } catch (error) {
            if (this.originalSpeed !== 1) {
                DeviceMaster.setLaserSpeed(this.originalSpeed);
                this.originalSpeed = 1;
            }
            DeviceMaster.endRawMode();
            throw error;
        } finally {
            Progress.popById('start-preview-mode');
        }
    }

    async end() {
        console.log('end of pmc');
        PreviewModeBackgroundDrawer.clearBoundary();
        PreviewModeBackgroundDrawer.end();
        const storedPrinter = this.storedPrinter;
        await this._reset();
        const res = await DeviceMaster.select(storedPrinter);
        if (res.success) {
            await DeviceMaster.endRawMode();
            if (this.originalSpeed !== 1) {
                await DeviceMaster.setLaserSpeed(this.originalSpeed);
                this.originalSpeed = 1;
            }
        }
    }

    async preview(x, y, last = false, callback = () => {}) {
        if (this.isPreviewBlocked) {
            return;
        }
        this.isDrawing = true;
        this.isPreviewBlocked = true;
        const constrainedXY = this._constrainPreviewXY(x, y);
        x = constrainedXY.x;
        y = constrainedXY.y;

        $('#workarea').css('cursor', 'wait');
        try {
            const imgUrl = await this._getPhotoAfterMove(x, y);
            const p = PreviewModeBackgroundDrawer.draw(imgUrl, x, y, last, callback);

            $('#workarea').css('cursor', 'url(img/camera-cursor.svg), cell');
                            this.isPreviewBlocked = false;
            if (last) {
                this.isDrawing = false;
            }
            return true;
        } catch (error) {
            console.log(error);
            Alert.popUp({
                type: AlertConstants.SHOW_POPUP_ERROR,
                message: error.message,
            });
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
                    left: this._constrainPreviewXY(l, 0).x,
                    right: this._constrainPreviewXY(r, 0).x,
                    top: this._constrainPreviewXY(0, t).y,
                    bottom: this._constrainPreviewXY(0, b).y
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
        return this._getPhotoAfterMoveTo(movementX, movementY);
    }

    isPreviewMode() {
        return this.isPreviewModeOn;
    }

    getCameraOffset() {
        return this.cameraOffset;
    }

    //helper functions

    async _retrieveCameraOffset() {
        // cannot getDeviceSetting during maintainMode. So we force to end it.
        try {
            await DeviceMaster.endRawMode();
        } catch (error) {
            if ( (error.status === 'error') && (error.error && error.error[0] === 'OPERATION_ERROR') ) {
                // do nothing.
            } else {
                console.log(error);
            }
        }
        const borderless = BeamboxPreference.read('borderless') || false;
        const supportOpenBottom = Constant.addonsSupportList.openBottom.includes(BeamboxPreference.read('workarea'));
        const configName = (supportOpenBottom && borderless) ? 'camera_offset_borderless' : 'camera_offset';
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
        console.log(`Got ${configName}`, this.cameraOffset);
        if ((this.cameraOffset.x === 0) && (this.cameraOffset.y === 0)) {
            this.cameraOffset = {
                x: Constant.camera.offsetX_ideal,
                y: Constant.camera.offsetY_ideal,
                angle: 0,
                scaleRatioX: Constant.camera.scaleRatio_ideal,
                scaleRatioY: Constant.camera.scaleRatio_ideal,
            };
        }
    }

    _getCameraOffset() {
        return this.cameraOffset;
    }

    async _reset() {
        this.storedPrinter = null;
        this.isPreviewModeOn = false;
        this.isPreviewBlocked = false;
        this.cameraOffset = null;
        this.lastPosition = [0, 0];
        await DeviceMaster.disconnectCamera();
    }

    _constrainPreviewXY(x, y) {
        const isDiodeEnabled = BeamboxPreference.read('enable-diode') && Constant.addonsSupportList.hybridLaser.includes(BeamboxPreference.read('workarea'));
        const isBorderlessEnabled = BeamboxPreference.read('borderless');
        let maxWidth = Constant.dimension.getWidth();
        let maxHeight = Constant.dimension.getHeight();
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
    _getPhotoAfterMove(x, y) {
        const movementX = x / Constant.dpmm - this._getCameraOffset().x;
        const movementY = y / Constant.dpmm - this._getCameraOffset().y;

        return this._getPhotoAfterMoveTo(movementX, movementY);
    }

    //movementX, movementY in mm
    async _getPhotoAfterMoveTo(movementX, movementY) {
        const movement = {
            f: Math.max(Constant.camera.movementSpeed.x, Constant.camera.movementSpeed.y), // firmware will used limited x, y speed still
            x: movementX, // mm
            y: movementY  // mm
        };
        if (BeamboxPreference.read('enable-diode') && Constant.addonsSupportList.hybridLaser.includes(BeamboxPreference.read('workarea'))) {
            movement.f = movement.f * 0.6;
        }
        const selectRes = await DeviceMaster.select(this.storedPrinter);
        if (!selectRes.success) {
            return;
        }
        const moveRes = await DeviceMaster.rawMove(movement);
        if (moveRes) {
            console.log('Preview raw move respond: ', moveRes.text);
        }
        await this._waitUntilEstimatedMovementTime(movementX, movementY);

        const imgUrl = await this._getPhotoFromMachine();

        return imgUrl;
    }

    //movementX, movementY in mm
    async _waitUntilEstimatedMovementTime(movementX, movementY) {
        const speed = {
            x: Constant.camera.movementSpeed.x / 60 / 1000, // speed: mm per millisecond
            y: Constant.camera.movementSpeed.y / 60 / 1000 // speed: mm per millisecond
        };
        let timeToWait = Math.hypot((this.lastPosition[0] - movementX)/speed.x, (this.lastPosition[1] - movementY)/speed.y);

        if (BeamboxPreference.read('enable-diode') && Constant.addonsSupportList.hybridLaser.includes(BeamboxPreference.read('workarea'))) {
            timeToWait = timeToWait / 0.6;
        }

        // wait for moving camera to take a stable picture, this value need to be optimized
        timeToWait *= 1.2;
        timeToWait += 100;
        this.lastPosition = [movementX, movementY];
        await Rx.Observable.timer(timeToWait).toPromise();
    }

    //just fot _getPhotoAfterMoveTo()
    async _getPhotoFromMachine() {
        const imgBlob = await DeviceMaster.takeOnePicture();
        const imgUrl = URL.createObjectURL(imgBlob);
        return imgUrl;
    }
}

const instance = new PreviewModeController();

export default instance;