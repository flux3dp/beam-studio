define([
    'app/actions/global-interaction',
    'app/actions/beambox',
    'app/actions/beambox/bottom-right-funcs',
    'app/actions/beambox/svgeditor-function-wrapper',
],function(
    GlobalInteraction,
    BeamboxAction,
    BottomRightFuncs,
    FnWrapper
){
    class BeamboxGlobalInteraction extends GlobalInteraction {
        constructor() {
            super();
            this._actions = {
                'IMPORT': () => {
                    if(electron) {
                        electron.trigger_file_input_click('import_image');
                    }
                },
                'IMPORT_EXAMPLE': () => {
                    var fileEntry = {
                        name: 'examples/badge.bvg',
                        toURL: function() {
                            return 'examples/badge.bvg';
                        }
                    }
                    var oReq = new XMLHttpRequest();
                    oReq.open('GET', 'examples/badge.bvg', true);
                    oReq.responseType = 'blob';

                    oReq.onload = function(oEvent) {
                        svgEditor.importBvg(oReq.response);
                    };

                    oReq.send();
                },
                'IMPORT_MATERIAL_TESTING': () => {
                    var fileEntry = {
                        name: 'examples/mat_test.bvg',
                        toURL: function() {
                            return 'examples/mat_test.bvg';
                        }
                    }
                    var oReq = new XMLHttpRequest();
                    oReq.open('GET', 'examples/mat_test.bvg', true);
                    oReq.responseType = 'blob';

                    oReq.onload = function(oEvent) {
                        svgEditor.importBvg(oReq.response);
                    };

                    oReq.send();
                },
                'SAVE_SCENE': () => FnWrapper.saveFile(),
                'EXPORT_FLUX_TASK': () => BottomRightFuncs.exportFcode(),
                'UNDO': () => FnWrapper.undo(),
                'DUPLICATE': () => FnWrapper.cloneSelectedElement(),
                'IMAGE_SHARPEN': () => FnWrapper.photoEdit('sharpen'),
                'IMAGE_CROP': () => FnWrapper.photoEdit('crop'),
                'IMAGE_INVERT': () => FnWrapper.photoEdit('invert'),
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
                'NETWORK_TESTING': () => BeamboxAction.showNetworkTestingPanel(),
                'ABOUT_BEAM_STUDIO': () => BeamboxAction.showAboutBeamStudio()
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
            this.enableMenuItems(['DUPLICATE']);
            if (svgCanvas.getSelectedElems()[0].tagName ==='image') {
                this.enableMenuItems(['PHOTO_EDIT']);
            }
            else if (svgCanvas.getSelectedElems()[0].tagName ==='use') {
                this.enableMenuItems(['DISASSEMBLE_USE']);
            }
        }
        onObjectBlur() {
            this.disableMenuItems(['DUPLICATE', 'PHOTO_EDIT', 'DISASSEMBLE_USE']);
        }
    }
    const instance = new BeamboxGlobalInteraction();

    return instance;
});
