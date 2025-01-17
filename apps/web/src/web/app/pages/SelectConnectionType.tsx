import classNames from 'classnames';
import React, { useMemo } from 'react';

import useI18n from 'helpers/useI18n';
import { supportUsbModels } from 'app/actions/beambox/constant';

import { WorkAreaModel } from 'app/constants/workarea-constants';
import { useLocation } from 'react-router-dom';
import styles from './SelectConnectionType.module.scss';

const TYPE_URL_MAP = {
  wifi: '#initialize/connect/connect-wi-fi',
  wired: '#initialize/connect/connect-wired',
  ether2ether: '#initialize/connect/connect-ethernet',
  usb: '#initialize/connect/connect-usb',
};

const SelectConnectionType = (): JSX.Element => {
  const lang = useI18n().initialize;
  const { search } = useLocation();
  const model = useMemo(() => new URLSearchParams(search).get('model') as WorkAreaModel, [search]);

  const handleBack = () => {
    window.location.hash = '#initialize/connect/select-machine-model';
  };

  const handleConnectionTypeClick = (type: 'wifi' | 'wired' | 'ether2ether' | 'usb') => {
    const url = TYPE_URL_MAP[type];
    const urlParams = new URLSearchParams({ model });
    const queryString = urlParams.toString();

    window.location.hash = `${url}?${queryString}`;
  };

  const renderConnectionTypeButton = (
    type: 'wifi' | 'wired' | 'ether2ether' | 'usb'
  ): JSX.Element => (
    <button
      id={`connect-${type}`}
      type="button"
      className={classNames('btn', styles.btn)}
      onClick={() => handleConnectionTypeClick(type)}
    >
      {lang.connection_types[type]}
    </button>
  );

  const renderConnectionTypeContainer = (
    type: 'wifi' | 'wired' | 'ether2ether' | 'usb'
  ): JSX.Element => (
    <div className={styles['btn-container']}>
      <img className={styles.icon} src={`img/init-panel/icon-${type}.svg`} draggable="false" />
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
