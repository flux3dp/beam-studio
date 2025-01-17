import { Buffer } from 'buffer';

import Alert from 'app/actions/alert-caller';
import BeamboxPreference from 'app/actions/beambox/beambox-preference';
import browser from 'implementations/browser';
import checkQuestionnaire from 'helpers/check-questionnaire';
import constant from 'app/actions/beambox/constant';
import clipboard from 'app/svgedit/operations/clipboard';
import Dialog from 'app/actions/dialog-caller';
import ExportFuncs from 'app/actions/beambox/export-funcs';
import FileExportHelper from 'helpers/file-export-helper';
import FnWrapper from 'app/actions/beambox/svgeditor-function-wrapper';
import historyUtils from 'app/svgedit/history/utils';
import i18n from 'helpers/i18n';
import isWeb from 'helpers/is-web';
import imageEdit from 'helpers/image-edit';
import MessageCaller, { MessageLevel } from 'app/actions/message-caller';
import OutputError from 'helpers/output-error';
import shortcuts from 'helpers/shortcuts';
import Tutorials from 'app/actions/beambox/tutorials';
import viewMenu from 'helpers/menubar/view';
import workareaManager from 'app/svgedit/workarea';
import { externalLinkMemberDashboard, signOut } from 'helpers/api/flux-id';
import { gestureIntroduction } from 'app/constants/media-tutorials';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { importBvgString } from 'app/svgedit/operations/import/importBvg';
import { showRotarySettings } from 'app/components/dialogs/RotarySettings';
import { IBatchCommand } from 'interfaces/IHistory';

let svgCanvas;
let svgEditor;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
  svgEditor = globalSVG.Editor;
});

const { lang } = i18n;

type ExampleFileKeys =
  | 'example'
  | 'mat_test_old'
  | 'mat_test_simple_cut'
  | 'mat_test_cut'
  | 'mat_test_cut_beambox_2'
  | 'mat_test_engrave'
  | 'mat_test_engrave_beambox_2'
  | 'mat_test_printing'
  | 'mat_test_line'
  | 'ador_example_laser'
  | 'ador_example_printing_single'
  | 'ador_example_printing_full'
  | 'focus_probe'
  | 'beambox_2_focus_probe'
  | 'hello_beambox'
  | 'beambox_2_example'
  | 'promark_example'
  | 'hexa_example'
  // mopa color test examples
  | 'promark_mopa_20w_color_example'
  | 'promark_mopa_60w_color_example'
  | 'promark_mopa_60w_color_example_2'
  | 'promark_mopa_100w_color_example'
  | 'promark_mopa_100w_color_example_2';

const getExampleFileName = (key: ExampleFileKeys) => {
  const workarea = BeamboxPreference.read('workarea') || 'fbm1';
  if (!constant.adorModels.includes(workarea)) {
    return {
      example: 'examples/badge.bvg',
      mat_test_old: 'examples/mat_test_old.bvg',
      mat_test_simple_cut: 'examples/mat_test_simple_cut.bvg',
      mat_test_cut: 'examples/mat_test_cut.bvg',
      mat_test_cut_beambox_2: 'examples/mat_test_cut_beambox_2.bvg',
      mat_test_engrave: 'examples/mat_test_engrave.bvg',
      mat_test_engrave_beambox_2: 'examples/mat_test_engrave_beambox_2.bvg',
      mat_test_line: 'examples/mat_test_line.bvg',
      focus_probe: 'examples/focus_probe.bvg',
      beambox_2_focus_probe: 'examples/beambox_2_focus_probe.bvg',
      hello_beambox: 'examples/hello-beambox.bvg',
      beambox_2_example: 'examples/beambox_2_example.bvg',
      promark_example: 'examples/promark_example.bvg',
      hexa_example: 'examples/hexa_example.bvg',
      promark_mopa_20w_color_example: 'examples/promark_mopa_20w_color_example.bvg',
      promark_mopa_60w_color_example: 'examples/promark_mopa_60w_color_example.bvg',
      promark_mopa_60w_color_example_2: 'examples/promark_mopa_60w_color_example_2.bvg',
      promark_mopa_100w_color_example: 'examples/promark_mopa_100w_color_example.bvg',
      promark_mopa_100w_color_example_2: 'examples/promark_mopa_100w_color_example_2.bvg',
    }[key];
  }

  return {
    example: 'examples/badge.bvg',
    mat_test_old: 'examples/ador_engraving_test_classic.bvg',
    mat_test_simple_cut: 'examples/ador_cutting_test_simple.bvg',
    mat_test_cut: 'examples/ador_cutting_test.bvg',
    mat_test_engrave: 'examples/ador_engraving_test.bvg',
    mat_test_printing: 'examples/ador_color_ring.bvg',
    ador_example_laser: 'examples/ador_example_laser.bvg',
    ador_example_printing_full: 'examples/ador_example_printing_full.bvg',
    ador_example_printing_single: 'examples/ador_example_printing_single.bvg',
    hello_beambox: 'examples/hello-beambox.bvg',
    beambox_2_example: 'examples/beambox_2_example.bvg',
    hexa_example: 'examples/hexa_example.bvg',
    promark_example: 'examples/promark_example.bvg',
    promark_mopa_20w_color_example: 'examples/promark_mopa_20w_color_example.bvg',
    promark_mopa_60w_color_example: 'examples/promark_mopa_60w_color_example.bvg',
    promark_mopa_60w_color_example_2: 'examples/promark_mopa_60w_color_example_2.bvg',
    promark_mopa_100w_color_example: 'examples/promark_mopa_100w_color_example.bvg',
    promark_mopa_100w_color_example_2: 'examples/promark_mopa_100w_color_example_2.bvg',
  }[key];
};

const loadExampleFile = async (path: string) => {
  if (!path) {
    Alert.popUp({ message: lang.message.unsupported_example_file });
    return;
  }
  const res = await FileExportHelper.toggleUnsavedChangedDialog();
  if (!res) return;
  const oReq = new XMLHttpRequest();
  oReq.open(
    'GET',
    isWeb() ? `https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/${path}` : path,
    true
  );
  oReq.responseType = 'blob';

  oReq.onload = async function onload() {
    const resp = oReq.response;
    const buf = Buffer.from(await new Response(resp).arrayBuffer());
    let string = buf.toString();
    if (i18n.getActiveLang() && i18n.getActiveLang() !== 'en') {
      const LANG = i18n.lang.beambox.right_panel.layer_panel;
      string = string
        .replace(/Engraving/g, LANG.layer_engraving)
        .replace(/Cutting/g, LANG.layer_cutting);
    }
    await importBvgString(string);
  };

  oReq.send();
};

export default {
  PREFERENCE: async (): Promise<void> => {
    Dialog.clearAllDialogComponents();
    const res = await FileExportHelper.toggleUnsavedChangedDialog();
    if (res) window.location.hash = '#studio/settings';
  },
  OPEN: (): void => {
    FnWrapper.importImage();
  },
  ADD_NEW_MACHINE: async () => {
    const res = await FileExportHelper.toggleUnsavedChangedDialog();
    if (res) window.location.hash = '#initialize/connect/select-machine-model';
  },
  SIGN_IN: (): void => Dialog.showLoginDialog(),
  MATERIAL_TEST_GENERATOR: (): void => Dialog.showMaterialTestGenerator(),
  CODE_GENERATOR: (): void => Dialog.showCodeGenerator(),
  BOX_GEN: (): void => Dialog.showBoxGen(),
  IMPORT_EXAMPLE: (): Promise<void> => loadExampleFile(getExampleFileName('example')),
  IMPORT_EXAMPLE_ADOR_LASER: (): Promise<void> =>
    loadExampleFile(getExampleFileName('ador_example_laser')),
  IMPORT_EXAMPLE_ADOR_PRINT_SINGLE: (): Promise<void> =>
    loadExampleFile(getExampleFileName('ador_example_printing_single')),
  IMPORT_EXAMPLE_ADOR_PRINT_FULL: (): Promise<void> =>
    loadExampleFile(getExampleFileName('ador_example_printing_full')),
  IMPORT_MATERIAL_TESTING_OLD: (): Promise<void> =>
    loadExampleFile(getExampleFileName('mat_test_old')),
  IMPORT_MATERIAL_TESTING_SIMPLECUT: (): Promise<void> =>
    loadExampleFile(getExampleFileName('mat_test_simple_cut')),
  IMPORT_MATERIAL_TESTING_CUT: (): Promise<void> =>
    loadExampleFile(getExampleFileName('mat_test_cut')),
  IMPORT_MATERIAL_TESTING_CUT_BEAMBOX_2: (): Promise<void> =>
    loadExampleFile(getExampleFileName('mat_test_cut_beambox_2')),
  IMPORT_MATERIAL_TESTING_ENGRAVE: (): Promise<void> =>
    loadExampleFile(getExampleFileName('mat_test_engrave')),
  IMPORT_MATERIAL_TESTING_ENGRAVE_BEAMBOX_2: (): Promise<void> =>
    loadExampleFile(getExampleFileName('mat_test_engrave_beambox_2')),
  IMPORT_MATERIAL_TESTING_LINE: (): Promise<void> =>
    loadExampleFile(getExampleFileName('mat_test_line')),
  IMPORT_MATERIAL_TESTING_PRINT: (): Promise<void> =>
    loadExampleFile(getExampleFileName('mat_test_printing')),
  IMPORT_ACRYLIC_FOCUS_PROBE: (): Promise<void> =>
    loadExampleFile(getExampleFileName('focus_probe')),
  IMPORT_BEAMBOX_2_FOCUS_PROBE: (): Promise<void> =>
    loadExampleFile(getExampleFileName('beambox_2_focus_probe')),
  IMPORT_HELLO_BEAMBOX: (): Promise<void> => loadExampleFile(getExampleFileName('hello_beambox')),
  IMPORT_EXAMPLE_BEAMBOX_2: (): Promise<void> =>
    loadExampleFile(getExampleFileName('beambox_2_example')),
  IMPORT_EXAMPLE_PROMARK: (): Promise<void> =>
    loadExampleFile(getExampleFileName('promark_example')),
  IMPORT_EXAMPLE_HEXA: (): Promise<void> => loadExampleFile(getExampleFileName('hexa_example')),
  IMPORT_EXAMPLE_PROMARK_MOPA_20W_COLOR: (): Promise<void> =>
    loadExampleFile(getExampleFileName('promark_mopa_20w_color_example')),
  IMPORT_EXAMPLE_PROMARK_MOPA_60W_COLOR: (): Promise<void> =>
    loadExampleFile(getExampleFileName('promark_mopa_60w_color_example')),
  IMPORT_EXAMPLE_PROMARK_MOPA_60W_COLOR_2: (): Promise<void> =>
    loadExampleFile(getExampleFileName('promark_mopa_60w_color_example_2')),
  IMPORT_EXAMPLE_PROMARK_MOPA_100W_COLOR: (): Promise<void> =>
    loadExampleFile(getExampleFileName('promark_mopa_100w_color_example')),
  IMPORT_EXAMPLE_PROMARK_MOPA_100W_COLOR_2: (): Promise<void> =>
    loadExampleFile(getExampleFileName('promark_mopa_100w_color_example_2')),
  SAVE_SCENE: (): Promise<boolean> => FileExportHelper.saveFile(),
  SAVE_AS: (): Promise<boolean> => FileExportHelper.saveAsFile(),
  SAVE_TO_CLOUD: (): Promise<boolean> => FileExportHelper.saveToCloud(),
  EXPORT_BVG: (): Promise<boolean> => FileExportHelper.exportAsBVG(),
  EXPORT_SVG: (): Promise<void> => FileExportHelper.exportAsSVG(),
  EXPORT_PNG: (): Promise<void> => FileExportHelper.exportAsImage('png'),
  EXPORT_JPG: (): Promise<void> => FileExportHelper.exportAsImage('jpg'),
  EXPORT_FLUX_TASK: (): void => {
    if (isWeb()) Dialog.forceLoginWrapper(() => ExportFuncs.exportFcode());
    else ExportFuncs.exportFcode();
  },
  UNDO: (): void => {
    if (shortcuts.isInBaseScope()) historyUtils.undo();
  },
  REDO: (): void => {
    if (shortcuts.isInBaseScope()) historyUtils.redo();
  },
  GROUP: (): Promise<void> => svgCanvas.groupSelectedElements(),
  UNGROUP: (): Promise<void> => svgCanvas.ungroupSelectedElement(),
  DELETE: (): Promise<void> => svgEditor.deleteSelected(),
  DUPLICATE: (): Promise<{
    cmd: IBatchCommand;
    elems: Element[];
  } | null> => clipboard.cloneSelectedElements(20, 20),
  OFFSET: (): Promise<void> => svgEditor.triggerOffsetTool(),
  IMAGE_SHARPEN: (): void => Dialog.showPhotoEditPanel('sharpen'),
  IMAGE_CROP: (): void => Dialog.showCropPanel(),
  IMAGE_INVERT: (): Promise<void> => imageEdit.colorInvert(),
  IMAGE_STAMP: (): Promise<void> => imageEdit.generateStampBevel(),
  IMAGE_VECTORIZE: (): Promise<void> => imageEdit.traceImage(),
  IMAGE_CURVE: (): void => Dialog.showPhotoEditPanel('curve'),
  ALIGN_TO_EDGES: (): Promise<void> => svgCanvas.toggleBezierPathAlignToEdge(),
  DISASSEMBLE_USE: (): Promise<void> => svgCanvas.disassembleUse2Group(),
  DECOMPOSE_PATH: (): Promise<void> => svgCanvas.decomposePath(),
  SVG_NEST: (): void => Dialog.showSvgNestButtons(),
  LAYER_COLOR_CONFIG: (): void => Dialog.showLayerColorConfig(),
  DOCUMENT_SETTING: (): void => Dialog.showDocumentSettings(),
  ROTARY_SETUP: showRotarySettings,
  CLEAR_SCENE: (): Promise<void> => svgEditor.clearScene(),
  START_TUTORIAL: (): void => {
    const continuousDrawing = BeamboxPreference.read('continuous_drawing');
    BeamboxPreference.write('continuous_drawing', false);
    Tutorials.startNewUserTutorial(() => {
      BeamboxPreference.write('continuous_drawing', continuousDrawing);
      MessageCaller.openMessage({
        level: MessageLevel.SUCCESS,
        content: lang.tutorial.tutorial_complete,
      });
    });
  },
  START_UI_INTRO: (): void => Tutorials.startInterfaceTutorial(() => {}),
  START_GESTURE_INTRO: (): Promise<void> => Dialog.showMediaTutorial(gestureIntroduction),
  ZOOM_IN: (): void => workareaManager.zoomIn(),
  ZOOM_OUT: (): void => workareaManager.zoomOut(),
  FITS_TO_WINDOW: (): void => workareaManager.resetView(),
  ZOOM_WITH_WINDOW: (): boolean => viewMenu.toggleZoomWithWindow(),
  SHOW_GRIDS: (): boolean => viewMenu.toggleGrid(),
  SHOW_RULERS: (): boolean => viewMenu.toggleRulers(),
  SHOW_LAYER_COLOR: (): boolean => viewMenu.toggleLayerColor(),
  ANTI_ALIASING: (): boolean => viewMenu.toggleAntiAliasing(),
  NETWORK_TESTING: (): void => Dialog.showNetworkTestingPanel(),
  ABOUT_BEAM_STUDIO: (): void => Dialog.showAboutBeamStudio(),
  MANAGE_ACCOUNT: (): Promise<void> => externalLinkMemberDashboard(),
  SIGN_OUT: (): Promise<boolean> => signOut(),
  QUESTIONNAIRE: async (): Promise<void> => {
    const res = await checkQuestionnaire({ allowOldVersion: true });
    if (!res) {
      Alert.popUp({ message: i18n.lang.beambox.popup.questionnaire.unable_to_get_url });
      return;
    }
    let url: string;
    if (res.version > 0 && res.urls) {
      url = res.urls[i18n.getActiveLang()] || res.urls.en;
    }
    if (!url) {
      Alert.popUp({
        message: i18n.lang.beambox.popup.questionnaire.no_questionnaire_available,
      });
      return;
    }
    browser.open(url);
  },
  CHANGE_LOGS: (): void => Dialog.showChangLog(),
  CUT: (): Promise<void> => svgEditor.cutSelected(),
  COPY: (): Promise<void> => svgEditor.copySelected(),
  PASTE: (): Promise<{
    cmd: IBatchCommand;
    elems: Element[];
  } | null> => clipboard.pasteInCenter(),
  PASTE_IN_PLACE: (): Promise<{
    cmd: IBatchCommand;
    elems: Element[];
  } | null> => clipboard.pasteElements('in_place'),
  BUG_REPORT: (): void => {
    OutputError.downloadErrorLog();
  },
  FOLLOW_US: (): void => Dialog.showSocialMedia(),
};
