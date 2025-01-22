import * as React from 'react';

import classNames from 'classnames';

import type { ArrowDirection } from '@core/interfaces/IDialog';

interface Position {
  bottom?: number;
  left?: number;
  right?: number;
  top?: number;
}

interface Props {
  arrowColor: string;
  arrowDirection: ArrowDirection;
  arrowHeight: number;
  arrowPadding: number;
  arrowWidth: number;
  children?: React.JSX.Element;
  content: React.JSX.Element | string;
  onClose: () => void;
  position: Position;
}

class DialogBox extends React.PureComponent<Props> {
  renderArrow = () => {
    const {
      arrowColor = '#0091ff',
      arrowDirection = 'left',
      arrowHeight = 17,
      arrowPadding = 15,
      arrowWidth = 20,
      position = { left: 100, top: 100 },
    } = this.props;
    const arrowStyle = {
      bottom: {
        borderColor: `${arrowColor} transparent transparent transparent`,
        borderWidth: `${arrowHeight}px ${arrowWidth / 2}px 0 ${arrowWidth / 2}px`,
      },
      left: {
        borderColor: `transparent ${arrowColor} transparent transparent`,
        borderWidth: `${arrowWidth / 2}px ${arrowHeight}px ${arrowWidth / 2}px 0`,
      },
      right: {
        borderColor: `transparent transparent transparent ${arrowColor}`,
        borderWidth: `${arrowWidth / 2}px 0 ${arrowWidth / 2}px ${arrowHeight}px`,
      },
      top: {
        borderColor: `transparent transparent ${arrowColor} transparent`,
        borderWidth: `0 ${arrowWidth / 2}px ${arrowHeight}px ${arrowWidth / 2}px`,
      },
    }[arrowDirection];
    const horizontalRef = position.left === undefined ? 'right' : 'left';
    const verticalRef = position.top === undefined ? 'bottom' : 'top';

    if (arrowDirection === 'top' || arrowDirection === 'bottom') {
      arrowStyle[horizontalRef] = arrowPadding;
    } else {
      arrowStyle[verticalRef] = arrowPadding;
    }

    return <div className={classNames('dialog-box-arrow', arrowDirection)} style={arrowStyle} />;
  };

  calculatePositioStyle = () => {
    const {
      arrowDirection = 'left',
      arrowHeight = 17,
      arrowPadding = 15,
      arrowWidth = 20,
      position = { left: 100, top: 100 },
    } = this.props;
    const horizontalRef = position.left === undefined ? 'right' : 'left';
    const verticalRef = position.top === undefined ? 'bottom' : 'top';
    const style = {};

    if (arrowDirection === 'top' || arrowDirection === 'bottom') {
      style[horizontalRef] = position[horizontalRef] - arrowPadding - arrowWidth / 2;
      style[verticalRef] = position[verticalRef] + arrowHeight;
    } else {
      style[verticalRef] = position[verticalRef] - arrowPadding - arrowWidth / 2;
      style[horizontalRef] = position[horizontalRef] + arrowHeight;
    }

    return style;
  };

  renderCloseButton = () => {
    const { onClose, position = { left: 100, top: 100 } } = this.props;
    const horizontalRef = position.left === undefined ? 'right' : 'left';

    return (
      <div className={classNames('close-btn', horizontalRef)} onClick={onClose}>
        <div className="cross-wrapper">
          <div className="bars bar1" />
          <div className="bars bar2" />
        </div>
      </div>
    );
  };

  render() {
    const { children, content } = this.props;

    return (
      <div className={classNames('dialog-box-container')} style={this.calculatePositioStyle()}>
        {this.renderArrow()}
        <div className={classNames('dialog-box')}>{children || content}</div>
        {this.renderCloseButton()}
      </div>
    );
  }
}

export default DialogBox;
