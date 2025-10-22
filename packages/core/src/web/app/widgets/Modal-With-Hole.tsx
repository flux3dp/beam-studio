import * as React from 'react';

import classNames from 'classnames';

import type { ITutorialDialog } from '@core/interfaces/ITutorial';

import Modal from './Modal';

interface Props {
  children?: React.JSX.Element;
  className?: string;
  holePosition: ITutorialDialog['holePosition'];
  holeSize: ITutorialDialog['holeSize'];
}

class ModalWithHole extends React.PureComponent<Props> {
  componentDidMount() {
    window.addEventListener('resize', () => this.handleResizeWindow());
  }

  componentWillUnmount() {
    window.removeEventListener('resize', () => this.handleResizeWindow());
  }

  handleResizeWindow() {
    this.setState({});
  }

  render() {
    const { children, className, holePosition, holeSize } = this.props;

    if (!holePosition) {
      return <Modal className={{ 'with-hole': true }}>{children}</Modal>;
    }

    const { bottom: holeBottom = 0, left: holeLeft = 0, right: holeRight = 0, top: holeTop = 0 } = holePosition;
    let { height, width } = holeSize || {};

    if (!height) {
      height = window.innerHeight - (holeTop + holeBottom);
    }

    if (!width) {
      width = window.innerWidth - (holeLeft + holeRight);
    }

    const bottom = 'top' in holePosition ? `calc(100% - ${holeTop}px)` : holeBottom + height;
    const top = 'bottom' in holePosition ? `calc(100% - ${holeBottom}px)` : holeTop + height;
    const right = 'left' in holePosition ? `calc(100% - ${holeLeft}px)` : holeRight + width;
    const left = 'right' in holePosition ? `calc(100% - ${holeRight}px)` : holeLeft + width;

    return (
      <div className={classNames('modal-window', 'with-hole', className)}>
        <div className="modal-background" style={{ top }} />
        <div className="modal-background" style={{ bottom }} />
        <div className="modal-background" style={{ left }} />
        <div className="modal-background" style={{ right }} />
        <div className="modal-body">{children}</div>
      </div>
    );
  }
}

export default ModalWithHole;
