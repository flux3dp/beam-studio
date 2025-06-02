import beamboxPreference from '@core/app/actions/beambox/beambox-preference';
import dialogCaller from '@core/app/actions/dialog-caller';
import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import { getDefaultLaserModule } from '@core/helpers/layer-module/layer-module-helper';
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
      defaultValue: beamboxPreference.read(id),
      id,
      options: [
        { label: lang.layer_module.general_laser, value: getDefaultLaserModule() },
        // TODO: should this check workarea for 4c?
        { label: lang.layer_module.printing, value: LayerModule.PRINTER },
      ],
      title: lang.beambox.popup.select_import_module,
    });
  }

  return LayerModule.LASER_10W_DIODE; // Default fallback
}
