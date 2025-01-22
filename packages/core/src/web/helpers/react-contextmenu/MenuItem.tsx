import React, { Component } from 'react';

import cx from 'classnames';

import { hideMenu } from './actions';
import { callIfExists, cssClasses, store } from './helpers';

interface Props {
  attributes?: any;
  children?: React.ReactNode;
  className?: string;
  data?: any;
  disabled?: boolean;
  divider?: boolean;
  onClick?: (e: Event) => void;
  onMouseLeave?: (e: Event) => void;
  onMouseMove?: (e: Event) => void;
  preventClose?: boolean;
  selected?: boolean;
}

export default class MenuItem extends Component<Props> {
  static defaultProps = {
    attributes: {},
    children: null,
    className: '',
    data: {},
    disabled: false,
    divider: false,
    onClick(): void {
      return null;
    },
    onMouseLeave: (): void => null,
    onMouseMove: (): void => null,
    preventClose: false,
    selected: false,
  };

  public ref: HTMLElement;

  handleClick = (event) => {
    const { data, disabled, divider, onClick, preventClose } = this.props;

    if (event.button !== 0 && event.button !== 1) {
      event.preventDefault();
    }

    if (disabled || divider) {
      return;
    }

    callIfExists(onClick, event, { ...data, ...store.data }, store.target);

    if (preventClose) {
      return;
    }

    hideMenu();
  };

  render() {
    const { attributes, children, className, disabled, divider, onMouseLeave, onMouseMove, selected } = this.props;

    const menuItemClassNames = cx(className, cssClasses.menuItem, attributes.className, {
      [cx(cssClasses.menuItemDisabled, attributes.disabledClassName)]: disabled,
      [cx(cssClasses.menuItemDivider, attributes.dividerClassName)]: divider,
      [cx(cssClasses.menuItemSelected, attributes.selectedClassName)]: selected,
    });

    return (
      <div
        {...attributes}
        aria-disabled={disabled ? 'true' : 'false'}
        aria-orientation={divider ? 'horizontal' : null}
        className={menuItemClassNames}
        onClick={this.handleClick}
        onMouseLeave={onMouseLeave}
        onMouseMove={onMouseMove}
        onTouchEnd={this.handleClick}
        ref={(ref) => {
          this.ref = ref;
        }}
        role="menuitem"
        tabIndex="-1"
      >
        {divider ? null : children}
      </div>
    );
  }
}
