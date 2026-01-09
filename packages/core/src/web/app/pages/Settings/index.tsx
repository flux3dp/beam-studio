import React, { useMemo, useState } from 'react';

import { InfoCircleOutlined } from '@ant-design/icons';
import { ConfigProvider, Form } from 'antd';
import classNames from 'classnames';

import settings from '@core/app/app-settings';
import AutoSave from '@core/app/components/settings/AutoSave';
import Camera from '@core/app/components/settings/Camera';
import type { SettingUnitInputProps } from '@core/app/components/settings/components/SettingUnitInput';
import Connection from '@core/app/components/settings/Connection';
import Editor from '@core/app/components/settings/Editor';
import Engraving from '@core/app/components/settings/Engraving';
import Experimental from '@core/app/components/settings/Experimental';
import General from '@core/app/components/settings/General';
import Module from '@core/app/components/settings/Module';
import Path from '@core/app/components/settings/Path';
import Privacy from '@core/app/components/settings/Privacy';
import styles from '@core/app/components/settings/Settings.module.scss';
import TextToPath from '@core/app/components/settings/TextToPath';
import autoSaveHelper from '@core/helpers/auto-save-helper';
import { getHomePage } from '@core/helpers/hashHelper';
import i18n from '@core/helpers/i18n';
import isDev from '@core/helpers/is-dev';
import isWeb from '@core/helpers/is-web';
import browser from '@core/implementations/browser';
import storage from '@core/implementations/storage';
import type { AutoSaveConfig } from '@core/interfaces/AutoSaveConfig';
import type { ILang } from '@core/interfaces/ILang';

import { useSettingStore } from './useSettingStore';

function Settings(): React.JSX.Element {
  const { supported_langs } = settings.i18n;
  const [lang, setLang] = useState<ILang>(i18n.lang);
  const [editingAutosaveConfig, setEditingAutosaveConfig] = useState<AutoSaveConfig>(autoSaveHelper.getConfig());
  const [warnings, setWarnings] = useState<Record<string, string>>({});
  const previousActiveLang = useMemo(() => i18n.getActiveLang(), []);
  const { getConfig, resetChanges, updateToStorage } = useSettingStore();
  const defaultUnit = getConfig('default-units');

  const commonUnitInputProps: Partial<SettingUnitInputProps> = useMemo(() => {
    const isInch = defaultUnit === 'inches';

    return {
      isInch,
      precision: isInch ? 4 : 2,
      step: isInch ? 2.54 : 1,
      unit: isInch ? 'in' : 'mm',
    };
  }, [defaultUnit]);

  const changeActiveLang = (value: string): void => {
    i18n.setActiveLang(value);
    setLang(i18n.lang);
  };

  const resetBS = (): void => {
    if (window.confirm(lang.settings.confirm_reset)) {
      storage.clearAllExceptIP();
      localStorage.clear();
      autoSaveHelper.useDefaultConfig();
      window.location.hash = '#';
      window.location.reload();
    }
  };

  const handleDone = (): void => {
    updateToStorage();

    autoSaveHelper.setConfig(editingAutosaveConfig);
    window.location.hash = getHomePage();
    window.location.reload();
  };

  const handleCancel = (): void => {
    i18n.setActiveLang(previousActiveLang);
    resetChanges();
    window.location.hash = getHomePage();
    window.location.reload();
  };

  const isAllValid = Object.keys(warnings).length === 0;

  return (
    <div className="studio-container settings-studio">
      <div className="form general">
        <ConfigProvider theme={{ components: { Form: { itemMarginBottom: 20, labelFontSize: 16 } } }}>
          <Form colon={false} labelAlign="left" labelWrap wrapperCol={{ flex: 1 }}>
            <div className={styles.subtitle}>{lang.settings.groups.general}</div>
            <General changeActiveLang={changeActiveLang} supportedLangs={supported_langs} />

            <div className={styles.subtitle}>
              {lang.settings.groups.connection}
              <InfoCircleOutlined
                className={styles.icon}
                onClick={() => browser.open(lang.settings.help_center_urls.connection)}
              />
            </div>
            <Connection />

            {!isWeb() && <div className={styles.subtitle}>{lang.settings.groups.autosave}</div>}
            <AutoSave
              editingAutosaveConfig={editingAutosaveConfig}
              setEditingAutosaveConfig={setEditingAutosaveConfig}
              setWarnings={setWarnings}
              warnings={warnings}
            />
            <div className={styles.subtitle}>{lang.settings.groups.camera}</div>
            <Camera />
            <div className={styles.subtitle}>{lang.settings.groups.editor}</div>
            <Editor unitInputProps={commonUnitInputProps} />
            <div className={styles.subtitle}>{lang.settings.groups.engraving}</div>
            <Engraving />
            <div className={styles.subtitle}>{lang.settings.groups.path}</div>
            <Path unitInputProps={commonUnitInputProps} />
            <div className={styles.subtitle}>{lang.settings.groups.text_to_path}</div>
            <TextToPath />
            <div className={styles.subtitle}>{lang.settings.groups.modules}</div>
            <Module unitInputProps={commonUnitInputProps} />
            <div className={styles.subtitle}>{lang.settings.groups.privacy}</div>
            <Privacy />
            {isDev() && <div className={styles.subtitle}>Experimental Features</div>}
            <Experimental />
          </Form>
        </ConfigProvider>
        <div className="font5" onClick={resetBS}>
          <b>{lang.settings.reset_now}</b>
        </div>
        <div className="clearfix" />
        <div className={classNames('btn btn-done', { disabled: !isAllValid })} onClick={handleDone}>
          {lang.settings.done}
        </div>
        <div className="btn btn-cancel" onClick={handleCancel}>
          {lang.settings.cancel}
        </div>
      </div>
    </div>
  );
}

export default Settings;
