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
                'DOCUMENT_SETTING': () => FnWrapper.openAdvancedPanel(),
                'CLEAR_SCENE': () => {window.svgEditorClearScene()},
                'TUTORIAL': () => {},
                'NETWORK_TESTING': () => {BeamboxAction.showNetworkTestingPanel()},
                'ABOUT_BEAM_STUDIO': () => {BeamboxAction.showAboutBeamStudio()}
            };
        }
        attach() {
            super.attach(['IMPORT', 'SAVE_SCENE', 'UNDO', 'EXPORT_FLUX_TASK', 'DOCUMENT_SETTING', 'CLEAR_SCENE', 'NETWORK_TESTING', 'ABOUT_BEAM_STUDIO']);
        }
        onObjectFocus() {
            this.enableMenuItems(['DUPLICATE']);
            if (svgCanvas.getSelectedElems()[0].tagName ==='image') {
                this.enableMenuItems(['PHOTO_EDIT']);
            }
        }
        onObjectBlur() {
            this.disableMenuItems(['DUPLICATE', 'PHOTO_EDIT']);
        }
    }
    const instance = new BeamboxGlobalInteraction();

    return instance;
});
