import { Buffer } from 'buffer';

import Alert from '@core/app/actions/alert-caller';
import BeamboxPreference from '@core/app/actions/beambox/beambox-preference';
import constant from '@core/app/actions/beambox/constant';
import ExportFuncs from '@core/app/actions/beambox/export-funcs';
import FnWrapper from '@core/app/actions/beambox/svgeditor-function-wrapper';
import Tutorials from '@core/app/actions/beambox/tutorials';
import Dialog from '@core/app/actions/dialog-caller';
import MessageCaller, { MessageLevel } from '@core/app/actions/message-caller';
import { showRotarySettings } from '@core/app/components/dialogs/RotarySettings';
import { gestureIntroduction } from '@core/app/constants/media-tutorials';
import historyUtils from '@core/app/svgedit/history/utils';
import clipboard from '@core/app/svgedit/operations/clipboard';
import { importBvgString } from '@core/app/svgedit/operations/import/importBvg';
import workareaManager from '@core/app/svgedit/workarea';
import { externalLinkMemberDashboard, signOut } from '@core/helpers/api/flux-id';
import checkQuestionnaire from '@core/helpers/check-questionnaire';
import FileExportHelper from '@core/helpers/file-export-helper';
import i18n from '@core/helpers/i18n';
import imageEdit from '@core/helpers/image-edit';
import isWeb from '@core/helpers/is-web';
import viewMenu from '@core/helpers/menubar/view';
import OutputError from '@core/helpers/output-error';
import shortcuts from '@core/helpers/shortcuts';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import browser from '@core/implementations/browser';
import type { IBatchCommand } from '@core/interfaces/IHistory';

let svgCanvas;
let svgEditor;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
  svgEditor = globalSVG.Editor;
});

const { lang } = i18n;

type ExampleFileKeys =
  | 'ador_example_laser'
  | 'ador_example_printing_full'
  | 'ador_example_printing_single'
  | 'beambox_2_example'
  | 'beambox_2_focus_probe'
  | 'example'
  | 'focus_probe'
  | 'hello_beambox'
  | 'hexa_example'
  | 'mat_test_cut'
  | 'mat_test_cut_beambox_2'
  | 'mat_test_engrave'
  | 'mat_test_engrave_beambox_2'
  | 'mat_test_line'
  | 'mat_test_old'
  | 'mat_test_printing'
  | 'mat_test_simple_cut'
  | 'promark_example'
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
      beambox_2_example: 'examples/beambox_2_example.bvg',
      beambox_2_focus_probe: 'examples/beambox_2_focus_probe.bvg',
      example: 'examples/badge.bvg',
      focus_probe: 'examples/focus_probe.bvg',
      hello_beambox: 'examples/hello-beambox.bvg',
      hexa_example: 'examples/hexa_example.bvg',
      mat_test_cut: 'examples/mat_test_cut.bvg',
      mat_test_cut_beambox_2: 'examples/mat_test_cut_beambox_2.bvg',
      mat_test_engrave: 'examples/mat_test_engrave.bvg',
      mat_test_engrave_beambox_2: 'examples/mat_test_engrave_beambox_2.bvg',
      mat_test_line: 'examples/mat_test_line.bvg',
      mat_test_old: 'examples/mat_test_old.bvg',
      mat_test_simple_cut: 'examples/mat_test_simple_cut.bvg',
      promark_example: 'examples/promark_example.bvg',
      promark_mopa_20w_color_example: 'examples/promark_mopa_20w_color_example.bvg',
      promark_mopa_60w_color_example: 'examples/promark_mopa_60w_color_example.bvg',
      promark_mopa_60w_color_example_2: 'examples/promark_mopa_60w_color_example_2.bvg',
      promark_mopa_100w_color_example: 'examples/promark_mopa_100w_color_example.bvg',
      promark_mopa_100w_color_example_2: 'examples/promark_mopa_100w_color_example_2.bvg',
    }[key];
  }

  return {
    ador_example_laser: 'examples/ador_example_laser.bvg',
    ador_example_printing_full: 'examples/ador_example_printing_full.bvg',
    ador_example_printing_single: 'examples/ador_example_printing_single.bvg',
    beambox_2_example: 'examples/beambox_2_example.bvg',
    example: 'examples/badge.bvg',
    hello_beambox: 'examples/hello-beambox.bvg',
    hexa_example: 'examples/hexa_example.bvg',
    mat_test_cut: 'examples/ador_cutting_test.bvg',
    mat_test_engrave: 'examples/ador_engraving_test.bvg',
    mat_test_old: 'examples/ador_engraving_test_classic.bvg',
    mat_test_printing: 'examples/ador_color_ring.bvg',
    mat_test_simple_cut: 'examples/ador_cutting_test_simple.bvg',
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

  if (!res) {
    return;
  }

  const oReq = new XMLHttpRequest();

  oReq.open('GET', isWeb() ? `https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/${path}` : path, true);
  oReq.responseType = 'blob';

  oReq.onload = async function onload() {
    const resp = oReq.response;
    const buf = Buffer.from(await new Response(resp).arrayBuffer());
    let string = buf.toString();

    if (i18n.getActiveLang() && i18n.getActiveLang() !== 'en') {
      const LANG = i18n.lang.beambox.right_panel.layer_panel;

      string = string.replace(/Engraving/g, LANG.layer_engraving).replace(/Cutting/g, LANG.layer_cutting);
    }

    await importBvgString(string);
  };

  oReq.send();
};

export default {
  ABOUT_BEAM_STUDIO: (): void => Dialog.showAboutBeamStudio(),
  ADD_NEW_MACHINE: async () => {
    const res = await FileExportHelper.toggleUnsavedChangedDialog();

    if (res) {
      window.location.hash = '#initialize/connect/select-machine-model';
    }
  },
  ALIGN_TO_EDGES: (): Promise<void> => svgCanvas.toggleBezierPathAlignToEdge(),
  ANTI_ALIASING: (): boolean => viewMenu.toggleAntiAliasing(),
  BOX_GEN: (): void => Dialog.showBoxGen(),
  BUG_REPORT: (): void => {
    OutputError.downloadErrorLog();
  },
  CHANGE_LOGS: (): void => Dialog.showChangLog(),
  CLEAR_SCENE: (): Promise<void> => svgEditor.clearScene(),
  CODE_GENERATOR: (): void => Dialog.showCodeGenerator(),
  COPY: (): Promise<void> => svgEditor.copySelected(),
  CUT: (): Promise<void> => svgEditor.cutSelected(),
  DECOMPOSE_PATH: (): Promise<void> => svgCanvas.decomposePath(),
  DELETE: (): Promise<void> => svgEditor.deleteSelected(),
  DISASSEMBLE_USE: (): Promise<void> => svgCanvas.disassembleUse2Group(),
  DOCUMENT_SETTING: (): void => Dialog.showDocumentSettings(),
  DUPLICATE: (): Promise<null | {
    cmd: IBatchCommand;
    elems: Element[];
  }> => clipboard.cloneSelectedElements(20, 20),
  EXPORT_BVG: (): Promise<boolean> => FileExportHelper.exportAsBVG(),
  EXPORT_FLUX_TASK: (): void => {
    if (isWeb()) {
      Dialog.forceLoginWrapper(() => ExportFuncs.exportFcode());
    } else {
      ExportFuncs.exportFcode();
    }
  },
  EXPORT_JPG: (): Promise<void> => FileExportHelper.exportAsImage('jpg'),
  EXPORT_PNG: (): Promise<void> => FileExportHelper.exportAsImage('png'),
  EXPORT_SVG: (): Promise<void> => FileExportHelper.exportAsSVG(),
  FITS_TO_WINDOW: (): void => workareaManager.resetView(),
  FOLLOW_US: (): void => Dialog.showSocialMedia(),
  GROUP: (): Promise<void> => svgCanvas.groupSelectedElements(),
  IMAGE_CROP: (): void => Dialog.showCropPanel(),
  IMAGE_CURVE: (): void => Dialog.showPhotoEditPanel('curve'),
  IMAGE_INVERT: (): Promise<void> => imageEdit.colorInvert(),
  IMAGE_SHARPEN: (): void => Dialog.showPhotoEditPanel('sharpen'),
  IMAGE_STAMP: (): Promise<void> => imageEdit.generateStampBevel(),
  IMAGE_VECTORIZE: (): Promise<void> => imageEdit.traceImage(),
  IMPORT_ACRYLIC_FOCUS_PROBE: (): Promise<void> => loadExampleFile(getExampleFileName('focus_probe')),
  IMPORT_BEAMBOX_2_FOCUS_PROBE: (): Promise<void> => loadExampleFile(getExampleFileName('beambox_2_focus_probe')),
  IMPORT_EXAMPLE: (): Promise<void> => loadExampleFile(getExampleFileName('example')),
  IMPORT_EXAMPLE_ADOR_LASER: (): Promise<void> => loadExampleFile(getExampleFileName('ador_example_laser')),
  IMPORT_EXAMPLE_ADOR_PRINT_FULL: (): Promise<void> =>
    loadExampleFile(getExampleFileName('ador_example_printing_full')),
  IMPORT_EXAMPLE_ADOR_PRINT_SINGLE: (): Promise<void> =>
    loadExampleFile(getExampleFileName('ador_example_printing_single')),
  IMPORT_EXAMPLE_BEAMBOX_2: (): Promise<void> => loadExampleFile(getExampleFileName('beambox_2_example')),
  IMPORT_EXAMPLE_HEXA: (): Promise<void> => loadExampleFile(getExampleFileName('hexa_example')),
  IMPORT_EXAMPLE_PROMARK: (): Promise<void> => loadExampleFile(getExampleFileName('promark_example')),
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
  IMPORT_HELLO_BEAMBOX: (): Promise<void> => loadExampleFile(getExampleFileName('hello_beambox')),
  IMPORT_MATERIAL_TESTING_CUT: (): Promise<void> => loadExampleFile(getExampleFileName('mat_test_cut')),
  IMPORT_MATERIAL_TESTING_CUT_BEAMBOX_2: (): Promise<void> =>
    loadExampleFile(getExampleFileName('mat_test_cut_beambox_2')),
  IMPORT_MATERIAL_TESTING_ENGRAVE: (): Promise<void> => loadExampleFile(getExampleFileName('mat_test_engrave')),
  IMPORT_MATERIAL_TESTING_ENGRAVE_BEAMBOX_2: (): Promise<void> =>
    loadExampleFile(getExampleFileName('mat_test_engrave_beambox_2')),
  IMPORT_MATERIAL_TESTING_LINE: (): Promise<void> => loadExampleFile(getExampleFileName('mat_test_line')),
  IMPORT_MATERIAL_TESTING_OLD: (): Promise<void> => loadExampleFile(getExampleFileName('mat_test_old')),
  IMPORT_MATERIAL_TESTING_PRINT: (): Promise<void> => loadExampleFile(getExampleFileName('mat_test_printing')),
  IMPORT_MATERIAL_TESTING_SIMPLECUT: (): Promise<void> => loadExampleFile(getExampleFileName('mat_test_simple_cut')),
  LAYER_COLOR_CONFIG: (): void => Dialog.showLayerColorConfig(),
  MANAGE_ACCOUNT: (): Promise<void> => externalLinkMemberDashboard(),
  MATERIAL_TEST_GENERATOR: (): void => Dialog.showMaterialTestGenerator(),
  NETWORK_TESTING: (): void => Dialog.showNetworkTestingPanel(),
  OFFSET: (): Promise<void> => svgEditor.triggerOffsetTool(),
  OPEN: (): void => {
    FnWrapper.importImage();
  },
  PASTE: (): Promise<null | {
    cmd: IBatchCommand;
    elems: Element[];
  }> => clipboard.pasteInCenter(),
  PASTE_IN_PLACE: (): Promise<null | {
    cmd: IBatchCommand;
    elems: Element[];
  }> => clipboard.pasteElements('in_place'),
  PREFERENCE: async (): Promise<void> => {
    Dialog.clearAllDialogComponents();

    const res = await FileExportHelper.toggleUnsavedChangedDialog();

    if (res) {
      window.location.hash = '#studio/settings';
    }
  },
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
  REDO: (): void => {
    if (shortcuts.isInBaseScope()) {
      historyUtils.redo();
    }
  },
  ROTARY_SETUP: showRotarySettings,
  SAVE_AS: (): Promise<boolean> => FileExportHelper.saveAsFile(),
  SAVE_SCENE: (): Promise<boolean> => FileExportHelper.saveFile(),
  SAVE_TO_CLOUD: (): Promise<boolean> => FileExportHelper.saveToCloud(),
  SHOW_GRIDS: (): boolean => viewMenu.toggleGrid(),
  SHOW_LAYER_COLOR: (): boolean => viewMenu.toggleLayerColor(),
  SHOW_RULERS: (): boolean => viewMenu.toggleRulers(),
  SIGN_IN: (): void => Dialog.showLoginDialog(),
  SIGN_OUT: (): Promise<boolean> => signOut(),
  START_GESTURE_INTRO: (): Promise<void> => Dialog.showMediaTutorial(gestureIntroduction),
  START_TUTORIAL: (): void => {
    const continuousDrawing = BeamboxPreference.read('continuous_drawing');

    BeamboxPreference.write('continuous_drawing', false);
    Tutorials.startNewUserTutorial(() => {
      BeamboxPreference.write('continuous_drawing', continuousDrawing);
      MessageCaller.openMessage({
        content: lang.tutorial.tutorial_complete,
        level: MessageLevel.SUCCESS,
      });
    });
  },
  START_UI_INTRO: (): void => Tutorials.startInterfaceTutorial(() => {}),
  SVG_NEST: (): void => Dialog.showSvgNestButtons(),
  UNDO: (): void => {
    if (shortcuts.isInBaseScope()) {
      historyUtils.undo();
    }
  },
  UNGROUP: (): Promise<void> => svgCanvas.ungroupSelectedElement(),
  ZOOM_IN: (): void => workareaManager.zoomIn(),
  ZOOM_OUT: (): void => workareaManager.zoomOut(),
  ZOOM_WITH_WINDOW: (): boolean => viewMenu.toggleZoomWithWindow(),
};
