import * as React from 'react';

import { Input } from 'antd';

import alert from '@core/app/actions/alert-caller';
import SettingSwitch from '@core/app/components/settings/components/SettingSwitch';
import alertConstants from '@core/app/constants/alert-constants';
import { useSettingStore } from '@core/app/pages/Settings/useSettingStore';
import useI18n from '@core/helpers/useI18n';

import SettingFormItem from './components/SettingFormItem';

function Connection(): React.JSX.Element {
  const lang = useI18n();
  const { getConfig, setConfig } = useSettingStore();
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
      <SettingFormItem id="connect-ip-list" label={lang.settings.ip}>
        <Input
          autoComplete="false"
          defaultValue={getConfig('poke-ip-addr')}
          id="ip-input"
          onBlur={checkIPFormat}
          style={{ width: 240 }}
        />
      </SettingFormItem>
      <SettingSwitch
        checked={getConfig('guessing_poke')}
        id="set-guessing-poke"
        label={lang.settings.guess_poke}
        onChange={(e) => setConfig('guessing_poke', e)}
      />
      <SettingSwitch
        checked={getConfig('auto_connect')}
        id="set-auto-connect"
        label={lang.settings.auto_connect}
        onChange={(e) => setConfig('auto_connect', e)}
      />
    </>
  );
}

export default Connection;
