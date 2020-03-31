define([
    'helpers/aws-helper',
    'helpers/device-master',
    'helpers/i18n',
    'helpers/image-data',
    'app/actions/beambox/beambox-preference',
    'app/actions/progress-actions',
    'app/constants/progress-constants',
    'app/actions/beambox/font-funcs',
    'app/contexts/AlertCaller',
    'app/constants/alert-constants',
    'helpers/api/svg-laser-parser',
    'app/actions/beambox',
    'app/actions/global-actions',
], function (
    AwsHelper,
    DeviceMaster,
    i18n,
    ImageData,
    BeamboxPreference,
    ProgressActions,
    ProgressConstants,
    FontFuncs,
    Alert,
    AlertConstants,
    svgLaserParser,
    BeamboxActions,
    GlobalActions
) {
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
            const w = ratio * $('#canvasBackground').attr('width');
            const h = ratio * $('#canvasBackground').attr('height');
            const x = - (W - w) / 2;
            const y = - (H - h) / 2;

            canvas.width = w;
            canvas.height = h;

            ctx.drawImage(img, x, y, img.width, img.height);
            return canvas;
        }

        const $svg = cloneAndModifySvg($('#svgroot'));
        const img = await DOM2Image($svg);
        const canvas = cropAndDrawOnCanvas(img);

        return await new Promise((resolve)=>{
            canvas.toBlob(function (blob) {
                resolve([canvas.toDataURL(), URL.createObjectURL(blob)]);
            });
        });
    };

    const updateImageResolution = () => {
        return new Promise((resolve) => {
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
                                width: $(img).width(),
                                height: $(img).height(),
                                grayscale: {
                                    is_rgba: true,
                                    is_shading: $(img).attr('data-shading') === 'true',
                                    threshold: parseInt($(img).attr('data-threshold')),
                                    is_svg: false
                                },
                                isFullResolution: true,
                                onComplete: function (result) {
                                    $(img).attr('xlink:href', result.canvas.toDataURL());
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
        const [thumbnail, thumbnailBlobURL] = await fetchThumbnail();
        ProgressActions.open(ProgressConstants.WAITING, lang.beambox.bottom_right_panel.retreive_image_data);
        await updateImageResolution();
        ProgressActions.close();
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

        return {
            uploadFile: uploadFile,
            thumbnailBlobURL: thumbnailBlobURL
        };
    };

    // fetchTaskCode: send svg string calculate taskcode, default output Fcode if isOutputGcode === true output gcode
    const fetchTaskCode = async (isOutputGcode) => {
        let isErrorOccur = false;
        ProgressActions.open(ProgressConstants.WAITING, lang.beambox.bottom_right_panel.convert_text_to_path_before_export);
        await FontFuncs.tempConvertTextToPathAmoungSvgcontent();
        ProgressActions.close();
        const { uploadFile, thumbnailBlobURL } = await prepareFileWrappedFromSvgStringAndThumbnail();
        await svgeditorParser.uploadToSvgeditorAPI([uploadFile], {
            model: BeamboxPreference.read('model'),
            engraveDpi: BeamboxPreference.read('engrave_dpi'),
            enableMask: BeamboxPreference.read('enable_mask') || BeamboxPreference.read('borderless'),
            onProgressing: (data) => {
                ProgressActions.open(ProgressConstants.STEPPING, '', data.message, false);
                ProgressActions.updating(data.message, data.percentage * 100);
            },
            onFinished: () => {
                ProgressActions.updating(lang.message.uploading_fcode, 100);
            },
            onError: (message) => {
                isErrorOccur = true;
                ProgressActions.close();
                Alert.popUp({
                    id: 'get-taskcode-error',
                    message: `${message}\n${lang.beambox.bottom_right_panel.export_file_error_ask_for_upload}`,
                    type: AlertConstants.SHOW_POPUP_ERROR,
                    buttonType: AlertConstants.YES_NO,
                    onYes: () => {
                        const svgString = svgCanvas.getSvgString();
                        AwsHelper.uploadToS3('output.bvg', svgString);
                    }
                });
            },
        });
        await FontFuncs.revertTempConvert();
        if (isErrorOccur) {
            return {fcodeBlob: null};
        }

        const {taskCodeBlob, fileTimeCost} = await new Promise((resolve) => {
            const names = []; //don't know what this is for
            const codeType = isOutputGcode ? 'gcode' : 'fcode';
            svgeditorParser.getTaskCode(
                names,
                {
                    onProgressing: (data) => {
                        ProgressActions.open(ProgressConstants.STEPPING, '', data.message, false);
                        ProgressActions.updating(data.message, data.percentage * 100);
                    },
                    onFinished: function (taskCodeBlob, fileName, fileTimeCost) {
                        GlobalActions.sliceComplete({ time: fileTimeCost });
                        ProgressActions.updating(lang.message.uploading_fcode, 100);
                        resolve({taskCodeBlob, fileTimeCost});
                    },
                    onError: (message) => {
                        ProgressActions.close();
                        Alert.popUp({
                            id: 'get-taskcode-error',
                            message: `${message}\n${lang.beambox.bottom_right_panel.export_file_error_ask_for_upload}`,
                            type: AlertConstants.SHOW_POPUP_ERROR,
                            buttonType: AlertConstants.YES_NO,
                            onYes: () => {
                                const svgString = svgCanvas.getSvgString();
                                AwsHelper.uploadToS3('output.bvg', svgString);
                            }
                        });
                        isErrorOccur = true;
                        resolve({});
                    },
                    fileMode: '-f',
                    codeType,
                    model: BeamboxPreference.read('model'),
                    enableAutoFocus: BeamboxPreference.read('enable-autofocus-module'),
                    enableDiode: BeamboxPreference.read('enable-diode-module'),
                }
            );
        });

        if (!isOutputGcode) {
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


    return {
        uploadFcode: async function (device) {
            const { fcodeBlob, thumbnailBlobURL } = await fetchTaskCode();
            if (!fcodeBlob) {
                return;
            }
            await DeviceMaster.select(device)
                .done(() => {
                    GlobalActions.showMonitor(device, fcodeBlob, thumbnailBlobURL, 'LASER');
                })
                .fail((errMsg) => {
                    Alert.popUp({
                        id: 'menu-item',
                        message: errMsg,
                        type: AlertConstants.SHOW_POPUP_ERROR,
                    });
                });

            ProgressActions.close();
        },

        exportFcode: async function () {
            const { fcodeBlob, _, fileTimeCost } = await fetchTaskCode();
            if (!fcodeBlob) {
                return;
            }
            const defaultFCodeName = svgCanvas.getLatestImportFileName() || 'untitled';
            const langFile = i18n.lang.topmenu.file;
            const fileReader = new FileReader();
            ProgressActions.close();

            fileReader.onload = function () {
                window.electron.ipc.send('save-dialog', langFile.save_fcode, langFile.all_files, langFile.fcode_files, ['fc'], defaultFCodeName, new Uint8Array(this.result));
            };

            fileReader.readAsArrayBuffer(fcodeBlob);
        },

        getGcode: async function () {
            const { gcodeBlob } = await fetchTaskCode(true);
            if (!gcodeBlob) {
                return;
            }
            ProgressActions.close();

            return gcodeBlob;
        },

        prepareFileWrappedFromSvgStringAndThumbnail: async () => {
            await FontFuncs.tempConvertTextToPathAmoungSvgcontent();
            const { uploadFile, thumbnailBlobURL } = await prepareFileWrappedFromSvgStringAndThumbnail();
            await FontFuncs.revertTempConvert();
            return { uploadFile, thumbnailBlobURL };
        }
    };
});
