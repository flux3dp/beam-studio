import React from 'react';

import { PlayCircleOutlined } from '@ant-design/icons';
import { Progress } from 'antd';
import { sprintf } from 'sprintf-js';

import { showFlux101 } from '@core/app/components/dialogs/Flux101';
import { LESSONS } from '@core/app/components/dialogs/Flux101/catalog';
import LessonList from '@core/app/components/dialogs/Flux101/LessonList';
import {
  completedCount,
  continueLessonId,
  earnedBadges,
  useFlux101Bucket,
} from '@core/app/components/dialogs/Flux101/progress';
import LeftPanelIcons from '@core/app/icons/left-panel/LeftPanelIcons';
import useI18n from '@core/helpers/useI18n';

import styles from './TabFlux101.module.scss';
import ThemedButton from './ThemedButton';

/** Welcome-page dashboard (PRD §5.2): progress, badges, Continue; lessons open the course dialog. */
const TabFlux101 = (): React.JSX.Element => {
  const t = useI18n().flux_101;
  const bucket = useFlux101Bucket();
  const done = completedCount(bucket);
  const nextId = continueLessonId(bucket);

  return (
    <div>
      <div className={styles.title}>
        <LeftPanelIcons.Book />
        {t.title}
      </div>
      <div className={styles.subtitle}>{sprintf(t.lessons_done, { done, total: LESSONS.length })}</div>
      <div className={styles.content}>
        <div className={styles.summary}>
          <Progress percent={Math.round((done / LESSONS.length) * 100)} showInfo={false} strokeColor="#1677ff" />
          <div className={styles.row}>
            <span className={styles.badges}>
              {earnedBadges(bucket).map((ch) => (
                <span key={ch.id} title={t.badges[ch.id]}>
                  {ch.badgeEmoji}
                </span>
              ))}
            </span>
            <ThemedButton icon={<PlayCircleOutlined />} onClick={() => showFlux101(nextId)} theme="yellow">
              {t.continue}
            </ThemedButton>
          </div>
        </div>
        <div className={styles.list}>
          <LessonList currentId={nextId} onSelect={showFlux101} />
        </div>
      </div>
    </div>
  );
};

export default TabFlux101;
