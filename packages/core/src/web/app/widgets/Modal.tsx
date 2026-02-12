import * as React from 'react';
import { useCallback, useEffect } from 'react';

import classNames from 'classnames';

import shortcuts from '../../helpers/shortcuts';

interface ModalProps {
  children?: React.JSX.Element;
  className?: any;
  content?: React.JSX.Element;
  disabledEscapeOnBackground?: boolean;
  onClose?: (any?) => void;
  onOpen?: (any?) => void;
}

const Modal = ({
  children,
  className = {},
  content = <div />,
  disabledEscapeOnBackground = false,
  onClose = () => {},
  onOpen,
}: ModalProps): React.JSX.Element => {
  const onEscapeOnBackground = useCallback(
    (e) => {
      if (!disabledEscapeOnBackground) {
        onClose(e);
      }
    },
    [disabledEscapeOnBackground, onClose],
  );

  useEffect(() => {
    onOpen?.();
    shortcuts.on(['Escape'], (e) => {
      if (!disabledEscapeOnBackground) {
        onClose(e);
      }
    });

    return () => {
      shortcuts.off(['Escape']);

      if (window.svgEditor) {
        shortcuts.on(['Escape'], window.svgEditor.clickSelect);
      }
    };
  }, []);

  className['modal-window'] = true;

  return (
    <div className={classNames(className)}>
      <div className="modal-background" onClick={onEscapeOnBackground} />
      <div className="modal-body">{children || content}</div>
    </div>
  );
};

export default Modal;
