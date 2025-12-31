import * as React from 'react';

import SettingSwitch from '@core/app/components/settings/components/SettingSwitch';
import SettingUnitInput from '@core/app/components/settings/components/SettingUnitInput';
import PathInput, { InputType } from '@core/app/widgets/PathInput';
import isWeb from '@core/helpers/is-web';
import useI18n from '@core/helpers/useI18n';
import type { AutoSaveConfig } from '@core/interfaces/AutoSaveConfig';

import SettingFormItem from './components/SettingFormItem';

interface Props {
  editingAutosaveConfig: AutoSaveConfig;
  setEditingAutosaveConfig: (config: AutoSaveConfig) => void;
  setWarnings: (warnings: Record<string, string>) => void;
  warnings: Record<string, string>;
}

function AutoSave({
  editingAutosaveConfig,
  setEditingAutosaveConfig,
  setWarnings,
  warnings,
}: Props): null | React.JSX.Element {
  const lang = useI18n();

  if (isWeb()) return null;

  return (
    <>
      <SettingSwitch
        checked={editingAutosaveConfig.enabled}
        id="set-auto-save"
        label={lang.settings.autosave_enabled}
        onChange={(enabled) => setEditingAutosaveConfig({ ...editingAutosaveConfig, enabled })}
      />
      <SettingFormItem
        id="auto-save-directory"
        label={lang.settings.autosave_path}
        warning={warnings.autosave_directory}
      >
        <PathInput
          buttonTitle={lang.general.choose_folder}
          data-id="location-input"
          defaultValue={editingAutosaveConfig.directory}
          error={Boolean(warnings.autosave_directory)}
          forceValidValue={false}
          getValue={(directory: string, isValid: boolean) => {
            if (!isValid) {
              warnings.autosave_directory = lang.settings.autosave_path_not_correct;
            } else {
              delete warnings.autosave_directory;
            }

            setEditingAutosaveConfig({ ...editingAutosaveConfig, directory });
            setWarnings(warnings);
          }}
          type={InputType.FOLDER}
        />
      </SettingFormItem>
      <SettingFormItem id="auto-save-interval" label={lang.settings.autosave_interval}>
        <SettingUnitInput
          id="save-every"
          max={60}
          min={1}
          onChange={(timeInterval) => setEditingAutosaveConfig({ ...editingAutosaveConfig, timeInterval })}
          precision={0}
          unit={lang.monitor.minute}
          value={editingAutosaveConfig.timeInterval}
        />
      </SettingFormItem>
      <SettingFormItem id="auto-save-maximum-count" label={lang.settings.autosave_number}>
        <SettingUnitInput
          id="number-of-auto-save"
          max={10}
          min={1}
          onChange={(fileNumber) => setEditingAutosaveConfig({ ...editingAutosaveConfig, fileNumber })}
          precision={0}
          value={editingAutosaveConfig.fileNumber}
        />
      </SettingFormItem>
    </>
  );
}

export default AutoSave;
