import React from 'react';

import useI18n from '@core/helpers/useI18n';

import styles from './ConnectionIssueStep.module.scss';

const StepStart = (): React.JSX.Element => {
  const lang = useI18n().connection_issue_guide;

  return (
    <>
      <div className={styles.image}>
        <img draggable="false" src="core-img/connection-issue-guide/start.jpg" />
      </div>
      <div className={styles.text}>
        <div className={styles.title}>{lang.title}</div>
        <div className={styles.content}>{lang.intro}</div>
        <div className={styles.subtitle}>{lang.how_it_works}</div>
        <div className={styles.content}>
          <div>{lang.how_it_works_step1}</div>
          <div>{lang.how_it_works_step2}</div>
          <div>{lang.how_it_works_step3}</div>
          <div>{lang.how_it_works_step4}</div>
        </div>
      </div>
    </>
  );
};

export default StepStart;
