import { sprintf } from 'sprintf-js';

import alertCaller from '@core/app/actions/alert-caller';
import BeamboxInit from '@core/app/actions/beambox/beambox-init';
import alertConstants from '@core/app/constants/alert-constants';
import alertConfig from '@core/helpers/api/alert-config';
import { getOS } from '@core/helpers/getOS';
import i18n from '@core/helpers/i18n';
import browser from '@core/implementations/browser';
import os, { macKernelVersionMap } from '@core/implementations/os';

class ElectronBeamboxInit extends BeamboxInit {
  async showStartUpDialogs(): Promise<void> {
    await super.showStartUpDialogs();
    this.checkMacOSBuild();
    this.checkOSVersion();
  }

  private checkOSVersion(): void {
    const { alert: tAlert, message: tMessage } = i18n.lang;
    const osName = getOS();

    if (!alertConfig.read('skip_os_version_warning')) {
      if (osName === 'MacOS') {
        try {
          const release = os.release() as string;
          const version = release.split('.').map((v) => Number.parseInt(v, 10));

          if (version[0] < 22) {
            const osVersion = macKernelVersionMap[release] || `Kernel Release: ${release}`;

            alertCaller.popUp({
              checkbox: {
                callbacks: () => alertConfig.write('skip_os_version_warning', true),
                text: tAlert.dont_show_again,
              },
              message: sprintf(tMessage.unsupport_osx_version, osVersion),
              type: alertConstants.SHOW_POPUP_WARNING,
            });
          }
        } catch {
          console.error('Fail to get MacOS Version');
        }
      } else if (osName === 'Windows') {
        const windowsVersionStrings = [
          { r: /(Windows 10.0|Windows NT 10.0)/, s: 'Windows 10', shouldAlert: false },
          { r: /(Windows 8.1|Windows NT 6.3)/, s: 'Windows 8.1', shouldAlert: true },
          { r: /(Windows 8|Windows NT 6.2)/, s: 'Windows 8', shouldAlert: true },
          { r: /(Windows 7|Windows NT 6.1)/, s: 'Windows 7', shouldAlert: true },
          { r: /Windows NT 6.0/, s: 'Windows Vista', shouldAlert: true },
          { r: /Windows NT 5.2/, s: 'Windows Server 2003', shouldAlert: true },
          { r: /(Windows NT 5.1|Windows XP)/, s: 'Windows XP', shouldAlert: true },
          { r: /(Windows NT 5.0|Windows 2000)/, s: 'Windows 2000', shouldAlert: true },
          { r: /(Win 9x 4.90|Windows ME)/, s: 'Windows ME', shouldAlert: true },
          { r: /(Windows 98|Win98)/, s: 'Windows 98', shouldAlert: true },
          { r: /(Windows 95|Win95|Windows_95)/, s: 'Windows 95', shouldAlert: true },
          { r: /(Windows NT 4.0|WinNT4.0|WinNT)/, s: 'Windows NT 4.0', shouldAlert: true },
          { r: /Windows CE/, s: 'Windows CE', shouldAlert: true },
          { r: /Win16/, s: 'Windows 3.11', shouldAlert: true },
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
          alertCaller.popUp({
            checkbox: {
              callbacks: () => alertConfig.write('skip_os_version_warning', true),
              text: tAlert.dont_show_again,
            },
            message: sprintf(tMessage.unsupport_win_version, osVersion),
            type: alertConstants.SHOW_POPUP_WARNING,
          });
        }
      }
    }
  }

  private checkMacOSBuild(): void {
    if (getOS() !== 'MacOS') return;

    const arch = os.arch();
    const cpus = os.cpus();

    if (arch === 'x64' && cpus.some((cpu) => cpu.model.includes('Apple'))) {
      const t = i18n.lang.message.mac_os_arch_mismatch;

      alertCaller.popUp({
        buttonLabels: [t.download_center],
        buttonType: alertConstants.CUSTOM_CANCEL,
        callbacks: () => browser.open(i18n.lang.topbar.menu.link.downloads),
        caption: t.caption,
        message: t.message,
        type: alertConstants.SHOW_POPUP_WARNING,
      });
    }
  }
}

export default ElectronBeamboxInit;
