import Alert from '@core/app/actions/alert-caller';
import ExportFuncs from '@core/app/actions/beambox/export-funcs';
import FnWrapper from '@core/app/actions/beambox/svgeditor-function-wrapper';
import Tutorials from '@core/app/actions/beambox/tutorials';
import curveEngravingModeController from '@core/app/actions/canvas/curveEngravingModeController';
import Dialog from '@core/app/actions/dialog-caller';
import MessageCaller, { MessageLevel } from '@core/app/actions/message-caller';
import { showCurvePanel, showSharpenPanel } from '@core/app/components/dialogs/image';
import { showOffsetModal } from '@core/app/components/dialogs/OffsetModal';
import { showRotarySettings } from '@core/app/components/dialogs/RotarySettings';
import { showSettingsModal } from '@core/app/components/settings/modal/SettingsModal';
import { getGestureIntroduction } from '@core/app/constants/media-tutorials';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import historyUtils from '@core/app/svgedit/history/utils';
import { cloneSelectedElements, pasteElements, pasteWithDefaultPosition } from '@core/app/svgedit/operations/clipboard';
import disassembleUse from '@core/app/svgedit/operations/disassembleUse';
import workareaManager from '@core/app/svgedit/workarea';
import { externalLinkMemberDashboard, signOut } from '@core/helpers/api/flux-id';
import checkQuestionnaire from '@core/helpers/check-questionnaire';
import {
  exportAsBVG,
  exportAsImage,
  exportAsSVG,
  exportUvPrintAsPdf,
  saveAsFile,
  saveFile,
  saveToCloud,
  toggleUnsavedChangedDialog,
} from '@core/helpers/file/export';
import { hashMap } from '@core/helpers/hashHelper';
import i18n from '@core/helpers/i18n';
import imageEdit from '@core/helpers/image-edit';
import { isCanvasEmpty } from '@core/helpers/layer/checkContent';
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

export default {
  ABOUT_BEAM_STUDIO: (): void => Dialog.showAboutBeamStudio(),
  ADD_NEW_MACHINE: async () => {
    if (await toggleUnsavedChangedDialog()) {
      window.location.hash = hashMap.machineSetup;
    }
  },
  ANTI_ALIASING: (): boolean => viewMenu.toggleAntiAliasing(),
  AUTO_ALIGN: (): boolean => svgCanvas.toggleAutoAlign(),
  BOX_GEN: (): void => Dialog.showBoxGen(),
  BUG_REPORT: (): void => void OutputError.downloadErrorLog(),
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
  }> => cloneSelectedElements(20, 20),
  EXPORT_BVG: (): Promise<boolean> => exportAsBVG(),
  EXPORT_FLUX_TASK: (): void => {
    if (isCanvasEmpty()) return;

    ExportFuncs.exportFcode();
  },
  EXPORT_JPG: (): Promise<void> => exportAsImage('jpg'),
  EXPORT_PNG: (): Promise<void> => exportAsImage('png'),
  EXPORT_SVG: (): Promise<void> => exportAsSVG(),
  EXPORT_UV_PRINT: (): Promise<void> => exportUvPrintAsPdf(),
  FITS_TO_WINDOW: (): void => workareaManager.resetView(),
  FOLLOW_US: (): void => Dialog.showSocialMedia(),
  GROUP: () => svgCanvas.groupSelectedElements(),
  IMAGE_CROP: (): void => Dialog.showCropPanel(),
  IMAGE_CURVE: (): void => showCurvePanel(),
  IMAGE_INVERT: (): Promise<void> => imageEdit.colorInvert(),
  IMAGE_SHARPEN: (): Promise<void> | void => showSharpenPanel(),
  IMAGE_STAMP: (): void => Dialog.showStampMakerPanel(),
  IMAGE_VECTORIZE: (): Promise<void> => imageEdit.traceImage(),
  LAYER_COLOR_CONFIG: (): void => Dialog.showLayerColorConfig(),
  MANAGE_ACCOUNT: (): Promise<void> => externalLinkMemberDashboard(),
  MATERIAL_TEST_GENERATOR: (): void => Dialog.showMaterialTestGenerator(),
  NETWORK_TESTING: (): void => Dialog.showNetworkTestingPanel(),
  OFFSET: () => showOffsetModal(),
  OPEN: (): void => void FnWrapper.importImage(),
  PASTE: (): Promise<null | {
    cmd: IBatchCommand;
    elems: Element[];
  }> => pasteWithDefaultPosition(),
  PASTE_IN_PLACE: (): Promise<null | {
    cmd: IBatchCommand;
    elems: Element[];
  }> => pasteElements({ type: 'inPlace' }),
  PREFERENCE: (): void => {
    Dialog.clearAllDialogComponents();
    showSettingsModal();
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
  SAVE_AS: (): Promise<boolean> => saveAsFile(),
  SAVE_SCENE: (): Promise<boolean> => saveFile(),
  SAVE_TO_CLOUD: (): Promise<boolean> => saveToCloud(),
  SHOW_GRIDS: (): boolean => viewMenu.toggleGrid(),
  SHOW_LAYER_COLOR: (): boolean => viewMenu.toggleLayerColor(),
  SHOW_MY_CLOUD: () => Dialog.showMyCloud(),
  SHOW_RULERS: (): boolean => viewMenu.toggleRulers(),
  SIGN_IN: (): void => Dialog.showLoginDialog(),
  SIGN_OUT: (): Promise<boolean> => signOut(),
  START_CURVE_ENGRAVING_MODE: () => curveEngravingModeController.start(),
  START_GESTURE_INTRO: (): Promise<void> => Dialog.showMediaTutorial(getGestureIntroduction()),
  START_TUTORIAL: (): void => {
    const globalPreference = useGlobalPreferenceStore.getState();
    const continuousDrawing = globalPreference['continuous_drawing'];

    globalPreference.set('continuous_drawing', false, false);

    Tutorials.startNewUserTutorial(() => {
      globalPreference.set('continuous_drawing', continuousDrawing, false);
      MessageCaller.openMessage({
        content: i18n.lang.tutorial.tutorial_complete,
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
