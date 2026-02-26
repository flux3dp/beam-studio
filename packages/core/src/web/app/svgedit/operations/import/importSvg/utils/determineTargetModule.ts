import dialogCaller from '@core/app/actions/dialog-caller';
import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import { getDefaultModule, getPrintingModule } from '@core/helpers/layer-module/layer-module-helper';
import type { ILang } from '@core/interfaces/ILang';

export async function determineTargetModule(
  currentModule: LayerModuleType | null,
  hasWorkareaModule: boolean,
  lang: ILang,
): Promise<LayerModuleType | null> {
  if (currentModule) return currentModule;

  const defaultModule = getDefaultModule();

  if (hasWorkareaModule) {
    const id = 'import-module';
    const printingModule = getPrintingModule();

    if (!printingModule || defaultModule === printingModule) {
      return defaultModule;
    }

    return dialogCaller.showRadioSelectDialog({
      defaultValue: useGlobalPreferenceStore.getState()[id],
      id,
      options: [
        { label: lang.layer_module.general_laser, value: defaultModule },
        { label: lang.layer_module.printing, value: printingModule },
      ],
      title: lang.beambox.popup.select_import_module,
    });
  }

  return defaultModule; // Default fallback
}
