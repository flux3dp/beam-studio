let EasyManipulator;
define([
    'app/actions/beambox/beambox-preference',
    'helpers/device-master',
    'helpers/api/discover',
    'helpers/api/svg-laser-parser',
    'app/actions/beambox/export-funcs',
], function (
    BeamboxPreference,
    DeviceMaster,
    Discover,
    svgLaserParser,
    ExportFuncs,
) {
    const svgeditorParser = svgLaserParser.default({ type: 'svgeditor' });
    const MACHINE_STATUS = {
        '-10': 'Maintain mode',
        '-2': 'Scanning',
        '-1': 'Maintaining',
        0: 'Idle',
        1: 'Initiating',
        2: 'ST_TRANSFORM',
        4: 'Starting',
        6: 'Resuming',
        16: 'Working',
        18: 'Resuming',
        32: 'Paused',
        36: 'Paused',
        38: 'Pausing',
        48: 'Paused',
        50: 'Pausing',
        64: 'Completed',
        66: 'Completing',
        68: 'Preparing',
        128: 'Aborted',
        UNKNOWN: 'Unknown'
    };

    class Emitter {
        constructor() {
            var delegate = document.createDocumentFragment();
            [
                'addEventListener',
                'dispatchEvent',
                'removeEventListener'
            ].forEach(f =>
                this[f] = (...xs) => delegate[f](...xs)
            );
        }
    };

    // Core
    EasyManipulator = class EasyManipulator extends Emitter {
        constructor() {
            super();
            this.machines = [];
            this.isWorking = false;
            Discover('easy-manipulator', machines => {
                this.machines = Object.values(machines).filter(m => m.model.startsWith('fb'));
                if (this.device) {
                    let device = this.machines.filter(m => m.uuid === this.device.uuid)[0];
                    if (device) {
                        this.device = device;
                        if (this.isWorking && this.device.st_id === 64) {
                            this.dispatchEvent(new CustomEvent('DONE'));
                            this.quit();
                            this.isWorking = false;
                        }
                    }
                }
            });
            /*
            this.addEventListener('LOAD', event => {console.log(event)});
            this.addEventListener('CALCULATED', event => {console.log(event)});
            this.addEventListener('UPLOADING', event => {console.log(event)});
            this.addEventListener('UPLOADED', event => {console.log(event)});
            this.addEventListener('DONE', event => {console.log(event)});
            this.addEventListener('ERROR', event => {console.log(event)});
            */
        }

        async selectMachine(machineName) {
            return new Promise((resolve) => {
                let isSuccessSelected = false;
                let interval = window.setInterval(async () => {
                    let targets = this.machines.filter(m => m.name === machineName);
                    let device = targets[0];
                    this.device = device;
                    if (!device) {
                        return;
                    } else {
                        const res = await DeviceMaster.select(device);
                        if (res.success) {
                            this.isWorking = device.st_id === 16;
                            isSuccessSelected = true;
                            window.clearInterval(interval);
                            resolve(true);
                        } else {
                            console.log(`Failed to connect to`, machineName);
                            this.dispatchEvent(new CustomEvent('ERROR', {detail: {error: res.error}}));
                        }
                        return;
                    }

                }, 200);
                window.setTimeout(() => {
                    if (!isSuccessSelected) {
                        let error = `Unable to select device: ${machineName}`;
                        this.dispatchEvent(new CustomEvent('ERROR', {detail: {error}}));
                        resolve(false);
                    }
                }, 3000);
            });
        }

        async loadBVG(bvgString) {
            this.bvg = bvgString;
            /*
            this.bvg = `
            <svg id="svgcontent" width="3000" height="2100" xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg" data-top="-1300" data-left="-512" data-zoom="0.115" data-rotary_mode="false" data-engrave_dpi="medium">
                <g data-repeat="1" data-strength="1" data-speed="20" clip-path="url(#scene_mask)" data-color="#333333" class="layer">
                    <title>預設圖層</title>
                    <rect fill="black" vector-effect="non-scaling-stroke" fill-opacity="0" id="svg_1" stroke="#333333" height="913.57312" width="713.4571" y="196.98372" x="201.85626"/>
                </g>
            </svg>`;*/
            await svgEditor.importBvgStringAsync(this.bvg);
            let { uploadFile, thumbnailBlobURL } = await ExportFuncs.prepareFileWrappedFromSvgStringAndThumbnail();
            let r = await svgeditorParser.uploadToSvgeditorAPI([uploadFile], {
                model: this.device ? this.device.model : BeamboxPreference.read('workarea') || BeamboxPreference.read('model'),
                engraveDpi: BeamboxPreference.read('engrave_dpi'),
                onProgressing: (data) => {
                },
                onFinished: () => {
                    this.dispatchEvent(new CustomEvent('LOAD'));
                }
            });
            if (!r) {
                return true;
            } else {
                this.dispatchEvent(new CustomEvent('ERROR', {detail: {error: r}}));
                return false;
            }
        }

        async calculate() {
            if (!this.bvg) {
                let error = 'No BVG loaded';
                this.dispatchEvent(new CustomEvent('ERROR', {detail: {error}}));
                return {success: false, timeCost: 0};
            }
            const self = this;
            const {taskCodeBlob, fileTimeCost} = await new Promise((resolve) => {
                const names = []; //don't know what this is for
                const codeType = 'fcode';
                svgeditorParser.getTaskCode(
                    names,
                    {
                        onProgressing: (data) => {
                        },
                        onFinished: function (taskCodeBlob, fileName, fileTimeCost) {
                            resolve({taskCodeBlob, fileTimeCost});
                            self.dispatchEvent(new CustomEvent('CALCULATED', {detail: {taskCodeBlob, fileName, fileTimeCost}}));
                        },
                        fileMode: '-f',
                        codeType,
                        model: this.device ? this.device.model : BeamboxPreference.read('workarea') || BeamboxPreference.read('model')
                    }
                );
            });
            this.taskCodeBlob = taskCodeBlob;
            return {success: true, timeCost: fileTimeCost};
        }

        async start() {
            if (!this.device) {
                let error = 'No Machine Selected';
                this.dispatchEvent(new CustomEvent('ERROR', {detail: {error}}));
                return false;
            }
            if (!this.taskCodeBlob) {
                let error = 'No Calculated Task';
                this.dispatchEvent(new CustomEvent('ERROR', {detail: {error}}));
                return false;
            }
            let isSuc = false;
            
            await DeviceMaster.go(this.taskCodeBlob)
            .then(() => {
                this.dispatchEvent(new CustomEvent('UPLOADED'));
                isSuc = true;
                this.isWorking = true;
            })
            .progress((progress) => {
                this.dispatchEvent(new CustomEvent('UPLOADING', {detail: {progress}}));
            })
            .fail((error) => {
                // reset status
                this.dispatchEvent(new CustomEvent('ERROR', {detail: {error}}));
                isSuc = false;
            });
            return isSuc;
        }

        pause() {
            if (!this.device) {
                let error = 'No Machine Selected';
                this.dispatchEvent(new CustomEvent('ERROR', {detail: {error}}));
                return false;
            }
            DeviceMaster.pause();
            return true;
        }

        resume() {
            if (!this.device) {
                let error = 'No Machine Selected';
                this.dispatchEvent(new CustomEvent('ERROR', {detail: {error}}));
                return false;
            }
            DeviceMaster.resume();
            return true;
        }

        abort() {
            if (!this.device) {
                let error = 'No Machine Selected';
                this.dispatchEvent(new CustomEvent('ERROR', {detail: {error}}));
                return false;
            }
            this.isWorking = false;
            DeviceMaster.stop();
            DeviceMaster.quit();
            return true;
        }

        quit() {
            DeviceMaster.quit();
            return true;
        }

        kick() {
            DeviceMaster.kick();
        }

        getStatus() {
            if (!this.device) {
                let error = 'No Machine Selected';
                this.dispatchEvent(new CustomEvent('ERROR', {detail: {error}}));
                return false;
            }
            let {st_id, st_prog} = this.device;
            return {state: MACHINE_STATUS[st_id], progress: st_prog};
        }
    }  
});