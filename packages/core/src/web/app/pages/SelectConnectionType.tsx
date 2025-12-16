import React, { useMemo } from 'react';

import classNames from 'classnames';
import { useLocation } from 'react-router-dom';

import { supportUsbModels } from '@core/app/actions/beambox/constant';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { hashMap } from '@core/helpers/hashHelper';
import useI18n from '@core/helpers/useI18n';

import styles from './SelectConnectionType.module.scss';

const TYPE_URL_MAP = {
  ether2ether: '#/initialize/connect/connect-ethernet',
  usb: '#/initialize/connect/connect-usb',
  wifi: '#/initialize/connect/connect-wi-fi',
  wired: '#/initialize/connect/connect-wired',
};

const SelectConnectionType = (): React.JSX.Element => {
  const lang = useI18n().initialize;
  const { search } = useLocation();
  const model = useMemo(() => new URLSearchParams(search).get('model') as WorkAreaModel, [search]);

  const handleBack = () => {
    window.location.hash = hashMap.machineSetup;
  };

  const handleConnectionTypeClick = (type: 'ether2ether' | 'usb' | 'wifi' | 'wired') => {
    const url = TYPE_URL_MAP[type];
    const urlParams = new URLSearchParams({ model });
    const queryString = urlParams.toString();

    window.location.hash = `${url}?${queryString}`;
  };

  const renderConnectionTypeButton = (type: 'ether2ether' | 'usb' | 'wifi' | 'wired'): React.JSX.Element => (
    <button
      className={classNames('btn', styles.btn)}
      id={`connect-${type}`}
      onClick={() => handleConnectionTypeClick(type)}
      type="button"
    >
      {lang.connection_types[type]}
    </button>
  );

  const renderConnectionTypeContainer = (type: 'ether2ether' | 'usb' | 'wifi' | 'wired'): React.JSX.Element => (
    <div className={styles['btn-container']}>
      <img className={styles.icon} draggable="false" src={`img/init-panel/icon-${type}.svg`} />
      {renderConnectionTypeButton(type)}
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles['top-bar']} />
      <div className={styles.btns}>
        <div className={classNames(styles.btn, styles.primary)} onClick={handleBack}>
          {lang.back}
        </div>
      </div>
      <div className={styles.main}>
        <h1 className={styles.title}>{lang.select_connection_type}</h1>
        <div className={styles.btns}>
          {renderConnectionTypeContainer('wifi')}
          {renderConnectionTypeContainer('wired')}
          {renderConnectionTypeContainer('ether2ether')}
          {supportUsbModels.has(model) && renderConnectionTypeContainer('usb')}
        </div>
      </div>
    </div>
  );
};

export default SelectConnectionType;
