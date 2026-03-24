import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { ModalProps } from 'antd';
import { Modal } from 'antd';
import classNames from 'classnames';
import Draggable from 'react-draggable';
import type { ControlPosition, DraggableData, DraggableEvent } from 'react-draggable';
import { match } from 'ts-pattern';

import layoutConstants from '@core/app/constants/layout-constants';
import { useIsMobile } from '@core/helpers/system-helper';

import styles from './DraggableModal.module.scss';

interface Props extends Omit<ModalProps, 'centered'> {
  centered?: boolean;
  defaultPosition?: ControlPosition;
  disableMobileDrag?: boolean;
  scrollableContent?: boolean;
  width?: number | string;
  xRef?: 'center' | 'left' | 'right';
  yRef?: 'bottom' | 'center' | 'top';
}

const DraggableModal = (props: Props): React.JSX.Element => {
  const {
    children,
    defaultPosition = { x: 0, y: 0 },
    disableMobileDrag,
    modalRender = (modal) => modal,
    scrollableContent,
    title,
    width = 520,
    xRef = 'center',
    yRef = 'center',
    ...restProps
  } = props;
  const isMobile = useIsMobile();
  const [disabled, setDisabled] = useState(true);
  const [bounds, setBounds] = useState({ bottom: 0, left: 0, right: 0, top: 0 });
  const [draggableHeight, setDraggableHeight] = useState(0);
  const [draggableWidth, setDraggableWidth] = useState(0);
  const draggableRef = useRef<HTMLDivElement>(null);
  const currentPosition = useRef<ControlPosition>(defaultPosition);
  const isDragDisabled = disableMobileDrag && isMobile;

  // eslint-disable-next-line hooks/exhaustive-deps
  useEffect(() => {
    if (draggableRef.current && draggableHeight !== draggableRef.current.clientHeight) {
      setDraggableHeight(draggableRef.current.clientHeight);
    }

    if (draggableRef.current && draggableWidth !== draggableRef.current.clientWidth) {
      setDraggableWidth(draggableRef.current.clientWidth);
    }
  });

  const setBoundsAccordingToPosition = useCallback((data: ControlPosition) => {
    const { clientHeight, clientWidth } = window.document.documentElement;
    const targetRect = draggableRef.current?.getBoundingClientRect();

    if (!targetRect) return;

    setBounds({
      bottom: clientHeight - (targetRect.bottom - data.y),
      left: -targetRect.left + data.x,
      right: clientWidth - (targetRect.right - data.x),
      top: -targetRect.top + data.y + layoutConstants.topBarHeight,
    });
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setBoundsAccordingToPosition(currentPosition.current);
    };

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [setBoundsAccordingToPosition]);

  const onStart = (_event: DraggableEvent, uiData: DraggableData) => {
    setBoundsAccordingToPosition(uiData);
  };

  const onStop = (_event: DraggableEvent, uiData: DraggableData) => {
    currentPosition.current = { x: uiData.x, y: uiData.y };
  };

  const positionOffset = useMemo(() => {
    const x = match(xRef)
      .with('left', () => {
        return -window.innerWidth / 2;
      })
      .with('right', () => {
        return -draggableWidth + window.innerWidth / 2;
      })
      .otherwise(() => {
        return -draggableWidth / 2;
      });
    const y = match(yRef)
      .with('top', () => {
        return layoutConstants.topBarHeight - window.innerHeight / 2;
      })
      .with('bottom', () => {
        return -draggableHeight + window.innerHeight / 2;
      })
      .otherwise(() => {
        return -draggableHeight / 2;
      });

    return { x, y };
  }, [xRef, yRef, draggableWidth, draggableHeight]);

  return (
    <Modal
      centered
      modalRender={(modal) => (
        <Draggable
          bounds={bounds}
          defaultPosition={defaultPosition}
          disabled={disabled || isDragDisabled}
          nodeRef={draggableRef as React.RefObject<HTMLDivElement>}
          onStart={onStart}
          onStop={onStop}
          positionOffset={positionOffset}
        >
          <div
            className={classNames({
              [styles.mobileScrollable]: isDragDisabled,
              [styles.scrollable]: scrollableContent,
            })}
            ref={draggableRef}
            style={{ minWidth: `min(${typeof width === 'string' ? width : `${width}px`}, 95vw)` }}
          >
            {modalRender(modal)}
          </div>
        </Draggable>
      )}
      title={
        <div
          onMouseOut={() => setDisabled(true)}
          onMouseOver={() => {
            if (disabled && !isDragDisabled) setDisabled(false);
          }}
          style={{ cursor: isDragDisabled ? 'default' : 'move', width: '100%' }}
          // end
        >
          {title}
        </div>
      }
      width={0}
      {...restProps}
    >
      {children}
    </Modal>
  );
};

export default DraggableModal;
