import * as React from 'react';

import alert from 'app/actions/alert-caller';
import alertConstants from 'app/constants/alert-constants';
import browser from 'implementations/browser';
import Controls from 'app/components/settings/Control';
import i18n from 'helpers/i18n';
import SelectControl from 'app/components/settings/SelectControl';
import storage from 'implementations/storage';
import { StorageKey } from 'interfaces/IStorage';

interface Props {
  originalIP: string;
  guessingPokeOptions: { value: any, label: string, selected: boolean, }[];
  autoConnectOptions: { value: any, label: string, selected: boolean, }[];
  updateConfigChange: (id: StorageKey, newVal: any) => void;
}

function Connection({
  originalIP,
  guessingPokeOptions,
  autoConnectOptions,
  updateConfigChange,
}: Props): JSX.Element {
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
          type: alertConstants.SHOW_POPUP_ERROR,
          message: `${lang.settings.wrong_ip_format}\n${ip}`,
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
          <img
            src="img/info.svg"
            onClick={() => browser.open(lang.settings.help_center_urls.connection)}
          />
        </span>
      </div>
      <Controls label={lang.settings.ip}>
        <input
          id="ip-input"
          type="text"
          autoComplete="false"
          defaultValue={storage.get('poke-ip-addr')}
          onBlur={checkIPFormat}
        />
      </Controls>
      <SelectControl
        id="set-guessing-poke"
        label={lang.settings.guess_poke}
        options={guessingPokeOptions}
        onChange={(e) => updateConfigChange('guessing_poke', e.target.value)}
      />
      <SelectControl
        id="set-auto-connect"
        label={lang.settings.auto_connect}
        options={autoConnectOptions}
        onChange={(e) => updateConfigChange('auto_connect', e.target.value)}
      />
    </>
  );
}

export default Connection;
