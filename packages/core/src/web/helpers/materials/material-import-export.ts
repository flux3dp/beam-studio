import alertCaller from '@core/app/actions/alert-caller';
import alertConstants from '@core/app/constants/alert-constants';
import { useMaterialStore } from '@core/app/stores/materialStore';
import type { MaterialLibraryExport } from '@core/app/stores/materialStore/types';
import { getOS } from '@core/helpers/getOS';
import i18n from '@core/helpers/i18n';
import dialog from '@core/implementations/dialog';
import type { Preset } from '@core/interfaces/ILayerConfig';

/**
 * Export the user's material library (user materials, catalog additions, customized
 * overlays, disabled ids) as a flux-material-library JSON file.
 */
export const exportMaterialLibrary = async (): Promise<void> => {
  const isLinux = getOS() === 'Linux';
  const getContent = () => JSON.stringify(useMaterialStore.getState().getExportData());

  await dialog.writeFileDialog(getContent, i18n.lang.beambox.material_browser.export, isLinux ? '.json' : '', [
    { extensions: ['json'], name: getOS() === 'MacOS' ? 'JSON (*.json)' : 'JSON' },
    { extensions: ['*'], name: i18n.lang.topmenu.file.all_files },
  ]);
};

interface LegacyPresetFile {
  customizedLaserConfigs?: Preset[];
  defaultLaserConfigsInUse?: Record<string, boolean>;
  presets?: Preset[];
}

const importParsed = (parsed: LegacyPresetFile | MaterialLibraryExport): boolean => {
  const store = useMaterialStore.getState();

  if ((parsed as MaterialLibraryExport).type === 'flux-material-library') {
    store.importData(parsed as MaterialLibraryExport);

    return true;
  }

  // Legacy preset files: current ({ presets }) and <= 2.3.9 ({ customizedLaserConfigs }).
  // Converted into bucket presets — the legacy 'presets' storage key is never written.
  const legacy = parsed as LegacyPresetFile;
  const legacyPresets =
    legacy.presets ??
    legacy.customizedLaserConfigs?.map((config) => ({
      ...config,
      hide: legacy.defaultLaserConfigsInUse?.[config.name ?? ''] === false,
    }));

  if (!legacyPresets) return false;

  store.importLegacyPresets(legacyPresets);

  return true;
};

/**
 * Import a material library (or legacy preset export) into the user's library.
 * Accepts a Blob (canvas drag-drop) or opens a file dialog.
 */
export const importMaterialLibrary = async (file?: Blob): Promise<boolean> => {
  const target =
    file ??
    (await dialog.getFileFromDialog({
      filters: [{ extensions: ['json', 'JSON'], name: 'JSON' }],
    }));

  if (!target) return false;

  return new Promise((resolve) => {
    alertCaller.popUp({
      buttonType: alertConstants.CONFIRM_CANCEL,
      message: i18n.lang.beambox.material_browser.sure_to_import,
      onCancel: () => resolve(false),
      onConfirm: () => {
        const reader = new FileReader();

        reader.onloadend = (event) => {
          try {
            const parsed = JSON.parse(event.target!.result as string) as LegacyPresetFile | MaterialLibraryExport;

            resolve(importParsed(parsed));
          } catch (error) {
            console.error('Failed to import material library:', error);
            resolve(false);
          }
        };
        reader.readAsText(target);
      },
    });
  });
};
