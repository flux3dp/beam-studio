/* eslint-disable class-methods-use-this */
import { sprintf } from 'sprintf-js';

import Alert from 'app/actions/alert-caller';
import AlertConfig from 'helpers/api/alert-config';
import AlertConstants from 'app/constants/alert-constants';
import BeamboxInit from 'app/actions/beambox/beambox-init';
import i18n from 'helpers/i18n';

class ElectronBeamboxInit extends BeamboxInit {
  async showStartUpDialogs(): Promise<void> {
    await super.showStartUpDialogs();
    this.checkOSVersion();
  }

  private checkOSVersion(): void {
    const LANG = i18n.lang.beambox;
    if (!AlertConfig.read('skip_os_version_warning')) {
      if (window.os === 'MacOS') {
        try {
          const osVersion = /(?<=Mac OS X )[._\d]+/.exec(navigator.userAgent)[0];
          const version = osVersion.split('_').map((v) => parseInt(v, 10));
          if (version[0] === 10 && version[1] < 13) {
            Alert.popUp({
              id: 'os_version_warning',
              message: sprintf(i18n.lang.message.unsupport_osx_version, osVersion),
              type: AlertConstants.SHOW_POPUP_WARNING,
              checkbox: {
                text: LANG.popup.dont_show_again,
                callbacks: () => AlertConfig.write('skip_os_version_warning', true),
              },
            });
          }
        } catch (e) {
          console.error('Fail to get MacOS Version');
        }
      } else if (window.os === 'Windows') {
        const windowsVersionStrings = [
          { s: 'Windows 10', r: /(Windows 10.0|Windows NT 10.0)/, shouldAlert: false },
          { s: 'Windows 8.1', r: /(Windows 8.1|Windows NT 6.3)/, shouldAlert: true },
          { s: 'Windows 8', r: /(Windows 8|Windows NT 6.2)/, shouldAlert: true },
          { s: 'Windows 7', r: /(Windows 7|Windows NT 6.1)/, shouldAlert: true },
          { s: 'Windows Vista', r: /Windows NT 6.0/, shouldAlert: true },
          { s: 'Windows Server 2003', r: /Windows NT 5.2/, shouldAlert: true },
          { s: 'Windows XP', r: /(Windows NT 5.1|Windows XP)/, shouldAlert: true },
          { s: 'Windows 2000', r: /(Windows NT 5.0|Windows 2000)/, shouldAlert: true },
          { s: 'Windows ME', r: /(Win 9x 4.90|Windows ME)/, shouldAlert: true },
          { s: 'Windows 98', r: /(Windows 98|Win98)/, shouldAlert: true },
          { s: 'Windows 95', r: /(Windows 95|Win95|Windows_95)/, shouldAlert: true },
          { s: 'Windows NT 4.0', r: /(Windows NT 4.0|WinNT4.0|WinNT)/, shouldAlert: true },
          { s: 'Windows CE', r: /Windows CE/, shouldAlert: true },
          { s: 'Windows 3.11', r: /Win16/, shouldAlert: true },
        ];
        let shouldAlert = false;
        let osVersion;
        for (let i = 0; i < windowsVersionStrings.length; i += 1) {
          const versionString = windowsVersionStrings[i];
          if (versionString.r.test(navigator.userAgent)) {
            osVersion = versionString.s;
            shouldAlert = versionString.shouldAlert;
            break;
          }
        }
        if (shouldAlert) {
          Alert.popUp({
            id: 'os_version_warning',
            message: sprintf(i18n.lang.message.unsupport_win_version, osVersion),
            type: AlertConstants.SHOW_POPUP_WARNING,
            checkbox: {
              text: LANG.popup.dont_show_again,
              callbacks: () => AlertConfig.write('skip_os_version_warning', true),
            },
          });
        }
      }
    }
  }
}

export default ElectronBeamboxInit;
