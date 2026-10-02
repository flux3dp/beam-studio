import React from 'react';

import { CaretRightFilled, CheckOutlined } from '@ant-design/icons';
import { Avatar, Collapse } from 'antd';
import classNames from 'classnames';

import useI18n from '@core/helpers/useI18n';

import { CHAPTERS } from './catalog';
import styles from './LessonList.module.scss';
import { continueLessonId, isChapterComplete, isLessonComplete, useFlux101Bucket } from './progress';

interface LessonListProps {
  currentId: string;
  onSelect: (lessonId: string) => void;
}

const fmt = (sec: number): string => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

const LessonList = ({ currentId, onSelect }: LessonListProps): React.JSX.Element => {
  const t = useI18n().flux_101;
  const bucket = useFlux101Bucket();
  const nextId = continueLessonId(bucket);

  const items = CHAPTERS.map((ch) => {
    const done = ch.lessons.filter((l) => isLessonComplete(bucket, l.id)).length;
    const full = isChapterComplete(bucket, ch);

    return {
      children: ch.lessons.map((l) => {
        const complete = isLessonComplete(bucket, l.id);

        return (
          <div
            className={classNames(styles.lesson, { [styles.current]: l.id === currentId })}
            key={l.id}
            onClick={() => onSelect(l.id)}
            role="button"
            tabIndex={0}
          >
            <Avatar
              className={classNames(styles.status, {
                [styles.done]: complete,
                [styles.next]: !complete && l.id === nextId,
              })}
              icon={complete ? <CheckOutlined /> : l.id === nextId ? <CaretRightFilled /> : null}
              size={18}
            />
            <span className={styles.id}>{l.id}</span>
            <span className={styles.name}>{t.lessons[l.id]}</span>
            <span className={styles.duration}>{fmt(l.durationSec)}</span>
          </div>
        );
      }),
      key: ch.id,
      label: (
        <div className={styles.chapter}>
          <Avatar className={classNames(styles.badge, { [styles.done]: full })} size={22}>
            {full ? <CheckOutlined /> : ch.id.replace('ch', '')}
          </Avatar>
          <span className={styles.chapterName}>{t.chapters[ch.id]}</span>
          <span className={styles.progress}>
            {full && (
              <span className={styles.emoji} title={t.badges[ch.id]}>
                {ch.badgeEmoji}
              </span>
            )}
            {done}/{ch.lessons.length}
          </span>
        </div>
      ),
    };
  });

  return (
    <Collapse
      className={styles.collapse}
      defaultActiveKey={CHAPTERS.map((c) => c.id)}
      ghost
      items={items}
      size="small"
    />
  );
};

export default LessonList;
