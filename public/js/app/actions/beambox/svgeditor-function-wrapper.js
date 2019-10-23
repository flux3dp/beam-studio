define([
    'app/actions/beambox/constant',
    'app/actions/alert-actions',
    'app/actions/progress-actions',
    'app/constants/progress-constants',
    'helpers/image-data',
    'lib/cropper',
    'jsx!app/actions/beambox/Advanced-Panel-Controller',
    'jsx!app/actions/beambox/Photo-Edit-Panel-Controller',
    'helpers/i18n'
], function(
    Constant,
    AlertActions,
    ProgressActions,
    ProgressConstants,
    ImageData,
    Cropper,
    AdvancedPanelController,
    PhotoEditPanelController,
    i18n
){
    const LANG = i18n.lang.beambox;

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
    };

    let _align = function(types) {
        if (svgCanvas.getTempGroup()) {
            const childeren = svgCanvas.ungroupTempGroup();
            svgCanvas.selectOnly(childeren, false);
        }
        const selectedElements = window.svgCanvas.getSelectedElems();
        const len = selectedElements.filter(e => e).length;
        const mode = len > 1 ? 'selected' : 'page';
        svgCanvas.alignSelectedElements(types, mode);
    };

    const funcs =  {
        clearSelection: function() {
            svgCanvas.clearSelection();
        },
        isAnyElementSelected: function() {
            if (!window.svgCanvas) {
                return false;
            }

            const selectedElements = window.svgCanvas.getSelectedElems();

            return ((selectedElements.length > 0) && (selectedElements[0] !== null));
        },
        cloneSelectedElement: function() {
            window.svgCanvas.cloneSelectedElements(20, 20);
        },
        undo: function() {
            window.svgeditorClickUndo();
        },

        //main panel
        importImage: function() {
            $('#tool_import input').click();
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
        insertImage: function(insertedImageSrc, cropData, preCrop, sizeFactor = 1, threshold = 128, imageTrace = false) {

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
                        'data-shading': false,
                        origImage: img.src
                    }
                });

                ImageData(
                    newImage.getAttribute('origImage'), {
                        height,
                        width,
                        grayscale: {
                            is_rgba: true,
                            is_shading: false,
                            threshold: parseInt(threshold),
                            is_svg: false
                        },
                        onComplete: function (result) {
                            svgCanvas.setHref(newImage, result.canvas.toDataURL());
                        }
                    }
                );

                svgCanvas.selectOnly([newImage]);

                window.updateContextPanel();
                $('#dialog_box').hide();
            };

            // create dummy img so we know the default dimensions
            const img = new Image();
            const layerName = LANG.right_panel.layer_panel.layer_bitmap;

            img.src = insertedImageSrc;
            img.style.opacity = 0;
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
                repeat: currentLayer.getAttribute('data-repeat')
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
            $('#tool_rect').mouseup();
            _setCrosshairCursor();
        },
        insertEllipse: function() {
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
        saveFile: function() {
            if (!svgCanvas.currentFilePath) {
                const result = this.saveAsFile();
                return result;
            } else {
                svgCanvas.clearSelection();
                const output = svgCanvas.getSvgString();
                const fs = require('fs');
                fs.writeFile(svgCanvas.currentFilePath, output, function(err) {
                    if (err) {
                        console.log('Save Err', err);
                        return;
                    }
                    console.log('saved');
                });
                svgCanvas.changed = false;
                return true;
            }
        },

        saveAsFile: function() {
            svgCanvas.clearSelection();
            const output = svgCanvas.getSvgString();
            const defaultFileName = (svgCanvas.getLatestImportFileName() || 'untitled').replace('/', ':');
            const langFile = i18n.lang.topmenu.file;
            let currentFilePath = window.electron.ipc.sendSync('save-dialog', langFile.save_scene, langFile.all_files, langFile.bvg_files, ['bvg'], defaultFileName, output, localStorage.getItem('lang'));
            if (currentFilePath) {
                let currentFileName;
                if (process.platform === 'win32') {
                    currentFileName = currentFilePath.split('\\');
                } else {
                    currentFileName = currentFilePath.split('/');
                }
                currentFileName = currentFileName[currentFileName.length -1];
                currentFileName = currentFileName.slice(0, currentFileName.lastIndexOf('.')).replace(':', "/");
                svgCanvas.setLatestImportFileName(currentFileName);
                svgCanvas.currentFilePath = currentFilePath;
                svgCanvas.updateRecentFiles(currentFilePath);
                svgCanvas.changed = false;
                return true;
            } else {
                return false;
            }
        },

        toggleUnsavedChangedDialog: function (callback) {
            if (!svgCanvas.changed) {
                callback();
            } else {
                AlertActions.showPopupCustomGroup(
                    'unsaved change dialog',
                    LANG.popup.save_unsave_changed,
                    [i18n.lang.alert.dont_save, i18n.lang.alert.cancel, i18n.lang.alert.save],
                    '',
                    '',
                    [
                        () => {
                            callback();
                        },
                        () => {},
                        () => {
                            if (this.saveFile()) {
                                callback();
                            }
                        }
                    ]
                );
            }
        },

        exportAsSVG: function() {
            svgCanvas.clearSelection();
            const output = svgCanvas.getSvgString();
            const defaultFileName = (svgCanvas.getLatestImportFileName() || 'untitled').replace('/', ':');
            const langFile = i18n.lang.topmenu.file;
            window.electron.ipc.sendSync('save-dialog', langFile.save_svg, langFile.all_files, langFile.svg_files, ['svg'], defaultFileName, output, localStorage.getItem('lang'));
        },

        exportAsImage: async (type) => {
            svgCanvas.clearSelection();
            const output = svgCanvas.getSvgString();
            const langFile = i18n.lang.topmenu.file;
            ProgressActions.open(ProgressConstants.NONSTOP, langFile.converting);
            const defaultFileName = (svgCanvas.getLatestImportFileName() || 'untitled').replace('/', ':');
            let image = await svgCanvas.svgStringToImage(type, output);
            image = image.replace(/^data:image\/\w+;base64,/, "");
            const buf = new Buffer.from(image, 'base64');
            ProgressActions.close();
            switch (type) {
                case 'png':
                    window.electron.ipc.sendSync('save-dialog', langFile.save_png, langFile.all_files, langFile.png_files, ['png'], defaultFileName, buf, localStorage.getItem('lang'));
                    break;
                case 'jpg':
                    window.electron.ipc.sendSync('save-dialog', langFile.save_jpg, langFile.all_files, langFile.jpg_files, ['jpg'], defaultFileName, buf, localStorage.getItem('lang'));
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
            window.updateContextPanel();
        },
        update_font_weight: function(val) {
            svgCanvas.setFontWeight(val);
            window.updateContextPanel();
        },
        update_letter_spacing: function(val) {
            svgCanvas.setLetterSpacing(val);
            window.updateContextPanel();
        },
        update_font_is_fill: function(val) {
            svgCanvas.setFontIsFill(val);
            window.updateContextPanel();
        },
        write_image_data_shading: function(elem, val) {
            elem.attr('data-shading', val);
        },
        write_image_data_threshold: function(elem, val) {
            elem.attr('data-threshold', val);
        },

        //menubar
        photoEdit: function(mode) {
            const selectedElements = window.svgCanvas.getSelectedElems();
            let len = selectedElements.length;
            for (let i = 0; i < selectedElements.length; ++i) {
                if (!selectedElements[i]) {
                    len = i;
                    break;
                }
            }
            if (len > 1) {
                return;
            }
            elem = selectedElements[0];
            PhotoEditPanelController.setElememt(elem);
            PhotoEditPanelController.setMode(mode);
            PhotoEditPanelController.render();
        },

        openAdvancedPanel: function() {
            AdvancedPanelController.render();
        },

        // others
        reset_select_mode: function() {
            // simulate user click on empty area of canvas.
            svgCanvas.textActions.clear();
            svgCanvas.setMode('select');
            $(svgroot).trigger({
                type: 'mousedown',
                pageX: 0,
                pageY: 0
            });
            $(svgroot).trigger({
                type: 'mouseup',
                pageX: 0,
                pageY: 0
            });
        },

        getLatestImportFileName: function() {
            return svgCanvas.getLatestImportFileName();
        },

        reset_object_panel: function() {
            const elem = svgCanvas.getSelectedElems()[0];
            $(elem).trigger({
                type: 'mousedown'
            });
            $(elem).trigger({
                type: 'mouseup'
            });
        }
    };

    return funcs;
});
