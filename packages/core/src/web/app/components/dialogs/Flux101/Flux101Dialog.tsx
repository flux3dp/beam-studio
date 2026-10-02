// FLUX 101 course window (PRD §5.3): header, lesson list, player slot and footer. In PiP mode the
// modal is destroyed and `PipPlayer` mounts its own player (D24).
import React, { useEffect } from 'react';

import {
  CheckOutlined,
  CloseOutlined,
  ExportOutlined,
  InfoCircleFilled,
  MinusOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
} from '@ant-design/icons';
import { Button, Modal, Space, Tag, Typography } from 'antd';

import { useDocumentStore } from '@core/app/stores/documentStore';
import { useIsMobile } from '@core/app/stores/screenStore';
import deviceMaster from '@core/helpers/device-master';
import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';

import { LESSONS } from './catalog';
import styles from './Flux101Dialog.module.scss';
import Flux101Player from './Flux101Player';
import { useFlux101Store } from './flux101Store';
import LessonList from './LessonList';
import PipPlayer from './PipPlayer';
import { completedCount, completeLesson, isLessonComplete, useFlux101Bucket } from './progress';

interface Flux101DialogProps {
  onClose: () => void;
}

const Flux101Dialog = ({ onClose }: Flux101DialogProps): React.JSX.Element => {
  const t = useI18n().flux_101;
  const { close, expand, lessonId, minimize, selectLesson, view } = useFlux101Store();
  const isMobile = useIsMobile();
  const bucket = useFlux101Bucket();
  const workarea = useDocumentStore((s) => s.workarea);
  const machine = deviceMaster.currentDevice?.info?.model ?? workarea;
  const lesson = LESSONS.find((l) => l.id === lessonId)!;
  const index = LESSONS.indexOf(lesson);
  const done = isLessonComplete(bucket, lessonId);

  // Close (✕) unmounts the whole window, which destroys the player and stops playback (R5a).
  useEffect(() => {
    if (view === 'closed') onClose();
  }, [view, onClose]);

  return (
    <>
      <Modal
        centered
        closable={false}
        destroyOnClose
        footer={null}
        maskClosable={false}
        maskTransitionName=""
        onCancel={close}
        open={view === 'dialog'}
        styles={{ body: { padding: 0 }, content: { borderRadius: 16, overflow: 'hidden', padding: 0 } }}
        transitionName=""
        width={940}
      >
        <div className={styles.course}>
          <header className={styles.header}>
            <span className={styles.logo}>🎓</span>
            <Typography.Title level={5} style={{ margin: 0 }}>
              {t.title}
            </Typography.Title>
            <Tag bordered={false}>
              {completedCount(bucket)}/{LESSONS.length}
            </Tag>
            <Space className={styles.actions} size={2}>
              {!isMobile && <Button icon={<MinusOutlined />} onClick={minimize} title={t.minimize} type="text" />}
              <Button icon={<CloseOutlined />} onClick={close} title={t.close} type="text" />
            </Space>
          </header>

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
                {lesson.helpArticleUrl && (
                  <Typography.Link className={styles.help} onClick={() => browser.open(lesson.helpArticleUrl!)}>
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
                    onClick={() => completeLesson(lessonId, 'marked_done')}
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
        </div>
      </Modal>

      {view === 'pip' && <PipPlayer lessonId={lessonId} onClose={close} onExpand={expand} />}
    </>
  );
};

export default Flux101Dialog;
