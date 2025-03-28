import * as React from 'react';

import classNames from 'classnames';

import Modal from './Modal';

interface HolePosition {
  bottom: number;
  left: number;
  right: number;
  top: number;
}

interface HoleSize {
  height: number;
  width: number;
}

interface Props {
  children?: React.JSX.Element;
  className?: string;
  holePosition: HolePosition;
  holeSize: HoleSize;
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

    let { height, width } = holeSize;

    if (!height) {
      height = window.innerHeight - (holePosition.top || 0 + holePosition.bottom || 0);
    }

    if (!width) {
      width = window.innerWidth - (holePosition.left || 0 + holePosition.right || 0);
    }

    const bottom = holePosition.top !== undefined ? `calc(100% - ${holePosition.top}px)` : holePosition.bottom + height;
    const top = holePosition.bottom !== undefined ? `calc(100% - ${holePosition.bottom}px)` : holePosition.top + height;
    const right = holePosition.left !== undefined ? `calc(100% - ${holePosition.left}px)` : holePosition.right + width;
    const left = holePosition.right !== undefined ? `calc(100% - ${holePosition.right}px)` : holePosition.left + width;

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
