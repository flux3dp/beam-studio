import React, { useMemo } from 'react';

import classNames from 'classnames';

import { getOS } from '@core/helpers/getOS';
import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';

import EthernetImage from './Components/EthernetImage';
import SetupPageLayout from './Components/SetupPageLayout';
import styles from './ConnectionPage.module.scss';

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
    <SetupPageLayout
      buttons={[
        { label: lang.back, onClick: () => window.history.back() },
        { label: lang.next, onClick: handleNext, primary: true },
      ]}
    >
      <EthernetImage />
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
    </SetupPageLayout>
  );
};

export default ConnectEthernet;
