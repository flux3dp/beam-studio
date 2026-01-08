import * as React from 'react';
import { useMemo, useState } from 'react';

import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Input } from 'antd';

import alert from '@core/app/actions/alert-caller';
import SettingSwitch from '@core/app/components/settings/components/SettingSwitch';
import alertConstants from '@core/app/constants/alert-constants';
import { useSettingStore } from '@core/app/pages/Settings/useSettingStore';
import useI18n from '@core/helpers/useI18n';

import styles from './Connection.module.scss';

const IPV4_PATTERN = /^\d{1,3}[.]\d{1,3}[.]\d{1,3}[.]\d{1,3}$/;

const parseIpList = (ipString: string): string[] => {
  const ips = ipString.split(/[,;]\s*/).filter(Boolean);

  return ips.length > 0 ? ips : [''];
};

function Connection(): React.JSX.Element {
  const lang = useI18n();
  const { getConfig, setConfig } = useSettingStore();

  // eslint-disable-next-line hooks/exhaustive-deps -- Only parse once on mount
  const initialIpList = useMemo(() => parseIpList(getConfig('poke-ip-addr')), []);
  const [ipList, setIpList] = useState<string[]>(initialIpList);
  const [selectedIndex, setSelectedIndex] = useState<null | number>(null);

  const updateIpConfig = (newList: string[]): void => {
    setIpList(newList);

    const validIps = newList.filter(Boolean).join(',');

    setConfig('poke-ip-addr', validIps);
  };

  const handleIpChange = (index: number, value: string): void => {
    const newList = [...ipList];

    newList[index] = value;
    setIpList(newList);
  };

  const handleIpBlur = (index: number, value: string): void => {
    if (value !== '' && !IPV4_PATTERN.test(value)) {
      alert.popUp({
        id: 'wrong-ip-error',
        message: `${lang.settings.wrong_ip_format}\n${value}`,
        type: alertConstants.SHOW_POPUP_ERROR,
      });

      const newList = [...ipList];

      newList[index] = initialIpList[index] || '';
      setIpList(newList);

      return;
    }

    updateIpConfig(ipList);
  };

  const handleAddIp = (): void => {
    setIpList([...ipList, '']);
  };

  const handleRemoveIp = (): void => {
    if (ipList.length > 1) {
      // Remove selected index if valid, otherwise remove the last one
      const indexToRemove = selectedIndex !== null && selectedIndex < ipList.length ? selectedIndex : ipList.length - 1;
      const newList = ipList.filter((_, i) => i !== indexToRemove);

      updateIpConfig(newList);
      setSelectedIndex(null);
    }
  };

  const guessingPoke = getConfig('guessing_poke');

  return (
    <>
      <SettingSwitch
        checked={guessingPoke}
        id="set-guessing-poke"
        label={lang.settings.guess_poke}
        onChange={(e) => setConfig('guessing_poke', e)}
      />
      <SettingSwitch
        checked={getConfig('auto_connect')}
        disabled={!guessingPoke}
        id="set-auto-connect"
        label={lang.settings.auto_connect}
        onChange={(e) => setConfig('auto_connect', e)}
      />
      <div className={styles['ip-section']} id="connect-ip-list">
        <span className={styles['ip-label']}>{lang.settings.ip}</span>
        <div className={styles['ip-list']}>
          {ipList.map((ip, index) => (
            <Input
              autoComplete="off"
              className={styles['ip-input']}
              key={index}
              onBlur={(e) => handleIpBlur(index, e.target.value)}
              onChange={(e) => handleIpChange(index, e.target.value)}
              onFocus={() => setSelectedIndex(index)}
              placeholder="192.168.1.1"
              value={ip}
            />
          ))}
        </div>
        <div className={styles['ip-buttons']}>
          <Button className={styles['ip-button']} icon={<PlusOutlined />} onClick={handleAddIp} type="text" />
          <Button
            className={styles['ip-button']}
            disabled={ipList.length <= 1}
            icon={<MinusOutlined />}
            onClick={handleRemoveIp}
            type="text"
          />
        </div>
      </div>
    </>
  );
}

export default Connection;
