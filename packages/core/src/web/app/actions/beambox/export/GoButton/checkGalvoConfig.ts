import { sprintf } from 'sprintf-js';

import alertCaller from '@core/app/actions/alert-caller';
import { showGalvoSettings } from '@core/app/components/dialogs/promark/GalvoSettings';
import alertConstants from '@core/app/constants/alert-constants';
import { galvoModulesArray } from '@core/app/constants/layer-module/layer-modules';
import workareaManager from '@core/app/svgedit/workarea';
import type { AlertConfigKey } from '@core/helpers/api/alert-config';
import alertConfig from '@core/helpers/api/alert-config';
import type { GalvoModule } from '@core/helpers/device/galvoConfig';
import { hasGalvoConfig } from '@core/helpers/device/galvoConfig';
import { getLayersByModule, getModulesTranslations } from '@core/helpers/layer-module/layer-module-helper';
import type { IDeviceInfo } from '@core/interfaces/IDevice';
import type { ILang } from '@core/interfaces/ILang';

/**
 * Warn before running a job whose galvo head has never been configured on this machine.
 *
 * This is an early prompt, not a gate: a job can also reach the machine without passing through
 * here, so the player still has to cope with a missing config on its own.
 */
export const checkGalvoConfig = async (device: IDeviceInfo, lang: ILang): Promise<void> => {
  if (workareaManager.model !== 'fhx2galvo' || device.model !== 'fhx2galvo') return;

  const translations = getModulesTranslations();

  for (const module of galvoModulesArray) {
    const alertConfigKey = `skip-galvo-config-${module}-warning`;

    if (alertConfig.read(alertConfigKey as AlertConfigKey)) continue;

    const moduleLayers = [...getLayersByModule([module], { checkRepeat: true, checkVisible: true })];
    const hasContent = moduleLayers.some((g) =>
      Boolean(g.querySelector(':not(title):not(filter):not(g):not(feColorMatrix)')),
    );

    if (!hasContent || (await hasGalvoConfig(module as GalvoModule))) continue;

    const doSetup = await new Promise((resolve) => {
      alertCaller.popUp({
        buttonType: alertConstants.CONFIRM_CANCEL,
        caption: lang.layer_module.notification.galvoNotConfiguredTitle,
        id: 'galvo-config-warning',
        message: sprintf(lang.layer_module.notification.galvoNotConfiguredMsg, translations[module]),
        onCancel: () => resolve(false),
        onConfirm: () => resolve(true),
      });
    });

    if (doSetup) {
      await showGalvoSettings(device, module as GalvoModule);
    }
  }
};
