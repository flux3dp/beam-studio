import * as React from 'react';

import classNames from 'classnames';

import type { ArrowDirection } from '@core/interfaces/IDialog';

interface Position {
  bottom?: number;
  left?: number;
  right?: number;
  top?: number;
}

interface DialogBoxProps {
  arrowColor?: string;
  arrowDirection?: ArrowDirection;
  arrowHeight?: number;
  arrowPadding?: number;
  arrowWidth?: number;
  children?: React.JSX.Element;
  content: React.JSX.Element | string;
  onClose: () => void;
  position?: Position;
}

const DialogBox = ({
  arrowColor = '#0091ff',
  arrowDirection = 'left',
  arrowHeight = 17,
  arrowPadding = 15,
  arrowWidth = 20,
  children,
  content,
  onClose,
  position = { left: 100, top: 100 },
}: DialogBoxProps): React.JSX.Element => {
  const renderArrow = () => {
    const arrowStyle: any = {
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

  const calculatePositionStyle = () => {
    const horizontalRef = position.left === undefined ? 'right' : 'left';
    const verticalRef = position.top === undefined ? 'bottom' : 'top';
    const style: any = {};

    if (arrowDirection === 'top' || arrowDirection === 'bottom') {
      style[horizontalRef] = position[horizontalRef] - arrowPadding - arrowWidth / 2;
      style[verticalRef] = position[verticalRef] + arrowHeight;
    } else {
      style[verticalRef] = position[verticalRef] - arrowPadding - arrowWidth / 2;
      style[horizontalRef] = position[horizontalRef] + arrowHeight;
    }

    return style;
  };

  const renderCloseButton = () => {
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

  return (
    <div className={classNames('dialog-box-container')} style={calculatePositionStyle()}>
      {renderArrow()}
      <div className={classNames('dialog-box')}>{children || content}</div>
      {renderCloseButton()}
    </div>
  );
};

export default DialogBox;
