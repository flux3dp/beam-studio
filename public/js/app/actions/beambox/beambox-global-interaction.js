define([
    'helpers/i18n',
    'app/actions/electron-updater',
    'app/actions/global-interaction',
    'app/actions/beambox',
    'app/actions/beambox/bottom-right-funcs',
    'app/actions/beambox/svgeditor-function-wrapper',
],function(
    i18n,
    ElectronUpdater,
    GlobalInteraction,
    BeamboxActions,
    BottomRightFuncs,
    FnWrapper
){
    class BeamboxGlobalInteraction extends GlobalInteraction {
        constructor() {
            super();
            const loadExampleFile = function(path) {
                var fileEntry = {
                    name: path,
                    toURL: function() {
                        return path;
                    }
                }
                var oReq = new XMLHttpRequest();
                oReq.open('GET', path, true);
                oReq.responseType = 'blob';

                oReq.onload = function(oEvent) {
                    svgEditor.importBvg(oReq.response);
                };

                oReq.send();
            }
            
            ElectronUpdater.autoCheck();
            
            this._actions = {

                'OPEN': () => {
                    if(electron) {
                        electron.trigger_file_input_click('import_image');
                    }
                },
                'IMPORT_EXAMPLE': () => {
                    if (i18n.getActiveLang() === 'zh-tw') {
                        loadExampleFile(`examples/badge_zh-tw.bvg`);
                    } else {
                        loadExampleFile(`examples/badge_en.bvg`);
                    }
                },
                'IMPORT_MATERIAL_TESTING_OLD': () => {loadExampleFile('examples/mat_test_old.bvg')},
                'IMPORT_MATERIAL_TESTING_SIMPLECUT': () => {loadExampleFile('examples/mat_test_simple_cut.bvg')},
                'IMPORT_MATERIAL_TESTING_CUT': () => {loadExampleFile('examples/mat_test_cut.bvg')},
                'IMPORT_MATERIAL_TESTING_ENGRAVE': () => {loadExampleFile('examples/mat_test_engrave.bvg')},
                'IMPORT_MATERIAL_TESTING_LINE': () => {loadExampleFile('examples/mat_test_line.bvg')},
                'SAVE_SCENE': () => FnWrapper.saveFile(),
                'SAVE_AS': () => FnWrapper.saveAsFile(),
                'EXPORT_SVG': () => FnWrapper.exportAsSVG(),
                'EXPORT_PNG': () => FnWrapper.exportAsImage('png'),
                'EXPORT_JPG': () => FnWrapper.exportAsImage('jpg'),
                'EXPORT_FLUX_TASK': () => BottomRightFuncs.exportFcode(),
                'UNDO': () => FnWrapper.undo(),
                'DUPLICATE': () => FnWrapper.cloneSelectedElement(),
                'OFFSET': () => svgEditor.triggerOffsetTool(),
                'IMAGE_SHARPEN': () => FnWrapper.photoEdit('sharpen'),
                'IMAGE_CROP': () => FnWrapper.photoEdit('crop'),
                'IMAGE_INVERT': () => FnWrapper.photoEdit('invert'),
                'IMAGE_VECTORIZE': () => svgCanvas.imageToSVG(),
                'IMAGE_CURVE': () => FnWrapper.photoEdit('curve'),
                'ALIGN_TO_EDGES': () => svgCanvas.toggleBezierPathAlignToEdge(),
                'DISASSEMBLE_USE': () => svgCanvas.disassembleUse2Group(),
                'DOCUMENT_SETTING': () => FnWrapper.openAdvancedPanel(),
                'CLEAR_SCENE': () => {window.svgEditorClearScene()},
                'TUTORIAL': () => {},
                'ZOOM_IN': () => svgEditor.zoomIn(),
                'ZOOM_OUT': () => svgEditor.zoomOut(),
                'FITS_TO_WINDOW': () => svgEditor.resetView(),
                'ZOOM_WITH_WINDOW': () => svgEditor.setZoomWithWindow(),
                'BORDERLESS_MODE': () => svgCanvas.toggleBorderless(),
                'SHOW_GRIDS': () => svgCanvas.toggleGrid(),
                'SHOW_LAYER_COLOR': () => svgCanvas.toggleUseLayerColor(),
                'NETWORK_TESTING': () => BeamboxActions.showNetworkTestingPanel(),
                'ABOUT_BEAM_STUDIO': () => BeamboxActions.showAboutBeamStudio(),
                'TASK_INTERPRETER': () => BeamboxActions.showTaskInterpreter(),
                'UPDATE_BS': () => ElectronUpdater.checkForUpdate()
            };
        }
        attach() {
            super.attach([
                'IMPORT',
                'SAVE_SCENE',
                'UNDO',
                'EXPORT_FLUX_TASK',
                'DOCUMENT_SETTING',
                'CLEAR_SCENE',
                'ZOOM_IN',
                'ZOOM_OUT',
                'ALIGN_TO_EDGES',
                'FITS_TO_WINDOW',
                'ZOOM_WITH_WINDOW',
                'BORDERLESS_MODE',
                'SHOW_GRIDS',
                'SHOW_LAYER_COLOR',
                'NETWORK_TESTING',
                'ABOUT_BEAM_STUDIO'
            ]);
        }
        onObjectFocus() {
            this.enableMenuItems(['DUPLICATE', 'OBJECT']);
            if (svgCanvas.getSelectedElems()[0].tagName ==='image') {
                this.enableMenuItems(['PHOTO_EDIT']);
            }
            else if (svgCanvas.getSelectedElems()[0].tagName ==='use') {
                this.enableMenuItems(['DISASSEMBLE_USE']);
            }
        }
        onObjectBlur() {
            this.disableMenuItems(['DUPLICATE', 'OBJECT', 'PHOTO_EDIT', 'DISASSEMBLE_USE']);
        }
    }
    const instance = new BeamboxGlobalInteraction();

    return instance;
});
