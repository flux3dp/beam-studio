import React from 'react';

import classNames from 'classnames';
import Draggable from 'react-draggable';

interface Props {
  children?: React.ReactNode;
  containerClass: string;
  defaultPosition: { x: number; y: number };
  handleClass?: string;
  onClose?: () => void;
  title: string;
}
class DraggableWindow extends React.PureComponent<Props> {
  renderTrafficLight() {
    const { onClose } = this.props;

    return (
      <div className={classNames('traffic-lights')}>
        <div className={classNames('traffic-light', 'traffic-light-close')} onClick={onClose || (() => {})} />
      </div>
    );
  }

  render(): React.JSX.Element {
    const { children, containerClass, defaultPosition, handleClass, title } = this.props;

    return (
      <Draggable
        bounds="body"
        defaultClassName={classNames('react-draggable', containerClass)}
        defaultPosition={defaultPosition}
        handle=".handle"
      >
        <div>
          <div className={classNames('handle', handleClass)}>{title}</div>
          {this.renderTrafficLight()}
          {children}
        </div>
      </Draggable>
    );
  }
}

export default DraggableWindow;
