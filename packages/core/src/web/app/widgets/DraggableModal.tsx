import Draggable, { ControlPosition, DraggableData, DraggableEvent } from 'react-draggable';
import React, { useRef, useState } from 'react';
import { Modal, ModalProps } from 'antd';

import layoutConstants from 'app/constants/layout-constants';

interface Props extends ModalProps {
  defaultPosition?: ControlPosition;
}

const DraggableModal = (props: Props): JSX.Element => {
  const {
    children,
    title,
    modalRender = (modal) => modal,
    defaultPosition = { x: 0, y: -300 },
    ...restProps
  } = props;
  const [disabled, setDisabled] = useState(true);
  const [bounds, setBounds] = useState({ left: 0, top: 0, bottom: 0, right: 0 });
  const draggleRef = useRef<HTMLDivElement>(null);

  const onStart = (_event: DraggableEvent, uiData: DraggableData) => {
    const { clientWidth, clientHeight } = window.document.documentElement;
    const targetRect = draggleRef.current?.getBoundingClientRect();
    if (!targetRect) return;

    setBounds({
      left: -targetRect.left + uiData.x,
      right: clientWidth - (targetRect.right - uiData.x),
      top: -targetRect.top + uiData.y + layoutConstants.topBarHeight,
      bottom: clientHeight - (targetRect.bottom - uiData.y),
    });
  };

  return (
    <Modal
      title={
        <div
          style={{ width: '100%', cursor: 'move' }}
          onMouseOver={() => {
            if (disabled) setDisabled(false);
          }}
          onMouseOut={() => {
            setDisabled(true);
          }}
          // fix eslintjsx-a11y/mouse-events-have-key-events
          // https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/blob/master/docs/rules/mouse-events-have-key-events.md
          onFocus={() => {}}
          onBlur={() => {}}
          // end
        >
          {title}
        </div>
      }
      modalRender={(modal) => (
        <Draggable
          disabled={disabled}
          defaultPosition={defaultPosition}
          bounds={bounds}
          nodeRef={draggleRef}
          onStart={onStart}
        >
          <div ref={draggleRef}>{modalRender(modal)}</div>
        </Draggable>
      )}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...restProps}
    >
      {children}
    </Modal>
  );
};

export default DraggableModal;
