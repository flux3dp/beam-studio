import Alert from '@core/app/actions/alert-caller';
import { migrate } from '@core/app/actions/beambox/beambox-preference';
import Tutorials from '@core/app/actions/beambox/tutorials';
import { boundaryDrawer } from '@core/app/actions/canvas/boundaryDrawer';
import Dialog from '@core/app/actions/dialog-caller';
import MessageCaller, { MessageLevel } from '@core/app/actions/message-caller';
import tabController from '@core/app/actions/tabController';
import AlertConstants from '@core/app/constants/alert-constants';
import { getGestureIntroduction } from '@core/app/constants/media-tutorials';
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
import { initializeAllFonts } from '@core/helpers/fonts/fontInitialization';
import i18n from '@core/helpers/i18n';
import {
  askAndInitSentry,
  initializeDefaultFont,
  showFirstCalibrationDialog,
  showUpdateFontConvertDialog,
  showUpdatePathEngineDialog,
} from '@core/helpers/initialization';
import isWeb from '@core/helpers/is-web';
import { prefetchAiConfig } from '@core/helpers/query';
import registerImageSymbolEvents from '@core/helpers/symbol-helper/registerImageSymbolEvents';
import { isMobile } from '@core/helpers/system-helper';
import menu from '@core/implementations/menu';
import storage from '@core/implementations/storage';

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
    initializeDefaultFont();

    menu.init();
    autoSaveHelper.init();
    fluxId.init().then(() => {
      prefetchAiConfig().catch((err) => {
        console.warn('[AI Config] Background prefetch failed:', err);
      });
    });
    cloud.recordActivity();
    alertHelper.registerAlertEvents();
    boundaryDrawer.registerEvents();
    registerImageSymbolEvents();
    initCurText();

    // WebSocket for Adobe Illustrator Plug-In
    aiExtension.init();

    if (isWeb() || tabController.getIsWelcomeTab()) {
      discoverManager.setMaster(true);
      setTimeout(recordMachines, 10000);
    }
  }

  async showStartUpDialogs(): Promise<void> {
    await askAndInitSentry();

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

    await showFirstCalibrationDialog(isNewUser);

    if (hasMachineConnection && !isMobile()) {
      await this.showTutorial(isNewUser);
    }

    if (!isNewUser) {
      const lastInstalledVersion = storage.get('last-installed-version');

      if (window.FLUX.version !== lastInstalledVersion) {
        await this.showChangeLog();
      }
    }

    await showUpdateFontConvertDialog(isNewUser);
    await showUpdatePathEngineDialog(isNewUser);

    if (isNewUser && globalPreference['use-auto-exposure'] === undefined) {
      globalPreference.set('use-auto-exposure', true);
    }

    // ratingHelper.init();
    announcementHelper.init(isNewUser);
    storage.removeAt('new-user');
    storage.set('last-installed-version', window.FLUX.version);
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
