import React from 'react';

import classNames from 'classnames';

import BeamboxPreference from '@core/app/actions/beambox/beambox-preference';
import settings from '@core/app/app-settings';
import AdorModule from '@core/app/components/settings/AdorModule';
import AutoSave from '@core/app/components/settings/AutoSave';
import BB2Settings from '@core/app/components/settings/BB2Settings';
import Camera from '@core/app/components/settings/Camera';
import Connection from '@core/app/components/settings/Connection';
import Editor from '@core/app/components/settings/Editor';
import Engraving from '@core/app/components/settings/Engraving';
import Experimental from '@core/app/components/settings/Experimental';
import General from '@core/app/components/settings/General';
import Mask from '@core/app/components/settings/Mask';
import Module from '@core/app/components/settings/Module';
import onOffOptionFactory from '@core/app/components/settings/onOffOptionFactory';
import Path from '@core/app/components/settings/Path';
import Privacy from '@core/app/components/settings/Privacy';
import TextToPath from '@core/app/components/settings/TextToPath';
import Update from '@core/app/components/settings/Update';
import { OptionValues } from '@core/app/constants/enums';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import autoSaveHelper from '@core/helpers/auto-save-helper';
import i18n from '@core/helpers/i18n';
import isWeb from '@core/helpers/is-web';
import storage from '@core/implementations/storage';
import type { IConfig } from '@core/interfaces/IAutosave';
import type { ILang } from '@core/interfaces/ILang';
import type { StorageKey } from '@core/interfaces/IStorage';

interface Props {}

interface State {
  editingAutosaveConfig: IConfig;
  lang: ILang;
  selectedModel: WorkAreaModel;
  warnings: Record<string, string>;
}

class Settings extends React.PureComponent<Props, State> {
  private origLang: string;

  private beamboxPreferenceChanges: Record<string, any>;

  private configChanges: Record<StorageKey, any>;

  constructor(props: Props) {
    super(props);
    this.state = {
      editingAutosaveConfig: autoSaveHelper.getConfig(),
      lang: i18n.lang,
      selectedModel: BeamboxPreference.read('model') || 'fbm1',
      warnings: {},
    };
    this.origLang = i18n.getActiveLang();
    this.beamboxPreferenceChanges = {};
    this.configChanges = {} as Record<StorageKey, any>;
  }

  changeActiveLang = (value: string): void => {
    i18n.setActiveLang(value);
    this.setState({ lang: i18n.lang });
  };

  updateConfigChange = (key: StorageKey, newVal: any): void => {
    this.configChanges[key] = Number.isNaN(Number(newVal)) ? newVal : Number(newVal);
    this.forceUpdate();
  };

  getConfigEditingValue = (key: StorageKey): any => {
    if (key in this.configChanges) {
      return this.configChanges[key];
    }

    return storage.get(key);
  };

  updateBeamboxPreferenceChange = (key: string, newVal: any): void => {
    const val = newVal === OptionValues.TRUE ? true : newVal === OptionValues.FALSE ? false : newVal;

    this.beamboxPreferenceChanges[key] = val;
    this.forceUpdate();
  };

  getBeamboxPreferenceEditingValue = (key: string): any => {
    if (key in this.beamboxPreferenceChanges) {
      return this.beamboxPreferenceChanges[key];
    }

    return BeamboxPreference.read(key);
  };

  resetBS = (): void => {
    const { lang } = this.state;

    if (window.confirm(lang.settings.confirm_reset)) {
      storage.clearAllExceptIP();
      localStorage.clear();
      autoSaveHelper.useDefaultConfig();

      window.location.hash = '#';
      window.location.reload();
    }
  };

  handleDone = (): void => {
    const { editingAutosaveConfig } = this.state;

    Object.keys(this.configChanges).forEach((key) => {
      storage.set(key as StorageKey, this.configChanges[key as StorageKey]);
    });

    Object.keys(this.beamboxPreferenceChanges).forEach((key) => {
      BeamboxPreference.write(key, this.beamboxPreferenceChanges[key]);
    });

    autoSaveHelper.setConfig(editingAutosaveConfig);

    window.location.hash = '#studio/beambox';
    window.location.reload();
  };

  handleCancel = (): void => {
    i18n.setActiveLang(this.origLang);

    window.location.hash = '#studio/beambox';
    window.location.reload();
  };

  onOffOptionFactory = <T,>(
    isOnSelected: boolean,
    onValue?: T,
    offValue?: T,
    onLabel?: string,
    offLabel?: string,
  ): Array<{ label: string; selected: boolean; value: T }> => {
    const { lang } = this.state;

    return onOffOptionFactory(isOnSelected, { lang, offLabel, offValue, onLabel, onValue });
  };

  render() {
    const { supported_langs } = settings.i18n;
    const { editingAutosaveConfig, lang, selectedModel, warnings } = this.state;

    const isNotificationOn = this.getConfigEditingValue('notification') === 1;
    const notificationOptions = this.onOffOptionFactory(
      isNotificationOn,
      1,
      0,
      lang.settings.notification_on,
      lang.settings.notification_off,
    );

    const isAutoCheckUpdateOn = this.getConfigEditingValue('auto_check_update') !== 0;
    const updateNotificationOptions = this.onOffOptionFactory(
      isAutoCheckUpdateOn,
      1,
      0,
      lang.settings.notification_on,
      lang.settings.notification_off,
    );

    const isGuessingPokeOn = this.getConfigEditingValue('guessing_poke') !== 0;
    const guessingPokeOptions = this.onOffOptionFactory(isGuessingPokeOn, 1, 0);

    const isAutoConnectOn = this.getConfigEditingValue('auto_connect') !== 0;
    const autoConnectOptions = this.onOffOptionFactory(isAutoConnectOn, 1, 0);

    const isSentryEnabled = this.getConfigEditingValue('enable-sentry') === 1;
    const enableSentryOptions = this.onOffOptionFactory(isSentryEnabled, 1, 0);

    const isCustomPrevHeightEnabled = this.getBeamboxPreferenceEditingValue('enable-custom-preview-height');
    const enableCustomPreviewHeightOptions = this.onOffOptionFactory<OptionValues>(isCustomPrevHeightEnabled);

    const isKeepPreviewResult = this.getBeamboxPreferenceEditingValue('keep-preview-result');
    const keepPreviewResultOptions = this.onOffOptionFactory<OptionValues>(isKeepPreviewResult);

    const isMultipassCompensationEnabled = this.getBeamboxPreferenceEditingValue('multipass-compensation') !== false;
    const multipassCompensationOptions = this.onOffOptionFactory<OptionValues>(isMultipassCompensationEnabled);

    const oneWayPrintingEnabled = this.getBeamboxPreferenceEditingValue('one-way-printing') !== false;
    const oneWayPrintingOptions = this.onOffOptionFactory<OptionValues>(oneWayPrintingEnabled);

    const autoSaveOptions = this.onOffOptionFactory(editingAutosaveConfig.enabled);

    const isAllValid = Object.keys(warnings).length === 0;
    const web = isWeb();
    const defaultUnit = this.getConfigEditingValue('default-units');

    return (
      <div className="studio-container settings-studio">
        <div className="settings-gradient-overlay" />
        <div className="form general">
          <General
            changeActiveLang={this.changeActiveLang}
            isWeb={web}
            notificationOptions={notificationOptions}
            supportedLangs={supported_langs}
            updateConfigChange={this.updateConfigChange}
          />
          <Update
            isWeb={web}
            updateConfigChange={this.updateConfigChange}
            updateNotificationOptions={updateNotificationOptions}
          />
          <Connection
            autoConnectOptions={autoConnectOptions}
            guessingPokeOptions={guessingPokeOptions}
            originalIP={this.getConfigEditingValue('poke-ip-addr')}
            updateConfigChange={this.updateConfigChange}
          />
          <AutoSave
            autoSaveOptions={autoSaveOptions}
            editingAutosaveConfig={editingAutosaveConfig}
            isWeb={web}
            updateState={(state) => this.setState(state)}
            warnings={warnings}
          />
          <Camera
            enableCustomPreviewHeightOptions={enableCustomPreviewHeightOptions}
            getBeamboxPreferenceEditingValue={this.getBeamboxPreferenceEditingValue}
            keepPreviewResultOptions={keepPreviewResultOptions}
            updateBeamboxPreferenceChange={this.updateBeamboxPreferenceChange}
          />
          <Editor
            defaultUnit={defaultUnit}
            getBeamboxPreferenceEditingValue={this.getBeamboxPreferenceEditingValue}
            selectedModel={selectedModel}
            updateBeamboxPreferenceChange={this.updateBeamboxPreferenceChange}
            updateConfigChange={this.updateConfigChange}
            updateModel={(newModel) => this.setState({ selectedModel: newModel })}
          />
          <Engraving
            getBeamboxPreferenceEditingValue={this.getBeamboxPreferenceEditingValue}
            updateBeamboxPreferenceChange={this.updateBeamboxPreferenceChange}
          />
          <Path
            defaultUnit={defaultUnit}
            getBeamboxPreferenceEditingValue={this.getBeamboxPreferenceEditingValue}
            loopCompensation={this.getConfigEditingValue('loop_compensation')}
            selectedModel={selectedModel}
            updateBeamboxPreferenceChange={this.updateBeamboxPreferenceChange}
            updateConfigChange={this.updateConfigChange}
          />
          <Mask
            getBeamboxPreferenceEditingValue={this.getBeamboxPreferenceEditingValue}
            updateBeamboxPreferenceChange={this.updateBeamboxPreferenceChange}
          />
          <TextToPath
            getBeamboxPreferenceEditingValue={this.getBeamboxPreferenceEditingValue}
            updateBeamboxPreferenceChange={this.updateBeamboxPreferenceChange}
          />
          <Module
            defaultUnit={defaultUnit}
            getBeamboxPreferenceEditingValue={this.getBeamboxPreferenceEditingValue}
            selectedModel={selectedModel}
            updateBeamboxPreferenceChange={this.updateBeamboxPreferenceChange}
          />
          <AdorModule
            defaultUnit={defaultUnit}
            getBeamboxPreferenceEditingValue={this.getBeamboxPreferenceEditingValue}
            selectedModel={selectedModel}
            updateBeamboxPreferenceChange={this.updateBeamboxPreferenceChange}
          />
          <BB2Settings
            getBeamboxPreferenceEditingValue={this.getBeamboxPreferenceEditingValue}
            selectedModel={selectedModel}
            updateBeamboxPreferenceChange={this.updateBeamboxPreferenceChange}
          />
          <Privacy enableSentryOptions={enableSentryOptions} updateConfigChange={this.updateConfigChange} />
          <Experimental
            multipassCompensationOptions={multipassCompensationOptions}
            oneWayPrintingOptions={oneWayPrintingOptions}
            updateBeamboxPreferenceChange={this.updateBeamboxPreferenceChange}
          />
          <div className="font5" onClick={this.resetBS}>
            <b>{lang.settings.reset_now}</b>
          </div>
          <div className="clearfix" />
          <div className={classNames('btn btn-done', { disabled: !isAllValid })} onClick={this.handleDone}>
            {lang.settings.done}
          </div>
          <div className="btn btn-cancel" onClick={this.handleCancel}>
            {lang.settings.cancel}
          </div>
        </div>
      </div>
    );
  }
}

export default Settings;
