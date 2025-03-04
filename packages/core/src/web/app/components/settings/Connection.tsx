import * as React from 'react';

import type { DefaultOptionType } from 'antd/es/select';

import alert from '@core/app/actions/alert-caller';
import alertConstants from '@core/app/constants/alert-constants';
import { useSettingStore } from '@core/app/pages/Settings/useSettingStore';
import i18n from '@core/helpers/i18n';
import browser from '@core/implementations/browser';

import SettingFormItem from './components/SettingFormItem';
import SettingSelect from './components/SettingSelect';

interface Props {
  options: DefaultOptionType[];
}

function Connection({ options }: Props): React.JSX.Element {
  const lang = i18n.lang;
  const getConfig = useSettingStore((state) => state.getConfig);
  const setConfig = useSettingStore((state) => state.setConfig);
  const originalIP = getConfig('poke-ip-addr');
  const checkIPFormat = (e: React.FocusEvent): void => {
    const me = e.currentTarget as HTMLInputElement;
    const ips = me.value.split(/[,;] ?/);
    const ipv4Pattern = /^\d{1,3}[.]\d{1,3}[.]\d{1,3}[.]\d{1,3}$/;

    for (const ip of ips) {
      if (ip !== '' && typeof ip === 'string' && ipv4Pattern.test(ip) === false) {
        me.value = originalIP;
        alert.popUp({
          id: 'wrong-ip-error',
          message: `${lang.settings.wrong_ip_format}\n${ip}`,
          type: alertConstants.SHOW_POPUP_ERROR,
        });

        return;
      }
    }

    setConfig('poke-ip-addr', me.value);
  };

  return (
    <>
      <div className="subtitle">
        {lang.settings.groups.connection}
        <span className="info-icon-medium">
          <img onClick={() => browser.open(lang.settings.help_center_urls.connection)} src="img/info.svg" />
        </span>
      </div>
      <SettingFormItem id="connect-ip-list" label={lang.settings.ip}>
        <input
          autoComplete="false"
          defaultValue={getConfig('poke-ip-addr')}
          id="ip-input"
          onBlur={checkIPFormat}
          type="text"
        />
      </SettingFormItem>
      <SettingSelect
        defaultValue={getConfig('guessing_poke')}
        id="set-guessing-poke"
        label={lang.settings.guess_poke}
        onChange={(e) => setConfig('guessing_poke', e)}
        options={options}
      />
      <SettingSelect
        defaultValue={getConfig('auto_connect')}
        id="set-auto-connect"
        label={lang.settings.auto_connect}
        onChange={(e) => setConfig('auto_connect', e)}
        options={options}
      />
    </>
  );
}

export default Connection;
