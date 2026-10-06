// Lesson list + current lesson (title, player, footer). Shared by the course dialog and the
// Welcome-page tab (PRD §5.2); reads the current lesson from `flux101Store`.
import React, { useMemo } from 'react';

import {
  CheckOutlined,
  ExportOutlined,
  InfoCircleFilled,
  StepBackwardOutlined,
  StepForwardOutlined,
} from '@ant-design/icons';
import { Button, Space, Tag, Typography } from 'antd';

import { useDocumentStore } from '@core/app/stores/documentStore';
import deviceMaster from '@core/helpers/device-master';
import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';

import { helpArticleIdFor, helpArticleUrl, LESSONS } from './catalog';
import styles from './CourseBody.module.scss';
import Flux101Player from './Flux101Player';
import { useFlux101Store } from './flux101Store';
import LessonList from './LessonList';
import { completeLesson, isLessonComplete, useFlux101Bucket } from './progress';

import { celebrate } from '.';

const CourseBody = (): React.JSX.Element => {
  const t = useI18n().flux_101;
  const { lessonId, selectLesson } = useFlux101Store();
  const bucket = useFlux101Bucket();
  const workarea = useDocumentStore((s) => s.workarea);
  const machine = useMemo(() => deviceMaster.currentDevice?.info?.model ?? workarea, [workarea]);
  const lesson = LESSONS.find((l) => l.id === lessonId)!;
  const articleId = helpArticleIdFor(lesson, machine);
  const index = LESSONS.indexOf(lesson);
  const done = isLessonComplete(bucket, lessonId);

  return (
    <div className={styles.body}>
      <div className={styles.list}>
        <LessonList currentId={lessonId} onSelect={selectLesson} />
      </div>

      <div className={styles.main}>
        <div className={styles.lessonHeader}>
          <Tag bordered={false} color="blue">
            {lesson.id}
          </Tag>
          <Typography.Text strong>{t.lessons[lesson.id]}</Typography.Text>
          {articleId && (
            <Typography.Link className={styles.help} onClick={() => browser.open(helpArticleUrl(articleId))}>
              {t.help_article} <ExportOutlined />
            </Typography.Link>
          )}
        </div>
        {lesson.id === '2-1' && (machine === 'fbm1' || machine === 'fbm2') && (
          <Tag bordered={false} color="geekblue" icon={<InfoCircleFilled />}>
            {t.water_tank_note}
          </Tag>
        )}

        <div className={styles.slot}>
          <Flux101Player lessonId={lessonId} />
        </div>

        <Typography.Text className={styles.audioNote} type="secondary">
          {t.english_audio}
        </Typography.Text>

        <div className={styles.footer}>
          <Button
            disabled={index === 0}
            icon={<StepBackwardOutlined />}
            onClick={() => selectLesson(LESSONS[index - 1].id)}
          >
            {t.prev}
          </Button>
          <Space className={styles.actions}>
            <Button
              disabled={done}
              icon={done ? <CheckOutlined /> : undefined}
              onClick={() => celebrate(completeLesson(lessonId, 'marked_done'))}
            >
              {done ? t.completed : t.mark_done}
            </Button>
            <Button
              disabled={index === LESSONS.length - 1}
              icon={<StepForwardOutlined />}
              onClick={() => selectLesson(LESSONS[index + 1].id)}
              type={done ? 'primary' : 'default'}
            >
              {t.next}
            </Button>
          </Space>
        </div>
      </div>
    </div>
  );
};

export default CourseBody;
