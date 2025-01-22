import * as React from 'react';

import classNames from 'classnames';

import Controls from '@core/app/components/settings/Control';
import SelectControl from '@core/app/components/settings/SelectControl';
import PathInput, { InputType } from '@core/app/widgets/PathInput';
import UnitInput from '@core/app/widgets/Unit-Input-v2';
import i18n from '@core/helpers/i18n';
import type { IConfig } from '@core/interfaces/IAutosave';

interface Props {
  autoSaveOptions: Array<{ label: string; selected: boolean; value: any }>;
  editingAutosaveConfig: IConfig;
  isWeb: boolean;
  updateState: (state: any) => void;
  warnings: { [key: string]: string };
}

function AutoSave({ autoSaveOptions, editingAutosaveConfig, isWeb, updateState, warnings }: Props): React.JSX.Element {
  if (isWeb) {
    return null;
  }

  const { lang } = i18n;

  return (
    <>
      <div className="subtitle">{lang.settings.groups.autosave}</div>
      <SelectControl
        id="set-auto-save"
        label={lang.settings.autosave_enabled}
        onChange={(e) => {
          updateState({
            editingAutosaveConfig: {
              ...editingAutosaveConfig,
              enabled: e.target.value === 'TRUE',
            },
          });
        }}
        options={autoSaveOptions}
      />
      <Controls label={lang.settings.autosave_path} warningText={warnings.autosave_directory}>
        <PathInput
          buttonTitle={lang.general.choose_folder}
          className={classNames({ 'with-error': !!warnings.autosave_directory })}
          data-id="location-input"
          defaultValue={editingAutosaveConfig.directory}
          forceValidValue={false}
          getValue={(val: string, isValid: boolean) => {
            if (!isValid) {
              warnings.autosave_directory = lang.settings.autosave_path_not_correct;
            } else {
              delete warnings.autosave_directory;
            }

            updateState({
              editingAutosaveConfig: {
                ...editingAutosaveConfig,
                directory: val,
              },
              warnings: {
                ...warnings,
              },
            });
          }}
          type={InputType.FOLDER}
        />
      </Controls>
      <Controls label={lang.settings.autosave_interval}>
        <UnitInput
          className={{ half: true }}
          decimal={0}
          defaultValue={editingAutosaveConfig.timeInterval}
          getValue={(val: number) => {
            updateState({
              editingAutosaveConfig: {
                ...editingAutosaveConfig,
                timeInterval: val,
              },
            });
          }}
          id="save-every"
          max={60}
          min={1}
          unit={lang.monitor.minute}
        />
      </Controls>
      <Controls label={lang.settings.autosave_number}>
        <UnitInput
          className={{ half: true }}
          decimal={0}
          defaultValue={editingAutosaveConfig.fileNumber}
          getValue={(val: number) => {
            updateState({
              editingAutosaveConfig: {
                ...editingAutosaveConfig,
                fileNumber: val,
              },
            });
          }}
          id="number-of-auto-save"
          max={10}
          min={1}
        />
      </Controls>
    </>
  );
}

export default AutoSave;
