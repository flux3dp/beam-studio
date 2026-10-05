// FLUX 101 course window (PRD §5.3): modal shell + header around `CourseBody`. In PiP mode the
// modal is destroyed and `PipPlayer` mounts its own player (D24).
import React, { useEffect } from 'react';

import { CloseOutlined, MinusOutlined } from '@ant-design/icons';
import { Button, Modal, Space, Tag, Tooltip, Typography } from 'antd';
import { sprintf } from 'sprintf-js';

import { useIsMobile } from '@core/app/stores/screenStore';
import useI18n from '@core/helpers/useI18n';

import { LESSONS } from './catalog';
import CourseBody from './CourseBody';
import styles from './Flux101Dialog.module.scss';
import { useFlux101Store } from './flux101Store';
import PipPlayer from './PipPlayer';
import { completedCount, creditsEarned, isCourseComplete, useFlux101Bucket } from './progress';
import { useCelebration } from './useCelebration';

import { showCertificate } from './index';

interface Flux101DialogProps {
  onClose: () => void;
}

const Flux101Dialog = ({ onClose }: Flux101DialogProps): React.JSX.Element => {
  const t = useI18n().flux_101;
  const { close, expand, lessonId, minimize, view } = useFlux101Store();
  const isMobile = useIsMobile();
  const bucket = useFlux101Bucket();
  const credits = creditsEarned(bucket);

  useCelebration();

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
              {completedCount(bucket)} / {LESSONS.length}
            </Tag>
            {credits > 0 && (
              <Tooltip title={sprintf(t.credits_earned, { credits })}>
                <Tag bordered={false} className={styles.credits}>
                  +{credits}
                </Tag>
              </Tooltip>
            )}
            <Space className={styles.actions} size={2}>
              {isCourseComplete(bucket) && (
                <Button onClick={() => showCertificate()} title={t.view_certificate} type="text">
                  🎓
                </Button>
              )}
              {!isMobile && <Button icon={<MinusOutlined />} onClick={minimize} title={t.minimize} type="text" />}
              <Button icon={<CloseOutlined />} onClick={close} title={t.close} type="text" />
            </Space>
          </header>

          <CourseBody />
        </div>
      </Modal>

      {view === 'pip' && <PipPlayer lessonId={lessonId} onClose={close} onExpand={expand} />}
    </>
  );
};

export default Flux101Dialog;
