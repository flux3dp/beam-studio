// Floating picture-in-picture shell (PRD §5.3 / R5–R6). Only the chrome lives here; the video is
// the shared fixed player in Flux101Dialog, laid over `slotRef`.
import React, { type RefObject, useRef, useState } from 'react';

import { CloseOutlined, ExpandOutlined } from '@ant-design/icons';
import { Button, Tag } from 'antd';
import { createPortal } from 'react-dom';
import Draggable from 'react-draggable';

import useI18n from '@core/helpers/useI18n';

import styles from './PipPlayer.module.scss';

export const PIP_WIDTH = 340;

const BAR_HEIGHT = 34;

interface PipPlayerProps {
  lessonId: string;
  onClose: () => void;
  /** fired while dragging so the fixed player can follow the slot */
  onDrag: () => void;
  onExpand: () => void;
  slotRef: RefObject<HTMLDivElement | null>;
}

const PipPlayer = ({ lessonId, onClose, onDrag, onExpand, slotRef }: PipPlayerProps): React.JSX.Element => {
  const t = useI18n().flux_101;
  const nodeRef = useRef<HTMLDivElement>(null);
  // bottom-right corner on first open; session-only afterwards (D17)
  const [defaultPosition] = useState(() => ({
    x: window.innerWidth - PIP_WIDTH - 16,
    y: window.innerHeight - Math.round((PIP_WIDTH * 9) / 16) - BAR_HEIGHT - 16,
  }));

  return createPortal(
    <Draggable
      bounds="body"
      defaultPosition={defaultPosition}
      handle="[data-pip-handle]"
      nodeRef={nodeRef as React.RefObject<HTMLDivElement>}
      onDrag={onDrag}
      onStop={onDrag}
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
        <div className={styles.slot} ref={slotRef} />
      </div>
    </Draggable>,
    document.body,
  );
};

export default PipPlayer;
