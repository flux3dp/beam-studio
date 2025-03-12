import React, { useMemo, useState } from 'react';

import { ConfigProvider, Form } from 'antd';
import type { DefaultOptionType } from 'antd/es/select';
import classNames from 'classnames';

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
import Path from '@core/app/components/settings/Path';
import Privacy from '@core/app/components/settings/Privacy';
import TextToPath from '@core/app/components/settings/TextToPath';
import Update from '@core/app/components/settings/Update';
import autoSaveHelper from '@core/helpers/auto-save-helper';
import i18n from '@core/helpers/i18n';
import storage from '@core/implementations/storage';
import type { IConfig } from '@core/interfaces/IAutosave';
import type { ILang } from '@core/interfaces/ILang';

import { useSettingStore } from './useSettingStore';

function Settings(): React.JSX.Element {
  const { supported_langs } = settings.i18n;
  const [lang, setLang] = useState<ILang>(i18n.lang);
  const [editingAutosaveConfig, setEditingAutosaveConfig] = useState<IConfig>(autoSaveHelper.getConfig());
  const [warnings, setWarnings] = useState<Record<string, string>>({});
  const previousActiveLang = useMemo(() => i18n.getActiveLang(), []);
  const { updateToStorage } = useSettingStore();

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
    window.location.hash = '#studio/beambox';
    window.location.reload();
  };

  const handleCancel = (): void => {
    i18n.setActiveLang(previousActiveLang);
    window.location.hash = '#studio/beambox';
    window.location.reload();
  };

  const commonBooleanOptions = [
    { label: lang.settings.on, value: true },
    { label: lang.settings.off, value: false },
  ] as unknown as DefaultOptionType[];
  const isAllValid = Object.keys(warnings).length === 0;

  return (
    <div className="studio-container settings-studio">
      <div className="settings-gradient-overlay" />
      <div className="form general">
        <ConfigProvider theme={{ components: { Form: { itemMarginBottom: 20, labelFontSize: 16 } } }}>
          <Form colon={false} labelAlign="left" labelWrap wrapperCol={{ flex: 1 }}>
            <General
              changeActiveLang={changeActiveLang}
              options={commonBooleanOptions}
              supportedLangs={supported_langs}
            />
            <Update options={commonBooleanOptions} />
            <Connection options={commonBooleanOptions} />
            <AutoSave
              editingAutosaveConfig={editingAutosaveConfig}
              options={commonBooleanOptions}
              setEditingAutosaveConfig={setEditingAutosaveConfig}
              setWarnings={setWarnings}
              warnings={warnings}
            />
            <Camera options={commonBooleanOptions} />
            <Editor options={commonBooleanOptions} />
            <Engraving options={commonBooleanOptions} />
            <Path options={commonBooleanOptions} />
            <Mask options={commonBooleanOptions} />
            <TextToPath options={commonBooleanOptions} />
            <Module options={commonBooleanOptions} />
            <AdorModule options={commonBooleanOptions} />
            <BB2Settings options={commonBooleanOptions} />
            <Privacy options={commonBooleanOptions} />
            <Experimental options={commonBooleanOptions} />
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
