// Floating picture-in-picture window (PRD §5.3 / R5–R6): draggable chrome plus the player.
import React, { useRef } from 'react';

import { CloseOutlined, ExpandOutlined } from '@ant-design/icons';
import { Button, Tag } from 'antd';
import { createPortal } from 'react-dom';
import Draggable from 'react-draggable';

import useI18n from '@core/helpers/useI18n';

import Flux101Player from './Flux101Player';
import styles from './PipPlayer.module.scss';

const PIP_WIDTH = 340;

const BAR_HEIGHT = 34;

interface PipPlayerProps {
  lessonId: string;
  onClose: () => void;
  onExpand: () => void;
}

const PipPlayer = ({ lessonId, onClose, onExpand }: PipPlayerProps): React.JSX.Element => {
  const t = useI18n().flux_101;
  const nodeRef = useRef<HTMLDivElement>(null);

  return createPortal(
    <Draggable
      bounds="body"
      // bottom-right corner; Draggable reads it on mount only, so drags survive re-renders (D17)
      defaultPosition={{
        x: window.innerWidth - PIP_WIDTH - 16,
        y: window.innerHeight - Math.round((PIP_WIDTH * 9) / 16) - BAR_HEIGHT - 16,
      }}
      handle="[data-pip-handle]"
      nodeRef={nodeRef as React.RefObject<HTMLDivElement>}
    >
      <div className={styles.pip} ref={nodeRef} style={{ width: PIP_WIDTH }}>
        <div className={styles.bar} data-pip-handle style={{ height: BAR_HEIGHT }}>
          <Tag bordered={false} color="blue">
            {lessonId}
          </Tag>
          <span className={styles.title}>{t.lessons[lessonId]}</span>
          <Button icon={<ExpandOutlined />} onClick={onExpand} size="small" title={t.expand} type="text" />
          <Button icon={<CloseOutlined />} onClick={onClose} size="small" title={t.close} type="text" />
        </div>
        <div className={styles.slot}>
          <Flux101Player lessonId={lessonId} />
        </div>
      </div>
    </Draggable>,
    document.body,
  );
};

export default PipPlayer;
