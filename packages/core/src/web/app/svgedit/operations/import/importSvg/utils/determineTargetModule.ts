import dialogCaller from '@core/app/actions/dialog-caller';
import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import { getDefaultLaserModule, getPrintingModule } from '@core/helpers/layer-module/layer-module-helper';
import type { ILang } from '@core/interfaces/ILang';

export async function determineTargetModule(
  currentModule: LayerModuleType | null,
  hasWorkareaModule: boolean,
  lang: ILang,
): Promise<LayerModuleType | null> {
  if (currentModule) return currentModule;

  if (hasWorkareaModule) {
    const id = 'import-module';

    return dialogCaller.showRadioSelectDialog({
      defaultValue: useGlobalPreferenceStore.getState()[id],
      id,
      options: [
        { label: lang.layer_module.general_laser, value: getDefaultLaserModule() },
        { label: lang.layer_module.printing, value: getPrintingModule() },
      ],
      title: lang.beambox.popup.select_import_module,
    });
  }

  return LayerModule.LASER_10W_DIODE; // Default fallback
}
