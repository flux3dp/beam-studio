import * as React from 'react';

import type { DefaultOptionType } from 'antd/es/select';
import classNames from 'classnames';

import SettingUnitInput from '@core/app/components/settings/components/SettingUnitInput';
import PathInput, { InputType } from '@core/app/widgets/PathInput';
import i18n from '@core/helpers/i18n';
import isWeb from '@core/helpers/is-web';
import type { IConfig } from '@core/interfaces/IAutosave';

import SettingFormItem from './components/SettingFormItem';
import SettingSelect from './components/SettingSelect';

interface Props {
  editingAutosaveConfig: IConfig;
  options: DefaultOptionType[];
  setEditingAutosaveConfig: (config: IConfig) => void;
  setWarnings: (warnings: Record<string, string>) => void;
  warnings: Record<string, string>;
}

function AutoSave({
  editingAutosaveConfig,
  options,
  setEditingAutosaveConfig,
  setWarnings,
  warnings,
}: Props): null | React.JSX.Element {
  const { lang } = i18n;

  if (isWeb()) return null;

  return (
    <>
      <div className="subtitle">{lang.settings.groups.autosave}</div>
      <SettingSelect
        defaultValue={editingAutosaveConfig.enabled}
        id="set-auto-save"
        label={lang.settings.autosave_enabled}
        onChange={(enabled) => setEditingAutosaveConfig({ ...editingAutosaveConfig, enabled })}
        options={options}
      />
      <SettingFormItem
        id="auto-save-directory"
        label={lang.settings.autosave_path}
        warning={warnings.autosave_directory}
      >
        <PathInput
          buttonTitle={lang.general.choose_folder}
          className={classNames({ 'with-error': Boolean(warnings.autosave_directory) })}
          data-id="location-input"
          defaultValue={editingAutosaveConfig.directory}
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
