import React from 'react';

import { getArchDisplayName } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import styles from './AboutInfo.module.scss';

const AboutInfo = (): React.JSX.Element => {
  const lang = useI18n();
  const { FLUX } = window;
  const archName = getArchDisplayName();
  const versionDisplay = archName ? `${FLUX.version} (${archName})` : FLUX.version;

  return (
    <div className={styles.container}>
      <div className={styles.icon}>
        <img alt="Beam Studio" draggable={false} src="core-img/BeamStudio-logo.png" />
      </div>
      <div className={styles.info}>
        <div className={styles.title}>{lang.topbar.menu.about_beam_studio}</div>
        <div className={styles.version}>{`${lang.topmenu.version} ${versionDisplay}`}</div>
      </div>
    </div>
  );
};

export default AboutInfo;
