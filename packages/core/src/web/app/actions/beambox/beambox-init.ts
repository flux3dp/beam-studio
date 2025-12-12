import Alert from '@core/app/actions/alert-caller';
import { migrate } from '@core/app/actions/beambox/beambox-preference';
import Tutorials from '@core/app/actions/beambox/tutorials';
import { boundaryDrawer } from '@core/app/actions/canvas/boundaryDrawer';
import Dialog from '@core/app/actions/dialog-caller';
import MessageCaller, { MessageLevel } from '@core/app/actions/message-caller';
import tabController from '@core/app/actions/tabController';
import { calibrateCamera } from '@core/app/components/dialogs/camera';
import updateFontConvert from '@core/app/components/dialogs/updateFontConvert';
import AlertConstants from '@core/app/constants/alert-constants';
import FontConstants from '@core/app/constants/font-constants';
import { getGestureIntroduction } from '@core/app/constants/media-tutorials';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import { getStorage, setStorage } from '@core/app/stores/storageStore';
import { initCurText } from '@core/app/svgedit/text/textedit';
import alertHelper from '@core/helpers/alert-helper';
import announcementHelper from '@core/helpers/announcement-helper';
import aiExtension from '@core/helpers/api/ai-extension';
import AlertConfig from '@core/helpers/api/alert-config';
import cloud from '@core/helpers/api/cloud';
import { discoverManager } from '@core/helpers/api/discover';
import fluxId, { recordMachines } from '@core/helpers/api/flux-id';
import autoSaveHelper from '@core/helpers/auto-save-helper';
import getDevice from '@core/helpers/device/get-device';
import fontHelper from '@core/helpers/fonts/fontHelper';
import { initializeAllFonts } from '@core/helpers/fonts/fontInitialization';
import i18n from '@core/helpers/i18n';
import isWeb from '@core/helpers/is-web';
import { prefetchAiConfig } from '@core/helpers/query';
import { regulateEngraveDpiOption } from '@core/helpers/regulateEngraveDpi';
import sentryHelper from '@core/helpers/sentry-helper';
import registerImageSymbolEvents from '@core/helpers/symbol-helper/registerImageSymbolEvents';
import { isMobile } from '@core/helpers/system-helper';
import menu from '@core/implementations/menu';
import storage from '@core/implementations/storage';
import type { IDefaultFont } from '@core/interfaces/IFont';

class BeamboxInit {
  constructor() {
    migrate();

    if (!getStorage('default-units')) {
      const { timeZone } = Intl.DateTimeFormat().resolvedOptions();
      const isEn = navigator.language.slice(0, 2).toLocaleLowerCase() === 'en';

      if (timeZone.startsWith('America') && isEn) {
        setStorage('default-units', 'inches');
      }
    }

    // Initialize all fonts (local, Google, web) early in the startup process
    const activeLang = i18n.getActiveLang();

    initializeAllFonts(activeLang);

    if (!getStorage('default-font')) {
      this.initDefaultFont();
    }

    menu.init();
    autoSaveHelper.init();
    fluxId.init();
    cloud.recordActivity();
    alertHelper.registerAlertEvents();
    boundaryDrawer.registerEvents();
    registerImageSymbolEvents();
    initCurText();
    prefetchAiConfig().catch((err) => {
      console.warn('[AI Config] Background prefetch failed:', err);
    });

    useDocumentStore
      .getState()
      .set(
        'engrave_dpi',
        regulateEngraveDpiOption(useDocumentStore.getState().workarea, useDocumentStore.getState().engrave_dpi),
      );

    // WebSocket for Adobe Illustrator Plug-In
    aiExtension.init();

    if (isWeb() || tabController.getIsWelcomeTab()) {
      discoverManager.setMaster(true);
      setTimeout(recordMachines, 10000);
    }
  }

  async showStartUpDialogs(): Promise<void> {
    await this.askAndInitSentry();

    const globalPreference = useGlobalPreferenceStore.getState();
    const isNewUser = Boolean(storage.get('new-user'));
    const hasMachineConnection = discoverManager.checkConnection();

    if (isWeb() && navigator.maxTouchPoints >= 1) {
      const res = await fluxId.getPreference('did_gesture_tutorial', true);

      if (res && !res.error) {
        if (res.status === 'ok' && !res.value) {
          await Dialog.showMediaTutorial(getGestureIntroduction());
          await fluxId.setPreference({ did_gesture_tutorial: true });
        } else if (res.status === 'error' && res.info === 'NOT_LOGGED_IN' && !storage.get('did-gesture-tutorial')) {
          await Dialog.showMediaTutorial(getGestureIntroduction());
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
    }

    if (!globalPreference['font-convert'] && !isNewUser) {
      globalPreference.set('font-convert', await updateFontConvert());
    }

    if (isNewUser && globalPreference['use-auto-exposure'] === undefined) {
      globalPreference.set('use-auto-exposure', true);
    }

    // ratingHelper.init();
    announcementHelper.init(isNewUser);
    storage.removeAt('new-user');
    storage.set('last-installed-version', window.FLUX.version);
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

    setStorage('default-font', {
      family: defaultFont.family,
      postscriptName: defaultFont.postscriptName,
      style: defaultFont.style,
    });
  }

  private async askAndInitSentry(): Promise<void> {
    const enableSentry = storage.get('enable-sentry');

    if (enableSentry === null) {
      await new Promise<void>((resolve) => {
        Alert.popUp({
          buttonType: AlertConstants.YES_NO,
          caption: i18n.lang.beambox.popup.sentry.title,
          iconUrl: 'img/beambox/icon-analyze.svg',
          id: 'ask-sentry',
          message: i18n.lang.beambox.popup.sentry.message,
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
    let hasMachineConnection = discoverManager.checkConnection();
    // in web, wait for websocket connection
    const web = isWeb();

    if (web && !hasDoneFirstCali && !hasMachineConnection) {
      await new Promise((r) => setTimeout(r, 1000));
      hasMachineConnection = discoverManager.checkConnection();
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
    const askForRetry = () =>
      new Promise<boolean>((resolve) => {
        const t = i18n.lang.tutorial;

        Alert.popUp({
          buttonType: AlertConstants.YES_NO,
          caption: t.camera_calibration_failed,
          message: t.ask_retry_calibration,
          onNo: async () => resolve(false),
          onYes: async () => resolve(await this.doFirstTimeCameraCalibration()),
        });
      });

    const { device } = await getDevice();

    if (!device) return false;

    try {
      return await calibrateCamera(device);
    } catch (e) {
      console.error(e);

      return await askForRetry();
    }
  }

  private showTutorial(isNewUser: boolean): Promise<boolean> {
    if (!AlertConfig.read('skip-interface-tutorial')) {
      const t = i18n.lang.tutorial;

      return new Promise<boolean>((resolve) => {
        Alert.popUp({
          buttonType: AlertConstants.YES_NO,
          caption: t.welcome,
          id: 'ask-tutorial',
          message: isNewUser ? t.needNewUserTutorial : t.needNewInterfaceTutorial,
          onNo: () => {
            AlertConfig.write('skip-interface-tutorial', true);
            resolve(false);
          },
          onYes: () => {
            const tutorialCallback = () => {
              AlertConfig.write('skip-interface-tutorial', true);
              MessageCaller.openMessage({
                content: t.tutorial_complete,
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
}

export default BeamboxInit;
