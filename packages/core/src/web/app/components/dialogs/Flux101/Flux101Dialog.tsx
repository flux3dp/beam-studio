// FLUX 101 course window (PRD §5.3). The YouTube player lives in a single position:fixed host
// that is laid over whichever slot is mounted (dialog now, PiP later) so switching modes never
// remounts the iframe.
import React, { type RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';

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
import { createPortal } from 'react-dom';

import { useDocumentStore } from '@core/app/stores/documentStore';
import deviceMaster from '@core/helpers/device-master';
import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';

import { LESSONS } from './catalog';
import styles from './Flux101Dialog.module.scss';
import { useFlux101Store } from './flux101Store';
import LessonList from './LessonList';
import { completedCount, completeLesson, isLessonComplete, useFlux101Bucket } from './progress';
import { useYouTubePlayer } from './useYouTubePlayer';

const useRect = (ref: RefObject<HTMLElement | null>, deps: unknown[]): DOMRect | null => {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const next = ref.current?.getBoundingClientRect();

      if (next) {
        setRect((prev) =>
          prev && ['x', 'y', 'width', 'height'].every((k) => prev[k as 'x'] === next[k as 'x']) ? prev : next,
        );
      }
    };
    const raf = requestAnimationFrame(measure);
    const timer = setTimeout(measure, 300); // antd portal / modal layout settles

    measure();
    window.addEventListener('resize', measure);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      window.removeEventListener('resize', measure);
    };
    // eslint-disable-next-line hooks/exhaustive-deps
  }, deps);

  return rect;
};

interface Flux101DialogProps {
  onClose: () => void;
}

const Flux101Dialog = ({ onClose }: Flux101DialogProps): React.JSX.Element => {
  const t = useI18n().flux_101;
  const { close, lessonId, minimize, selectLesson, view } = useFlux101Store();
  const bucket = useFlux101Bucket();
  const workarea = useDocumentStore((s) => s.workarea);
  const machine = deviceMaster.currentDevice?.info?.model ?? workarea;
  const lesson = LESSONS.find((l) => l.id === lessonId)!;
  const index = LESSONS.indexOf(lesson);
  const done = isLessonComplete(bucket, lessonId);

  const slotRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const rect = useRect(slotRef, [view, lessonId]);

  useYouTubePlayer(hostRef, lessonId);

  // Close (✕) unmounts the whole window, which destroys the player and stops playback (R5a).
  useEffect(() => {
    if (view === 'closed') onClose();
  }, [view, onClose]);

  return (
    <>
      <Modal
        centered
        closable={false}
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
              <Button icon={<MinusOutlined />} onClick={minimize} title={t.minimize} type="text" />
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

              <div className={styles.slot} ref={slotRef} />

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

      {/* the one and only player, laid over the active slot; portaled to body so no ancestor
          stacking context or transform can trap the fixed positioning below the antd modal */}
      {createPortal(
        <div
          className={styles.player}
          style={
            rect ? { height: rect.height, left: rect.x, top: rect.y, width: rect.width } : { visibility: 'hidden' }
          }
        >
          <div ref={hostRef} />
        </div>,
        document.body,
      )}
    </>
  );
};

export default Flux101Dialog;
