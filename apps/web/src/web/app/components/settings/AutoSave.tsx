import * as React from 'react';
import classNames from 'classnames';

import Controls from 'app/components/settings/Control';
import i18n from 'helpers/i18n';
import PathInput, { InputType } from 'app/widgets/PathInput';
import SelectControl from 'app/components/settings/SelectControl';
import UnitInput from 'app/widgets/Unit-Input-v2';
import { IConfig } from 'interfaces/IAutosave';

interface Props {
  isWeb: boolean;
  autoSaveOptions: { value: any, label: string, selected: boolean }[];
  editingAutosaveConfig: IConfig;
  warnings: { [key: string]: string };
  updateState: (state: any) => void;
}

function AutoSave({
  isWeb,
  autoSaveOptions,
  editingAutosaveConfig,
  warnings,
  updateState,
}: Props): JSX.Element {
  if (isWeb) return null;
  const { lang } = i18n;
  return (
    <>
      <div className="subtitle">{lang.settings.groups.autosave}</div>
      <SelectControl
        id="set-auto-save"
        label={lang.settings.autosave_enabled}
        options={autoSaveOptions}
        onChange={(e) => {
          updateState({
            editingAutosaveConfig: {
              ...editingAutosaveConfig,
              enabled: e.target.value === 'TRUE',
            },
          });
        }}
      />
      <Controls
        label={lang.settings.autosave_path}
        warningText={warnings.autosave_directory}
      >
        <PathInput
          data-id="location-input"
          buttonTitle={lang.general.choose_folder}
          className={classNames({ 'with-error': !!warnings.autosave_directory })}
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
          id="save-every"
          unit={lang.monitor.minute}
          min={1}
          max={60}
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
          className={{ half: true }}
        />
      </Controls>
      <Controls label={lang.settings.autosave_number}>
        <UnitInput
          id="number-of-auto-save"
          min={1}
          max={10}
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
          className={{ half: true }}
        />
      </Controls>
    </>
  );
}

export default AutoSave;
