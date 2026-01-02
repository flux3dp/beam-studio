import React from 'react';

import { InfoCircleOutlined } from '@ant-design/icons';

import useI18n from '@core/helpers/useI18n';

import styles from './AboutInfo.module.scss';

const AboutInfo = (): React.JSX.Element => {
  const lang = useI18n();
  const { FLUX } = window;

  return (
    <div className={styles.container}>
      <div className={styles.icon}>
        <InfoCircleOutlined />
      </div>
      <div className={styles.info}>
        <div className={styles.title}>{lang.topbar.menu.about_beam_studio}</div>
        <div className={styles.version}>{`${lang.topmenu.version} ${FLUX.version}`}</div>
      </div>
    </div>
  );
};

export default AboutInfo;
