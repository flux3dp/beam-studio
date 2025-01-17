/* eslint-disable class-methods-use-this */
import Alert from 'app/actions/alert-caller';
import AlertConfig from 'helpers/api/alert-config';
import AlertConstants from 'app/constants/alert-constants';
import aiExtension from 'helpers/api/ai-extension';
import alertHelper from 'helpers/alert-helper';
import announcementHelper from 'helpers/announcement-helper';
import autoSaveHelper from 'helpers/auto-save-helper';
import BeamboxPreference, { migrate } from 'app/actions/beambox/beambox-preference';
import BeamboxStore from 'app/stores/beambox-store';
import browser from 'implementations/browser';
import checkDeviceStatus from 'helpers/check-device-status';
import checkQuestionnaire from 'helpers/check-questionnaire';
import cloud from 'helpers/api/cloud';
import Constant from 'app/actions/beambox/constant';
import Dialog from 'app/actions/dialog-caller';
import fluxId from 'helpers/api/flux-id';
import FontConstants from 'app/constants/font-constants';
import fontHelper from 'helpers/fonts/fontHelper';
import getDevice from 'helpers/device/get-device';
import i18n from 'helpers/i18n';
import isWeb from 'helpers/is-web';
import MessageCaller, { MessageLevel } from 'app/actions/message-caller';
import menu from 'implementations/menu';
import ratingHelper from 'helpers/rating-helper';
import sentryHelper from 'helpers/sentry-helper';
import storage from 'implementations/storage';
import Tutorials from 'app/actions/beambox/tutorials';
import updateFontConvert from 'app/components/dialogs/updateFontConvert';
import workareaManager from 'app/svgedit/workarea';
import { checkConnection } from 'helpers/api/discover';
import { gestureIntroduction } from 'app/constants/media-tutorials';
import { getSupportInfo } from 'app/constants/add-on';
import { IFont } from 'interfaces/IFont';
import { isMobile } from 'helpers/system-helper';
import { showAdorCalibrationV2 } from 'app/components/dialogs/camera/AdorCalibrationV2';
import { showBB2Calibration } from 'app/components/dialogs/camera/BB2Calibration';
import { showCameraCalibration } from 'app/views/beambox/Camera-Calibration';

class BeamboxInit {
  constructor() {
    migrate();
    const workarea = BeamboxPreference.read('workarea');
    const supportInfo = getSupportInfo(workarea);
    if (supportInfo.autoFocus) {
      const defaultAutoFocus = BeamboxPreference.read('default-autofocus');
      BeamboxPreference.write('enable-autofocus', defaultAutoFocus);
    } else {
      BeamboxPreference.write('enable-autofocus', false);
    }
    if (supportInfo.hybridLaser) {
      const defaultDiode = BeamboxPreference.read('default-diode');
      BeamboxPreference.write('enable-diode', defaultDiode);
    } else {
      BeamboxPreference.write('enable-diode', false);
    }

    let defaultBorderless = BeamboxPreference.read('default-borderless');
    if (defaultBorderless === undefined) {
      BeamboxPreference.write('default-borderless', BeamboxPreference.read('borderless'));
      defaultBorderless = BeamboxPreference.read('default-borderless');
    }
    if (supportInfo.openBottom) {
      BeamboxPreference.write('borderless', defaultBorderless);
    } else {
      BeamboxPreference.write('borderless', false);
    }
    if (!supportInfo.rotary) {
      BeamboxPreference.write('rotary_mode', 0);
    }

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
    alertHelper.registerAlertEvents(Alert.popUp);

    // WebSocket for Adobe Illustrator Plug-In
    aiExtension.init();
  }

  async showStartUpDialogs(): Promise<void> {
    await this.askAndInitSentry();
    const isNewUser = !!storage.get('new-user');
    const defaultFontConvert = BeamboxPreference.read('font-convert');
    const hasMachineConnection = checkConnection();
    if (isWeb() && navigator.maxTouchPoints >= 1) {
      const res = await fluxId.getPreference('did_gesture_tutorial', true);
      if (res && !res.error) {
        if (res.status === 'ok' && !res.value) {
          await Dialog.showMediaTutorial(gestureIntroduction);
          await fluxId.setPreference({ did_gesture_tutorial: true });
        } else if (
          res.status === 'error' &&
          res.info === 'NOT_LOGGED_IN' &&
          !storage.get('did-gesture-tutorial')
        ) {
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
    if (defaultFontConvert === undefined) {
      if (isNewUser) BeamboxPreference.write('font-convert', '2.0');
      else {
        const version = await updateFontConvert();
        BeamboxPreference.write('font-convert', version);
      }
    }
    const autoSwitchTab = BeamboxPreference.read('auto-switch-tab');
    if (autoSwitchTab === undefined) {
      if (isNewUser) BeamboxPreference.write('auto-switch-tab', false);
      else {
        const res = await new Promise<boolean>((resolve) => {
          Alert.popUp({
            caption: i18n.lang.beambox.popup.auto_switch_tab.title,
            message: i18n.lang.beambox.popup.auto_switch_tab.message,
            buttonType: AlertConstants.YES_NO,
            onYes: () => resolve(true),
            onNo: () => resolve(false),
          });
        });
        BeamboxPreference.write('auto-switch-tab', res);
      }
    }

    ratingHelper.init();
    announcementHelper.init(isNewUser);
    storage.removeAt('new-user');
    storage.set('last-installed-version', window.FLUX.version);
  }

  private displayGuides(): void {
    document.getElementById('horizontal_guide')?.remove();
    document.getElementById('vertical_guide')?.remove();
    const { NS, utilities } = window.svgedit;
    const guidesLines = (() => {
      const svgdoc = document.getElementById('svgcanvas').ownerDocument;
      const linesGroup = svgdoc.createElementNS(NS.SVG, 'svg');
      const lineVertical = svgdoc.createElementNS(NS.SVG, 'line');
      const lineHorizontal = svgdoc.createElementNS(NS.SVG, 'line');
      const { width, height } = workareaManager;
      utilities.assignAttributes(linesGroup, {
        id: 'guidesLines',
        width: '100%',
        height: '100%',
        x: 0,
        y: 0,
        viewBox: `0 0 ${width} ${height}`,
        style: 'pointer-events: none',
      });

      utilities.assignAttributes(lineHorizontal, {
        id: 'horizontal_guide',
        x1: 0,
        x2: width,
        y1: BeamboxPreference.read('guide_y0') * 10,
        y2: BeamboxPreference.read('guide_y0') * 10,
        stroke: '#000',
        'stroke-width': '2',
        'stroke-opacity': 0.8,
        'stroke-dasharray': '5, 5',
        'vector-effect': 'non-scaling-stroke',
        fill: 'none',
        style: 'pointer-events:none',
      });

      utilities.assignAttributes(lineVertical, {
        id: 'vertical_guide',
        x1: BeamboxPreference.read('guide_x0') * 10,
        x2: BeamboxPreference.read('guide_x0') * 10,
        y1: 0,
        y2: height,
        stroke: '#000',
        'stroke-width': '2',
        'stroke-opacity': 0.8,
        'stroke-dasharray': '5, 5',
        'vector-effect': 'non-scaling-stroke',
        fill: 'none',
        style: 'pointer-events:none',
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
    if (web) defaultFontFamily = 'Noto Sans';
    else if (os === 'Linux') defaultFontFamily = 'Ubuntu';
    if (FontConstants[lang]) {
      if (web && FontConstants[lang].web) {
        defaultFontFamily = FontConstants[lang].web;
      } else if (FontConstants[lang][os]) {
        defaultFontFamily = FontConstants[lang][os];
      }
    }
    const fonts = fontHelper.findFonts({ family: defaultFontFamily });
    if (fonts.length > 0) {
      const defaultFont: IFont = fonts.filter((font) => font.style === 'Regular')[0] || fonts[0];
      storage.set('default-font', {
        family: defaultFont.family,
        postscriptName: defaultFont.postscriptName,
        style: defaultFont.style,
      });
    }
  }

  private async askAndInitSentry(): Promise<void> {
    const enableSentry = storage.get('enable-sentry');
    if (enableSentry === undefined || enableSentry === '') {
      await new Promise<void>((resolve) => {
        const LANG = i18n.lang;
        Alert.popUp({
          id: 'ask-sentry',
          caption: LANG.beambox.popup.sentry.title,
          iconUrl: 'img/beambox/icon-analyze.svg',
          message: LANG.beambox.popup.sentry.message,
          buttonType: AlertConstants.YES_NO,
          onYes: () => {
            storage.set('enable-sentry', 1);
            sentryHelper.initSentry();
            resolve();
          },
          onNo: () => {
            storage.set('enable-sentry', 0);
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
    const shouldShow = web
      ? hasMachineConnection && !hasDoneFirstCali
      : isNewUser || !hasDoneFirstCali;
    let caliRes = true;
    if (shouldShow) {
      const res = await this.askFirstTimeCameraCalibration();
      AlertConfig.write('done-first-cali', true);
      if (res) {
        caliRes = await this.doFirstTimeCameraCalibration();
      } else return false;
    }
    return caliRes;
  };

  private askFirstTimeCameraCalibration = () =>
    new Promise<boolean>((resolve) => {
      Alert.popUp({
        caption: i18n.lang.topbar.menu.calibrate_beambox_camera,
        message: i18n.lang.tutorial.suggest_calibrate_camera_first,
        buttonType: AlertConstants.YES_NO,
        onNo: () => resolve(false),
        onYes: () => resolve(true),
      });
    });

  private async doFirstTimeCameraCalibration(): Promise<boolean> {
    const LANG = i18n.lang.tutorial;
    const askForRetry = () =>
      new Promise<boolean>((resolve) => {
        Alert.popUp({
          caption: LANG.camera_calibration_failed,
          message: LANG.ask_retry_calibration,
          buttonType: AlertConstants.YES_NO,
          onYes: async () => resolve(await this.doFirstTimeCameraCalibration()),
          onNo: async () => resolve(false),
        });
      });

    const { device } = await getDevice();
    if (!device) return false;
    let res: boolean;
    try {
      const deviceStatus = await checkDeviceStatus(device);
      if (!deviceStatus) return false;
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
          id: 'ask-tutorial',
          caption: LANG.welcome,
          message: isNewUser ? LANG.needNewUserTutorial : LANG.needNewInterfaceTutorial,
          buttonType: AlertConstants.YES_NO,
          onYes: () => {
            const tutorialCallback = () => {
              AlertConfig.write('skip-interface-tutorial', true);
              MessageCaller.openMessage({
                level: MessageLevel.SUCCESS,
                content: LANG.tutorial_complete,
              });
              resolve(true);
            };
            if (isNewUser) {
              Tutorials.startNewUserTutorial(tutorialCallback);
            } else {
              Tutorials.startInterfaceTutorial(tutorialCallback);
            }
          },
          onNo: () => {
            AlertConfig.write('skip-interface-tutorial', true);
            resolve(false);
          },
        });
      });
    }
    return null;
  }

  private showChangeLog = () =>
    new Promise<void>((resolve) => {
      Dialog.showChangLog({ callback: resolve });
    });

  private async showQuestionnaire(): Promise<void> {
    const res = await checkQuestionnaire();
    if (!res) return null;
    const lastQuestionnaireVersion = storage.get('questionnaire-version') || 0;
    if (lastQuestionnaireVersion >= res.version) return null;
    let url: string;
    if (res.urls) {
      url = res.urls[i18n.getActiveLang()] || res.urls.en;
    }
    if (!url) return null;

    storage.set('questionnaire-version', res.version);

    return new Promise<void>((resolve) => {
      Alert.popUp({
        id: 'qustionnaire',
        caption: i18n.lang.beambox.popup.questionnaire.caption,
        message: i18n.lang.beambox.popup.questionnaire.message,
        iconUrl: 'img/beambox/icon-questionnaire.svg',
        buttonType: AlertConstants.YES_NO,
        onYes: () => {
          browser.open(url);
          resolve();
        },
        onNo: () => {
          resolve();
        },
      });
    });
  }
}

export default BeamboxInit;
