import React from 'react';

import classNames from 'classnames';

import useI18n from '@core/helpers/useI18n';

import styles from './ConnectionIssueStep.module.scss';

const StepSuccess = (): React.JSX.Element => {
  const lang = useI18n().connection_issue_guide.success;

  // TODO: update image
  return (
    <>
      <div className={styles.image}>
        <img draggable="false" src="core-img/connection-issue-guide/success.png" />
      </div>
      <div className={styles.textColumn}>
        <div className={styles.scrollable}>
          <div className={styles.text}>
            <div className={classNames(styles.title, styles.green)}>{lang.title}</div>
            <div className={styles.content}>{lang.intro}</div>
            <div className={styles.content}>{lang.cause}</div>
            <div className={styles.subtitle}>{lang.recommend_title}</div>
            <div className={styles.bullets}>
              <div className={styles.content}>{lang.recommend1}</div>
              <div className={styles.content}>{lang.recommend2}</div>
              <div className={styles.content}>{lang.recommend3}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StepSuccess;
