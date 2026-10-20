import React, { useEffect } from 'react';

import { Button, Progress, Tooltip } from 'antd';
import classNames from 'classnames';
import { sprintf } from 'sprintf-js';

import { showCertificate } from '@core/app/components/dialogs/Flux101';
import { CHAPTERS, LESSONS } from '@core/app/components/dialogs/Flux101/catalog';
import CourseBody from '@core/app/components/dialogs/Flux101/CourseBody';
import {
  completedCount,
  creditsEarned,
  isChapterComplete,
  isCourseComplete,
  useFlux101Bucket,
} from '@core/app/components/dialogs/Flux101/progress';
import { warnIfClaimed } from '@core/app/components/dialogs/Flux101/sync';
import LeftPanelIcons from '@core/app/icons/left-panel/LeftPanelIcons';
import useI18n from '@core/helpers/useI18n';

import styles from './TabFlux101.module.scss';

/** Welcome-page tab (PRD §5.2): progress summary above the embedded course (no window header). */
const TabFlux101 = (): React.JSX.Element => {
  const t = useI18n().flux_101;
  const bucket = useFlux101Bucket();
  const done = completedCount(bucket);
  const credits = creditsEarned(bucket);

  useEffect(warnIfClaimed, []);

  return (
    <div className={styles.root}>
      <div className={styles.title}>
        <LeftPanelIcons.Book />
        {t.title}
      </div>
      <div className={styles.subtitle}>
        {sprintf(t.lessons_done, { done, total: LESSONS.length })}
        {credits > 0 && ` · ${sprintf(t.credits_earned, { credits })}`}
      </div>
      <div className={styles.content}>
        <div className={styles.summary}>
          <Progress percent={Math.round((done / LESSONS.length) * 100)} showInfo={false} strokeColor="#1890ff" />
          <span className={styles.badges}>
            {CHAPTERS.map((ch) => {
              const earned = isChapterComplete(bucket, ch);
              const tip = sprintf(earned ? t.badge_earned : t.badge_locked, {
                badge: t.badges[ch.id],
                chapter: t.chapters[ch.id],
              });

              return (
                <Tooltip key={ch.id} title={tip}>
                  <span className={classNames({ [styles.locked]: !earned })}>{ch.badgeEmoji}</span>
                </Tooltip>
              );
            })}
          </span>
          {isCourseComplete(bucket) && <Button onClick={() => showCertificate()}>🎓 {t.view_certificate}</Button>}
        </div>
        <div className={styles.course}>
          <CourseBody />
        </div>
      </div>
    </div>
  );
};

export default TabFlux101;
