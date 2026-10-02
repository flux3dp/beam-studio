// Lesson / chapter completion dialog (PRD §5.4), after the ClickUp draft: icon, headline, lesson,
// chapter progress, "Back to course" / "Next ›". Opened via `showCelebrationDialog` (index.tsx) so
// the dialog, PiP and Welcome tab all use it. Credits tag arrives with D22; XP was cut (D20).
import React, { useEffect } from 'react';

import { Button, Modal, Progress } from 'antd';
import { sprintf } from 'sprintf-js';

import { popConfetti } from '@core/helpers/confetti';
import useI18n from '@core/helpers/useI18n';

import { chapterOf } from './catalog';
import styles from './CelebrationDialog.module.scss';
import { useFlux101Store } from './flux101Store';
import { continueLessonId, isChapterComplete, isLessonComplete, useFlux101Bucket } from './progress';

interface CelebrationDialogProps {
  lessonId: string;
  onClose: () => void;
}

const CelebrationDialog = ({ lessonId, onClose }: CelebrationDialogProps): React.JSX.Element => {
  const t = useI18n().flux_101;
  const selectLesson = useFlux101Store((s) => s.selectLesson);
  const bucket = useFlux101Bucket();
  const chapter = chapterOf(lessonId)!;
  const chapterDone = isChapterComplete(bucket, chapter);
  const done = chapter.lessons.filter((l) => isLessonComplete(bucket, l.id)).length;

  useEffect(() => popConfetti(window.innerWidth / 2, window.innerHeight / 2), []);

  return (
    <Modal centered footer={null} onCancel={onClose} open width={400}>
      <div className={styles.body}>
        <div className={styles.icon}>{chapterDone ? chapter.badgeEmoji : '🎉'}</div>
        <div className={styles.headline}>
          {chapterDone ? sprintf(t.chapter_done, { badge: t.badges[chapter.id] }) : t.lesson_done}
        </div>
        <div className={styles.lesson}>
          {lessonId} {t.lessons[lessonId]}
        </div>
        <div className={styles.chapter}>
          <span>{t.chapters[chapter.id]}</span>
          <span>
            {done}/{chapter.lessons.length}
          </span>
        </div>
        <Progress percent={(done / chapter.lessons.length) * 100} showInfo={false} strokeColor="#1890ff" />
        <div className={styles.actions}>
          <Button onClick={onClose}>{t.expand}</Button>
          <Button
            onClick={() => {
              selectLesson(continueLessonId(bucket));
              onClose();
            }}
            type="primary"
          >
            {t.next} ›
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CelebrationDialog;
