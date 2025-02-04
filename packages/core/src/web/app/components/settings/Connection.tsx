import * as React from 'react';

import alert from '@core/app/actions/alert-caller';
import Controls from '@core/app/components/settings/Control';
import SelectControl from '@core/app/components/settings/SelectControl';
import alertConstants from '@core/app/constants/alert-constants';
import i18n from '@core/helpers/i18n';
import browser from '@core/implementations/browser';
import storage from '@core/implementations/storage';
import type { StorageKey } from '@core/interfaces/IStorage';

interface Props {
  autoConnectOptions: Array<{ label: string; selected: boolean; value: any }>;
  guessingPokeOptions: Array<{ label: string; selected: boolean; value: any }>;
  originalIP: string;
  updateConfigChange: (id: StorageKey, newVal: any) => void;
}

function Connection({
  autoConnectOptions,
  guessingPokeOptions,
  originalIP,
  updateConfigChange,
}: Props): React.JSX.Element {
  const lang = i18n.lang;
  const checkIPFormat = (e: React.FocusEvent): void => {
    const me = e.currentTarget as HTMLInputElement;
    const ips = me.value.split(/[,;] ?/);
    const ipv4Pattern = /^\d{1,3}[.]\d{1,3}[.]\d{1,3}[.]\d{1,3}$/;

    for (let i = 0; i < ips.length; i += 1) {
      const ip = ips[i];

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
    updateConfigChange('poke-ip-addr', me.value);
  };

  return (
    <>
      <div className="subtitle">
        {lang.settings.groups.connection}
        <span className="info-icon-medium">
          <img onClick={() => browser.open(lang.settings.help_center_urls.connection)} src="img/info.svg" />
        </span>
      </div>
      <Controls label={lang.settings.ip}>
        <input
          autoComplete="false"
          defaultValue={storage.get('poke-ip-addr')}
          id="ip-input"
          onBlur={checkIPFormat}
          type="text"
        />
      </Controls>
      <SelectControl
        id="set-guessing-poke"
        label={lang.settings.guess_poke}
        onChange={(e) => updateConfigChange('guessing_poke', e.target.value)}
        options={guessingPokeOptions}
      />
      <SelectControl
        id="set-auto-connect"
        label={lang.settings.auto_connect}
        onChange={(e) => updateConfigChange('auto_connect', e.target.value)}
        options={autoConnectOptions}
      />
    </>
  );
}

export default Connection;
