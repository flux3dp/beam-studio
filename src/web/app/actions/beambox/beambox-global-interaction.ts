import Alert from 'app/actions/alert-caller';
import dialog from 'app/actions/dialog-caller';
import GlobalInteraction from 'app/actions/global-interaction';
import BeamboxActions from 'app/actions/beambox';
import { externalLinkMemberDashboard, signOut } from 'helpers/api/flux-id';
import checkQuestionnaire from 'helpers/check-questionnaire';
import ElectronUpdater from 'helpers/electron-updater';
import FileExportHelper from 'helpers/file-export-helper';
import imageEdit from 'helpers/image-edit';
import * as i18n from 'helpers/i18n';
import { getSVGAsync } from 'helpers/svg-editor-helper';

import BeamboxPreference from './beambox-preference';
import ExportFuncs from './export-funcs';
import FnWrapper from './svgeditor-function-wrapper';
import Tutorials from './tutorials';

let svgCanvas;
let svgEditor;
getSVGAsync((globalSVG) => { svgCanvas = globalSVG.Canvas; svgEditor = globalSVG.Editor; });

class BeamboxGlobalInteraction extends GlobalInteraction {
  constructor() {
    super();
    const loadExampleFile = async (path: string) => {
      const res = await FileExportHelper.toggleUnsavedChangedDialog();
      if (!res) return;
      const oReq = new XMLHttpRequest();
      oReq.open('GET', path, true);
      oReq.responseType = 'blob';

      oReq.onload = async function onload() {
        const resp = oReq.response;
        const buf = Buffer.from(await new Response(resp).arrayBuffer());
        let string = buf.toString();
        if (i18n.getActiveLang() && i18n.getActiveLang() !== 'en') {
          const LANG = i18n.lang.beambox.right_panel.layer_panel;
          string = string.replace(/Engraving/g, LANG.layer_engraving).replace(/Cutting/g, LANG.layer_cutting);
        }
        await svgEditor.importBvgStringAsync(string);
      };

      oReq.send();
    };

    this.actions = {
      SWITCH_VERSION: () => ElectronUpdater.switchVersion(),
      OPEN: () => {
        const { electron } = window;
        if (electron) {
          electron.trigger_file_input_click('import_image');
        }
      },
      IMPORT_EXAMPLE: () => loadExampleFile('examples/badge.bvg'),
      IMPORT_MATERIAL_TESTING_OLD: () => loadExampleFile('examples/mat_test_old.bvg'),
      IMPORT_MATERIAL_TESTING_SIMPLECUT: () => loadExampleFile('examples/mat_test_simple_cut.bvg'),
      IMPORT_MATERIAL_TESTING_CUT: () => loadExampleFile('examples/mat_test_cut.bvg'),
      IMPORT_MATERIAL_TESTING_ENGRAVE: () => loadExampleFile('examples/mat_test_engrave.bvg'),
      IMPORT_MATERIAL_TESTING_LINE: () => loadExampleFile('examples/mat_test_line.bvg'),
      IMPORT_HELLO_BEAMBOX: () => loadExampleFile('examples/hello-beambox.bvg'),
      SAVE_SCENE: () => FileExportHelper.saveFile(),
      SAVE_AS: () => FileExportHelper.saveAsFile(),
      EXPORT_BVG: () => FileExportHelper.exportAsBVG(),
      EXPORT_SVG: () => FileExportHelper.exportAsSVG(),
      EXPORT_PNG: () => FileExportHelper.exportAsImage('png'),
      EXPORT_JPG: () => FileExportHelper.exportAsImage('jpg'),
      EXPORT_FLUX_TASK: () => ExportFuncs.exportFcode(),
      UNDO: () => svgEditor.clickUndo(),
      REDO: () => svgEditor.clickRedo(),
      GROUP: () => FnWrapper.groupSelected(),
      UNGROUP: () => FnWrapper.ungroupSelected(),
      DUPLICATE: () => FnWrapper.cloneSelectedElement(),
      OFFSET: () => svgEditor.triggerOffsetTool(),
      IMAGE_SHARPEN: () => dialog.showPhotoEditPanel('sharpen'),
      IMAGE_CROP: () => dialog.showPhotoEditPanel('crop'),
      IMAGE_INVERT: () => imageEdit.colorInvert(),
      IMAGE_STAMP: () => imageEdit.generateStampBevel(),
      IMAGE_VECTORIZE: () => svgCanvas.imageToSVG(),
      IMAGE_CURVE: () => dialog.showPhotoEditPanel('curve'),
      ALIGN_TO_EDGES: () => svgCanvas.toggleBezierPathAlignToEdge(),
      DISASSEMBLE_USE: () => svgCanvas.disassembleUse2Group(),
      DECOMPOSE_PATH: () => svgCanvas.decomposePath(),
      SVG_NEST: () => dialog.showSvgNestButtons(),
      LAYER_COLOR_CONFIG: () => dialog.showLayerColorConfig(),
      DOCUMENT_SETTING: () => dialog.showDocumentSettings(),
      CLEAR_SCENE: () => svgEditor.clearScene(),
      START_TUTORIAL: () => {
        const LANG = i18n.lang.tutorial;
        const continuousDrawing = BeamboxPreference.read('continuous_drawing');
        BeamboxPreference.write('continuous_drawing', false);
        Tutorials.startNewUserTutorial(() => {
          BeamboxPreference.write('continuous_drawing', continuousDrawing);
          Alert.popUp({ message: LANG.tutorial_complete });
        });
      },
      START_UI_INTRO: () => Tutorials.startInterfaceTutorial(() => { }),
      ZOOM_IN: () => svgEditor.zoomIn(),
      ZOOM_OUT: () => svgEditor.zoomOut(),
      FITS_TO_WINDOW: () => svgEditor.resetView(),
      ZOOM_WITH_WINDOW: () => svgEditor.setZoomWithWindow(),
      SHOW_GRIDS: () => svgCanvas.toggleGrid(),
      SHOW_RULERS: () => svgCanvas.toggleRulers(),
      SHOW_LAYER_COLOR: () => svgCanvas.toggleUseLayerColor(),
      NETWORK_TESTING: () => dialog.showNetworkTestingPanel(),
      ABOUT_BEAM_STUDIO: () => dialog.showAboutBeamStudio(),
      TASK_INTERPRETER: () => BeamboxActions.showTaskInterpreter(),
      MANAGE_ACCOUNT: () => externalLinkMemberDashboard(),
      SIGN_IN: () => dialog.showLoginDialog(() => {
        // Disable before noun-project is available
        // if (!alertConfig.read('skip-np-dialog-box')) {
        //   if (getCurrentUser()) {
        //     dialog.showDialogBox('login-np', {
        //       position: { left: 52, top: 413 },
        //     }, i18n.lang.noun_project_panel.enjoy_shape_library);
        //     alertConfig.write('skip-np-dialog-box', true);
        //   }
        // }
      }),
      SIGN_OUT: () => signOut(),
      UPDATE_BS: () => ElectronUpdater.checkForUpdate(),
      QUESTIONNAIRE: async () => {
        const res = await checkQuestionnaire();
        if (!res) {
          Alert.popUp({ message: i18n.lang.beambox.popup.questionnaire.unable_to_get_url });
          return;
        }
        let url = null;
        if (res.version > 0 && res.urls) {
          url = res.urls[i18n.getActiveLang()] || res.urls.en;
        }
        if (!url) {
          Alert.popUp({
            message: i18n.lang.beambox.popup.questionnaire.no_questionnaire_available,
          });
          return;
        }
        const electron = requireNode('electron');
        electron.remote.shell.openExternal(url);
      },
      CHANGE_LOGS: () => dialog.showChangLog(),
      PASTE_IN_PLACE: () => svgCanvas.pasteElements('in_place'),
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
      'SHOW_GRIDS',
      'SHOW_LAYER_COLOR',
      'NETWORK_TESTING',
      'ABOUT_BEAM_STUDIO',
    ]);
    ElectronUpdater.autoCheck();
  }

  onObjectFocus(elems?) {
    this.enableMenuItems(['DUPLICATE', 'PATH']);
    let selectedElements = elems || svgCanvas.getSelectedElems().filter((elem) => elem);
    if (selectedElements.length > 0 && selectedElements[0].getAttribute('data-tempgroup') === 'true') {
      selectedElements = Array.from(selectedElements[0].childNodes);
    }
    if (selectedElements.length === 0) {
      return;
    }
    if (selectedElements[0].tagName === 'image') {
      this.enableMenuItems(['PHOTO_EDIT']);
    } else if (selectedElements[0].tagName === 'use') {
      this.enableMenuItems(['SVG_EDIT']);
    } else if (selectedElements[0].tagName === 'path') {
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
    this.disableMenuItems(['DUPLICATE', 'PATH', 'DECOMPOSE_PATH', 'PHOTO_EDIT', 'SVG_EDIT']);
  }
}

const instance = new BeamboxGlobalInteraction();

export default instance;
