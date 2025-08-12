import Alert from '@core/app/actions/alert-caller';
import { migrate } from '@core/app/actions/beambox/beambox-preference';
import Constant from '@core/app/actions/beambox/constant';
import Tutorials from '@core/app/actions/beambox/tutorials';
import { boundaryDrawer } from '@core/app/actions/canvas/boundaryDrawer';
import Dialog from '@core/app/actions/dialog-caller';
import MessageCaller, { MessageLevel } from '@core/app/actions/message-caller';
import tabController from '@core/app/actions/tabController';
import { showAdorCalibrationV2 } from '@core/app/components/dialogs/camera/AdorCalibrationV2';
import { showBB2Calibration } from '@core/app/components/dialogs/camera/BB2Calibration';
import updateFontConvert from '@core/app/components/dialogs/updateFontConvert';
import AlertConstants from '@core/app/constants/alert-constants';
import FontConstants from '@core/app/constants/font-constants';
import { gestureIntroduction } from '@core/app/constants/media-tutorials';
import NS from '@core/app/constants/namespaces';
import BeamboxStore from '@core/app/stores/beambox-store';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import { initCurText } from '@core/app/svgedit/text/textedit';
import workareaManager from '@core/app/svgedit/workarea';
import { showCameraCalibration } from '@core/app/views/beambox/Camera-Calibration';
import alertHelper from '@core/helpers/alert-helper';
import announcementHelper from '@core/helpers/announcement-helper';
import aiExtension from '@core/helpers/api/ai-extension';
import AlertConfig from '@core/helpers/api/alert-config';
import cloud from '@core/helpers/api/cloud';
import { checkConnection } from '@core/helpers/api/discover';
import fluxId, { recordMachines } from '@core/helpers/api/flux-id';
import autoSaveHelper from '@core/helpers/auto-save-helper';
import checkDeviceStatus from '@core/helpers/check-device-status';
import checkQuestionnaire from '@core/helpers/check-questionnaire';
import getDevice from '@core/helpers/device/get-device';
import fontHelper from '@core/helpers/fonts/fontHelper';
import i18n from '@core/helpers/i18n';
import isWeb from '@core/helpers/is-web';
import sentryHelper from '@core/helpers/sentry-helper';
import registerImageSymbolEvents from '@core/helpers/symbol-helper/registerImageSymbolEvents';
import { isMobile } from '@core/helpers/system-helper';
import browser from '@core/implementations/browser';
import menu from '@core/implementations/menu';
import storage from '@core/implementations/storage';
import type { IDefaultFont } from '@core/interfaces/IFont';

class BeamboxInit {
  constructor() {
    migrate();

    if (!storage.get('default-units')) {
      const { timeZone } = Intl.DateTimeFormat().resolvedOptions();
      const isEn = navigator.language.slice(0, 2).toLocaleLowerCase() === 'en';

      if (timeZone.startsWith('America') && isEn) {
        storage.set('default-units', 'inches');
      }
    }

    if (!storage.get('default-font')) {
      this.initDefaultFont();
    }

    menu.init();
    autoSaveHelper.init();
    fluxId.init();
    cloud.recordActivity();
    BeamboxStore.onDrawGuideLines(this.displayGuides);
    alertHelper.registerAlertEvents();
    boundaryDrawer.registerEvents();
    registerImageSymbolEvents();
    initCurText();

    // WebSocket for Adobe Illustrator Plug-In
    aiExtension.init();

    if (isWeb() || tabController.getIsWelcomeTab()) {
      setTimeout(recordMachines, 10000);
    }
  }

  async showStartUpDialogs(): Promise<void> {
    await this.askAndInitSentry();

    const globalPreference = useGlobalPreferenceStore.getState();
    const isNewUser = Boolean(storage.get('new-user'));
    const hasMachineConnection = checkConnection();

    if (isWeb() && navigator.maxTouchPoints >= 1) {
      const res = await fluxId.getPreference('did_gesture_tutorial', true);

      if (res && !res.error) {
        if (res.status === 'ok' && !res.value) {
          await Dialog.showMediaTutorial(gestureIntroduction);
          await fluxId.setPreference({ did_gesture_tutorial: true });
        } else if (res.status === 'error' && res.info === 'NOT_LOGGED_IN' && !storage.get('did-gesture-tutorial')) {
          await Dialog.showMediaTutorial(gestureIntroduction);
          storage.set('did-gesture-tutorial', 1);
        }
      }
    }

    await this.showFirstCalibrationDialog();

    if (hasMachineConnection && !isMobile()) {
      await this.showTutorial(isNewUser);
    }

    if (!isNewUser) {
      const lastInstalledVersion = storage.get('last-installed-version');

      if (window.FLUX.version !== lastInstalledVersion) {
        await this.showChangeLog();
      }

      await this.showQuestionnaire();
    }

    if (!globalPreference['font-convert'] && !isNewUser) {
      globalPreference.set('font-convert', await updateFontConvert());
    }

    // ratingHelper.init();
    announcementHelper.init(isNewUser);
    storage.removeAt('new-user');
    storage.set('last-installed-version', window.FLUX.version);
  }

  private displayGuides(): void {
    // TODO: update guide lines dynamically
    const { guide_x0: x, guide_y0: y, show_guides: showGuides } = useGlobalPreferenceStore.getState();

    if (!showGuides) return;

    document.getElementById('guidesLines')?.remove();
    document.getElementById('horizontal_guide')?.remove();
    document.getElementById('vertical_guide')?.remove();

    const { utilities } = window.svgedit;
    const guidesLines = (() => {
      const linesGroup = document.createElementNS(NS.SVG, 'svg');
      const lineVertical = document.createElementNS(NS.SVG, 'line');
      const lineHorizontal = document.createElementNS(NS.SVG, 'line');
      const { height, maxY, minY, width } = workareaManager;

      utilities.assignAttributes(linesGroup, {
        height: '100%',
        id: 'guidesLines',
        style: 'pointer-events: none',
        viewBox: `0 0 ${width} ${height}`,
        width: '100%',
        x: 0,
        y: 0,
      });

      utilities.assignAttributes(lineHorizontal, {
        fill: 'none',
        id: 'horizontal_guide',
        stroke: '#000',
        'stroke-dasharray': '5, 5',
        'stroke-opacity': 0.8,
        'stroke-width': '2',
        style: 'pointer-events:none',
        'vector-effect': 'non-scaling-stroke',
        x1: 0,
        x2: width,
        y1: y * 10,
        y2: y * 10,
      });

      utilities.assignAttributes(lineVertical, {
        fill: 'none',
        id: 'vertical_guide',
        stroke: '#000',
        'stroke-dasharray': '5, 5',
        'stroke-opacity': 0.8,
        'stroke-width': '2',
        style: 'pointer-events:none',
        'vector-effect': 'non-scaling-stroke',
        x1: x * 10,
        x2: x * 10,
        y1: minY,
        y2: maxY,
      });

      linesGroup.appendChild(lineHorizontal);
      linesGroup.appendChild(lineVertical);

      return linesGroup;
    })();
    const canvasBG = document.getElementById('canvasBackground');

    if (canvasBG) {
      canvasBG.appendChild(guidesLines);
    }
  }

  private initDefaultFont(): void {
    const lang = navigator.language;
    const web = isWeb();
    const { os } = window;
    let defaultFontFamily = 'Arial';

    if (web) {
      defaultFontFamily = 'Noto Sans';
    } else if (os === 'Linux') {
      defaultFontFamily = 'Ubuntu';
    }

    if (FontConstants[lang]) {
      if (web && FontConstants[lang].web) {
        defaultFontFamily = FontConstants[lang].web;
      } else if ((FontConstants[lang] as any)[os]) {
        defaultFontFamily = (FontConstants[lang] as any)[os];
      }
    }

    const fonts = fontHelper.findFonts({ family: defaultFontFamily });
    let defaultFont: IDefaultFont;

    if (fonts.length > 0) {
      defaultFont = fonts.filter((font) => font.style === 'Regular')[0] || fonts[0];
    } else {
      defaultFont = fontHelper.getAvailableFonts()[0];
    }

    storage.set('default-font', {
      family: defaultFont.family,
      postscriptName: defaultFont.postscriptName,
      style: defaultFont.style,
    });
  }

  private async askAndInitSentry(): Promise<void> {
    const enableSentry = storage.get('enable-sentry');

    if (enableSentry === null) {
      await new Promise<void>((resolve) => {
        const LANG = i18n.lang;

        Alert.popUp({
          buttonType: AlertConstants.YES_NO,
          caption: LANG.beambox.popup.sentry.title,
          iconUrl: 'img/beambox/icon-analyze.svg',
          id: 'ask-sentry',
          message: LANG.beambox.popup.sentry.message,
          onNo: () => {
            storage.set('enable-sentry', false);
            resolve();
          },
          onYes: () => {
            storage.set('enable-sentry', true);
            sentryHelper.initSentry();
            resolve();
          },
        });
      });
    }
  }

  private showFirstCalibrationDialog = async (): Promise<boolean> => {
    const isNewUser = storage.get('new-user');
    const hasDoneFirstCali = AlertConfig.read('done-first-cali');
    let hasMachineConnection = checkConnection();
    // in web, wait for websocket connection
    const web = isWeb();

    if (web && !hasDoneFirstCali && !hasMachineConnection) {
      await new Promise((r) => setTimeout(r, 1000));
      hasMachineConnection = checkConnection();
    }

    const shouldShow = web ? hasMachineConnection && !hasDoneFirstCali : isNewUser || !hasDoneFirstCali;
    let caliRes = true;

    if (shouldShow) {
      const res = await this.askFirstTimeCameraCalibration();

      AlertConfig.write('done-first-cali', true);

      if (res) {
        caliRes = await this.doFirstTimeCameraCalibration();
      } else {
        return false;
      }
    }

    return caliRes;
  };

  private askFirstTimeCameraCalibration = () =>
    new Promise<boolean>((resolve) => {
      Alert.popUp({
        buttonType: AlertConstants.YES_NO,
        caption: i18n.lang.topbar.menu.calibrate_beambox_camera,
        message: i18n.lang.tutorial.suggest_calibrate_camera_first,
        onNo: () => resolve(false),
        onYes: () => resolve(true),
      });
    });

  private async doFirstTimeCameraCalibration(): Promise<boolean> {
    const LANG = i18n.lang.tutorial;
    const askForRetry = () =>
      new Promise<boolean>((resolve) => {
        Alert.popUp({
          buttonType: AlertConstants.YES_NO,
          caption: LANG.camera_calibration_failed,
          message: LANG.ask_retry_calibration,
          onNo: async () => resolve(false),
          onYes: async () => resolve(await this.doFirstTimeCameraCalibration()),
        });
      });

    const { device } = await getDevice();

    if (!device) {
      return false;
    }

    let res: boolean;

    try {
      const deviceStatus = await checkDeviceStatus(device);

      if (!deviceStatus) {
        return false;
      }

      if (Constant.adorModels.includes(device.model)) {
        const caliRes = await showAdorCalibrationV2();

        return caliRes;
      }

      if (device.model === 'fbb2') {
        const caliRes = await showBB2Calibration();

        return caliRes;
      }

      const caliRes = await showCameraCalibration(device, false);

      return caliRes;
    } catch (e) {
      console.error(e);
      res = await askForRetry();
    }

    return res;
  }

  private showTutorial(isNewUser: boolean): Promise<boolean> {
    if (!AlertConfig.read('skip-interface-tutorial')) {
      const LANG = i18n.lang.tutorial;

      return new Promise<boolean>((resolve) => {
        Alert.popUp({
          buttonType: AlertConstants.YES_NO,
          caption: LANG.welcome,
          id: 'ask-tutorial',
          message: isNewUser ? LANG.needNewUserTutorial : LANG.needNewInterfaceTutorial,
          onNo: () => {
            AlertConfig.write('skip-interface-tutorial', true);
            resolve(false);
          },
          onYes: () => {
            const tutorialCallback = () => {
              AlertConfig.write('skip-interface-tutorial', true);
              MessageCaller.openMessage({
                content: LANG.tutorial_complete,
                level: MessageLevel.SUCCESS,
              });
              resolve(true);
            };

            if (isNewUser) {
              Tutorials.startNewUserTutorial(tutorialCallback);
            } else {
              Tutorials.startInterfaceTutorial(tutorialCallback);
            }
          },
        });
      });
    }

    return Promise.resolve(false);
  }

  private showChangeLog = () =>
    new Promise<void>((resolve) => {
      Dialog.showChangLog({ callback: resolve });
    });

  private async showQuestionnaire(): Promise<void> {
    const res = await checkQuestionnaire();

    if (!res) {
      return;
    }

    const lastQuestionnaireVersion = storage.get('questionnaire-version') || 0;

    if (lastQuestionnaireVersion >= res.version) {
      return;
    }

    let url: string = '';

    if (res.urls) {
      url = res.urls[i18n.getActiveLang()] || res.urls.en;
    }

    if (!url) {
      return;
    }

    storage.set('questionnaire-version', res.version);

    return new Promise<void>((resolve) => {
      Alert.popUp({
        buttonType: AlertConstants.YES_NO,
        caption: i18n.lang.beambox.popup.questionnaire.caption,
        iconUrl: 'img/beambox/icon-questionnaire.svg',
        id: 'questionnaire',
        message: i18n.lang.beambox.popup.questionnaire.message,
        onNo: () => {
          resolve();
        },
        onYes: () => {
          browser.open(url);
          resolve();
        },
      });
    });
  }
}

export default BeamboxInit;
