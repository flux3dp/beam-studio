import React from 'react';

import { Alert } from 'antd';

import useI18n from '@core/helpers/useI18n';

import styles from './ConnectionIssueStep.module.scss';

const StepHotspot = (): React.JSX.Element => {
  const lang = useI18n().connection_issue_guide.hotspot;

  return (
    <div className={styles.column}>
      <div className={styles.scrollable}>
        <Alert message={lang.warning_2_4ghz} showIcon type="warning" />
        <div className={styles.row}>
          <div className={styles.platform}>
            <div className={styles.subtitle}>{lang.ios_title}</div>
            <div className={styles.content}>{lang.ios_steps}</div>
            <div className={styles.image}>
              <img draggable="false" src="core-img/connection-issue-guide/hotspot-ios.jpg" />
            </div>
          </div>
          <div className={styles.platform}>
            <div className={styles.subtitle}>{lang.android_title}</div>
            <div className={styles.content}>{lang.android_steps}</div>
            <div className={styles.image}>
              <img draggable="false" src="core-img/connection-issue-guide/hotspot-android.jpg" />
            </div>
          </div>
        </div>
        <Alert message={lang.tip} showIcon type="info" />
      </div>
    </div>
  );
};

export default StepHotspot;
