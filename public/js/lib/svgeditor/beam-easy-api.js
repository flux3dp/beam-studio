let EasyManipulator;
define([
    'app/actions/beambox/beambox-preference',
    'helpers/device-master',
    'helpers/api/discover',
    'helpers/api/svg-laser-parser',
], function (
    BeamboxPreference,
    DeviceMaster,
    Discover,
    svgLaserParser
) {
    const THUMBNAIL_DOWNSCALE = 2;
    const GRID_SPACING = 100;
    const svgeditorParser = svgLaserParser({ type: 'svgeditor' });
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

    const svgStringToImg = async (svgString) => {
        return await new Promise((resolve)=>{
            const img  = new Image();
            let isSuc = false;
            img.onload = () => {
                isSuc = true;
                resolve(img)
            };
            img.src = 'data:image/svg+xml; charset=utf8, ' + encodeURIComponent(svgString);
            window.setTimeout(() => {
                if(!isSuc) {
                    resolve(false);
                }
            }, 15000)
        });
    };

    const fetchThumbnail = async (bvgString) => {
        let img = await svgStringToImg(bvgString);
        if (!img) {
            return [false, false];
        }
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width / THUMBNAIL_DOWNSCALE;
        canvas.height = img.height / THUMBNAIL_DOWNSCALE;
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        for (i = GRID_SPACING / THUMBNAIL_DOWNSCALE; i < Math.max(canvas.width, canvas.height); i += GRID_SPACING / THUMBNAIL_DOWNSCALE) {
            ctx.beginPath();
            ctx.lineWidth = 0.3;
            if (i % (10 * GRID_SPACING / THUMBNAIL_DOWNSCALE) === 0) {
                ctx.lineWidth = 0.9;
            } 
            if (i < canvas.width) {
                ctx.moveTo(i, 0);
                ctx.lineTo(i, canvas.height);
            }
            if (i < canvas.height) {
                ctx.moveTo(0, i);
                ctx.lineTo(canvas.width, i);
            }
            ctx.stroke();
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        return await new Promise((resolve)=>{
            canvas.toBlob(function (blob) {
                resolve([canvas.toDataURL(), URL.createObjectURL(blob)]);
            });
        });
    }

    const prepareUploadFile = async (thumbnail, thumbnailBlobURL, svgString) => {
        const blob = new Blob([thumbnail, svgString], { type: 'application/octet-stream' });
        const reader = new FileReader();
        const uploadFile = await new Promise((resolve) => {
            reader.onload = () => {
                const file = {
                    data: reader.result,
                    name: 'svgeditor.svg',
                    uploadName: thumbnailBlobURL.split('/').pop(),
                    extension: 'svg',
                    type: 'application/octet-stream',
                    size: blob.size,
                    thumbnailSize: thumbnail.length,
                    index: 0,
                    totalFiles: 1
                };
                resolve(file);
            };
            reader.readAsArrayBuffer(blob);
        });
        return uploadFile;
    }

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
            return new Promise(resolve => {
                let isSuccessSelected = false;
                let interval = window.setInterval(() => {
                    let targets = this.machines.filter(m => m.name === machineName);
                    let device = targets[0];
                    this.device = device;
                    if (!device) {
                        return;
                    } else {
                        DeviceMaster.select(device).done(() => {
                            this.isWorking = device.st_id === 16;
                            isSuccessSelected = true;
                            window.clearInterval(interval);
                            resolve(true);
                        })
                        .fail((error) => {
                            console.log(`Failed to connect to`, machineName);
                            this.dispatchEvent(new CustomEvent('ERROR', {detail: {error}}));
                        });
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
            const [thumbnail, thumbnailBlobURL] = await fetchThumbnail(this.bvg);
            if (!thumbnail) {
                let error = 'Fetch Thumbnail Timeout';
                this.dispatchEvent(new CustomEvent('ERROR', {detail: {error}}));
                return false;
            }
            const uploadFile = await prepareUploadFile(thumbnail, thumbnailBlobURL, this.bvg);
            let r = await svgeditorParser.uploadToSvgeditorAPI([uploadFile], {
                model: this.device ? this.device.model : BeamboxPreference.read('model'),
                engraveDpi: BeamboxPreference.read('engrave_dpi'),
                onProgressing: (data) => {
                },
                onFinished: () => {
                    this.dispatchEvent(new CustomEvent('LOAD'));
                }
            });
            svgEditor.importBvgString(bvgString);
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
                        model: this.device ? this.device.model : BeamboxPreference.read('model')
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