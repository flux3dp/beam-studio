/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { Component } from 'react';
import cx from 'classnames';

import { showMenu, hideMenu } from './actions';
import { callIfExists, cssClasses } from './helpers';

interface Props {
  id: string,
  attributes?: any,
  children?: React.ReactNode,
  collect?: Function,
  disable?: boolean,
  holdToDisplay?: number,
  holdToDisplayMouse?: number,
  holdThreshold?: number,
  posX: number,
  posY: number,
  renderTag?: string,
  mouseButton?: number,
  disableIfShiftIsPressed?: boolean,
  hideOnLeaveHoldPosition?: boolean,
}

export default class ContextMenuTrigger extends Component<Props> {
  // eslint-disable-next-line react/static-property-placement
  static defaultProps = {
    attributes: {},
    collect() { return null; },
    disable: false,
    holdToDisplay: 1000,
    holdToDisplayMouse: -1,
    holdThreshold: 10,
    renderTag: 'div',
    posX: 0,
    posY: 0,
    mouseButton: 2, // 0 is left click, 2 is right click
    disableIfShiftIsPressed: false,
  };

  private elem: HTMLElement;

  private mouseDownTimeoutId: NodeJS.Timeout;

  private touchstartTimeoutId: NodeJS.Timeout;

  private holdStartPosition: { x: number, y: number };

  touchHandled = false;

  handleMouseDown = (event) => {
    hideMenu();
    const { attributes, holdToDisplayMouse } = this.props;
    if (holdToDisplayMouse >= 0 && event.button === 0) {
      event.persist();
      event.stopPropagation();
      this.holdStartPosition = {
        x: event.clientX,
        y: event.clientY,
      };
      if (this.mouseDownTimeoutId) clearTimeout(this.mouseDownTimeoutId);
      this.mouseDownTimeoutId = setTimeout(
        () => {
          this.handleContextClick(event);
        },
        holdToDisplayMouse,
      );
    }
    callIfExists(attributes.onMouseDown, event);
  };

  handleMouseMove = (event: MouseEvent) => {
    if (this.mouseDownTimeoutId && this.holdStartPosition && event.button === 0) {
      const { holdThreshold } = this.props;
      const { x, y } = this.holdStartPosition;
      const { clientX, clientY } = event;
      if (Math.hypot(clientX - x, clientY - y) > holdThreshold) {
        clearTimeout(this.mouseDownTimeoutId);
      }
    }
  };

  handleMouseUp = (event) => {
    const { attributes } = this.props;
    if (event.button === 0) {
      clearTimeout(this.mouseDownTimeoutId);
    }
    callIfExists(attributes.onMouseUp, event);
  };

  handleMouseOut = (event) => {
    const { attributes } = this.props;
    if (event.button === 0) {
      clearTimeout(this.mouseDownTimeoutId);
    }
    callIfExists(attributes.onMouseOut, event);
  };

  handleTouchstart = (event) => {
    const { attributes, holdToDisplay } = this.props;
    this.touchHandled = false;

    if (holdToDisplay >= 0 && event.touches.length > 0) {
      event.persist();
      this.holdStartPosition = {
        x: event.touches[0].pageX,
        y: event.touches[0].pageY,
      };
      if (this.touchstartTimeoutId) clearTimeout(this.touchstartTimeoutId);
      this.touchstartTimeoutId = setTimeout(
        () => {
          this.handleContextClick(event);
          this.touchHandled = true;
        },
        holdToDisplay,
      );
    }
    callIfExists(attributes.onTouchStart, event);
  };

  handleTouchMove = (event) => {
    const { holdToDisplay, hideOnLeaveHoldPosition } = this.props;
    if (this.touchstartTimeoutId && this.holdStartPosition && event.touches.length > 0) {
      const { holdThreshold } = this.props;
      const { x, y } = this.holdStartPosition;
      const touch = event.touches[0];
      if (Math.hypot(touch.pageX - x, touch.pageY - y) > holdThreshold) {
        clearTimeout(this.touchstartTimeoutId);
      }
    }
    if (holdToDisplay
      && hideOnLeaveHoldPosition
      && this.holdStartPosition
      && event.touches.length > 0
    ) {
      const { holdThreshold } = this.props;
      const { x, y } = this.holdStartPosition;
      const touch = event.touches[0];
      if (Math.hypot(touch.pageX - x, touch.pageY - y) > holdThreshold) {
        hideMenu();
      }
    }
  };

  handleTouchEnd = (event) => {
    const { attributes } = this.props;
    if (this.touchHandled) {
      event.preventDefault();
    }
    clearTimeout(this.touchstartTimeoutId);
    callIfExists(attributes.onTouchEnd, event);
  };

  handleContextMenu = (event) => {
    const { attributes } = this.props;
    this.handleContextClick(event);
    callIfExists(attributes.onContextMenu, event);
  };

  handleMouseClick = (event) => {
    const { attributes, mouseButton } = this.props;
    if (event.button === mouseButton) {
      this.handleContextClick(event);
    }
    callIfExists(attributes.onClick, event);
  };

  handleContextClick = (event) => {
    const {
      collect, disable, disableIfShiftIsPressed, posX, posY, id,
    } = this.props;
    if (disable) return;
    if (disableIfShiftIsPressed && event.shiftKey) return;

    event.preventDefault();
    event.stopPropagation();

    let x = event.clientX || (event.touches && event.touches[0].pageX);
    let y = event.clientY || (event.touches && event.touches[0].pageY);

    if (posX) {
      x -= posX;
    }
    if (posY) {
      y -= posY;
    }

    hideMenu();

    const data = callIfExists(collect, this.props);
    const showMenuConfig = {
      position: { x, y },
      target: this.elem,
      id,
    } as any;
    if (data && (typeof data.then === 'function')) {
      // it's promise
      data.then((resp) => {
        showMenuConfig.data = {
          ...resp,
          target: event.target,
        };
        showMenu(showMenuConfig);
      });
    } else {
      showMenuConfig.data = {
        ...data,
        target: event.target,
      };
      showMenu(showMenuConfig);
    }
  };

  elemRef = (c: HTMLElement) => {
    this.elem = c;
  };

  render(): JSX.Element {
    const { renderTag, attributes, children } = this.props;
    const newAttrs = {
      ...attributes,
      className: cx(cssClasses.menuWrapper, attributes.className),
      onContextMenu: this.handleContextMenu,
      onClick: this.handleMouseClick,
      onMouseDown: this.handleMouseDown,
      onMouseMove: this.handleMouseMove,
      onMouseUp: this.handleMouseUp,
      onTouchStart: this.handleTouchstart,
      onTouchMove: this.handleTouchMove,
      onTouchEnd: this.handleTouchEnd,
      onMouseOut: this.handleMouseOut,
      ref: this.elemRef,
    };

    return React.createElement(renderTag, newAttrs, children);
  }
}
