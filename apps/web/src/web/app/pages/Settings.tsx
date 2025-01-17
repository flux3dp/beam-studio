/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import classNames from 'classnames';

import AdorModule from 'app/components/settings/AdorModule';
import AutoSave from 'app/components/settings/AutoSave';
import autoSaveHelper from 'helpers/auto-save-helper';
import BeamboxPreference from 'app/actions/beambox/beambox-preference';
import Camera from 'app/components/settings/Camera';
import Connection from 'app/components/settings/Connection';
import Editor from 'app/components/settings/Editor';
import Engraving from 'app/components/settings/Engraving';
import Experimental from 'app/components/settings/Experimental';
import General from 'app/components/settings/General';
import i18n from 'helpers/i18n';
import isWeb from 'helpers/is-web';
import Mask from 'app/components/settings/Mask';
import Module from 'app/components/settings/Module';
import onOffOptionFactory from 'app/components/settings/onOffOptionFactory';
import Path from 'app/components/settings/Path';
import Privacy from 'app/components/settings/Privacy';
import settings from 'app/app-settings';
import storage from 'implementations/storage';
import TextToPath from 'app/components/settings/TextToPath';
import Update from 'app/components/settings/Update';
import { IConfig } from 'interfaces/IAutosave';
import { ILang } from 'interfaces/ILang';
import { OptionValues } from 'app/constants/enums';
import { StorageKey } from 'interfaces/IStorage';
import { WorkAreaModel } from 'app/constants/workarea-constants';

interface State {
  lang?: ILang;
  editingAutosaveConfig?: IConfig;
  selectedModel: WorkAreaModel;
  warnings?: Record<string, string>;
}

class Settings extends React.PureComponent<null, State> {
  private origLang: string;

  private beamboxPreferenceChanges: Record<string, any>;

  private configChanges: Record<StorageKey, any>;

  constructor(props) {
    super(props);
    this.state = {
      lang: i18n.lang,
      editingAutosaveConfig: autoSaveHelper.getConfig(),
      selectedModel: BeamboxPreference.read('model') || 'fbm1',
      warnings: {},
    };
    this.origLang = i18n.getActiveLang();
    this.beamboxPreferenceChanges = {};
    this.configChanges = {} as Record<StorageKey, any>;
  }

  changeActiveLang = ({ currentTarget: { value } }: React.ChangeEvent<HTMLInputElement>): void => {
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
    const val =
      // eslint-disable-next-line no-nested-ternary
      newVal === OptionValues.TRUE ? true : newVal === OptionValues.FALSE ? false : newVal;

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
    // eslint-disable-next-line no-alert
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
      storage.set(key as StorageKey, this.configChanges[key]);
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
    offLabel?: string
  ): Array<{ value: T; label: string; selected: boolean }> => {
    const { lang } = this.state;

    return onOffOptionFactory(isOnSelected, { onValue, offValue, onLabel, offLabel, lang });
  };

  render() {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { supported_langs } = settings.i18n;
    const { lang, selectedModel, editingAutosaveConfig, warnings } = this.state;

    const isNotificationOn = this.getConfigEditingValue('notification') === 1;
    const notificationOptions = this.onOffOptionFactory(
      isNotificationOn,
      1,
      0,
      lang.settings.notification_on,
      lang.settings.notification_off
    );

    const isAutoCheckUpdateOn = this.getConfigEditingValue('auto_check_update') !== 0;
    const updateNotificationOptions = this.onOffOptionFactory(
      isAutoCheckUpdateOn,
      1,
      0,
      lang.settings.notification_on,
      lang.settings.notification_off
    );

    const isGuessingPokeOn = this.getConfigEditingValue('guessing_poke') !== 0;
    const guessingPokeOptions = this.onOffOptionFactory(isGuessingPokeOn, 1, 0);

    const isAutoConnectOn = this.getConfigEditingValue('auto_connect') !== 0;
    const autoConnectOptions = this.onOffOptionFactory(isAutoConnectOn, 1, 0);

    const isSentryEnabled = this.getConfigEditingValue('enable-sentry') === 1;
    const enableSentryOptions = this.onOffOptionFactory(isSentryEnabled, 1, 0);

    const isCustomPrevHeightEnabled = this.getBeamboxPreferenceEditingValue(
      'enable-custom-preview-height'
    );
    const enableCustomPreviewHeightOptions =
      this.onOffOptionFactory<OptionValues>(isCustomPrevHeightEnabled);

    const isKeepPreviewResult = this.getBeamboxPreferenceEditingValue('keep-preview-result');
    const keepPreviewResultOptions = this.onOffOptionFactory<OptionValues>(isKeepPreviewResult);

    const isMultipassCompensationEnabled =
      this.getBeamboxPreferenceEditingValue('multipass-compensation') !== false;
    const multipassCompensationOptions = this.onOffOptionFactory<OptionValues>(
      isMultipassCompensationEnabled
    );

    const oneWayPrintingEnabled =
      this.getBeamboxPreferenceEditingValue('one-way-printing') !== false;
    const oneWayPrintingOptions = this.onOffOptionFactory<OptionValues>(oneWayPrintingEnabled);

    const autoSaveOptions = this.onOffOptionFactory(editingAutosaveConfig.enabled);

    const isAllValid = !warnings || Object.keys(warnings).length === 0;
    const web = isWeb();
    const defaultUnit = this.getConfigEditingValue('default-units');

    return (
      <div className="studio-container settings-studio">
        <div className="settings-gradient-overlay" />
        <div className="form general">
          <General
            isWeb={web}
            supportedLangs={supported_langs}
            notificationOptions={notificationOptions}
            changeActiveLang={this.changeActiveLang}
            updateConfigChange={this.updateConfigChange}
          />
          <Update
            isWeb={web}
            updateNotificationOptions={updateNotificationOptions}
            updateConfigChange={this.updateConfigChange}
          />
          <Connection
            originalIP={this.getConfigEditingValue('poke-ip-addr')}
            guessingPokeOptions={guessingPokeOptions}
            autoConnectOptions={autoConnectOptions}
            updateConfigChange={this.updateConfigChange}
          />
          <AutoSave
            isWeb={web}
            autoSaveOptions={autoSaveOptions}
            editingAutosaveConfig={editingAutosaveConfig}
            warnings={warnings}
            updateState={(state) => this.setState(state)}
          />
          <Camera
            enableCustomPreviewHeightOptions={enableCustomPreviewHeightOptions}
            keepPreviewResultOptions={keepPreviewResultOptions}
            getBeamboxPreferenceEditingValue={this.getBeamboxPreferenceEditingValue}
            updateBeamboxPreferenceChange={this.updateBeamboxPreferenceChange}
          />
          <Editor
            defaultUnit={defaultUnit}
            selectedModel={selectedModel}
            getBeamboxPreferenceEditingValue={this.getBeamboxPreferenceEditingValue}
            updateConfigChange={this.updateConfigChange}
            updateBeamboxPreferenceChange={this.updateBeamboxPreferenceChange}
            updateModel={(newModel) => this.setState({ selectedModel: newModel })}
          />
          <Engraving
            getBeamboxPreferenceEditingValue={this.getBeamboxPreferenceEditingValue}
            updateBeamboxPreferenceChange={this.updateBeamboxPreferenceChange}
          />
          <Path
            selectedModel={selectedModel}
            defaultUnit={defaultUnit}
            loopCompensation={this.getConfigEditingValue('loop_compensation')}
            getBeamboxPreferenceEditingValue={this.getBeamboxPreferenceEditingValue}
            updateConfigChange={this.updateConfigChange}
            updateBeamboxPreferenceChange={this.updateBeamboxPreferenceChange}
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
            selectedModel={selectedModel}
            getBeamboxPreferenceEditingValue={this.getBeamboxPreferenceEditingValue}
            updateBeamboxPreferenceChange={this.updateBeamboxPreferenceChange}
          />
          <AdorModule
            defaultUnit={defaultUnit}
            selectedModel={selectedModel}
            getBeamboxPreferenceEditingValue={this.getBeamboxPreferenceEditingValue}
            updateBeamboxPreferenceChange={this.updateBeamboxPreferenceChange}
          />
          <Privacy
            enableSentryOptions={enableSentryOptions}
            updateConfigChange={this.updateConfigChange}
          />
          <Experimental
            multipassCompensationOptions={multipassCompensationOptions}
            oneWayPrintingOptions={oneWayPrintingOptions}
            updateBeamboxPreferenceChange={this.updateBeamboxPreferenceChange}
          />
          <div className="font5" onClick={this.resetBS}>
            <b>{lang.settings.reset_now}</b>
          </div>
          <div className="clearfix" />
          <div
            className={classNames('btn btn-done', { disabled: !isAllValid })}
            onClick={this.handleDone}
          >
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
