import Alert from '@core/app/actions/alert-caller';
import BeamboxPreference from '@core/app/actions/beambox/beambox-preference';
import ExportFuncs from '@core/app/actions/beambox/export-funcs';
import FnWrapper from '@core/app/actions/beambox/svgeditor-function-wrapper';
import Tutorials from '@core/app/actions/beambox/tutorials';
import Dialog from '@core/app/actions/dialog-caller';
import MessageCaller, { MessageLevel } from '@core/app/actions/message-caller';
import { showCurvePanel, showSharpenPanel } from '@core/app/components/dialogs/image';
import { showRotarySettings } from '@core/app/components/dialogs/RotarySettings';
import { gestureIntroduction } from '@core/app/constants/media-tutorials';
import historyUtils from '@core/app/svgedit/history/utils';
import clipboard from '@core/app/svgedit/operations/clipboard';
import disassembleUse from '@core/app/svgedit/operations/disassembleUse';
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
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import type { ISVGEditor } from './svg-editor';

let svgCanvas: ISVGCanvas;
let svgEditor: ISVGEditor;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
  svgEditor = globalSVG.Editor;
});

const { lang } = i18n;

export default {
  ABOUT_BEAM_STUDIO: (): void => Dialog.showAboutBeamStudio(),
  ADD_NEW_MACHINE: async () => {
    const res = await FileExportHelper.toggleUnsavedChangedDialog();

    if (res) {
      window.location.hash = '#/initialize/connect/select-machine-model';
    }
  },
  ANTI_ALIASING: (): boolean => viewMenu.toggleAntiAliasing(),
  AUTO_ALIGN: (): boolean => svgCanvas.toggleAutoAlign(),
  BOX_GEN: (): void => Dialog.showBoxGen(),
  BUG_REPORT: (): void => {
    OutputError.downloadErrorLog();
  },
  CHANGE_LOGS: (): void => Dialog.showChangLog(),
  CLEAR_SCENE: (): Promise<void> => FnWrapper.clearScene(),
  CODE_GENERATOR: (): void => Dialog.showCodeGenerator(),
  COPY: (): void => svgEditor.copySelected(),
  CUT: (): void => svgEditor.cutSelected(),
  DECOMPOSE_PATH: (): Promise<void> => (svgCanvas as any).decomposePath(),
  DELETE: (): void => svgEditor.deleteSelected(),
  DISASSEMBLE_USE: () => disassembleUse(),
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
  EXPORT_UV_PRINT: (): Promise<void> => FileExportHelper.exportUvPrintAsPdf(),
  FITS_TO_WINDOW: (): void => workareaManager.resetView(),
  FOLLOW_US: (): void => Dialog.showSocialMedia(),
  GROUP: () => svgCanvas.groupSelectedElements(),
  IMAGE_CROP: (): void => Dialog.showCropPanel(),
  IMAGE_CURVE: (): void => showCurvePanel(),
  IMAGE_INVERT: (): Promise<void> => imageEdit.colorInvert(),
  IMAGE_SHARPEN: (): void => showSharpenPanel(),
  IMAGE_STAMP: (): Promise<void> => imageEdit.generateStampBevel(),
  IMAGE_VECTORIZE: (): Promise<void> => imageEdit.traceImage(),
  LAYER_COLOR_CONFIG: (): void => Dialog.showLayerColorConfig(),
  MANAGE_ACCOUNT: (): Promise<void> => externalLinkMemberDashboard(),
  MATERIAL_TEST_GENERATOR: (): void => Dialog.showMaterialTestGenerator(),
  NETWORK_TESTING: (): void => Dialog.showNetworkTestingPanel(),
  OFFSET: () => svgEditor.triggerOffsetTool(),
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
  }> => clipboard.pasteElements({ type: 'in_place' }),
  PREFERENCE: async (): Promise<void> => {
    Dialog.clearAllDialogComponents();

    const res = await FileExportHelper.toggleUnsavedChangedDialog();

    if (res) {
      window.location.hash = '#/studio/settings';
    }
  },
  QUESTIONNAIRE: async (): Promise<void> => {
    const res = await checkQuestionnaire({ allowOldVersion: true });

    if (!res) {
      Alert.popUp({ message: i18n.lang.beambox.popup.questionnaire.unable_to_get_url });

      return;
    }

    let url: string = '';

    if (res.version > 0 && res.urls) {
      url = res.urls[i18n.getActiveLang()] || res.urls.en;
    }

    if (!url.length) {
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
  ROTARY_SETUP: () => showRotarySettings(),
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
  UNDO: (): void => {
    if (shortcuts.isInBaseScope()) {
      historyUtils.undo();
    }
  },
  UNGROUP: () => svgCanvas.ungroupSelectedElement(),
  ZOOM_IN: (): void => workareaManager.zoomIn(),
  ZOOM_OUT: (): void => workareaManager.zoomOut(),
  ZOOM_WITH_WINDOW: (): boolean => viewMenu.toggleZoomWithWindow(),
};
