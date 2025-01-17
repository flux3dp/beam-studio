/* eslint-disable @typescript-eslint/no-shadow */
import classNames from 'classnames';
import React, { useMemo } from 'react';
import { Collapse } from 'antd';

import { adorModels, bb2Models } from 'app/actions/beambox/constant';
import useI18n from 'helpers/useI18n';

import { useLocation } from 'react-router-dom';
import styles from './ConnectWired.module.scss';

const ConnectWired = (): JSX.Element => {
  const lang = useI18n().initialize;
  const { search } = useLocation();
  const [model, isAdor, isBb2] = useMemo(() => {
    const model = new URLSearchParams(search).get('model');
    return [model, adorModels.has(model), bb2Models.has(model)];
  }, [search]);

  const imageSrc = useMemo(() => {
    if (isAdor) {
      return 'core-img/init-panel/ador-network.jpg';
    }

    if (isBb2) {
      return 'core-img/init-panel/beambox-2-panel.png';
    }

    return 'img/init-panel/touch-panel-en.jpg';
  }, [isAdor, isBb2]);

  const handleNext = () => {
    const urlParams = new URLSearchParams({ model, wired: '1' });
    const queryString = urlParams.toString();

    window.location.hash = `#initialize/connect/connect-machine-ip?${queryString}`;
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
      <div className={classNames(styles.main, { [styles.ador]: isAdor, [styles.bb2]: isBb2 })}>
        <div className={styles.image}>
          <div className={styles.hint} />
          <img src={imageSrc} draggable="false" />
        </div>
        <div className={styles.text}>
          <div className={styles.title}>{lang.connect_wired.title}</div>
          <div className={classNames(styles.contents, styles.tutorial)}>
            <div>{lang.connect_wired.tutorial1}</div>
            <div>{isAdor ? lang.connect_wired.tutorial2_ador : lang.connect_wired.tutorial2}</div>
          </div>
          <Collapse
            accordion
            items={[
              {
                key: '1',
                label: lang.connect_wired.what_if_1,
                children: (
                  <div className={classNames(styles.contents, styles.collapse)}>
                    {lang.connect_wired.what_if_1_content}
                  </div>
                ),
              },
              {
                key: '2',
                label: lang.connect_wired.what_if_2,
                children: (
                  <div className={classNames(styles.contents, styles.collapse)}>
                    {lang.connect_wired.what_if_2_content}
                  </div>
                ),
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default ConnectWired;
