/**
 * API camera
 * Ref: https://github.com/flux3dp/fluxghost/wiki/websocket-camera(monitoring)
 */

import Websocket from '../websocket';
import rsaKey from '../rsa-key';
import VersionChecker from '../version-checker';
import * as i18n from '../i18n';

const Rxjs = requireNode('rxjs');
const { concatMap, filter, map, switchMap, take, timeout } = requireNode('rxjs/operators');

const TIMEOUT = 30000;
const MIN_IMAGE_ALLOWABLE_SIZE = 10000;
const IMAGE_TRANSMISSION_FAIL_THRESHOLD = 40;
const CAMERA_CABLE_ALERT_THRESHOLD = 20;
const LANG = i18n.lang;

class Camera {
    cameraNeedFlip: boolean = null;
    shouldCrop: boolean;
    private _device: {
        uuid: string | null,
        source: string | null,
        model: string | null,
        version: string | null
    };
    private _ws: any;
    private _wsSubject: any;
    private _source: any;
    private requireFrameRetry: number;
    private needCameraCableAlert: boolean;
    constructor(shouldCrop: boolean = true, cameraNeedFlip: boolean = null) {
        this.shouldCrop = shouldCrop;
        this._device = {
            uuid: null,
            source: null,
            model: null,
            version: null
        };
        if (cameraNeedFlip !== null) {
            this.cameraNeedFlip = cameraNeedFlip;
        }
        this._ws = null;
        this.requireFrameRetry = 0;
        this.needCameraCableAlert = false;
        this._wsSubject = new Rxjs.Subject();
        this._source = this._wsSubject
            .asObservable()
            .pipe(filter(x => x instanceof Blob))
            .pipe(filter((blob: Blob) => {
                // if stream return extremely small blob (i.e. when camera hardware connection fail)
                if (blob.size >= MIN_IMAGE_ALLOWABLE_SIZE) {
                    this.needCameraCableAlert = this.requireFrameRetry >= CAMERA_CABLE_ALERT_THRESHOLD;
                    this.requireFrameRetry = 0;
                    return true;
                }
                // TODO: Add camera cable alert
                console.log('Blob size:', blob.size, 'too small.\nRetry time:', this.requireFrameRetry);
                if (this.requireFrameRetry < IMAGE_TRANSMISSION_FAIL_THRESHOLD) {
                    setTimeout(() => this._ws.send('require_frame'), 500);
                    this.requireFrameRetry += 1;
                    return false;
                }
                throw new Error(LANG.message.camera.fail_to_transmit_image);
            }))
            .pipe(map(async (blob: Blob) => {
                const imgBlob = await this.preprocessImage(blob);
                const { needCameraCableAlert } = this;
                return { imgBlob, needCameraCableAlert };
            }))
            .pipe(concatMap(p => Rxjs.from(p)));
    }

    // let subject get response from websocket
    async createWs(device) {
        this._device = device;
        console.log("Device ", device);
        console.assert(device.version, 'device miss version!', device);
        const method = (device.source === 'h2h') ? `camera/usb/${parseInt(device.uuid)}` : `camera/${device.uuid}`;

        this._ws = Websocket({
            method: method,
            onOpen: () => this._ws.send(rsaKey()),
            onMessage: (res) => this._wsSubject.next(res),
            onError: (res) => {
                return this._wsSubject.error(new Error(`Camera WS ${res.error ? res.error.toString() : res}`))
            },
            onFatal: (res) => {
                return this._wsSubject.error(new Error(`Camera WS ${res.error ? res.error.toString() : res}`))
            },
            onClose: () => this._wsSubject.complete(),
            autoReconnect: false
        });

        // if response.status === 'connected' within TIMEOUT, the promise resolve. and the websocket will keep listening.
        await this._wsSubject
            .pipe(filter(res => res.status === 'connected'))
            .pipe(take(1))
            .pipe(timeout(TIMEOUT))
            .toPromise();

        // check whether the camera need flip
        if (this.cameraNeedFlip === null && device && device['model'].indexOf('delta-') < 0) {
            this.cameraNeedFlip = !!(Number((/F:\s?(\-?\d+\.?\d+)/.exec(await this._getCameraOffset()) || ['',''])[1]));
        }
    }

    async _getCameraOffset() {
        console.warn('This is additional control socket created in camera.ts, this may take unnecessary time.');
        const tempWsSubject = new Rxjs.Subject();
        const tempWs = Websocket({
            method: (this._device.source === 'h2h') ? `control/usb/${parseInt(this._device.uuid)}` : `control/${this._device.uuid}`,
            onOpen: () => tempWs.send(rsaKey()),
            onMessage: (res) => tempWsSubject.next(res),
            onError: (res) => tempWsSubject.error(new Error(res.error?res.error.toString():res)),
            onFatal: (res) => tempWsSubject.error(new Error(res.error?res.error.toString():res)),
            onClose: () => tempWsSubject.complete(),
            autoReconnect: false
        });
        await tempWsSubject
            .pipe(filter(res => res.status === 'connected'))
            .pipe(take(1))
            .pipe(timeout(TIMEOUT))
            .toPromise();

        tempWs.send('config get camera_offset');
        const camera_offset = await tempWsSubject
            .pipe(take(1))
            .pipe(timeout(TIMEOUT))
            .toPromise();
        return camera_offset.value;
    }

    async oneShot() {
        if (this._wsSubject.isStopped) {
            if (this._wsSubject.hasError) {
                console.error(this._wsSubject.thrownError);
            }
            throw new Error(LANG.message.camera.ws_closed_unexpectly);
        }
        this._ws.send('require_frame');
        return await this._source
            .pipe(take(1))
            .pipe(timeout(TIMEOUT))
            .toPromise();
    }

    getLiveStreamSource() {
        this._ws.send('enable_streaming');
        return this._source
            .pipe(timeout(TIMEOUT));
    }

    closeWs() {
        this._ws.close(false);
    }

    async preprocessImage(blob: Blob) {
        // load blob and flip if necessary
        const imageLoadBlob = async () => {
            const img = new Image();
            const imgUrl = URL.createObjectURL(blob);
            img.src = imgUrl;
            await new Promise(resolve => img.onload = resolve);
            URL.revokeObjectURL(imgUrl);

            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;

            if (this.cameraNeedFlip) {
                canvas.getContext('2d').scale(-1, -1);
                canvas.getContext('2d').drawImage(img, -img.width, -img.height, img.width, img.height);
            } else {
                canvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height);
            }
            return canvas;
        };
        const resize1280x720ImageTo640x280 = async () => {
            const img = await imageLoadBlob();
            console.assert(img.width === 1280 && img.height === 720, 'image should be 1280x720',img.width, img.height);

            const canvas = document.createElement('canvas');
            canvas.width = 640;
            canvas.height = 280;
            canvas.getContext('2d').drawImage(img, 0, -40, 640, 360); // resize
            const preprocessedBlob = await new Promise<Blob>(resolve => canvas.toBlob(b => resolve(b)));
            return preprocessedBlob;
        };

        const crop640x480ImageTo640x280 = async () => {
            const img = await imageLoadBlob();
            console.assert(img.width === 640 && img.height === 480, 'image should be 640x480',img.width, img.height);

            const canvas = document.createElement('canvas');
            canvas.width = 640;
            canvas.height = 280;
            canvas.getContext('2d').drawImage(img, 0, -100, 640, 480); // crop top and bottom
            const preprocessedBlob = await new Promise<Blob>(resolve => canvas.toBlob(b => resolve(b)));
            return preprocessedBlob;
        };

        const loadAndFlipImage = async () => {
            const canvas = await imageLoadBlob();
            const preprocessedBlob = await new Promise<Blob>(resolve => canvas.toBlob(b => resolve(b)));
            return preprocessedBlob;
        }

        if (!['mozu1', 'fbm1', 'fbb1b', 'fbb1p', 'fbb2b', 'laser-b1', 'darwin-dev'].includes(this._device.model)) {
            return blob;
        }
        if (!this.shouldCrop) {
            return await loadAndFlipImage();
        }
        if (VersionChecker(this._device.version).meetRequirement('BEAMBOX_CAMERA_SPEED_UP')) {
            return await crop640x480ImageTo640x280();
        } else {
            return await resize1280x720ImageTo640x280();
        }
    }
}

export default Camera;
