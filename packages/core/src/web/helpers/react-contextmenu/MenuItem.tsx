/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import React, { Component } from 'react';
import cx from 'classnames';

import { hideMenu } from './actions';
import { callIfExists, cssClasses, store } from './helpers';

interface Props {
  children?: React.ReactNode,
  attributes?: any,
  className?: string,
  data?: any,
  disabled?: boolean,
  divider?: boolean,
  onClick?: (e: Event) => void,
  onMouseLeave?: (e: Event) => void,
  onMouseMove?: (e: Event) => void,
  preventClose?: boolean,
  selected?: boolean,
}

export default class MenuItem extends Component<Props> {
  // eslint-disable-next-line react/static-property-placement
  static defaultProps = {
    attributes: {},
    children: null,
    className: '',
    data: {},
    disabled: false,
    divider: false,
    onClick(): void { return null; },
    onMouseMove: (): void => null,
    onMouseLeave: (): void => null,
    preventClose: false,
    selected: false,
  };

  public ref: HTMLElement;

  handleClick = (event) => {
    const {
      data, disabled, divider, onClick, preventClose,
    } = this.props;
    if (event.button !== 0 && event.button !== 1) {
      event.preventDefault();
    }

    if (disabled || divider) return;

    callIfExists(
      onClick,
      event,
      { ...data, ...store.data },
      store.target,
    );

    if (preventClose) return;

    hideMenu();
  };

  render() {
    const {
      attributes,
      children,
      className,
      disabled,
      divider,
      selected,
      onMouseMove,
      onMouseLeave,
    } = this.props;

    const menuItemClassNames = cx(
      className,
      cssClasses.menuItem,
      attributes.className,
      {
        [cx(cssClasses.menuItemDisabled, attributes.disabledClassName)]: disabled,
        [cx(cssClasses.menuItemDivider, attributes.dividerClassName)]: divider,
        [cx(cssClasses.menuItemSelected, attributes.selectedClassName)]: selected,
      },
    );

    return (
      // eslint-disable-next-line jsx-a11y/role-supports-aria-props
      <div
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...attributes}
        className={menuItemClassNames}
        role="menuitem"
        tabIndex="-1"
        aria-disabled={disabled ? 'true' : 'false'}
        aria-orientation={divider ? 'horizontal' : null}
        ref={(ref) => { this.ref = ref; }}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onTouchEnd={this.handleClick}
        onClick={this.handleClick}
      >
        {divider ? null : children}
      </div>
    );
  }
}
