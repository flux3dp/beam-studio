import React, { useRef, useState } from 'react';

import type { ModalProps } from 'antd';
import { Modal } from 'antd';
import Draggable from 'react-draggable';
import type { ControlPosition, DraggableData, DraggableEvent } from 'react-draggable';

import layoutConstants from '@core/app/constants/layout-constants';

interface Props extends ModalProps {
  defaultPosition?: ControlPosition;
}

const DraggableModal = (props: Props): React.JSX.Element => {
  const { children, defaultPosition = { x: 0, y: -300 }, modalRender = (modal) => modal, title, ...restProps } = props;
  const [disabled, setDisabled] = useState(true);
  const [bounds, setBounds] = useState({ bottom: 0, left: 0, right: 0, top: 0 });
  const draggleRef = useRef<HTMLDivElement>(null);

  const onStart = (_event: DraggableEvent, uiData: DraggableData) => {
    const { clientHeight, clientWidth } = window.document.documentElement;
    const targetRect = draggleRef.current?.getBoundingClientRect();

    if (!targetRect) {
      return;
    }

    setBounds({
      bottom: clientHeight - (targetRect.bottom - uiData.y),
      left: -targetRect.left + uiData.x,
      right: clientWidth - (targetRect.right - uiData.x),
      top: -targetRect.top + uiData.y + layoutConstants.topBarHeight,
    });
  };

  return (
    <Modal
      modalRender={(modal) => (
        <Draggable
          bounds={bounds}
          defaultPosition={defaultPosition}
          disabled={disabled}
          nodeRef={draggleRef}
          onStart={onStart}
        >
          <div ref={draggleRef}>{modalRender(modal)}</div>
        </Draggable>
      )}
      title={
        <div
          onBlur={() => {}}
          // fix eslintjsx-a11y/mouse-events-have-key-events
          // https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/blob/master/docs/rules/mouse-events-have-key-events.md
          onFocus={() => {}}
          onMouseOut={() => {
            setDisabled(true);
          }}
          onMouseOver={() => {
            if (disabled) {
              setDisabled(false);
            }
          }}
          style={{ cursor: 'move', width: '100%' }}
          // end
        >
          {title}
        </div>
      }
      {...restProps}
    >
      {children}
    </Modal>
  );
};

export default DraggableModal;
