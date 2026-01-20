import * as React from 'react';
import { useMemo, useState } from 'react';

import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Input } from 'antd';
import { v4 as uuidv4 } from 'uuid';

import alert from '@core/app/actions/alert-caller';
import SettingSwitch from '@core/app/components/settings/components/SettingSwitch';
import alertConstants from '@core/app/constants/alert-constants';
import { useSettingStore } from '@core/app/pages/Settings/useSettingStore';
import checkIPFormat from '@core/helpers/check-ip-format';
import useI18n from '@core/helpers/useI18n';

import styles from './Connection.module.scss';

interface IpItem {
  id: string;
  value: string;
}

const parseIpList = (str: string): IpItem[] =>
  str
    .split(/[,]\s*/)
    .filter(Boolean)
    .map((ip) => ({ id: uuidv4(), value: ip }));

function Connection(): React.JSX.Element {
  const lang = useI18n();
  const { getConfig, setConfig } = useSettingStore();
  // eslint-disable-next-line hooks/exhaustive-deps -- Only parse once on mount
  const initialIpList = useMemo(() => parseIpList(getConfig('poke-ip-addr')), []);
  const [ipList, setIpList] = useState<IpItem[]>(initialIpList);
  const [selectedId, setSelectedId] = useState<null | string>(null);

  const updateIpConfig = (newList: IpItem[]): void => {
    setIpList(newList);

    const validIps = newList
      .map((item) => item.value)
      .filter(Boolean)
      .join(',');

    setConfig('poke-ip-addr', validIps);
  };

  const handleIpChange = (id: string, value: string): void => {
    setIpList((prev) => prev.map((item) => (item.id === id ? { ...item, value } : item)));
  };

  const handleIpBlur = (id: string, value: string): void => {
    if (value !== '' && !checkIPFormat(value)) {
      alert.popUp({
        id: 'wrong-ip-error',
        message: `${lang.settings.wrong_ip_format}\n${value}`,
        type: alertConstants.SHOW_POPUP_ERROR,
      });

      const initialItem = initialIpList.find((item) => item.id === id);
      const revertedList = ipList.map((item) => (item.id === id ? { ...item, value: initialItem?.value || '' } : item));

      setIpList(revertedList);

      return;
    }

    const newList = ipList.map((item) => (item.id === id ? { ...item, value } : item));

    updateIpConfig(newList);
  };

  const handleAddIp = (): void => {
    setIpList([...ipList, { id: uuidv4(), value: '' }]);
  };

  const handleRemoveIp = (): void => {
    if (ipList.length > 1) {
      const idToRemove = selectedId ?? ipList[ipList.length - 1].id;
      const newList = ipList.filter((item) => item.id !== idToRemove);

      updateIpConfig(newList);
      setSelectedId(null);
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
        id="set-auto-connect"
        label={lang.settings.auto_connect}
        onChange={(e) => setConfig('auto_connect', e)}
      />
      <div className={styles['ip-section']} id="connect-ip-list">
        <span className={styles['ip-label']}>{lang.settings.ip}</span>
        <div className={styles['ip-content']}>
          <div className={styles['ip-list']}>
            {ipList.map((item) => (
              <Input
                autoComplete="false"
                className={styles['ip-input']}
                key={item.id}
                onBlur={(e) => handleIpBlur(item.id, e.target.value)}
                onChange={(e) => handleIpChange(item.id, e.target.value)}
                onFocus={() => setSelectedId(item.id)}
                placeholder="192.168.1.1"
                value={item.value}
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
      </div>
    </>
  );
}

export default Connection;
