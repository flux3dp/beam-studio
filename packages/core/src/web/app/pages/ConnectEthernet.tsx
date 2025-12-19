import React, { useMemo } from 'react';

import classNames from 'classnames';

import { getOS } from '@core/helpers/getOS';
import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';

import styles from './ConnectEthernet.module.scss';

const ConnectEthernet = (): React.JSX.Element => {
  const lang = useI18n().initialize;

  const { model } = useMemo(() => {
    const queryString = window.location.hash.split('?')[1] || '';
    const urlParams = new URLSearchParams(queryString);

    return { model: urlParams.get('model')! };
  }, []);

  const guideHref =
    getOS() === 'MacOS' ? lang.connect_ethernet.tutorial2_a_href_mac : lang.connect_ethernet.tutorial2_a_href_win;

  const handleNext = () => {
    const urlParams = new URLSearchParams({ model, wired: '1' });
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
      <div className={styles.main}>
        <div className={styles.image}>
          <div className={classNames(styles.circle, styles.c1)} />
          <img draggable="false" src="img/init-panel/icon-dual-cable.svg" />
          <div className={classNames(styles.circle, styles.c2)} />
        </div>
        <div className={styles.text}>
          <div className={styles.title}>{lang.connect_ethernet.title}</div>
          <div className={classNames(styles.contents, styles.tutorial)}>
            <div>{lang.connect_ethernet.tutorial1}</div>
            <div>
              {lang.connect_ethernet.tutorial2_1}
              <span className={styles.link} onClick={() => browser.open(guideHref)}>
                {lang.connect_ethernet.tutorial2_a_text}
              </span>
              {lang.connect_ethernet.tutorial2_2}
            </div>
            <div>{lang.connect_ethernet.tutorial3}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectEthernet;
