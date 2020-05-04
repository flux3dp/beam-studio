define([
    'helpers/i18n',
    'helpers/electron-updater',
    'app/actions/global-interaction',
    'app/actions/beambox',
    'app/actions/beambox/bottom-right-funcs',
    'app/actions/beambox/svgeditor-function-wrapper',
    'jsx!contexts/DialogCaller'
],function(
    i18n,
    ElectronUpdater,
    GlobalInteraction,
    BeamboxActions,
    BottomRightFuncs,
    FnWrapper,
    DialogCaller
){
    class BeamboxGlobalInteraction extends GlobalInteraction {
        constructor() {
            super();
            const loadExampleFile = function(path) {
                var oReq = new XMLHttpRequest();
                oReq.open('GET', path, true);
                oReq.responseType = 'blob';
                console.log(path);

                oReq.onload = async function(oEvent) {
                    let res = oReq.response;
                    let buf = new Buffer.from(await new Response(res).arrayBuffer());
                    let string = buf.toString();
                    if (i18n.getActiveLang() && i18n.getActiveLang() !== 'en') {
                        const LANG = i18n.lang.beambox.right_panel.layer_panel;
                        string = string.replace(/Engraving/g, LANG.layer_engraving).replace(/Cutting/g, LANG.layer_cutting);
                        console.log(string);
                    }
                    svgEditor.importBvgString(string);
                };

                oReq.send();
            }
            
            this._actions = {
                'SWITCH_VERSION': () => {ElectronUpdater.switchVersion()},
                'OPEN': () => {
                    if(electron) {
                        electron.trigger_file_input_click('import_image');
                    }
                },
                'IMPORT_EXAMPLE': () => {loadExampleFile(`examples/badge.bvg`);},
                'IMPORT_MATERIAL_TESTING_OLD': () => {loadExampleFile('examples/mat_test_old.bvg')},
                'IMPORT_MATERIAL_TESTING_SIMPLECUT': () => {loadExampleFile('examples/mat_test_simple_cut.bvg')},
                'IMPORT_MATERIAL_TESTING_CUT': () => {loadExampleFile('examples/mat_test_cut.bvg')},
                'IMPORT_MATERIAL_TESTING_ENGRAVE': () => {loadExampleFile('examples/mat_test_engrave.bvg')},
                'IMPORT_MATERIAL_TESTING_LINE': () => {loadExampleFile('examples/mat_test_line.bvg')},
                'IMPORT_HELLO_BEAMBOX': () => {loadExampleFile('examples/hello-beambox.bvg')},
                'SAVE_SCENE': () => FnWrapper.saveFile(),
                'SAVE_AS': () => FnWrapper.saveAsFile(),
                'EXPORT_BVG': () => FnWrapper.exportAsBVG(),
                'EXPORT_SVG': () => FnWrapper.exportAsSVG(),
                'EXPORT_PNG': () => FnWrapper.exportAsImage('png'),
                'EXPORT_JPG': () => FnWrapper.exportAsImage('jpg'),
                'EXPORT_FLUX_TASK': () => BottomRightFuncs.exportFcode(),
                'UNDO': () => svgEditor.clickUndo(),
                'REDO': () => svgEditor.clickRedo(),
                'GROUP': () => FnWrapper.groupSelected(),
                'UNGROUP': () => FnWrapper.ungroupSelected(),
                'DUPLICATE': () => FnWrapper.cloneSelectedElement(),
                'OFFSET': () => svgEditor.triggerOffsetTool(),
                'IMAGE_SHARPEN': () => DialogCaller.showPhotoEditPanel('sharpen'),
                'IMAGE_CROP': () => DialogCaller.showPhotoEditPanel('crop'),
                'IMAGE_INVERT': () => DialogCaller.showPhotoEditPanel('invert'),
                'IMAGE_VECTORIZE': () => svgCanvas.imageToSVG(),
                'IMAGE_CURVE': () => DialogCaller.showPhotoEditPanel('curve'),
                'ALIGN_TO_EDGES': () => svgCanvas.toggleBezierPathAlignToEdge(),
                'DISASSEMBLE_USE': () => svgCanvas.disassembleUse2Group(),
                'DECOMPOSE_PATH': () => svgCanvas.decomposePath(),
                'SVG_NEST': () => DialogCaller.showSvgNestButtons(),
                'LAYER_COLOR_CONFIG': () => DialogCaller.showLayerColorConfig(),
                'DOCUMENT_SETTING': () => DialogCaller.showDocumentSettings(),
                'CLEAR_SCENE': () => {window.svgEditorClearScene()},
                'TUTORIAL': () => {},
                'ZOOM_IN': () => svgEditor.zoomIn(),
                'ZOOM_OUT': () => svgEditor.zoomOut(),
                'FITS_TO_WINDOW': () => svgEditor.resetView(),
                'ZOOM_WITH_WINDOW': () => svgEditor.setZoomWithWindow(),
                'BORDERLESS_MODE': () => svgCanvas.toggleBorderless(),
                'SHOW_GRIDS': () => svgCanvas.toggleGrid(),
                'SHOW_LAYER_COLOR': () => svgCanvas.toggleUseLayerColor(),
                'NETWORK_TESTING': () => DialogCaller.showNetworkTestingPanel(),
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
                'REDO',
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
            ElectronUpdater.autoCheck();
        }
        onObjectFocus() {
            this.enableMenuItems(['DUPLICATE', 'PATH']);
            let selectedElements = svgCanvas.getSelectedElems().filter((elem) => elem);
            if (selectedElements.length > 0 && selectedElements[0].getAttribute('data-tempgroup') === 'true') {
                selectedElements = Array.from(selectedElements[0].childNodes);
            }
            if (selectedElements[0].tagName ==='image') {
                this.enableMenuItems(['PHOTO_EDIT']);
            } else if (selectedElements[0].tagName ==='use') {
                this.enableMenuItems(['DISASSEMBLE_USE']);
            } else if (selectedElements[0].tagName ==='path') {
                this.enableMenuItems(['DECOMPOSE_PATH']);
            }
            if (selectedElements && selectedElements.length > 0) {
                this.enableMenuItems(['GROUP']);
            }
            if (selectedElements && selectedElements.length === 1 && ['g', 'a', 'use'].includes(selectedElements[0].tagName)) {
                this.enableMenuItems(['UNGROUP']);
            }
        }
        onObjectBlur() {
            this.disableMenuItems(['DUPLICATE', 'PATH', 'DECOMPOSE_PATH', 'PHOTO_EDIT', 'DISASSEMBLE_USE']);
        }
    }
    const instance = new BeamboxGlobalInteraction();

    return instance;
});
