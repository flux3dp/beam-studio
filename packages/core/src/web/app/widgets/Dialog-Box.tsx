import * as React from 'react';
import classNames from 'classnames';
import { ArrowDirection } from 'interfaces/IDialog';

interface Position {
  top?: number;
  left?: number;
  bottom?: number;
  right?: number;
}

interface Props {
  children?: JSX.Element;
  arrowDirection: ArrowDirection;
  arrowHeight: number;
  arrowWidth: number;
  arrowColor: string;
  arrowPadding: number;
  position: Position;
  onClose: () => void;
  content: string | JSX.Element;
}

class DialogBox extends React.PureComponent<Props> {
  renderArrow = () => {
    const {
      arrowDirection = 'left',
      arrowHeight = 17,
      arrowWidth = 20,
      arrowColor = '#0091ff',
      arrowPadding = 15,
      position = { left: 100, top: 100 },
    } = this.props;
    const arrowStyle = {
      top: {
        borderWidth: `0 ${arrowWidth / 2}px ${arrowHeight}px ${arrowWidth / 2}px`,
        borderColor: `transparent transparent ${arrowColor} transparent`,
      },
      left: {
        borderWidth: `${arrowWidth / 2}px ${arrowHeight}px ${arrowWidth / 2}px 0`,
        borderColor: `transparent ${arrowColor} transparent transparent`,
      },
      right: {
        borderWidth: `${arrowWidth / 2}px 0 ${arrowWidth / 2}px ${arrowHeight}px`,
        borderColor: `transparent transparent transparent ${arrowColor}`,
      },
      bottom: {
        borderWidth: `${arrowHeight}px ${arrowWidth / 2}px 0 ${arrowWidth / 2}px`,
        borderColor: `${arrowColor} transparent transparent transparent`,
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
      arrowWidth = 20,
      arrowPadding = 15,
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
    const { position = { left: 100, top: 100 }, onClose } = this.props;
    const horizontalRef = position.left === undefined ? 'right' : 'left';
    return (
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions
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
