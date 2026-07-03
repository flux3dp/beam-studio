import React from 'react';

import useI18n from '@core/helpers/useI18n';

import styles from './ConnectionIssueStep.module.scss';

const StepFail = (): React.JSX.Element => {
  const lang = useI18n().connection_issue_guide.fail;

  // TODO: update image
  return (
    <>
      <div className={styles.image}>
        <img draggable="false" src="core-img/connection-issue-guide/fail.png" />
      </div>
      <div className={styles.textColumn}>
        <div className={styles.scrollable}>
          <div className={styles.text}>
            <div className={styles.title}>{lang.title}</div>
            <div className={styles.content}>{lang.intro}</div>
            <div className={styles.subtitle}>{lang.contact_title}</div>
            <div className={styles.bullets}>
              <div className={styles.content}>{lang.bullet1}</div>
              <div className={styles.content}>{lang.bullet2}</div>
              <div className={styles.content}>{lang.bullet3}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StepFail;
