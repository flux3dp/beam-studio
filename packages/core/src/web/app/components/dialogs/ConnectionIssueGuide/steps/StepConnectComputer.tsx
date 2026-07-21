import React from 'react';

import useI18n from '@core/helpers/useI18n';

import styles from './ConnectionIssueStep.module.scss';

const StepConnectComputer = (): React.JSX.Element => {
  const lang = useI18n().connection_issue_guide.connect_computer;

  return (
    <div className={styles.column}>
      <div className={styles.scrollable}>
        <div className={styles.title}>{lang.title}</div>
        <div className={styles.content}>{lang.content}</div>
        <div className={styles.row}>
          <div className={styles.platform}>
            <div className={styles.subtitle}>{lang.macos_title}</div>
            <div className={styles.content}>{lang.macos_steps}</div>
            <div className={styles.image}>
              <img draggable="false" src="core-img/connection-issue-guide/hotspot-macos.jpg" />
            </div>
          </div>
          <div className={styles.platform}>
            <div className={styles.subtitle}>{lang.windows_title}</div>
            <div className={styles.content}>{lang.windows_steps}</div>
            <div className={styles.image}>
              <img draggable="false" src="core-img/connection-issue-guide/hotspot-windows.jpg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepConnectComputer;
