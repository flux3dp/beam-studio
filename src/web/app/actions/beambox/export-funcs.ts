import BeamboxPreference from './beambox-preference';
import Progress from '../progress-caller';
import FontFuncs from './font-funcs';
import Alert from '../alert-caller';
import MonitorController from '../monitor-controller';
import Constant from './constant';
import GlobalActions from '../global-actions';
import AlertConstants from 'app/constants/alert-constants';
import { Mode } from 'app/constants/monitor-constants'
import svgLaserParser from 'helpers/api/svg-laser-parser';
import AwsHelper from 'helpers/aws-helper';
import DeviceMaster from 'helpers/device-master';
import * as i18n from 'helpers/i18n';
import ImageData from 'helpers/image-data';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import SymbolMaker from 'helpers/symbol-maker';
import VersionChecker from 'helpers/version-checker';
let svgCanvas;
let svgedit;

getSVGAsync((globalSVG) => {
    svgCanvas = globalSVG.Canvas;
    svgedit = globalSVG.Edit;
});

const electron = window['electron'];
const lang = i18n.lang;
const svgeditorParser = svgLaserParser({ type: 'svgeditor' });

// capture the scene of the svgCanvas to bitmap
const fetchThumbnail = async () => {
    function cloneAndModifySvg($svg) {
        const $clonedSvg = $svg.clone(false);

        $clonedSvg.find('text').remove();
        $clonedSvg.find('#selectorParentGroup').remove();
        $clonedSvg.find('#canvasBackground image#background_image').remove();
        $clonedSvg.find('#canvasBackground #previewBoundary').remove();
        $clonedSvg.find('#canvasBackground #guidesLines').remove();
        $clonedSvg.find('#canvasBackground #diode-boundary').remove();

        return $clonedSvg;
    }

    async function DOM2Image($svg){
        const $modifiedSvg = cloneAndModifySvg($svg);
        const svgString = new XMLSerializer().serializeToString($modifiedSvg.get(0));

        return await new Promise((resolve)=>{
            const img  = new Image();
            img.onload = () => resolve(img);

            img.src = 'data:image/svg+xml; charset=utf8, ' + encodeURIComponent(svgString);
        });
    }

    function cropAndDrawOnCanvas(img) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        //cropping
        const ratio = img.width / $('#svgroot').width();
        const W = ratio * $('#svgroot').width();
        const H = ratio * $('#svgroot').height();
        const w = ratio * parseInt($('#canvasBackground').attr('width'), 10);
        const h = ratio * parseInt($('#canvasBackground').attr('height'), 10);
        const x = - (W - w) / 2;
        const y = - (H - h) / 2;

        canvas.width = Math.min(w, 500);
        canvas.height = h * canvas.width / w;

        ctx.drawImage(img, -x, -y, w, h, 0, 0, canvas.width, canvas.height);
        return canvas;
    }

    const $svg = cloneAndModifySvg($('#svgroot'));
    const img = await DOM2Image($svg);
    const canvas = cropAndDrawOnCanvas(img);

    return await new Promise<any[]>((resolve)=>{
        canvas.toBlob(function (blob) {
            resolve([canvas.toDataURL(), URL.createObjectURL(blob)]);
        });
    });
};

const updateImageResolution = (isFullResolution: boolean = true) => {
    return new Promise<void>((resolve) => {
        if (BeamboxPreference.read('image_downsampling') === false) {
            resolve();
        }
        const imgs = $('#svgcontent image').toArray();
        const numImgs = imgs.length;
        let done = 0;
        if (0 === numImgs) {
            resolve();
        } else {
            imgs.forEach(img => {
                if (img.getAttribute('origImage')) {
                    ImageData(
                        img.getAttribute('origImage'), {
                            grayscale: {
                                is_rgba: true,
                                is_shading: $(img).attr('data-shading') === 'true',
                                threshold: parseInt($(img).attr('data-threshold')),
                                is_svg: false
                            },
                            isFullResolution: isFullResolution,
                            onComplete: function (result) {
                                $(img).attr('xlink:href', result.pngBase64);
                                done += 1;
                                if (done === numImgs) {
                                    resolve();
                                }
                            }
                        }
                    );
                } else {
                    done += 1;
                    if (done === numImgs) {
                        resolve();
                    }

                }
            });
        }
    });
}

//return {uploadFile, thumbnailBlobURL}
const prepareFileWrappedFromSvgStringAndThumbnail = async () => {
    svgedit.utilities.moveDefsIntoSvgContent();
    const [thumbnail, thumbnailBlobURL] = await fetchThumbnail();
    svgedit.utilities.moveDefsOutfromSvgContent();
    Progress.openNonstopProgress({'id': 'retreive-image-data', message: lang.beambox.bottom_right_panel.retreive_image_data});
    await updateImageResolution(true);
    Progress.popById('retreive-image-data');
    const svgString = svgCanvas.getSvgString();
    const blob = new Blob([thumbnail, svgString], { type: 'application/octet-stream' });
    const reader = new FileReader();
    const uploadFile = await new Promise((resolve) => {
        reader.onload = function () {
            //not sure whether all para is needed
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
    await updateImageResolution(false);
    return {
        uploadFile: uploadFile,
        thumbnailBlobURL: thumbnailBlobURL
    };
};

// fetchTaskCode: send svg string calculate taskcode, default output Fcode if shouldOutputGcode === true output gcode
const fetchTaskCode = async (device: any = null, shouldOutputGcode: boolean = false) => {
    let isErrorOccur = false;
    let isCanceled = false;
    SymbolMaker.switchImageSymbolForAll(false);
    Progress.openNonstopProgress({id: 'convert-text', message: lang.beambox.bottom_right_panel.convert_text_to_path_before_export});
    const res = await FontFuncs.tempConvertTextToPathAmoungSvgcontent();
    Progress.popById('convert-text');
    if (!res) {
        SymbolMaker.switchImageSymbolForAll(true);
        return {};
    }
    const { uploadFile, thumbnailBlobURL } = await prepareFileWrappedFromSvgStringAndThumbnail();
    Progress.openSteppingProgress({
        id: 'upload-scene',
        message: '',
        onCancel: async () => {
            svgeditorParser.interruptCalculation();
            await FontFuncs.revertTempConvert();
            SymbolMaker.switchImageSymbolForAll(true);
            isCanceled = true;
        },
    });
    await svgeditorParser.uploadToSvgeditorAPI([uploadFile], {
        model: BeamboxPreference.read('workarea') || BeamboxPreference.read('model'),
        engraveDpi: BeamboxPreference.read('engrave_dpi'),
        enableMask: BeamboxPreference.read('enable_mask') || BeamboxPreference.read('borderless'),
        onProgressing: (data) => {
            Progress.update('upload-scene', {message: data.message, percentage: data.percentage * 100});
        },
        onFinished: () => {
            Progress.update('upload-scene', {message: lang.message.uploading_fcode, percentage: 100});
        },
        onError: (message) => {
            if (isCanceled) return;
            isErrorOccur = true;
            Progress.popById('upload-scene');
            Alert.popUp({
                id: 'get-taskcode-error',
                message: `#806 ${message}\n${lang.beambox.bottom_right_panel.export_file_error_ask_for_upload}`,
                type: AlertConstants.SHOW_POPUP_ERROR,
                buttonType: AlertConstants.YES_NO,
                onYes: () => {
                    const svgString = svgCanvas.getSvgString();
                    AwsHelper.uploadToS3('output.bvg', svgString);
                }
            });
        },
    });
    if (isCanceled) {
        return {};
    }
    await FontFuncs.revertTempConvert();
    SymbolMaker.switchImageSymbolForAll(true);
    if (isErrorOccur) {
        return {};
    }

    let doesSupportDiodeAndAF = true;
    let shouldUseFastGradient = BeamboxPreference.read('fast_gradient') !== false;
    if (device) {
        const vc = VersionChecker(device.version);
        doesSupportDiodeAndAF = vc.meetRequirement('DIODE_AND_AUTOFOCUS');
        shouldUseFastGradient = shouldUseFastGradient && vc.meetRequirement('FAST_GRADIENT');
    }
    Progress.popById('upload-scene');
    Progress.openSteppingProgress({id: 'fetch-task', message: '', onCancel: () => {
        svgeditorParser.interruptCalculation();
        isCanceled = true;
    }});
    const { taskCodeBlob, fileTimeCost } = await new Promise((resolve) => {
        const names = []; //don't know what this is for
        const codeType = shouldOutputGcode ? 'gcode' : 'fcode';
        svgeditorParser.getTaskCode(
            names,
            {
                onProgressing: (data) => {
                    Progress.update('fetch-task', {message: data.message, percentage: data.percentage * 100});
                },
                onFinished: function (taskCodeBlob, fileName, fileTimeCost) {
                    GlobalActions.sliceComplete({ time: fileTimeCost });
                    Progress.update('fetch-task', {message: lang.message.uploading_fcode, percentage: 100});
                    resolve({taskCodeBlob, fileTimeCost});
                },
                onError: (message) => {
                    Progress.popById('fetch-task');
                    Alert.popUp({
                        id: 'get-taskcode-error',
                        message: `#806 ${message}\n${lang.beambox.bottom_right_panel.export_file_error_ask_for_upload}`,
                        type: AlertConstants.SHOW_POPUP_ERROR,
                        buttonType: AlertConstants.YES_NO,
                        onYes: () => {
                            const svgString = svgCanvas.getSvgString();
                            AwsHelper.uploadToS3('output.bvg', svgString);
                        }
                    });
                    isErrorOccur = true;
                    resolve({
                        taskCodeBlob: null,
                        fileTimeCost: null
                    });
                },
                fileMode: '-f',
                codeType,
                model: BeamboxPreference.read('workarea') || BeamboxPreference.read('model'),
                enableAutoFocus: doesSupportDiodeAndAF && BeamboxPreference.read('enable-autofocus') && Constant.addonsSupportList.autoFocus.includes(BeamboxPreference.read('workarea')),
                enableDiode: doesSupportDiodeAndAF && BeamboxPreference.read('enable-diode') && Constant.addonsSupportList.hybridLaser.includes(BeamboxPreference.read('workarea')),
                shouldUseFastGradient,
                vectorSpeedConstraint: BeamboxPreference.read('vector_speed_contraint') !== false
            }
        );
    });
    Progress.popById('fetch-task');
    if (isCanceled || isErrorOccur) {
        return {};
    }
    
    if (!shouldOutputGcode) {
        return {
            fcodeBlob: taskCodeBlob,
            thumbnailBlobURL: thumbnailBlobURL,
            fileTimeCost: fileTimeCost
        };
    } else {
        return {
            gcodeBlob: taskCodeBlob,
            thumbnailBlobURL: thumbnailBlobURL,
            fileTimeCost: fileTimeCost
        };
    }
    
};


export default {
    uploadFcode: async function (device) {
        const { fcodeBlob, thumbnailBlobURL, fileTimeCost } = await fetchTaskCode(device);
        if (!fcodeBlob) {
            return;
        }
        try {
            const res = await DeviceMaster.select(device);
            if (!res) {
                return;
            }
            MonitorController.showMonitor(device, Mode.PREVIEW, { fcodeBlob, taskImageURL: thumbnailBlobURL, taskTime: fileTimeCost });
        } catch(errMsg) {
            console.error(errMsg);
            // TODO: handle err message
            Alert.popUp({
                id: 'menu-item',
                message: `#807 ${errMsg}`,
                type: AlertConstants.SHOW_POPUP_ERROR,
            });
        }
    },

    exportFcode: async function () {
        const { fcodeBlob } = await fetchTaskCode();
        if (!fcodeBlob) {
            return;
        }
        const defaultFCodeName = svgCanvas.getLatestImportFileName() || 'untitled';
        const langFile = i18n.lang.topmenu.file;
        const fileReader = new FileReader();

        fileReader.onload = function () {
            electron.ipc.send('save-dialog', langFile.save_fcode, langFile.all_files, langFile.fcode_files, ['fc'], defaultFCodeName, new Uint8Array(this.result as ArrayBuffer));
        };

        fileReader.readAsArrayBuffer(fcodeBlob);
    },

    getGcode: async function () {
        const { gcodeBlob } = await fetchTaskCode(null, true);
        if (!gcodeBlob) {
            return;
        }

        return gcodeBlob;
    },

    estimateTime: async function () {
        const { fcodeBlob, fileTimeCost } = await fetchTaskCode();
        if (!fcodeBlob) {
            return;
        }
        return fileTimeCost;
    },

    prepareFileWrappedFromSvgStringAndThumbnail: async () => {
        await FontFuncs.tempConvertTextToPathAmoungSvgcontent();
        const { uploadFile, thumbnailBlobURL } = await prepareFileWrappedFromSvgStringAndThumbnail();
        await FontFuncs.revertTempConvert();
        return { uploadFile, thumbnailBlobURL };
    }
};
