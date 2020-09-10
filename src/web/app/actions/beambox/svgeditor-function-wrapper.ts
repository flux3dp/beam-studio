import Constant from './constant'
import Progress from '../../contexts/ProgressCaller'
import ImageData from '../../../helpers/image-data'
import BeamFileHelper from '../../../helpers/beam-file-helper'
import Alert from '../../contexts/AlertCaller'
import * as TutorialController from '../../views/tutorials/Tutorial-Controller'
import TutorialConstants from '../../constants/tutorial-constants'
import SymbolMaker from '../../../helpers/symbol-maker'
import * as i18n from '../../../helpers/i18n'
import { getSVGAsync } from '../../../helpers/svg-editor-helper'

let svgCanvas;
let svgedit;
let svgEditor;
getSVGAsync((globalSVG) => {
    svgCanvas = globalSVG.Canvas;
    svgedit = globalSVG.Edit;
    svgEditor = globalSVG.Editor;
});
const LANG = i18n.lang.beambox;
const electron = window['electron'];

    let _mm2pixel = function(mm_input) {
        const dpmm = Constant.dpmm;

        return mm_input*dpmm;
    };

    let _update_attr_changer = function(name, val) {
        $('#'+name).val(val);
        $('#'+name).change();
    };

    let _setCrosshairCursor = function() {
        $('#workarea').css('cursor', 'crosshair');
        $('#svg_editor g').css('cursor', 'crosshair');
    };

    let _align = function(types) {
        if (svgCanvas.getTempGroup()) {
            const childeren = svgCanvas.ungroupTempGroup();
            svgCanvas.selectOnly(childeren, false);
        }
        const selectedElements = svgCanvas.getSelectedElems();
        const len = selectedElements.filter(e => e).length;
        const mode = len > 1 ? 'selected' : 'page';
        svgCanvas.alignSelectedElements(types, mode);
        svgCanvas.tempGroupSelectedElements();
    };

    const funcs =  {
        clearSelection: function() {
            svgCanvas.clearSelection();
        },
        isAnyElementSelected: function() {
            if (!svgCanvas) {
                return false;
            }

            const selectedElements = svgCanvas.getSelectedElems();

            return ((selectedElements.length > 0) && (selectedElements[0] !== null));
        },
        cloneSelectedElement: function() {
            svgCanvas.cloneSelectedElements(20, 20);
        },
        undo: function() {
            svgEditor.clickUndo();
        },

        //main panel
        importImage: () => {
            $('#tool_import input').click();
            funcs.useSelectTool();
        },

        insertSvg: function(svgString, type, cropData = { x: 0, y: 0 }, preCrop = { offsetX: 0, offsetY: 0 }) {
            const imageElement = svgString.split('<image');

            svgString = svgString.replace(/fill(: ?#(fff(fff)?|FFF(FFF)?));/g, 'fill: none;');
            svgString = svgString.replace(/fill= ?"#(fff(fff)?|FFF(FFF))"/g, 'fill="none"');
            svgString = svgString.replace(/<image(.|\n)+\/image>/g, '');
            svgString = svgString.replace(/<image(.|\n)+\/>/g, '');

            const newElement = svgCanvas.importSvgString(svgString, type);
            const { x, y } = cropData;
            const { offsetX, offsetY } = preCrop;

            if (imageElement.length > 1) {
                for (let i = 1; i < imageElement.length; i++) {
                    const nodeString = imageElement[i].substr(0, imageElement[i].indexOf('>'));
                    const widthString = nodeString.match(/width="\d+"/)[0];
                    const heightString = nodeString.match(/height="\d+"/)[0];
                    const matrixString = nodeString.match(/matrix\(.+\)/)[0];
                    const xlink = nodeString.indexOf('xlink:href=')+ 12;
                    const width = parseInt(widthString.substr(widthString.indexOf('"')+1, widthString.lastIndexOf('"')-1));
                    const height = parseInt(heightString.substr(heightString.indexOf('"')+1, heightString.lastIndexOf('"')-1));
                    const matrix = matrixString.substring(matrixString.indexOf('(')+1, matrixString.indexOf(')')-1).split(' ').map((e) => (Number(e)));
                    const imageHref = nodeString.substr(xlink , nodeString.substr(xlink).indexOf('"')).replace(/\n/g, '');
                    const sizeFactor = ((matrix[0] === matrix[3]) ? matrix[0] : 1);

                    this.insertImage(imageHref, {x: matrix[4], y: matrix[5], width, height}, preCrop, sizeFactor);
                }
            }

            svgCanvas.ungroupSelectedElement();
            svgCanvas.ungroupSelectedElement();
            svgCanvas.groupSelectedElements();
            svgCanvas.alignSelectedElements('m', 'page');
            svgCanvas.alignSelectedElements('c', 'page');
            // highlight imported element, otherwise we get strange empty selectbox
            try {
                svgCanvas.selectOnly([newElement]);

                if (type === 'image-trace') {
                    svgCanvas.setSvgElemPosition('x', offsetX + x);
                    svgCanvas.setSvgElemPosition('y', offsetY + y);
                    svgCanvas.zoomSvgElem(72/254);
                }
            } catch(e) {
                console.warn('Reading empty SVG');
            }

            $('#dialog_box').hide();
        },
        insertImage: function(insertedImageSrc, cropData, preCrop, sizeFactor = 1, threshold = 255, imageTrace = false) {

            // let's insert the new image until we know its dimensions
            const insertNewImage = function (img, cropData, preCrop, sizeFactor, threshold) {
                const { x, y, width, height } = cropData;
                const { offsetX, offsetY } = preCrop;
                const scale = (imageTrace ? 1 : 3.5277777);
                const newImage = svgCanvas.addSvgElementFromJson({
                    element: 'image',
                    attr: {
                        x: (offsetX + x) * scale,
                        y: (offsetY + y) * scale,
                        width: width * scale * sizeFactor,
                        height: height * scale * sizeFactor,
                        id: svgCanvas.getNextId(),
                        style: 'pointer-events:inherit',
                        preserveAspectRatio: 'none',
                        'data-threshold': parseInt(threshold),
                        'data-shading': true,
                        origImage: img.src
                    }
                });

                ImageData(
                    newImage.getAttribute('origImage'), {
                        height,
                        width,
                        grayscale: {
                            is_rgba: true,
                            is_shading: true,
                            threshold: parseInt(threshold),
                            is_svg: false
                        },
                        onComplete: function (result) {
                            svgCanvas.setHref(newImage, result.canvas.toDataURL());
                        }
                    }
                );

                svgCanvas.selectOnly([newImage]);

                window['updateContextPanel']();
                $('#dialog_box').hide();
            };

            // create dummy img so we know the default dimensions
            const img = new Image();
            const layerName = LANG.right_panel.layer_panel.layer_bitmap;

            img.src = insertedImageSrc;
            img.style.opacity = '0';
            img.onload = function () {
                if (!svgCanvas.setCurrentLayer(layerName)) {
                    svgCanvas.createLayer(layerName);
                }

                insertNewImage(img, cropData, preCrop, sizeFactor, threshold);
            };
        },

        getCurrentLayerData: function() {
            const drawing = svgCanvas.getCurrentDrawing();
            const currentLayer = drawing.getCurrentLayer();
            const layerData = {
                speed: currentLayer.getAttribute('data-speed'),
                power: currentLayer.getAttribute('data-strength'),
                repeat: currentLayer.getAttribute('data-repeat'),
                height: currentLayer.getAttribute('data-height'),
                zStep: currentLayer.getAttribute('data-zstep'),
                isDiode: currentLayer.getAttribute('data-diode'),
                configName: currentLayer.getAttribute('data-configName'),
            };

            return layerData;
        },

        renameLayer: function(oldName, newName) {
            if (svgCanvas.setCurrentLayer(oldName)) {
                svgCanvas.renameCurrentLayer(newName);
            }
        },

        //top menu
        groupSelected: function() {
            svgCanvas.groupSelectedElements();
        },
        ungroupSelected: function() {
            svgCanvas.ungroupSelectedElement();
        },
        booleanUnion: function() {
            svgCanvas.booleanOperationSelectedElements('union');
        },
        booleanDifference: function() {
            svgCanvas.booleanOperationSelectedElements('diff');
        },
        booleanIntersect: function() {
            svgCanvas.booleanOperationSelectedElements('intersect');
        },
        booleanXor: function() {
            svgCanvas.booleanOperationSelectedElements('xor');
        },

        //align toolbox
        alignLeft: function() {
            _align('l');
        },
        alignCenter: function(){
            _align('c');
        },
        alignRight: function() {
            _align('r');
        },
        alignTop: function() {
            _align('t');
        },
        alignMiddle: function() {
            _align('m');
        },
        alignBottom: function() {
            _align('b');
        },
        // distribute toolbox
        distHori: function() {
            svgCanvas.distHori();
        },
        distVert: function() {
            svgCanvas.distVert();
        },
        distEven: function() {
            svgCanvas.distEven();
        },
        flipHorizontal: function() {
            svgCanvas.flipSelectedElements(-1, 1);
        },
        flipVertical: function() {
            svgCanvas.flipSelectedElements(1, -1);
        },
        //left panel
        useSelectTool: function() {
            $('#tool_select').click();
        },
        insertRectangle: function() {
            if (TutorialController.getNextStepRequirement() === TutorialConstants.SELECT_RECT) {
            TutorialController.handleNextStep();
            }
            $('#tool_rect').mouseup();
            _setCrosshairCursor();
        },
        insertEllipse: function() {
            if (TutorialController.getNextStepRequirement() === TutorialConstants.SELECT_CIRCLE) {
                TutorialController.handleNextStep();
            }
            $('#tool_ellipse').mouseup();
            _setCrosshairCursor();
        },
        insertPath: function() {
            $('#tool_path').mouseup();
            _setCrosshairCursor();
        },
        insertPolygon: function() {
            svgCanvas.setMode('polygon');
            _setCrosshairCursor();
        },
        insertLine: function() {
            $('#tool_line').mouseup();
            _setCrosshairCursor();
        },
        insertText: function() {
            $('#tool_text').click();
            if (svgedit.browser.isTouch()) {
                $('#tool_text').mousedown();
            }
            $('#workarea').css('cursor', 'text');
        },
        gridArraySelected: function() {
            $('#tool_grid').mouseup();
        },

        enterPreviewMode: function() {
            svgCanvas.setMode('preview');
        },
        saveFile: async function() {
            if (!svgCanvas.currentFilePath) {
                const result = await this.saveAsFile();
                return result;
            } else {
                svgCanvas.clearSelection();
                const output = svgCanvas.getSvgString();
                const fs = requireNode('fs');;
                console.log(svgCanvas.currentFilePath);
                if (svgCanvas.currentFilePath.endsWith('.bvg')) {
                    fs.writeFile(svgCanvas.currentFilePath, output, function(err) {
                        if (err) {
                            console.log('Save Err', err);
                            return;
                        }
                        console.log('saved');
                    });
                    svgCanvas.setHasUnsavedChange(false);
                    return true;
                } else if (svgCanvas.currentFilePath.endsWith('.beam')) {
                    const ImageSource = await svgCanvas.getImageSource();
                    await BeamFileHelper.saveBeam(svgCanvas.currentFilePath, output, ImageSource);
                    svgCanvas.setHasUnsavedChange(false);
                    return true;
                }
            }
        },

        saveAsFile: async function() {
            svgCanvas.clearSelection();
            const output = svgCanvas.getSvgString();
            const defaultFileName = (svgCanvas.getLatestImportFileName() || 'untitled').replace('/', ':');
            const langFile = i18n.lang.topmenu.file;
            const ImageSource = await svgCanvas.getImageSource();
            const currentFilePath = await BeamFileHelper.getFilePath(langFile.save_scene, langFile.all_files, langFile.bvg_files, ['beam'], defaultFileName);
            if (currentFilePath) {
                svgCanvas.currentFilePath = currentFilePath;
                await BeamFileHelper.saveBeam(currentFilePath, output, ImageSource);
                this.setCurrentFileName(currentFilePath);
                return true;
            } else {
                return false;
            }
        },

        exportAsBVG: async function() {
            svgCanvas.clearSelection();
            const output = svgCanvas.getSvgString();
            const defaultFileName = (svgCanvas.getLatestImportFileName() || 'untitled').replace('/', ':');
            const langFile = i18n.lang.topmenu.file;
            let currentFilePath = electron.ipc.sendSync('save-dialog', langFile.save_scene, langFile.all_files, langFile.bvg_files, ['bvg'], defaultFileName, output, localStorage.getItem('lang'));
            if (currentFilePath) {
                this.setCurrentFileName(currentFilePath);
                return true;
            } else {
                return false;
            }
        },

        setCurrentFileName: (filePath) => {
            let currentFileName;
            if (process.platform === 'win32') {
                currentFileName = filePath.split('\\');
            } else {
                currentFileName = filePath.split('/');
            }
            currentFileName = currentFileName[currentFileName.length -1];
            currentFileName = currentFileName.slice(0, currentFileName.lastIndexOf('.')).replace(':', "/");
            svgCanvas.setLatestImportFileName(currentFileName);
            svgCanvas.filePath = filePath;
            svgCanvas.updateRecentFiles(filePath);
            svgCanvas.setHasUnsavedChange(false);
        },

        toggleUnsavedChangedDialog: function (callback) {
            electron.ipc.send('SAVE_DIALOG_POPPED');
            if (!svgCanvas.getHasUnsaveChanged() || location.hash !== '#studio/beambox') {
                callback();
            } else {
                Alert.popById('unsaved_change_dialog');
                Alert.popUp({
                    id: 'unsaved_change_dialog',
                    message: LANG.popup.save_unsave_changed,
                    buttonLabels: [i18n.lang.alert.save, i18n.lang.alert.dont_save, i18n.lang.alert.cancel],
                    callbacks: [
                        async () => {
                            if (await this.saveFile()) {
                                callback();
                            }
                        },
                        () => {
                            callback();
                        },
                        () => {},
                    ],
                    primaryButtonIndex: 0
                });
            }
        },

        exportAsSVG: function() {
            svgCanvas.clearSelection();
            $('g.layer').removeAttr('clip-path');
            SymbolMaker.switchImageSymbolForAll(false);
            const output = svgCanvas.getSvgString();
            $('g.layer').attr('clip-path', 'url(#scene_mask)');
            SymbolMaker.switchImageSymbolForAll(true);
            const defaultFileName = (svgCanvas.getLatestImportFileName() || 'untitled').replace('/', ':');
            const langFile = i18n.lang.topmenu.file;
            electron.ipc.sendSync('save-dialog', langFile.save_svg, langFile.all_files, langFile.svg_files, ['svg'], defaultFileName, output, localStorage.getItem('lang'));
        },

        exportAsImage: async (type) => {
            svgCanvas.clearSelection();
            const output = svgCanvas.getSvgString();
            const langFile = i18n.lang.topmenu.file;
            Progress.openNonstopProgress({id: 'export_image', message: langFile.converting});
            const defaultFileName = (svgCanvas.getLatestImportFileName() || 'untitled').replace('/', ':');
            let image = await svgCanvas.svgStringToImage(type, output);
            image = image.replace(/^data:image\/\w+;base64,/, "");
            const buf = Buffer.from(image, 'base64');
            Progress.popById('export_image');
            switch (type) {
                case 'png':
                    electron.ipc.sendSync('save-dialog', langFile.save_png, langFile.all_files, langFile.png_files, ['png'], defaultFileName, buf, localStorage.getItem('lang'));
                    break;
                case 'jpg':
                    electron.ipc.sendSync('save-dialog', langFile.save_jpg, langFile.all_files, langFile.jpg_files, ['jpg'], defaultFileName, buf, localStorage.getItem('lang'));
            }
        },

        //top panel
        update_image_width: function(val) {
            _update_attr_changer('image_width', _mm2pixel(val));
        },
        update_image_height: function(val) {
            _update_attr_changer('image_height', _mm2pixel(val));
        },
        update_rect_width: function(val) {
            _update_attr_changer('rect_width', _mm2pixel(val));
        },
        update_rect_height: function(val) {
            _update_attr_changer('rect_height', _mm2pixel(val));
        },
        update_angle: function(val) {
            _update_attr_changer('angle', val);
        },
        update_selected_x: function(val) {
            _update_attr_changer('selected_x', _mm2pixel(val));
        },
        update_selected_y: function(val) {
            _update_attr_changer('selected_y', _mm2pixel(val));
        },
        update_ellipse_cx: function(val) {
            _update_attr_changer('ellipse_cx', _mm2pixel(val));
        },
        update_rect_rx: function(val) {
            _update_attr_changer('rect_rx', _mm2pixel(val));
        },
        update_ellipse_cy: function(val) {
            _update_attr_changer('ellipse_cy', _mm2pixel(val));
        },
        update_ellipse_rx: function(val) {
            _update_attr_changer('ellipse_rx', _mm2pixel(val));
        },
        update_ellipse_ry: function(val) {
            _update_attr_changer('ellipse_ry', _mm2pixel(val));
        },
        update_line_x1: function(val) {
            _update_attr_changer('line_x1', _mm2pixel(val));
        },
        update_line_y1: function(val) {
            _update_attr_changer('line_y1', _mm2pixel(val));
        },
        update_line_x2: function(val) {
            _update_attr_changer('line_x2', _mm2pixel(val));
        },
        update_line_y2: function(val) {
            _update_attr_changer('line_y2', _mm2pixel(val));
        },
        update_font_family: function(val) {
            _update_attr_changer('font_family', val);
        },
        update_font_size: function(val) {
            _update_attr_changer('font_size', val);
        },
        update_font_italic: function(val) {
            svgCanvas.setItalic(val);
            window['updateContextPanel']();
        },
        update_font_weight: function(val) {
            svgCanvas.setFontWeight(val);
            window['updateContextPanel']();
        },
        update_letter_spacing: function(val) {
            svgCanvas.setLetterSpacing(val);
            window['updateContextPanel']();
        },
        update_font_is_fill: function(val) {
            svgCanvas.setFontIsFill(val);
            window['updateContextPanel']();
        },
        write_image_data_shading: function(elem, val) {
            elem.attr('data-shading', val);
        },
        write_image_data_threshold: function(elem, val) {
            elem.attr('data-threshold', val);
        },

        // others
        reset_select_mode: function() {
            // simulate user click on empty area of canvas.
            svgCanvas.textActions.clear();
            svgCanvas.setMode('select');
            $(window['svgroot']).trigger({
                type: 'mousedown',
                pageX: 0,
                pageY: 0
            } as JQuery.Event);
            $(window['svgroot']).trigger({
                type: 'mouseup',
                pageX: 0,
                pageY: 0
            } as JQuery.Event);
        },

        getLatestImportFileName: function() {
            return svgCanvas.getLatestImportFileName();
        },

        resetObjectPanel: function() {
            const elem = svgCanvas.getSelectedElems()[0];
            $(elem).trigger({
                type: 'mousedown'
            } as JQuery.Event);
            $(elem).trigger({
                type: 'mouseup'
            } as JQuery.Event);
        }
    };

    export default funcs;