import React, { useMemo } from 'react';

import { Collapse } from 'antd';
import classNames from 'classnames';
import { useLocation } from 'react-router-dom';

import { adorModels, nxModels } from '@core/app/actions/beambox/constant';
import useI18n from '@core/helpers/useI18n';

import styles from './ConnectWiFi.module.scss';

const ConnectWiFi = (): React.JSX.Element => {
  const lang = useI18n().initialize;
  const { search } = useLocation();
  const [model, isAdor, isNx] = useMemo(() => {
    const model = new URLSearchParams(search).get('model') ?? '';

    return [model, adorModels.has(model), nxModels.has(model)];
  }, [search]);

  const imageSrc = useMemo(() => {
    if (isAdor) {
      return 'core-img/init-panel/ador-network.jpg';
    }

    if (isNx) {
      return 'core-img/init-panel/beambox-2-panel.png';
    }

    return 'img/init-panel/touch-panel-en.jpg';
  }, [isAdor, isNx]);

  const handleNext = () => {
    const urlParams = new URLSearchParams({ model, wired: '0' });
    const queryString = urlParams.toString();

    window.location.hash = `#/initialize/connect/connect-machine-ip?${queryString}`;
  };

  return (
    <div className={styles.container}>
      <div className={styles['top-bar']} />
      <div className={styles.btns}>
        <div className={styles.btn} onClick={() => window.history.back()}>
          {lang.back}
        </div>
        <div className={classNames(styles.btn, styles.primary)} onClick={handleNext}>
          {lang.next}
        </div>
      </div>
      <div className={classNames(styles.main, { [styles.ador]: isAdor, [styles.nx]: isNx })}>
        <div className={styles.image}>
          <div className={styles.hint} />
          <img draggable="false" src={imageSrc} />
        </div>
        <div className={styles.text}>
          <div className={styles.title}>{lang.connect_wifi.title}</div>
          <div className={classNames(styles.contents, styles.tutorial)}>
            <div>{isAdor ? lang.connect_wifi.tutorial1_ador : lang.connect_wifi.tutorial1}</div>
            <div>{lang.connect_wifi.tutorial2}</div>
          </div>
          <Collapse
            accordion
            items={[
              {
                children: (
                  <div className={classNames(styles.contents, styles.collapse)}>
                    {lang.connect_wifi.what_if_1_content}
                  </div>
                ),
                key: '1',
                label: lang.connect_wifi.what_if_1,
              },
              {
                children: (
                  <div className={classNames(styles.contents, styles.collapse)}>
                    {lang.connect_wifi.what_if_2_content}
                  </div>
                ),
                key: '2',
                label: lang.connect_wifi.what_if_2,
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default ConnectWiFi;
